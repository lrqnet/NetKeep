package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

const (
	defaultBaseURL   = "http://app:8080"
	defaultTokenPath = "/home/oxidized/.config/oxidized/.netkeep-token"
	defaultTraceDir  = "/run/netkeep-diagnostics/logs"
	defaultRepoDir   = "/run/netkeep-diagnostics/repository"
	maxPayloadBytes  = 8 * 1024
	maxTraceBytes    = 5 * 1024 * 1024
)

var safeHostname = regexp.MustCompile(`^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$`)

type eventPayload struct {
	EventID     string `json:"event_id"`
	OccurredAt  string `json:"occurred_at"`
	Event       string `json:"event"`
	NodeName    string `json:"node_name"`
	NodeIP      string `json:"node_ip,omitempty"`
	NodeGroup   string `json:"node_group,omitempty"`
	NodeModel   string `json:"node_model,omitempty"`
	JobStatus   string `json:"job_status,omitempty"`
	JobTime     string `json:"job_time,omitempty"`
	ErrorType   string `json:"error_type,omitempty"`
	ErrorReason string `json:"error_reason,omitempty"`
}

type reporter struct {
	baseURL  string
	token    string
	traceDir string
	repoDir  string
	client   *http.Client
}

func main() {
	token, err := readToken(defaultTokenPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, "reporter authentication unavailable")
		os.Exit(1)
	}
	r := reporter{
		baseURL:  defaultBaseURL,
		token:    token,
		traceDir: defaultTraceDir,
		repoDir:  defaultRepoDir,
		client:   &http.Client{Timeout: 5 * time.Second},
	}
	if err := r.run(os.Environ()); err != nil {
		fmt.Fprintln(os.Stderr, "reporter delivery failed")
		os.Exit(1)
	}
}

func (r reporter) run(environ []string) error {
	env := environment(environ)
	payload, err := newEventPayload(env)
	if err != nil {
		return err
	}
	terminal := payload.Event == "node_success" || payload.Event == "node_fail"
	if terminal {
		defer r.cleanupTraceFiles()
	}
	if payload.Event == "node_fail" || payload.Event == "post_store" {
		defer r.cleanupRepository()
	}

	eventErr := r.sendEvent(payload)
	var traceErr error
	if terminal {
		traceErr = r.sendTrace(payload.NodeName, payload.NodeIP)
	}

	return errors.Join(eventErr, traceErr)
}

func newEventPayload(env map[string]string) (eventPayload, error) {
	event := env["OX_EVENT"]
	if event != "node_success" && event != "node_fail" && event != "post_store" {
		return eventPayload{}, errors.New("event is not supported")
	}
	node := env["OX_NODE_NAME"]
	if !validUUID(node) {
		return eventPayload{}, errors.New("node identifier is invalid")
	}
	id, err := randomUUID()
	if err != nil {
		return eventPayload{}, err
	}

	return eventPayload{
		EventID:     id,
		OccurredAt:  time.Now().UTC().Format(time.RFC3339Nano),
		Event:       event,
		NodeName:    node,
		NodeIP:      truncateUTF8(env["OX_NODE_IP"], 255),
		NodeGroup:   truncateUTF8(env["OX_NODE_GROUP"], 255),
		NodeModel:   truncateUTF8(env["OX_NODE_MODEL"], 255),
		JobStatus:   truncateUTF8(env["OX_JOB_STATUS"], 64),
		JobTime:     truncateUTF8(env["OX_JOB_TIME"], 64),
		ErrorType:   truncateUTF8(env["OX_ERR_TYPE"], 512),
		ErrorReason: truncateUTF8(env["OX_ERR_REASON"], 4096),
	}, nil
}

func (r reporter) sendEvent(payload eventPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	if len(body) > maxPayloadBytes {
		return errors.New("event payload exceeds limit")
	}
	return r.doWithRetry(func() (*http.Request, error) {
		request, requestErr := http.NewRequest(http.MethodPost, r.baseURL+"/internal/oxidized/events", bytes.NewReader(body))
		if requestErr != nil {
			return nil, requestErr
		}
		request.Header.Set("Content-Type", "application/json")
		return request, nil
	})
}

func (r reporter) sendTrace(node, nodeIP string) error {
	path, size, err := r.findTrace(nodeIP)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	return r.doWithRetry(func() (*http.Request, error) {
		file, openErr := os.Open(path)
		if openErr != nil {
			return nil, openErr
		}
		stat, statErr := file.Stat()
		if statErr != nil || !stat.Mode().IsRegular() {
			file.Close()
			return nil, errors.New("trace is not a regular file")
		}
		length := size
		if length > maxTraceBytes {
			length = maxTraceBytes
		}
		body := struct {
			io.Reader
			io.Closer
		}{Reader: io.LimitReader(file, length), Closer: file}
		request, requestErr := http.NewRequest(http.MethodPut, r.baseURL+"/internal/oxidized/diagnostics/"+node+"/trace", body)
		if requestErr != nil {
			file.Close()
			return nil, requestErr
		}
		request.ContentLength = length
		request.Header.Set("Content-Type", "application/octet-stream")
		request.Header.Set("X-NetKeep-Truncated", fmt.Sprintf("%t", size > maxTraceBytes))
		return request, nil
	})
}

func (r reporter) doWithRetry(build func() (*http.Request, error)) error {
	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		request, err := build()
		if err != nil {
			return err
		}
		request.Host = "app"
		request.Header.Set("X-NetKeep-Token", r.token)
		response, err := r.client.Do(request)
		if err != nil {
			lastErr = err
			continue
		}
		_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4096))
		response.Body.Close()
		if response.StatusCode >= 200 && response.StatusCode < 300 {
			return nil
		}
		lastErr = fmt.Errorf("unexpected response status %d", response.StatusCode)
		if response.StatusCode < 500 {
			break
		}
	}
	return lastErr
}

func (r reporter) findTrace(nodeIP string) (string, int64, error) {
	if !safeAddress(nodeIP) {
		return "", 0, errors.New("node address is invalid")
	}
	entries, err := os.ReadDir(r.traceDir)
	if err != nil {
		return "", 0, err
	}
	var selected string
	var selectedSize int64
	var selectedTime time.Time
	for _, entry := range entries {
		name := entry.Name()
		if !strings.HasPrefix(name, nodeIP+"-") || !strings.HasSuffix(name, ".txt") || entry.Type()&os.ModeSymlink != 0 {
			continue
		}
		info, infoErr := entry.Info()
		if infoErr != nil || !info.Mode().IsRegular() {
			continue
		}
		path := filepath.Join(r.traceDir, name)
		if !info.ModTime().Before(selectedTime) {
			selected = path
			selectedSize = info.Size()
			selectedTime = info.ModTime()
		}
	}
	if selected == "" {
		return "", 0, os.ErrNotExist
	}
	return selected, selectedSize, nil
}

func (r reporter) cleanupTraceFiles() {
	entries, err := os.ReadDir(r.traceDir)
	if err != nil {
		return
	}
	for _, entry := range entries {
		if strings.HasSuffix(entry.Name(), ".txt") || strings.HasSuffix(entry.Name(), ".yaml") {
			_ = os.Remove(filepath.Join(r.traceDir, entry.Name()))
		}
	}
	_ = os.Remove(r.traceDir)
}

func (r reporter) cleanupRepository() {
	_ = os.RemoveAll(r.repoDir)
}

func readToken(path string) (string, error) {
	contents, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	if len(contents) > 4096 {
		return "", errors.New("token file exceeds limit")
	}
	token := strings.TrimSpace(string(contents))
	if token == "" {
		return "", errors.New("token is empty")
	}
	return token, nil
}

func environment(environ []string) map[string]string {
	values := make(map[string]string, len(environ))
	for _, item := range environ {
		key, value, found := strings.Cut(item, "=")
		if found {
			values[key] = value
		}
	}
	return values
}

func safeAddress(value string) bool {
	if net.ParseIP(value) != nil {
		return true
	}
	return safeHostname.MatchString(value) && !strings.Contains(value, "..")
}

func validUUID(value string) bool {
	if len(value) != 36 || value[8] != '-' || value[13] != '-' || value[18] != '-' || value[23] != '-' {
		return false
	}
	_, err := hex.DecodeString(strings.ReplaceAll(value, "-", ""))
	return err == nil
}

func randomUUID() (string, error) {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	value[6] = (value[6] & 0x0f) | 0x40
	value[8] = (value[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		value[0:4], value[4:6], value[6:8], value[8:10], value[10:16]), nil
}

func truncateUTF8(value string, limit int) string {
	if len(value) <= limit {
		return value
	}
	value = value[:limit]
	for !utf8.ValidString(value) {
		value = value[:len(value)-1]
	}
	return value
}
