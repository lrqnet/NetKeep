package main

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type fakeRestarter struct {
	err   error
	calls int
}

func (f *fakeRestarter) Restart() error {
	f.calls++
	return f.err
}

func TestControllerRequiresHostTokenMethodAndEmptyBody(t *testing.T) {
	t.Parallel()
	restarter := &fakeRestarter{}
	handler := controller{token: "test-token", restarter: restarter}.handler()
	cases := []struct {
		name   string
		method string
		host   string
		token  string
		body   string
		status int
	}{
		{name: "valid", method: http.MethodPost, host: "sandbox", token: "test-token", status: http.StatusNoContent},
		{name: "host", method: http.MethodPost, host: "app", token: "test-token", status: http.StatusForbidden},
		{name: "token", method: http.MethodPost, host: "sandbox", token: "wrong", status: http.StatusForbidden},
		{name: "method", method: http.MethodGet, host: "sandbox", token: "test-token", status: http.StatusMethodNotAllowed},
		{name: "body", method: http.MethodPost, host: "sandbox", token: "test-token", body: "data", status: http.StatusRequestEntityTooLarge},
	}
	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			request := httptest.NewRequest(testCase.method, "http://sandbox/restart", stringsReader(testCase.body))
			request.Host = testCase.host
			request.Header.Set("X-NetKeep-Token", testCase.token)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)
			if response.Code != testCase.status {
				t.Fatalf("unexpected status %d", response.Code)
			}
		})
	}
	if restarter.calls != 1 {
		t.Fatalf("unexpected restart count %d", restarter.calls)
	}
}

func TestControllerReportsRestartFailure(t *testing.T) {
	t.Parallel()
	restarter := &fakeRestarter{err: errors.New("restart failed")}
	request := httptest.NewRequest(http.MethodPost, "http://sandbox/restart", nil)
	request.Host = "sandbox"
	request.Header.Set("X-NetKeep-Token", "test-token")
	response := httptest.NewRecorder()
	controller{token: "test-token", restarter: restarter}.handler().ServeHTTP(response, request)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("unexpected status %d", response.Code)
	}
}

func stringsReader(value string) io.Reader {
	if value == "" {
		return nil
	}
	return strings.NewReader(value)
}
