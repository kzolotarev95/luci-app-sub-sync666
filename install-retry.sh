#!/bin/sh
# SUBSYNC_SAFE_PODKOP_RESTART_INSTALL_V388_BEGIN
cat > /usr/bin/podcop-sub-v666-safe-podkop-restart <<'EOSAFE'
#!/bin/sh
# SUBSYNC_SAFE_PODKOP_RESTART_V388
set -u

has_outbound() {
  for S in $(uci show podkop 2>/dev/null | sed -n 's/^podkop\.\([^.=]*\)=section.*/\1/p'); do
    for O in proxy_string selector_proxy_links urltest_proxy_links outbound_json interface; do
      V="$(uci -q get podkop.$S.$O 2>/dev/null || true)"
      [ -n "$V" ] && return 0
    done
  done
  return 1
}

if [ -x /usr/bin/podcop-sub-v666-xhttp-patch ]; then
  /usr/bin/podcop-sub-v666-xhttp-patch apply >/dev/null 2>&1 || true
fi

if ! has_outbound; then
  logger -t podcop-sub-v666 "v388: skip podkop restart, no outbound configured yet"
  /etc/init.d/podkop stop >/dev/null 2>&1 || true
  echo "SKIP_PODKOP_RESTART_NO_OUTBOUND"
  exit 0
fi

/etc/init.d/podkop restart
EOSAFE
chmod +x /usr/bin/podcop-sub-v666-safe-podkop-restart
# SUBSYNC_SAFE_PODKOP_RESTART_INSTALL_V388_END
set -u

REPO_OWNER="${REPO_OWNER:-kzolotarev95}"
REPO_NAME="${REPO_NAME:-luci-app-sub-sync666}"
REPO_REF="${REPO_REF:-main}"
BASE_URL="https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/$REPO_REF"
TMP="/tmp/subsync-install-v361.sh"

echo "========================================="
echo " Podcop Sub v666 retry installer v361"
echo "========================================="

i=1
while [ "$i" -le 10 ]; do
  echo "--- install download try $i from $BASE_URL ---"
  wget -O "$TMP" "$BASE_URL/install.sh?v=$(date +%s)-$i" || true

  if [ -s "$TMP" ] && grep -q 'SUBSYNC_PUBLIC_BUILD_V388' "$TMP" && sh -n "$TMP"; then
    echo "OK: install.sh v388 downloaded and verified"
    sh "$TMP"
    exit $?
  fi

  echo "WARN: downloaded install.sh is not verified v361"
  i=$((i + 1))
  sleep 3
done

echo "ERROR: cannot download verified install.sh v388"
exit 1
