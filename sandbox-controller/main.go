package main

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

const (
	controllerAddress = ":8890"
	tokenPath         = "/home/oxidized/.config/oxidized/.netkeep-token"
	oxidizedCommand   = "/usr/local/bin/oxidized"
)

type restarter interface {
	Restart() error
}

type processManager struct {
	mutex      sync.Mutex
	command    *exec.Cmd
	done       chan error
	restarting bool
	exited     chan error
}

func newProcessManager() *processManager {
	return &processManager{exited: make(chan error, 1)}
}

func (m *processManager) Start() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	return m.startLocked()
}

func (m *processManager) Restart() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.restarting = true
	defer func() { m.restarting = false }()
	if err := m.stopLocked(); err != nil {
		return err
	}
	return m.startLocked()
}

func (m *processManager) Stop() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.restarting = true
	defer func() { m.restarting = false }()
	return m.stopLocked()
}

func (m *processManager) startLocked() error {
	command := exec.Command(oxidizedCommand)
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	command.Env = os.Environ()
	if err := command.Start(); err != nil {
		return err
	}
	done := make(chan error, 1)
	m.command = command
	m.done = done
	go func() {
		err := command.Wait()
		done <- err
		m.mutex.Lock()
		unexpected := m.command == command && !m.restarting
		m.mutex.Unlock()
		if unexpected {
			select {
			case m.exited <- err:
			default:
			}
		}
	}()
	return nil
}

func (m *processManager) stopLocked() error {
	if m.command == nil || m.command.Process == nil {
		return nil
	}
	if err := m.command.Process.Signal(syscall.SIGTERM); err != nil && !errors.Is(err, os.ErrProcessDone) {
		return err
	}
	select {
	case <-m.done:
	case <-time.After(10 * time.Second):
		if err := m.command.Process.Kill(); err != nil && !errors.Is(err, os.ErrProcessDone) {
			return err
		}
		<-m.done
	}
	m.command = nil
	m.done = nil
	return nil
}

type controller struct {
	token     string
	restarter restarter
}

func (c controller) handler() http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/restart" {
			http.NotFound(response, request)
			return
		}
		if request.Method != http.MethodPost {
			response.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		provided := request.Header.Get("X-NetKeep-Token")
		if request.Host != "sandbox" || len(provided) != len(c.token) || subtle.ConstantTimeCompare([]byte(provided), []byte(c.token)) != 1 {
			response.WriteHeader(http.StatusForbidden)
			return
		}
		if request.ContentLength != 0 {
			response.WriteHeader(http.StatusRequestEntityTooLarge)
			return
		}
		if err := c.restarter.Restart(); err != nil {
			response.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		response.WriteHeader(http.StatusNoContent)
	})
}

func main() {
	token, err := readControllerToken(tokenPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, "sandbox controller authentication unavailable")
		os.Exit(1)
	}
	manager := newProcessManager()
	if err := manager.Start(); err != nil {
		fmt.Fprintln(os.Stderr, "sandbox engine unavailable")
		os.Exit(1)
	}
	server := &http.Server{
		Addr:              controllerAddress,
		Handler:           controller{token: token, restarter: manager}.handler(),
		ReadHeaderTimeout: 3 * time.Second,
		ReadTimeout:       3 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       30 * time.Second,
	}
	serverError := make(chan error, 1)
	go func() {
		serverError <- server.ListenAndServe()
	}()
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	select {
	case <-signals:
	case <-manager.exited:
	case err := <-serverError:
		if !errors.Is(err, http.ErrServerClosed) {
			fmt.Fprintln(os.Stderr, "sandbox controller unavailable")
		}
	}
	shutdownContext, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownContext)
	_ = manager.Stop()
}

func readControllerToken(path string) (string, error) {
	contents, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	if len(contents) == 0 || len(contents) > 4096 {
		return "", errors.New("token is invalid")
	}
	for len(contents) > 0 && (contents[len(contents)-1] == '\n' || contents[len(contents)-1] == '\r') {
		contents = contents[:len(contents)-1]
	}
	if len(contents) == 0 {
		return "", errors.New("token is invalid")
	}
	return string(contents), nil
}
