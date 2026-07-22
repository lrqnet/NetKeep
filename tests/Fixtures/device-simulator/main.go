package main

import (
	"bufio"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/subtle"
	"errors"
	"io"
	"net"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

const listenAddress = ":2222"
const prompt = "NetKeep-E2E# "

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
	defer channel.Close()
	_, _ = io.WriteString(channel, "\r\n"+prompt)
	reader := bufio.NewScanner(channel)
	for reader.Scan() {
		response, exit := commandResponse(strings.TrimSuffix(reader.Text(), "\r"))
		if response != "" {
			_, _ = io.WriteString(channel, response)
		}
		if exit {
			_, _ = channel.SendRequest("exit-status", false, ssh.Marshal(struct{ Status uint32 }{0}))
			return
		}
		_, _ = io.WriteString(channel, prompt)
	}
	status := uint32(0)
	if reader.Err() != nil {
		status = 1
	}
	_, _ = channel.SendRequest("exit-status", false, ssh.Marshal(struct{ Status uint32 }{status}))
}

func commandResponse(command string) (string, bool) {
	responses := map[string][]string{
		"show version": {
			"Cisco IOS Software, C800 Software (C800-UNIVERSALK9-M), Version 15.8(3)M9",
			"Compiled Mon 01-Jun-26 00:00 by NetKeep",
			"NETKEEP-E2E processor with 262144K bytes of memory.",
			"Processor board ID NETKEEP0001",
		},
		"show vtp status": {
			"VTP Version capable             : 1 to 3",
			"VTP version running             : 2",
			"VTP Operating Mode              : Transparent",
		},
		"show inventory": {
			`NAME: "NetKeep E2E", DESCR: "Virtual network device"`,
			"PID: NETKEEP-E2E, VID: V01, SN: NETKEEP0001",
		},
		"show running-config": {
			"Building configuration...",
			"",
			"Current configuration : 384 bytes",
			"!",
			"version 15.8",
			"service timestamps log datetime msec",
			"hostname NETKEEP-E2E",
			"!",
			"interface GigabitEthernet0/0",
			" description NetKeep E2E simulated uplink",
			" ip address 192.0.2.10 255.255.255.0",
			" no shutdown",
			"!",
			"line vty 0 4",
			" transport input ssh",
			"!",
			"end",
		},
	}
	if command == "exit" || command == "logout" {
		return "", true
	}
	if command == "" || command == "terminal length 0" || command == "terminal width 0" {
		return "", false
	}
	lines, found := responses[command]
	if !found {
		return "% Invalid input detected at '^' marker.\r\n", false
	}
	return strings.Join(lines, "\r\n") + "\r\n", false
}

func reply(request *ssh.Request, accepted bool) {
	if request.WantReply {
		_ = request.Reply(accepted, nil)
	}
}
