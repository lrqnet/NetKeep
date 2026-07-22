package main

import (
	"bufio"
	"net"
	"strings"
	"testing"
	"time"

	"golang.org/x/crypto/ssh"
)

func TestSimulatorAuthenticatesAndRunsReadOnlyCLI(t *testing.T) {
	configuration, err := serverConfiguration()
	if err != nil {
		t.Fatal(err)
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go func() {
		_ = serveListener(listener, configuration)
	}()

	connection, err := net.DialTimeout("tcp", listener.Addr().String(), 2*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	if err := connection.SetDeadline(time.Now().Add(5 * time.Second)); err != nil {
		t.Fatal(err)
	}
	clientConnection, channels, requests, err := ssh.NewClientConn(connection, listener.Addr().String(), &ssh.ClientConfig{
		User:            "netkeep",
		Auth:            []ssh.AuthMethod{ssh.Password("e2e")},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	})
	if err != nil {
		t.Fatal(err)
	}
	client := ssh.NewClient(clientConnection, channels, requests)
	defer client.Close()
	session, err := client.NewSession()
	if err != nil {
		t.Fatal(err)
	}
	input, err := session.StdinPipe()
	if err != nil {
		t.Fatal(err)
	}
	output, err := session.StdoutPipe()
	if err != nil {
		t.Fatal(err)
	}
	if err := session.RequestPty("xterm", 80, 24, ssh.TerminalModes{}); err != nil {
		t.Fatal(err)
	}
	if err := session.Shell(); err != nil {
		t.Fatal(err)
	}
	reader := bufio.NewReader(output)
	if _, err := reader.ReadString('#'); err != nil {
		t.Fatal(err)
	}
	if _, err := input.Write([]byte("show version\n")); err != nil {
		t.Fatal(err)
	}
	response, err := reader.ReadString('#')
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(response, "Cisco IOS Software") || !strings.Contains(response, "NETKEEP-E2E processor") {
		t.Fatalf("unexpected simulator response: %s", response)
	}
	if _, err := input.Write([]byte("exit\n")); err != nil {
		t.Fatal(err)
	}
	if err := input.Close(); err != nil {
		t.Fatal(err)
	}
	if err := session.Wait(); err != nil {
		t.Fatal(err)
	}
}
