#!/bin/sh
# SUBSYNC_PUBLIC_BUILD_V261
# SUBSYNC_SKIP_THEME_IF_PRESENT_V260_BEGIN
if [ -d /www/luci-static/proton2025 ] && uci show luci 2>/dev/null | grep -q "ProtoByZKS95"; then
  export SUBSYNC_SKIP_PROTOBYZKS95_THEME=1
fi
# SUBSYNC_SKIP_THEME_IF_PRESENT_V260_END
# SUBSYNC_PUBLIC_BUILD_V260
# SUBSYNC_PUBLIC_BUILD_V259
# SUBSYNC_PUBLIC_BUILD_V258
# SUBSYNC_PUBLIC_BUILD_V256
# SUBSYNC_PUBLIC_BUILD_V255
# SUBSYNC_PUBLIC_BUILD_V254
# SUBSYNC_PUBLIC_BUILD_V253
# SUBSYNC_PUBLIC_BUILD_V252
# SUBSYNC_PUBLIC_BUILD_V238
# PODCOP_SUB_V666_PUBLIC_INSTALL_CLEAN_V221
set -u

REPO_SLUG="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
BRANCH="${SUBSYNC_BRANCH:-main}"
RAW="https://raw.githubusercontent.com/${REPO_SLUG}/${BRANCH}"

echo "========================================="
echo "  Podcop Sub v666 — public install v261"
echo "========================================="
echo "Backup: disabled for public/friend install"

fetch_file() {
  src="$1"
  dst="$2"
  mode="${3:-755}"
  mkdir -p "$(dirname "$dst")"
  if wget -qO "$dst" "$RAW/$src?v=$(date +%s)"; then
    chmod "$mode" "$dst" 2>/dev/null || true
    echo "OK: $dst"
  else
    echo "WARN: failed to download $src"
    return 1
  fi
}

echo "=== install UI ==="
fetch_file "htdocs/luci-static/resources/view/sub_sync/sub_sync.js" "/www/luci-static/resources/view/sub_sync/sub_sync.js" 644
fetch_file "htdocs/luci-static/resources/view/sub_sync/sub_sync_v221.js" "/www/luci-static/resources/view/sub_sync/sub_sync_v221.js" 644

echo "=== install ACL ==="
fetch_file "usr/share/rpcd/acl.d/luci-app-sub-sync.json" "/usr/share/rpcd/acl.d/luci-app-sub-sync.json" 644

echo "=== install helpers ==="
for f in \
  podcop-sub-v666-xhttp-patch \
  sub-sync \
  sub-sync.real \
  sub-sync.v51base \
  sub-sync.v164manualbase \
  sub-sync-autoadd \
  sub-sync-donaters \
  sub-sync-happ-json-hy2-import \
  sub-sync-hy2-manager \
  sub-sync-hy2-probe \
  sub-sync-hy2-urltest \
  sub-sync-manual-import \
  sub-sync-manual-link \
  sub-sync-section \
  sub-sync-singbox-log \
  sub-sync-subs-info \
  sub-sync-system-info \
  sub-sync-urltest \
  sub-sync-xhttp-guard
do
  fetch_file "usr/bin/$f" "/usr/bin/$f" 755 || true
done

echo "=== install public donor state ==="
mkdir -p /etc/sub-sync
fetch_file "etc/sub-sync/donaters.tsv" "/etc/sub-sync/donaters.tsv" 600 || true

echo "=== remove stale old helper files ==="
rm -f /usr/bin/sub-sync-public-ui-patch /usr/bin/sub-sync-public-ui-patch.disabled-v* 2>/dev/null || true
rm -f /usr/bin/*prev* /usr/bin/*before* /usr/bin/*.bak /usr/bin/*real-v* /usr/bin/sub-sync-hy2-ping 2>/dev/null || true

echo "=== integrate into Services -> Podkop ==="
mkdir -p /usr/share/luci/menu.d
cat > /usr/share/luci/menu.d/luci-app-podkop.json <<'MENU'
{
  "admin/services/podkop": {
    "title": "Podkop",
    "order": 42,
    "action": {
      "type": "view",
      "path": "sub_sync/sub_sync_v221"
    },
    "depends": {
      "acl": [ "luci-app-podkop", "luci-app-sub-sync" ],
      "uci": { "podkop": true }
    }
  }
}
MENU

rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json 2>/dev/null || true

echo "=== apply Podkop xHTTP patch ==="
if [ -x /usr/bin/podcop-sub-v666-xhttp-patch ]; then
  /usr/bin/podcop-sub-v666-xhttp-patch apply || true
fi

echo "=== clear LuCI cache ==="
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
: # V260_DELAYED_RESTART old immediate rpcd restart disabled
: # V260_DELAYED_RESTART old immediate uhttpd restart disabled
/etc/init.d/podkop restart >/dev/null 2>&1 || true

echo "========================================="
echo "Podcop Sub v666 public install v261 complete"
echo "Open: Services -> Podkop"
echo "Ctrl+F5 after install"
echo "========================================="
# SUBSYNC_INSTALL_VERSION_FILES_V261_BEGIN
echo "========================================="
echo " Podcop Sub v666 OTA v261 real report"
echo "========================================="

SUBSYNC_RAW_BASE="${SUBSYNC_RAW_BASE:-${RAW_BASE:-https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main}}"
DST="/www/luci-static/resources/view/sub_sync"
TMP_JS="/tmp/sub-sync-v261-$RANDOM.js"

echo "[1/9] prepare folders"
mkdir -p /etc/sub-sync /usr/bin /usr/share/rpcd/acl.d "$DST"

echo "[2/9] download new module JS"
if ! wget -qO "$TMP_JS" "$SUBSYNC_RAW_BASE/htdocs/luci-static/resources/view/sub_sync/sub_sync.js?v=$(date +%s)"; then
  echo "ERROR: failed to download sub_sync.js"
  exit 1
fi

echo "[3/9] verify JS markers"
grep -q 'SUBSYNC_DONATE_COPY_BUTTON_V258' "$TMP_JS" || { echo "ERROR: donate copy marker missing"; exit 1; }
grep -q 'SUBSYNC_SAFE_OTA_REPORT_UI_V260' "$TMP_JS" || { echo "ERROR: v260 safe OTA marker missing"; exit 1; }
grep -q 'SUBSYNC_UPDATE_CHECK_TEXT_V261' "$TMP_JS" || { echo "ERROR: v261 check text marker missing"; exit 1; }

echo "[4/9] install JS safely without deleting active aliases"
cp -f "$TMP_JS" "$DST/sub_sync.js"

for v in 208 211 212 221 238 252 253 254 255 256 258 259 260 261; do
  cp -f "$TMP_JS" "$DST/sub_sync_v${v}.js"
done

chmod 755 "$DST"
chmod 644 "$DST"/*.js 2>/dev/null || true

echo "[5/9] remove only stale temp/live files"
rm -f "$DST"/sub_sync_live_*.js "$DST"/sub_sync_tmp_*.js "$DST"/*.bak "$DST"/*.old "$DST"/*.tmp 2>/dev/null || true

echo "[6/9] install updater and ACL"
wget -qO /usr/bin/sub-sync-module-update "$SUBSYNC_RAW_BASE/usr/bin/sub-sync-module-update?v=$(date +%s)" && chmod 755 /usr/bin/sub-sync-module-update || echo "WARN: updater download failed"
wget -qO /usr/share/rpcd/acl.d/luci-app-sub-sync.json "$SUBSYNC_RAW_BASE/usr/share/rpcd/acl.d/luci-app-sub-sync.json?v=$(date +%s)" || echo "WARN: ACL download failed"

echo "[7/9] write local version"
echo "261" > /etc/sub-sync/module-build
echo "v261" > /etc/sub-sync/module-version

echo "[8/9] clear LuCI cache files"
rm -rf /tmp/luci-modulecache /tmp/luci-modulecache/* /tmp/luci-indexcache /tmp/luci-indexcache* /tmp/luci-sessions /tmp/luci-sessions/* 2>/dev/null || true
find /tmp -maxdepth 1 -type d -name 'luci-*cache*' -exec rm -rf {} + 2>/dev/null || true
find /tmp -maxdepth 1 -type f -name 'luci-*cache*' -delete 2>/dev/null || true
sync

echo "[9/9] schedule LuCI service restart after report"
nohup sh -c 'sleep 3; rm -rf /tmp/luci-modulecache /tmp/luci-modulecache/* /tmp/luci-indexcache /tmp/luci-indexcache* /tmp/luci-sessions /tmp/luci-sessions/* 2>/dev/null || true; /etc/init.d/rpcd restart >/dev/null 2>&1 || true; /etc/init.d/uhttpd restart >/dev/null 2>&1 || true' >/tmp/subsync-v261-delayed-restart.log 2>&1 &

rm -f "$TMP_JS" 2>/dev/null || true
logger -t sub-sync "Podcop Sub v666 public build v261 installed" 2>/dev/null || true

echo "DONE: install.sh finished rc=0"
echo "DONE: Podcop Sub v666 v261 installed. LuCI will restart in a few seconds."
# SUBSYNC_INSTALL_VERSION_FILES_V261_END
