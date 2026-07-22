package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestVersionComparison(t *testing.T) {
	tests := []struct {
		left     string
		right    string
		expected int
	}{
		{"1.0.2", "1.0.1", 1},
		{"v1.0.2", "1.0.2", 0},
		{"1.0.2", "1.1.0", -1},
		{"2.0.0", "1.99.99", 1},
	}
	for _, test := range tests {
		if actual := compareVersions(test.left, test.right); actual != test.expected {
			t.Fatalf("compareVersions(%q, %q) = %d", test.left, test.right, actual)
		}
	}
}

func TestValidateManifestRejectsAutomaticMajorUpdate(t *testing.T) {
	value := manifest{
		Schema:               1,
		Version:              "2.0.0",
		MinimumSourceVersion: "1.0.0",
		ManualSourceMajors:   []int{1},
		AutomaticEligible:    true,
		ComposeSHA256:        "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		Images: []string{
			"docker.io/lrqnet/netkeep@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			"docker.io/lrqnet/netkeep-oxidized@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			"docker.io/lrqnet/netkeep-updater@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
		},
	}
	req := request{Schema: 1, FromVersion: "1.0.1", ToVersion: "2.0.0", Trigger: "automatic"}
	if validateManifest(value, req) == nil {
		t.Fatal("automatic major update was accepted")
	}
}

func TestValidateManifestAcceptsSignedPolicyShape(t *testing.T) {
	value := manifest{
		Schema:               1,
		Version:              "1.0.2",
		MinimumSourceVersion: "1.0.0",
		ManualSourceMajors:   []int{1},
		AutomaticEligible:    true,
		ComposeSHA256:        "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		Images: []string{
			"docker.io/lrqnet/netkeep@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			"docker.io/lrqnet/netkeep-oxidized@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			"docker.io/lrqnet/netkeep-updater@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
		},
	}
	req := request{Schema: 1, FromVersion: "1.0.1", ToVersion: "1.0.2", Trigger: "manual"}
	if err := validateManifest(value, req); err != nil {
		t.Fatal(err)
	}
}

func TestValidateManifestRejectsUntrustedImage(t *testing.T) {
	value := validManifest()
	value.Images[0] = "docker.io/example/netkeep@sha256:" + strings.Repeat("a", 64)
	req := request{Schema: 1, FromVersion: "1.0.1", ToVersion: "1.0.2", Trigger: "manual"}
	if validateManifest(value, req) == nil {
		t.Fatal("untrusted image was accepted")
	}
}

func TestValidateManifestRejectsExternalHostSteps(t *testing.T) {
	value := validManifest()
	value.RequiresHostSteps = true
	req := request{Schema: 1, FromVersion: "1.0.1", ToVersion: "1.0.2", Trigger: "manual"}
	if validateManifest(value, req) == nil {
		t.Fatal("manifest with external host steps was accepted")
	}
}

func TestRequireRegularRejectsSymlink(t *testing.T) {
	directory := t.TempDir()
	target := filepath.Join(directory, "manifest.json")
	link := filepath.Join(directory, "manifest-link.json")
	if err := os.WriteFile(target, []byte("{}"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(target, link); err != nil {
		t.Fatal(err)
	}
	if requireRegular(link) == nil {
		t.Fatal("symlink was accepted")
	}
}

func TestDecodeStrictRejectsUnknownFieldsAndOversizedFiles(t *testing.T) {
	directory := t.TempDir()
	unknown := filepath.Join(directory, "unknown.json")
	oversized := filepath.Join(directory, "oversized.json")
	if err := os.WriteFile(unknown, []byte(`{"schema":1,"unexpected":true}`), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(oversized, []byte(strings.Repeat(" ", 65)), 0600); err != nil {
		t.Fatal(err)
	}
	var req request
	if decodeStrict(unknown, 1024, &req) == nil {
		t.Fatal("unknown field was accepted")
	}
	if decodeStrict(oversized, 64, &req) == nil {
		t.Fatal("oversized file was accepted")
	}
}

func TestMergedEnvironmentReplacesImageOverrides(t *testing.T) {
	t.Setenv("NETKEEP_IMAGE", "docker.io/example/untrusted:latest")
	environment := mergedEnvironment([]string{"NETKEEP_IMAGE=", "NETKEEP_HTTP_PORT=80"})
	seen := 0
	for _, value := range environment {
		if value == "NETKEEP_IMAGE=" {
			seen++
		}
		if value == "NETKEEP_IMAGE=docker.io/example/untrusted:latest" {
			t.Fatal("untrusted image override remained in the environment")
		}
	}
	if seen != 1 {
		t.Fatalf("expected one image override, got %d", seen)
	}
}

func validManifest() manifest {
	return manifest{
		Schema:               1,
		Version:              "1.0.2",
		MinimumSourceVersion: "1.0.0",
		ManualSourceMajors:   []int{1},
		AutomaticEligible:    true,
		ComposeSHA256:        "sha256:" + strings.Repeat("a", 64),
		Images: []string{
			"docker.io/lrqnet/netkeep@sha256:" + strings.Repeat("a", 64),
			"docker.io/lrqnet/netkeep-oxidized@sha256:" + strings.Repeat("b", 64),
			"docker.io/lrqnet/netkeep-updater@sha256:" + strings.Repeat("c", 64),
		},
	}
}
