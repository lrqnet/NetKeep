#!/usr/bin/env bash
set -Eeuo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$root/.inventory-lab.env"

if [[ "${NETKEEP_INVENTORY_LAB_SKIP_START:-0}" != '1' ]]; then
    "$root/scripts/inventory-lab.sh" up
fi

set -a
source "$env_file"
set +a

compose=(
    docker compose
    --project-name "${NETKEEP_INVENTORY_LAB_PROJECT:-netkeep-inventory-lab}"
    --file "$root/compose.yaml"
    --file "$root/compose.dev.yaml"
    --file "$root/compose.inventory-lab.yaml"
)

netbox_api="http://127.0.0.1:${NETKEEP_LAB_NETBOX_PORT:-28181}/api"
run_id="$(date +%s)"

netbox_post() {
    curl --fail --silent --show-error \
        -H "Authorization: Token $NETKEEP_LAB_NETBOX_V1_TOKEN" \
        -H 'Content-Type: application/json' \
        -X POST "$netbox_api/$1" \
        --data "$2"
}

site_id="$(netbox_post 'dcim/sites/' "{\"name\":\"NetKeep Lab Site $run_id\",\"slug\":\"netkeep-lab-site-$run_id\"}" | jq -er '.id')"
manufacturer_id="$(netbox_post 'dcim/manufacturers/' "{\"name\":\"NetKeep Lab Vendor $run_id\",\"slug\":\"netkeep-lab-vendor-$run_id\"}" | jq -er '.id')"
role_id="$(netbox_post 'dcim/device-roles/' "{\"name\":\"Router $run_id\",\"slug\":\"router-$run_id\",\"color\":\"00aa00\"}" | jq -er '.id')"
device_type_id="$(netbox_post 'dcim/device-types/' "{\"model\":\"Lab Router $run_id\",\"slug\":\"lab-router-$run_id\",\"manufacturer\":$manufacturer_id}" | jq -er '.id')"
device_id="$(netbox_post 'dcim/devices/' "{\"name\":\"netbox-lab-$run_id\",\"device_type\":$device_type_id,\"role\":$role_id,\"site\":$site_id,\"status\":\"active\"}" | jq -er '.id')"
interface_id="$(netbox_post 'dcim/interfaces/' "{\"device\":$device_id,\"name\":\"mgmt0\",\"type\":\"1000base-t\"}" | jq -er '.id')"
ip_id="$(netbox_post 'ipam/ip-addresses/' "{\"address\":\"198.18.$((run_id % 250)).10/24\",\"status\":\"active\",\"assigned_object_type\":\"dcim.interface\",\"assigned_object_id\":$interface_id}" | jq -er '.id')"

curl --fail --silent --show-error \
    -H "Authorization: Token $NETKEEP_LAB_NETBOX_V1_TOKEN" \
    -H 'Content-Type: application/json' \
    -X PATCH "$netbox_api/dcim/devices/$device_id/" \
    --data "{\"primary_ip4\":$ip_id}" \
    >/dev/null

librenms_ip="198.19.$((run_id % 250)).20"
librenms_sql="INSERT INTO locations (location, timestamp, fixed_coordinates) VALUES ('NetKeep Lab $run_id', UTC_TIMESTAMP(), 0); SET @location_id = LAST_INSERT_ID(); INSERT INTO devices (hostname, sysName, ip, hardware, location_id, os, status, status_reason, type, disabled, snmpver, community) VALUES ('$librenms_ip', 'librenms-lab-$run_id', INET6_ATON('$librenms_ip'), 'Lab Router $run_id', @location_id, 'routeros', 1, '', 'network', 0, 'v2c', 'not-used');"

"${compose[@]}" exec --no-TTY \
    -e MYSQL_PWD="$NETKEEP_LAB_LIBRENMS_DATABASE_PASSWORD" \
    librenms-db mariadb -u librenms_lab -D librenms -e "$librenms_sql"

"${compose[@]}" exec --no-TTY \
    -e NETKEEP_LAB_NETBOX_V1_TOKEN="$NETKEEP_LAB_NETBOX_V1_TOKEN" \
    -e NETKEEP_LAB_LIBRENMS_TOKEN="$NETKEEP_LAB_LIBRENMS_TOKEN" \
    app php artisan tinker --execute='$sources = [["name" => "NetBox Lab Verification", "type" => "netbox", "base_url" => "http://netbox-lab:8080", "token" => getenv("NETKEEP_LAB_NETBOX_V1_TOKEN")], ["name" => "LibreNMS Lab Verification", "type" => "librenms", "base_url" => "http://librenms-lab:8000", "token" => getenv("NETKEEP_LAB_LIBRENMS_TOKEN")]]; foreach ($sources as $source) { \App\Models\InventorySource::query()->updateOrCreate(["name" => $source["name"]], ["type" => $source["type"], "base_url" => $source["base_url"], "token" => $source["token"], "settings" => ["grace_period" => 300], "sync_interval" => 300, "enabled" => true, "last_synced_at" => null]); }' \
    >/dev/null

for source in 'NetBox Lab Verification' 'LibreNMS Lab Verification'; do
    source_id="$("${compose[@]}" exec --no-TTY app php artisan tinker --execute="echo \\App\\Models\\InventorySource::query()->where('name', '$source')->value('id');" | tail -n 1)"
    "${compose[@]}" exec --no-TTY app php artisan inventory:sync "$source_id" >/dev/null
done

"${compose[@]}" exec --no-TTY app php artisan tinker --execute="\$netbox = \\App\\Models\\Device::query()->whereHas('inventorySource', fn (\$query) => \$query->where('name', 'NetBox Lab Verification'))->where('external_id', '$device_id')->exists(); \$librenms = \\App\\Models\\Device::query()->whereHas('inventorySource', fn (\$query) => \$query->where('name', 'LibreNMS Lab Verification'))->where('hostname', '$librenms_ip')->exists(); if (! \$netbox || ! \$librenms) { exit(1); }" \
    >/dev/null

printf '%s\n' 'Inventory lab verification passed.'
