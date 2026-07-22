package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/subtle"
	"errors"
	"net"
	"os"
	"os/exec"
	"time"

	"golang.org/x/crypto/ssh"
)

const listenAddress = ":2222"

var networkCLI = "/usr/local/bin/network-cli"

func main() {
	if len(os.Args) == 2 && os.Args[1] == "healthcheck" {
		connection, err := net.DialTimeout("tcp", "127.0.0.1:2222", 2*time.Second)
		if err != nil {
			os.Exit(1)
		}
		_ = connection.Close()
		return
	}
	if len(os.Args) != 1 || serve() != nil {
		os.Exit(1)
	}
}

func serve() error {
	configuration, err := serverConfiguration()
	if err != nil {
		return err
	}
	listener, err := net.Listen("tcp", listenAddress)
	if err != nil {
		return err
	}
	return serveListener(listener, configuration)
}

func serverConfiguration() (*ssh.ServerConfig, error) {
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}
	signer, err := ssh.NewSignerFromKey(privateKey)
	if err != nil {
		return nil, err
	}
	configuration := &ssh.ServerConfig{
		ServerVersion: "SSH-2.0-NetKeep-E2E",
		PasswordCallback: func(connection ssh.ConnMetadata, password []byte) (*ssh.Permissions, error) {
			userMatches := subtle.ConstantTimeCompare([]byte(connection.User()), []byte("netkeep"))
			passwordMatches := subtle.ConstantTimeCompare(password, []byte("e2e"))
			if userMatches != 1 || passwordMatches != 1 {
				return nil, errors.New("authentication_failed")
			}
			return nil, nil
		},
	}
	configuration.AddHostKey(signer)
	return configuration, nil
}

func serveListener(listener net.Listener, configuration *ssh.ServerConfig) error {
	defer listener.Close()
	for {
		connection, acceptErr := listener.Accept()
		if acceptErr != nil {
			return acceptErr
		}
		go handleConnection(connection, configuration)
	}
}

func handleConnection(connection net.Conn, configuration *ssh.ServerConfig) {
	server, channels, requests, err := ssh.NewServerConn(connection, configuration)
	if err != nil {
		_ = connection.Close()
		return
	}
	defer server.Close()
	go ssh.DiscardRequests(requests)
	for candidate := range channels {
		if candidate.ChannelType() != "session" {
			_ = candidate.Reject(ssh.UnknownChannelType, "unsupported_channel")
			continue
		}
		channel, channelRequests, acceptErr := candidate.Accept()
		if acceptErr != nil {
			continue
		}
		go handleSession(channel, channelRequests)
	}
}

func handleSession(channel ssh.Channel, requests <-chan *ssh.Request) {
	started := false
	for request := range requests {
		switch request.Type {
		case "pty-req":
			reply(request, !started)
		case "shell":
			if started {
				reply(request, false)
				continue
			}
			started = true
			reply(request, true)
			go runCLI(channel)
		case "window-change":
			reply(request, true)
		default:
			reply(request, false)
		}
	}
	if !started {
		_ = channel.Close()
	}
}

func runCLI(channel ssh.Channel) {
	command := exec.Command(networkCLI)
	command.Stdin = channel
	command.Stdout = channel
	command.Stderr = channel
	status := uint32(0)
	if command.Run() != nil {
		status = 1
	}
	_, _ = channel.SendRequest("exit-status", false, ssh.Marshal(struct{ Status uint32 }{status}))
	_ = channel.Close()
}

func reply(request *ssh.Request, accepted bool) {
	if request.WantReply {
		_ = request.Reply(accepted, nil)
	}
}
