package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

const (
	exchangeDefault = "/var/lib/netkeep/updates"
	composeName     = "compose.yaml"
	manifestName    = "update-manifest.json"
	bundleName      = "update-manifest.sigstore.json"
)

var (
	uuidPattern    = regexp.MustCompile(`^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$`)
	versionPattern = regexp.MustCompile(`^v?([0-9]+)\.([0-9]+)\.([0-9]+)$`)
	imagePattern   = regexp.MustCompile(`^(docker\.io/lrqnet/netkeep|docker\.io/lrqnet/netkeep-oxidized|docker\.io/lrqnet/netkeep-updater|postgres:18\.4-bookworm)@sha256:[a-f0-9]{64}$`)
)

type request struct {
	Schema        int    `json:"schema"`
	OperationUUID string `json:"operation_uuid"`
	FromVersion   string `json:"from_version"`
	ToVersion     string `json:"to_version"`
	Trigger       string `json:"trigger"`
	Compatibility string `json:"compatibility"`
	RequestedAt   string `json:"requested_at"`
}

type manifest struct {
	Schema                   int      `json:"schema"`
	Version                  string   `json:"version"`
	MinimumSourceVersion     string   `json:"minimum_source_version"`
	ManualSourceMajors       []int    `json:"manual_source_majors"`
	AutomaticEligible        bool     `json:"automatic_eligible"`
	RollbackSafe             bool     `json:"rollback_safe"`
	RequiresHostSteps        bool     `json:"requires_host_steps"`
	EstimatedDowntimeSeconds int      `json:"estimated_downtime_seconds"`
	ComposeSHA256            string   `json:"compose_sha256"`
	Images                   []string `json:"images"`
}

type status struct {
	OperationUUID string `json:"operation_uuid"`
	Status        string `json:"status"`
	ErrorCode     string `json:"error_code,omitempty"`
	UpdatedAt     string `json:"updated_at"`
}

type heartbeatState struct {
	CheckedAt string `json:"checked_at"`
}

type composeConfig struct {
	Services map[string]composeService `json:"services"`
}

type composeService struct {
	Image       string          `json:"image"`
	NetworkMode string          `json:"network_mode"`
	Ports       []any           `json:"ports"`
	Volumes     []composeVolume `json:"volumes"`
}

type composeVolume struct {
	Source   string `json:"source"`
	Target   string `json:"target"`
	Type     string `json:"type"`
	ReadOnly bool   `json:"read_only"`
}

type updater struct {
	exchange   string
	installDir string
	compose    string
	project    string
	mu         sync.Mutex
}

func main() {
	exchange := env("NETKEEP_UPDATE_EXCHANGE", exchangeDefault)
	if len(os.Args) == 2 && os.Args[1] == "healthcheck" {
		if heartbeatHealthy(filepath.Join(exchange, "heartbeat.json"), time.Now().UTC()) != nil {
			os.Exit(1)
		}
		return
	}
	u := updater{
		exchange:   exchange,
		installDir: env("NETKEEP_INSTALL_DIR", ""),
		project:    env("NETKEEP_COMPOSE_PROJECT", "netkeep"),
	}
	u.compose = filepath.Join(u.installDir, composeName)
	if len(os.Args) != 1 || u.run() != nil {
		os.Exit(1)
	}
}

func (u *updater) run() error {
	if !filepath.IsAbs(u.installDir) || u.installDir == "/" {
		return errors.New("install_dir_invalid")
	}
	if err := requireRegular(u.compose); err != nil {
		return err
	}
	for _, directory := range []string{"queue", "requests", "status"} {
		if err := os.MkdirAll(filepath.Join(u.exchange, directory), 02770); err != nil {
			return err
		}
	}
	go u.heartbeat()
	for {
		if err := u.processNext(); err != nil {
			time.Sleep(5 * time.Second)
		} else {
			time.Sleep(2 * time.Second)
		}
	}
}

func (u *updater) heartbeat() {
	for {
		_ = atomicJSON(filepath.Join(u.exchange, "heartbeat.json"), map[string]string{
			"checked_at": time.Now().UTC().Format(time.RFC3339),
		})
		time.Sleep(30 * time.Second)
	}
}

func heartbeatHealthy(path string, now time.Time) error {
	if err := requireRegular(path); err != nil {
		return err
	}
	var value heartbeatState
	if err := decodeStrict(path, 4096, &value); err != nil {
		return err
	}
	checkedAt, err := time.Parse(time.RFC3339, value.CheckedAt)
	if err != nil || checkedAt.After(now.Add(30*time.Second)) || checkedAt.Before(now.Add(-2*time.Minute)) {
		return errors.New("heartbeat_stale")
	}
	return nil
}

func (u *updater) processNext() error {
	u.mu.Lock()
	defer u.mu.Unlock()
	entries, err := filepath.Glob(filepath.Join(u.exchange, "queue", "*.request"))
	if err != nil || len(entries) == 0 {
		return err
	}
	sort.Strings(entries)
	marker := entries[0]
	uuid := strings.TrimSuffix(filepath.Base(marker), ".request")
	processing := marker + ".processing"
	if !uuidPattern.MatchString(uuid) || os.Rename(marker, processing) != nil {
		_ = os.Remove(marker)
		return errors.New("request_invalid")
	}
	defer os.Remove(processing)
	if err := u.process(uuid); err != nil {
		code := safeCode(err)
		state := "failed"
		if code == "update_recovery_required" || code == "update_rollback_failed" {
			state = "recovery_required"
		}
		_ = u.writeStatus(uuid, state, code)
		return err
	}
	return nil
}

func (u *updater) process(uuid string) error {
	requestDir := filepath.Join(u.exchange, "requests", uuid)
	for _, name := range []string{"request.json", composeName, manifestName, bundleName} {
		if err := requireRegular(filepath.Join(requestDir, name)); err != nil {
			return fmt.Errorf("update_file_invalid: %w", err)
		}
	}
	var req request
	if err := decodeStrict(filepath.Join(requestDir, "request.json"), 65536, &req); err != nil {
		return fmt.Errorf("update_request_invalid: %w", err)
	}
	if req.Schema != 1 || req.OperationUUID != uuid || normalizeVersion(req.FromVersion) == "" || normalizeVersion(req.ToVersion) == "" {
		return errors.New("update_request_invalid")
	}
	if req.Trigger != "manual" && req.Trigger != "automatic" {
		return errors.New("update_trigger_invalid")
	}
	if compareVersions(req.ToVersion, req.FromVersion) <= 0 {
		return errors.New("update_downgrade_rejected")
	}
	actualVersion, err := u.currentVersion()
	if err != nil || normalizeVersion(actualVersion) != normalizeVersion(req.FromVersion) {
		return errors.New("update_source_mismatch")
	}
	if err := u.writeStatus(uuid, "validating", ""); err != nil {
		return err
	}
	manifestPath := filepath.Join(requestDir, manifestName)
	var signed manifest
	if err := decodeStrict(manifestPath, 1048576, &signed); err != nil {
		return fmt.Errorf("update_manifest_invalid: %w", err)
	}
	if err := validateManifest(signed, req); err != nil {
		return err
	}
	identity := "https://github.com/lrqnet/NetKeep/.github/workflows/release.yml@refs/tags/v" + normalizeVersion(signed.Version)
	if err := command(2*time.Minute, u.installDir, nil,
		"cosign", "verify-blob", "--offline=true", "--bundle", filepath.Join(requestDir, bundleName),
		"--certificate-identity", identity, "--certificate-oidc-issuer", "https://token.actions.githubusercontent.com", manifestPath,
	); err != nil {
		return errors.New("update_signature_invalid")
	}
	candidate := filepath.Join(requestDir, composeName)
	if digestFile(candidate) != strings.TrimPrefix(signed.ComposeSHA256, "sha256:") {
		return errors.New("update_compose_digest_invalid")
	}
	ports, err := u.currentPorts()
	if err != nil {
		return err
	}
	environment := composeEnvironment(u.installDir, ports, u.project)
	configured, err := u.validatedCompose(candidate, environment)
	if err != nil {
		return err
	}
	if !equalStrings(configured, signed.Images) {
		return errors.New("update_images_mismatch")
	}
	if err := u.writeStatus(uuid, "downloading", ""); err != nil {
		return err
	}
	if err := command(30*time.Minute, u.installDir, environment, "docker", "compose", "-f", candidate, "pull"); err != nil {
		return errors.New("update_image_pull_failed")
	}
	previous := filepath.Join(requestDir, "compose.previous.yaml")
	if err := copyAtomic(u.compose, previous, 0600); err != nil {
		return errors.New("update_compose_backup_failed")
	}
	if err := u.writeStatus(uuid, "applying", ""); err != nil {
		return err
	}
	if err := copyAtomic(candidate, u.compose, 0644); err != nil {
		return errors.New("update_compose_publish_failed")
	}
	if err := u.apply(environment); err != nil {
		return u.recover(uuid, previous, environment, signed.RollbackSafe)
	}
	if err := u.writeStatus(uuid, "restarting", ""); err != nil {
		return err
	}
	if err := u.writeStatus(uuid, "succeeded", ""); err != nil {
		return err
	}
	_ = command(2*time.Minute, u.installDir, environment, "docker", "compose", "-f", u.compose, "up", "-d", "updater")
	return nil
}

func (u *updater) apply(environment []string) error {
	if err := command(5*time.Minute, u.installDir, environment, "docker", "compose", "-f", u.compose, "up", "-d", "--remove-orphans", "init", "postgres"); err != nil {
		return err
	}
	if err := u.waitService(environment, "init", true, 2*time.Minute); err != nil {
		return err
	}
	if err := command(5*time.Minute, u.installDir, environment, "docker", "compose", "-f", u.compose, "up", "-d", "database-init"); err != nil {
		return err
	}
	if err := u.waitService(environment, "database-init", true, 5*time.Minute); err != nil {
		return err
	}
	if err := command(5*time.Minute, u.installDir, environment, "docker", "compose", "-f", u.compose, "up", "-d", "app", "oxidized", "sandbox", "worker", "scheduler"); err != nil {
		return err
	}
	for _, service := range []string{"app", "oxidized", "sandbox", "worker", "scheduler"} {
		if err := u.waitService(environment, service, false, 10*time.Minute); err != nil {
			return err
		}
	}
	return nil
}

func (u *updater) recover(uuid, previous string, environment []string, rollbackSafe bool) error {
	if !rollbackSafe {
		return errors.New("update_recovery_required")
	}
	if copyAtomic(previous, u.compose, 0644) != nil || u.apply(environment) != nil {
		return errors.New("update_rollback_failed")
	}
	return errors.New("update_rolled_back")
}

func (u *updater) validatedCompose(path string, environment []string) ([]string, error) {
	output, err := commandOutput(2*time.Minute, u.installDir, environment, "docker", "compose", "-f", path, "config", "--format", "json")
	if err != nil || len(output) > 4194304 {
		return nil, errors.New("update_compose_invalid")
	}
	var config composeConfig
	if json.Unmarshal(output, &config) != nil || len(config.Services) == 0 {
		return nil, errors.New("update_compose_invalid")
	}
	updaterService, ok := config.Services["updater"]
	if !ok || updaterService.NetworkMode != "none" || len(updaterService.Ports) != 0 {
		return nil, errors.New("update_updater_isolation_invalid")
	}
	socketCount := 0
	images := map[string]struct{}{}
	for name, service := range config.Services {
		if service.Image == "" || !imagePattern.MatchString(service.Image) {
			return nil, errors.New("update_image_untrusted")
		}
		images[service.Image] = struct{}{}
		for _, volume := range service.Volumes {
			if volume.Source == "/var/run/docker.sock" || volume.Target == "/var/run/docker.sock" {
				socketCount++
				if name != "updater" || volume.Source != "/var/run/docker.sock" || volume.Target != "/var/run/docker.sock" || volume.ReadOnly {
					return nil, errors.New("update_socket_exposure_invalid")
				}
			}
		}
	}
	if socketCount != 1 {
		return nil, errors.New("update_socket_exposure_invalid")
	}
	result := make([]string, 0, len(images))
	for image := range images {
		result = append(result, image)
	}
	sort.Strings(result)
	return result, nil
}

func (u *updater) currentVersion() (string, error) {
	id, err := u.serviceContainer("app", nil)
	if err != nil {
		return "", err
	}
	output, err := commandOutput(30*time.Second, u.installDir, nil, "docker", "inspect", "--format", "{{range .Config.Env}}{{println .}}{{end}}", id)
	if err != nil {
		return "", err
	}
	for _, line := range strings.Split(string(output), "\n") {
		if strings.HasPrefix(line, "NETKEEP_VERSION=") {
			return strings.TrimPrefix(line, "NETKEEP_VERSION="), nil
		}
	}
	return "", errors.New("update_source_unknown")
}

type publishedPorts struct {
	httpPort  string
	httpsPort string
	bindIP    string
}

func (u *updater) currentPorts() (publishedPorts, error) {
	containerID, err := u.serviceContainer("app", nil)
	if err != nil {
		return publishedPorts{}, err
	}
	ports := publishedPorts{}
	for _, target := range []string{"8080/tcp", "8443/tcp"} {
		output, commandErr := commandOutput(30*time.Second, u.installDir, nil, "docker", "inspect", "--format", "{{(index (index .NetworkSettings.Ports \""+target+"\") 0).HostIp}} {{(index (index .NetworkSettings.Ports \""+target+"\") 0).HostPort}}", containerID)
		if commandErr != nil {
			return publishedPorts{}, errors.New("update_ports_unknown")
		}
		parts := strings.Fields(string(output))
		if len(parts) != 2 {
			return publishedPorts{}, errors.New("update_ports_unknown")
		}
		if ports.bindIP != "" && ports.bindIP != parts[0] {
			return publishedPorts{}, errors.New("update_bind_mismatch")
		}
		ports.bindIP = parts[0]
		if target == "8080/tcp" {
			ports.httpPort = parts[1]
		} else {
			ports.httpsPort = parts[1]
		}
	}
	if ports.httpPort == "" || ports.httpsPort == "" || ports.bindIP == "" {
		return publishedPorts{}, errors.New("update_ports_unknown")
	}
	return ports, nil
}

func (u *updater) serviceContainer(service string, environment []string) (string, error) {
	output, err := commandOutput(30*time.Second, u.installDir, environment, "docker", "ps", "--filter", "label=com.docker.compose.project="+u.project, "--filter", "label=com.docker.compose.service="+service, "--format", "{{.ID}}")
	if err != nil {
		return "", err
	}
	ids := strings.Fields(string(output))
	if len(ids) != 1 {
		return "", errors.New("update_container_state_invalid")
	}
	return ids[0], nil
}

func (u *updater) waitService(environment []string, service string, completed bool, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		id, err := u.serviceContainer(service, environment)
		if err == nil {
			format := "{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}} {{.State.ExitCode}}"
			output, inspectErr := commandOutput(30*time.Second, u.installDir, environment, "docker", "inspect", "--format", format, id)
			if inspectErr == nil {
				parts := strings.Fields(string(output))
				if completed && len(parts) >= 2 && parts[0] == "exited" && parts[len(parts)-1] == "0" {
					return nil
				}
				if !completed && len(parts) >= 1 && parts[0] == "running" && (len(parts) == 2 || parts[1] == "healthy") {
					return nil
				}
			}
		}
		time.Sleep(5 * time.Second)
	}
	return errors.New("update_health_timeout")
}

func (u *updater) writeStatus(uuid, state, code string) error {
	return atomicJSON(filepath.Join(u.exchange, "status", uuid+".json"), status{
		OperationUUID: uuid,
		Status:        state,
		ErrorCode:     code,
		UpdatedAt:     time.Now().UTC().Format(time.RFC3339),
	})
}

func validateManifest(value manifest, req request) error {
	if value.Schema != 1 || normalizeVersion(value.Version) != normalizeVersion(req.ToVersion) {
		return errors.New("update_manifest_version_invalid")
	}
	minimum := normalizeVersion(value.MinimumSourceVersion)
	if minimum == "" || compareVersions(req.FromVersion, minimum) < 0 || value.RequiresHostSteps {
		return errors.New("update_source_unsupported")
	}
	major, _, _, ok := versionParts(req.FromVersion)
	if !ok || !containsInt(value.ManualSourceMajors, major) {
		return errors.New("update_source_unsupported")
	}
	targetMajor, _, _, _ := versionParts(req.ToVersion)
	if req.Trigger == "automatic" && (targetMajor != major || !value.AutomaticEligible) {
		return errors.New("update_automatic_rejected")
	}
	if !regexp.MustCompile(`^sha256:[a-f0-9]{64}$`).MatchString(value.ComposeSHA256) || len(value.Images) < 3 {
		return errors.New("update_manifest_invalid")
	}
	seen := map[string]struct{}{}
	for _, image := range value.Images {
		if !imagePattern.MatchString(image) {
			return errors.New("update_image_untrusted")
		}
		seen[image] = struct{}{}
	}
	if len(seen) != len(value.Images) {
		return errors.New("update_manifest_invalid")
	}
	return nil
}

func composeEnvironment(installDir string, ports publishedPorts, project string) []string {
	return []string{
		"COMPOSE_PROJECT_NAME=" + project,
		"PWD=" + installDir,
		"NETKEEP_IMAGE=",
		"NETKEEP_OXIDIZED_IMAGE=",
		"NETKEEP_UPDATER_IMAGE=",
		"NETKEEP_HTTP_PORT=" + ports.httpPort,
		"NETKEEP_HTTPS_PORT=" + ports.httpsPort,
		"NETKEEP_BIND_IP=" + ports.bindIP,
	}
}

func command(timeout time.Duration, directory string, environment []string, name string, arguments ...string) error {
	_, err := commandOutput(timeout, directory, environment, name, arguments...)
	return err
}

func commandOutput(timeout time.Duration, directory string, environment []string, name string, arguments ...string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	cmd := exec.CommandContext(ctx, name, arguments...)
	cmd.Dir = directory
	cmd.Env = mergedEnvironment(environment)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	output, err := cmd.Output()
	if ctx.Err() != nil {
		return nil, ctx.Err()
	}
	return output, err
}

func decodeStrict(path string, maximum int64, target any) error {
	info, err := os.Stat(path)
	if err != nil || info.Size() < 1 || info.Size() > maximum {
		return errors.New("json_size_invalid")
	}
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	decoder := json.NewDecoder(io.LimitReader(file, maximum+1))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return errors.New("json_trailing_data")
	}
	return nil
}

func requireRegular(path string) error {
	info, err := os.Lstat(path)
	if err != nil || !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 {
		return errors.New("file_not_regular")
	}
	return nil
}

func copyAtomic(source, target string, mode os.FileMode) error {
	if err := requireRegular(source); err != nil {
		return err
	}
	info, err := os.Stat(source)
	if err != nil || info.Size() < 1 || info.Size() > 1048576 {
		return errors.New("atomic_copy_size_invalid")
	}
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()
	temporary := target + ".partial"
	output, err := os.OpenFile(temporary, os.O_CREATE|os.O_EXCL|os.O_WRONLY, mode)
	if errors.Is(err, os.ErrExist) {
		_ = os.Remove(temporary)
		output, err = os.OpenFile(temporary, os.O_CREATE|os.O_EXCL|os.O_WRONLY, mode)
	}
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(output, io.LimitReader(input, 1048577))
	syncErr := output.Sync()
	closeErr := output.Close()
	if copyErr != nil || syncErr != nil || closeErr != nil {
		_ = os.Remove(temporary)
		return errors.New("atomic_copy_failed")
	}
	if err := os.Rename(temporary, target); err != nil {
		_ = os.Remove(temporary)
		return err
	}
	return nil
}

func mergedEnvironment(overrides []string) []string {
	keys := map[string]struct{}{}
	for _, value := range overrides {
		key, _, found := strings.Cut(value, "=")
		if found {
			keys[key] = struct{}{}
		}
	}
	result := make([]string, 0, len(os.Environ())+len(overrides))
	for _, value := range os.Environ() {
		key, _, found := strings.Cut(value, "=")
		if !found {
			continue
		}
		if _, replaced := keys[key]; !replaced {
			result = append(result, value)
		}
	}
	return append(result, overrides...)
}

func atomicJSON(path string, value any) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	temporary := path + ".partial"
	if err := os.WriteFile(temporary, append(data, '\n'), 0660); err != nil {
		return err
	}
	return os.Rename(temporary, path)
}

func digestFile(path string) string {
	file, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer file.Close()
	digest := sha256.New()
	if _, err := io.Copy(digest, io.LimitReader(file, 1048577)); err != nil {
		return ""
	}
	return hex.EncodeToString(digest.Sum(nil))
}

func normalizeVersion(value string) string {
	matches := versionPattern.FindStringSubmatch(value)
	if len(matches) != 4 {
		return ""
	}
	return matches[1] + "." + matches[2] + "." + matches[3]
}

func versionParts(value string) (int, int, int, bool) {
	normalized := normalizeVersion(value)
	if normalized == "" {
		return 0, 0, 0, false
	}
	parts := strings.Split(normalized, ".")
	major, firstErr := strconv.Atoi(parts[0])
	minor, secondErr := strconv.Atoi(parts[1])
	patch, thirdErr := strconv.Atoi(parts[2])
	return major, minor, patch, firstErr == nil && secondErr == nil && thirdErr == nil
}

func compareVersions(left, right string) int {
	lMajor, lMinor, lPatch, lOk := versionParts(left)
	rMajor, rMinor, rPatch, rOk := versionParts(right)
	if !lOk || !rOk {
		return 0
	}
	leftParts := []int{lMajor, lMinor, lPatch}
	rightParts := []int{rMajor, rMinor, rPatch}
	for index := range leftParts {
		if leftParts[index] < rightParts[index] {
			return -1
		}
		if leftParts[index] > rightParts[index] {
			return 1
		}
	}
	return 0
}

func equalStrings(left, right []string) bool {
	leftCopy := append([]string(nil), left...)
	rightCopy := append([]string(nil), right...)
	sort.Strings(leftCopy)
	sort.Strings(rightCopy)
	return strings.Join(leftCopy, "\x00") == strings.Join(rightCopy, "\x00")
}

func containsInt(values []int, target int) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func safeCode(err error) string {
	if err == nil {
		return ""
	}
	code := strings.SplitN(err.Error(), ":", 2)[0]
	if regexp.MustCompile(`^[a-z0-9_]{1,64}$`).MatchString(code) {
		return code
	}
	return "update_failed"
}

func env(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
