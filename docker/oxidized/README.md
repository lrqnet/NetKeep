# Oxidized model backports

The runtime stays on the official 0.37.0 base. `upstream.json` records the
immutable upstream commit and SHA-256 of every copied production file:
26 equipment models (including new FTD and VSOL OLT models), the model base
class string mutability fix, and the HTTP input compatibility needed by FTD
(public request methods, DELETE and configurable port).

Files in `upstream/` are copied verbatim from ytti/oxidized at
`76e630b70e04901a48eda3bf14a7773d94d7a482`, under Apache-2.0; see LICENSE.
The build verifies their checksums before replacing the matching gem files.
No other upstream core, SSH or scheduler changes are included.

FTD also requires rubyzip 3.7.0, installed from a checksum-verified gem.

## Regression tests

The `model-tests` Docker target includes upstream model tests, fixtures for the
changed models, HTTP tests, and Mocha. Only the coverage setup was removed from
upstream `spec_helper.rb`; the production image contains none of these test
files or development dependencies. `tests/run.rb` verifies installed checksums
and loads every backported model before running the tests.

```sh
docker build -f Dockerfile.oxidized --target model-tests -t netkeep-oxidized:model-tests .
docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --cpus 2 --memory 768m --pids-limit 96 \
  --ulimit cpu=180 --ulimit fsize=10485760 --tmpfs /tmp:size=64m \
  --entrypoint /usr/bin/env netkeep-oxidized:model-tests \
  -i PATH=/usr/local/bin:/usr/bin:/bin HOME=/tmp timeout 240 ruby /tests/run.rb
```

PAN-OS API now backs up the running configuration by default. Set the device
variable `panos_api_candidate: true` to retain the former candidate export
behavior. FTD uses the HTTP input and creates/deletes its export file
(default `oxidized.zip`) on the device; use a dedicated export filename.
Actual equipment and firmware compatibility still needs device validation.

## NetKeep transport scope

NetKeep currently accepts SSH and Telnet devices. FTD and PAN-OS API are HTTP
models: their files and HTTP compatibility are present and tested in the engine,
but HTTP collection cannot yet be configured through NetKeep's device workflow.
This backport does not add HTTP transport to the application. VSOL uses SSH.
The `panos_api_candidate` setting above is an Oxidized model variable, not a
new field in NetKeep's device editor.
