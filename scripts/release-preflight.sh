#!/bin/sh

set -eu

TAG="$1"
RELEASE_SHA="$2"
MAIN_SHA="$3"
TAG_TYPE="$4"

printf '%s\n' "${TAG}" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$'
test "${TAG_TYPE}" = 'tag'
test -n "${MAIN_SHA}"
test "${RELEASE_SHA}" = "${MAIN_SHA}"

VERSION="${TAG#v}"
APP_VERSION="$(sed -n 's#.*docker.io/lrqnet/netkeep:\([0-9][0-9.]*\)}#\1#p' compose.yaml | head -n 1)"
UPDATER_VERSION="$(sed -n 's#.*docker.io/lrqnet/netkeep-updater:\([0-9][0-9.]*\)}#\1#p' compose.yaml | head -n 1)"

test "${APP_VERSION}" = "${VERSION}"
test "${UPDATER_VERSION}" = "${VERSION}"
test "$(grep -Fc 'docker.io/lrqnet/netkeep-oxidized:0.37.0-r4' compose.yaml)" -eq 2
grep -Fq "## [${VERSION}] - " CHANGELOG.md
grep -Fq "releases/tag/${TAG}" README.md
grep -Fq "releases/download/${TAG}/compose.yaml" README.md
grep -Fq "releases/download/${TAG}/compose.yaml" docs/INSTALL.md
grep -Fq "releases/download/${TAG}/compose.yaml" docs/UPGRADE.md
grep -Fq "releases/download/${TAG}/compose.yaml" docs/RELEASE.md
