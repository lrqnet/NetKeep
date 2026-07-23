package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

const testNodeUUID = "11111111-2222-4333-8444-555555555555"

func TestReporterSendsAllowedEnvironmentWithToken(t *testing.T) {
	t.Parallel()
	var received eventPayload
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.Header.Get("X-NetKeep-Token") != "test-token" {
			t.Error("token was not sent")
			return
		}
		if request.Host != "app" {
			t.Errorf("unexpected host %q", request.Host)
			return
		}
		if err := jsonDecoder(request.Body, &received); err != nil {
			t.Error(err)
			return
		}
		response.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()
	r := testReporter(t, server.URL)

	err := r.run(testEnvironment("node_success", ""))
	if err != nil {
		t.Fatal(err)
	}
	if received.NodeName != testNodeUUID || received.NodeIP != "192.0.2.10" {
		t.Fatalf("unexpected payload: %#v", received)
	}
}

func TestReporterReusesEventIDWhenRetrying(t *testing.T) {
	t.Parallel()
	var mutex sync.Mutex
	var ids []string
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		var payload eventPayload
		if err := jsonDecoder(request.Body, &payload); err != nil {
			t.Error(err)
			return
		}
		mutex.Lock()
		ids = append(ids, payload.EventID)
		attempt := len(ids)
		mutex.Unlock()
		if attempt == 1 {
			response.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		response.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()
	r := testReporter(t, server.URL)

	if err := r.run(testEnvironment("post_store", "")); err != nil {
		t.Fatal(err)
	}
	if len(ids) != 2 || ids[0] != ids[1] {
		t.Fatalf("event ids were not stable across retry: %#v", ids)
	}
}

func TestReporterRemovesEphemeralRepositoryAfterPostStore(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()
	r := testReporter(t, server.URL)
	if err := os.MkdirAll(r.repoDir, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(r.repoDir, "config"), []byte("sensitive"), 0600); err != nil {
		t.Fatal(err)
	}

	if err := r.run(testEnvironment("post_store", "")); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(r.repoDir); !os.IsNotExist(err) {
		t.Fatal("ephemeral repository was not removed")
	}
}

func TestReporterRejectsUnknownDeviceResponse(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()
	r := testReporter(t, server.URL)

	if err := r.run(testEnvironment("post_store", "")); err == nil {
		t.Fatal("expected unknown device response to fail")
	}
}

func TestReporterUploadsTruncatedTraceAndRemovesPlaintext(t *testing.T) {
	t.Parallel()
	traceDir := t.TempDir()
	tracePath := filepath.Join(traceDir, "192.0.2.10-ssh-20260722-120000.txt")
	contents := strings.Repeat("x", maxTraceBytes+64)
	if err := os.WriteFile(tracePath, []byte(contents), 0600); err != nil {
		t.Fatal(err)
	}
	var traceSize int
	var truncated string
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.Method == http.MethodPut {
			body, err := io.ReadAll(request.Body)
			if err != nil {
				t.Error(err)
				return
			}
			traceSize = len(body)
			truncated = request.Header.Get("X-NetKeep-Truncated")
			response.WriteHeader(http.StatusCreated)
			return
		}
		response.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()
	r := testReporter(t, server.URL)
	r.traceDir = traceDir

	if err := r.run(testEnvironment("node_fail", "connection timeout")); err != nil {
		t.Fatal(err)
	}
	if traceSize != maxTraceBytes || truncated != "true" {
		t.Fatalf("unexpected trace result size=%d truncated=%q", traceSize, truncated)
	}
	if _, err := os.Stat(tracePath); !os.IsNotExist(err) {
		t.Fatal("plaintext trace was not removed")
	}
}

func TestReporterRejectsTraversalAndSymlink(t *testing.T) {
	t.Parallel()
	r := testReporter(t, "http://127.0.0.1:1")
	r.traceDir = t.TempDir()
	if _, _, err := r.findTrace("../escape"); err == nil {
		t.Fatal("traversal address was accepted")
	}
	target := filepath.Join(r.traceDir, "target.txt")
	if err := os.WriteFile(target, []byte("secret"), 0600); err != nil {
		t.Fatal(err)
	}
	link := filepath.Join(r.traceDir, "192.0.2.10-ssh-20260722-120000.txt")
	if err := os.Symlink(target, link); err != nil {
		t.Fatal(err)
	}
	if _, _, err := r.findTrace("192.0.2.10"); !os.IsNotExist(err) {
		t.Fatalf("symlink was accepted: %v", err)
	}
}

func TestReporterCleansTraceWhenApplicationIsUnavailable(t *testing.T) {
	t.Parallel()
	traceDir := t.TempDir()
	tracePath := filepath.Join(traceDir, "192.0.2.10-ssh-20260722-120000.txt")
	if err := os.WriteFile(tracePath, []byte("sensitive marker"), 0600); err != nil {
		t.Fatal(err)
	}
	r := testReporter(t, "http://127.0.0.1:1")
	r.traceDir = traceDir
	r.client.Timeout = 50 * time.Millisecond

	if err := r.run(testEnvironment("node_fail", "timeout")); err == nil {
		t.Fatal("expected unavailable application to fail")
	}
	if _, err := os.Stat(tracePath); !os.IsNotExist(err) {
		t.Fatal("plaintext trace survived failed delivery")
	}
}

func testReporter(t *testing.T, baseURL string) reporter {
	t.Helper()
	root := t.TempDir()
	return reporter{
		baseURL:  baseURL,
		token:    "test-token",
		traceDir: filepath.Join(root, "logs"),
		repoDir:  filepath.Join(root, "repository"),
		client:   &http.Client{Timeout: time.Second},
	}
}

func testEnvironment(event, reason string) []string {
	return []string{
		"OX_EVENT=" + event,
		"OX_NODE_NAME=" + testNodeUUID,
		"OX_NODE_IP=192.0.2.10",
		"OX_NODE_GROUP=group-1",
		"OX_NODE_MODEL=IOS",
		"OX_JOB_STATUS=success",
		"OX_JOB_TIME=1.25",
		"OX_ERR_TYPE=RuntimeError",
		"OX_ERR_REASON=" + reason,
	}
}

func jsonDecoder(reader io.Reader, target any) error {
	decoder := json.NewDecoder(reader)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}
