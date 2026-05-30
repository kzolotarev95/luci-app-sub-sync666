#!/bin/sh
# SUBSYNC_PUBLIC_BUILD_V274
# SUBSYNC_SKIP_THEME_IF_PRESENT_V260_BEGIN
if [ -d /www/luci-static/proton2025 ] && uci show luci 2>/dev/null | grep -q "ProtoByZKS95"; then
  export SUBSYNC_SKIP_PROTOBYZKS95_THEME=1
fi
# SUBSYNC_SKIP_THEME_IF_PRESENT_V260_END
# PODCOP_SUB_V666_PUBLIC_INSTALL_CLEAN_V221
set -u

REPO_SLUG="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
BRANCH="${SUBSYNC_BRANCH:-main}"
RAW="https://raw.githubusercontent.com/${REPO_SLUG}/${BRANCH}"

echo "========================================="
echo "  Podcop Sub v666 — public install v274"
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
echo "Podcop Sub v666 public install v274 complete"
echo "Open: Services -> Podkop"
echo "Re-login LuCI after install"
echo "========================================="
# SUBSYNC_INSTALL_VERSION_FILES_V274_BEGIN
echo "========================================="
echo " Podcop Sub v666 OTA v274 ACL fallback clean install"
echo "========================================="

SUBSYNC_RAW_BASE="${SUBSYNC_RAW_BASE:-${RAW_BASE:-https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main}}"
THEME_RAW="https://raw.githubusercontent.com/kzolotarev95/luci-theme-protobyzks95/main/install.sh"
DST="/www/luci-static/resources/view/sub_sync"
SRC_JS="$DST/sub_sync.js"
ACL="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"
THEME_OK=0

subsync_write_acl_fallback_v274() {
  echo "=== SUBSYNC_ACL_LOCAL_FALLBACK_V274 ==="
  mkdir -p /usr/share/rpcd/acl.d
  cat > "$ACL" <<'ACLJSON'
{
  "luci-app-sub-sync": {
    "description": "Grant access to Podcop Sub v666",
    "read": {
      "uci": [ "podkop", "sub-sync", "network", "dhcp" ],
      "file": {
        "/etc/sub-sync/*": [ "read" ],
        "/etc/sing-box/config.json": [ "read" ],
        "/tmp/sub-sync-*": [ "read" ]
      }
    },
    "write": {
      "uci": [ "podkop", "sub-sync" ],
      "file": {
        "/etc/sub-sync/*": [ "read", "write" ],
        "/etc/config/podkop": [ "read", "write" ],
        "/usr/bin/sub-sync": [ "exec" ],
        "/usr/bin/sub-sync.real": [ "exec" ],
        "/usr/bin/sub-sync.v51base": [ "exec" ],
        "/usr/bin/sub-sync.v164manualbase": [ "exec" ],
        "/usr/bin/sub-sync-autoadd": [ "exec" ],
        "/usr/bin/sub-sync-donaters": [ "exec" ],
        "/usr/bin/sub-sync-happ-json-hy2-import": [ "exec" ],
        "/usr/bin/sub-sync-hy2-manager": [ "exec" ],
        "/usr/bin/sub-sync-hy2-probe": [ "exec" ],
        "/usr/bin/sub-sync-hy2-urltest": [ "exec" ],
        "/usr/bin/sub-sync-manual-import": [ "exec" ],
        "/usr/bin/sub-sync-manual-link": [ "exec" ],
        "/usr/bin/sub-sync-section": [ "exec" ],
        "/usr/bin/sub-sync-singbox-log": [ "exec" ],
        "/usr/bin/sub-sync-subs-info": [ "exec" ],
        "/usr/bin/sub-sync-system-info": [ "exec" ],
        "/usr/bin/sub-sync-urltest": [ "exec" ],
        "/usr/bin/sub-sync-xhttp-guard": [ "exec" ],
        "/usr/bin/sub-sync-module-update": [ "exec" ],
        "/usr/bin/podcop-sub-v666-xhttp-patch": [ "exec" ]
      }
    }
  }
}
ACLJSON
}

subsync_ensure_acl_v274() {
  if [ -s "$ACL" ] && jsonfilter -i "$ACL" -e '@["luci-app-sub-sync"].description' >/dev/null 2>&1; then
    echo "OK: ACL valid"
    return 0
  fi

  echo "WARN: ACL missing/invalid, writing local fallback"
  subsync_write_acl_fallback_v274

  jsonfilter -i "$ACL" -e '@["luci-app-sub-sync"].description' >/dev/null 2>&1 || {
    echo "ERROR: ACL fallback invalid"
    exit 1
  }
}

subsync_hide_check_v274() {
  f="$1"
  [ -s "$f" ] || return 0
  grep -q 'SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B' "$f" || sed -i "1a/* SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B */" "$f"

  awk '
    /var moduleUpdateCheckBtnV236[[:space:]]*=[[:space:]]*E\('\''button'\''/ {
      in_check = 1
      print
      next
    }
    in_check && /'\''style'\'':[[:space:]]*'\''display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important'\''/ {
      next
    }
    in_check && /'\''class'\'':[[:space:]]*'\''btn cbi-button cbi-button-neutral'\''/ {
      print
      print "                            '\''style'\'': '\''display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important'\'',"
      next
    }
    in_check && /\}, '\''Проверить'\''\);/ {
      in_check = 0
      print
      next
    }
    { print }
  ' "$f" > /tmp/sub_sync.hidecheck.v274.js
  mv /tmp/sub_sync.hidecheck.v274.js "$f"
}

subsync_theme_install_v274() {
  i=1
  while [ "$i" -le 5 ]; do
    echo "=== theme install try $i/5 ==="
    if wget -O /tmp/protobyzks95-install.sh "$THEME_RAW?v=$(date +%s)-$i"; then
      if sh -n /tmp/protobyzks95-install.sh && sh /tmp/protobyzks95-install.sh; then
        if [ -d /www/luci-static/proton2025 ]; then
          uci set luci.main.mediaurlbase='/luci-static/proton2025' 2>/dev/null || true
          uci commit luci 2>/dev/null || true
          echo "OK: theme installed and active: $(uci get luci.main.mediaurlbase 2>/dev/null || true)"
          return 0
        fi
      fi
    fi
    echo "WARN: theme install try $i failed"
    i=$((i + 1))
    sleep 4
  done

  if [ -d /www/luci-static/proton2025 ]; then
    uci set luci.main.mediaurlbase='/luci-static/proton2025' 2>/dev/null || true
    uci commit luci 2>/dev/null || true
    echo "OK: theme already exists and active: $(uci get luci.main.mediaurlbase 2>/dev/null || true)"
    return 0
  fi

  echo "WARN_THEME_FAILED: module installed, but proton2025 theme was not installed"
  return 1
}

echo "[1/15] prepare folders"
mkdir -p /etc/sub-sync /usr/bin /etc/init.d /usr/share/luci/menu.d /usr/share/rpcd/acl.d "$DST"

echo "[2/15] remove duplicate standalone menu"
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json 2>/dev/null || true

echo "[3/15] ensure ACL before risky checks"
subsync_ensure_acl_v274

echo "[4/15] hide Проверить in source and aliases early"
[ -s "$SRC_JS" ] || { echo "ERROR: module JS missing: $SRC_JS"; exit 1; }
subsync_hide_check_v274 "$SRC_JS"
for v in 208 211 212 221 238 252 253 254 255 256 258 259 260 261 262 263 264 265 266 267 268 269 270 271 272 273 274; do
  cp -f "$SRC_JS" "$DST/sub_sync_v${v}.js"
done
chmod 644 "$DST"/sub_sync*.js 2>/dev/null || true

echo "[5/15] install persistent guard v274 before theme"
if wget -qO /usr/bin/podcop-sub-v666-guard "$SUBSYNC_RAW_BASE/usr/bin/podcop-sub-v666-guard?v=$(date +%s)"; then
  chmod 755 /usr/bin/podcop-sub-v666-guard
else
  echo "WARN: guard helper download failed, keeping existing if any"
fi

echo "[6/15] install guard init service before theme"
if wget -qO /etc/init.d/podcop-sub-v666-guard "$SUBSYNC_RAW_BASE/etc/init.d/podcop-sub-v666-guard?v=$(date +%s)"; then
  chmod 755 /etc/init.d/podcop-sub-v666-guard
  /etc/init.d/podcop-sub-v666-guard enable >/dev/null 2>&1 || true
else
  echo "WARN: guard init download failed before theme"
fi

echo "[7/15] install cron guard"
touch /etc/crontabs/root
grep -q '/usr/bin/podcop-sub-v666-guard' /etc/crontabs/root 2>/dev/null || \
  echo '*/5 * * * * /usr/bin/podcop-sub-v666-guard >/tmp/podcop-sub-v666-guard.log 2>&1' >> /etc/crontabs/root
/etc/init.d/cron restart >/dev/null 2>&1 || true

echo "[8/15] install updater helper before theme"
wget -qO /usr/bin/sub-sync-module-update "$SUBSYNC_RAW_BASE/usr/bin/sub-sync-module-update?v=$(date +%s)" && chmod 755 /usr/bin/sub-sync-module-update || echo "WARN: updater download failed before theme"

echo "[9/15] install ProtoByZKS95/proton2025 theme with retries"
if subsync_theme_install_v274; then
  THEME_OK=1
else
  THEME_OK=0
fi

echo "[10/15] verify final module JS/ACL/integrated menu"
subsync_ensure_acl_v274
[ -s "$SRC_JS" ] || { echo "ERROR: module JS missing: $SRC_JS"; exit 1; }

if [ -f /usr/share/luci/menu.d/luci-app-sub-sync.json ]; then
  echo "ERROR: duplicate standalone menu still exists"
  exit 1
fi

grep -Rqs 'sub_sync/sub_sync' /usr/share/luci/menu.d/luci-app-podkop.json 2>/dev/null || {
  echo "ERROR: integrated Podkop menu route missing"
  exit 1
}

echo "[11/15] verify UI markers"
grep -q 'SUBSYNC_DIRECT_REMOVE_MANUAL_HIDE_LOAD_V266B' "$SRC_JS" || { echo "ERROR: v266b direct UI marker missing"; exit 1; }
grep -q 'SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B' "$SRC_JS" || { echo "ERROR: update check hide marker missing"; exit 1; }
grep -q 'SUBSYNC_UI_UPDATE_LIVE_TIMER_V263' "$SRC_JS" || { echo "ERROR: v263 timer marker missing"; exit 1; }
grep -q 'SUBSYNC_DONATE_COPY_BUTTON_V258' "$SRC_JS" || { echo "ERROR: donate copy marker missing"; exit 1; }
grep -q 'display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important' "$SRC_JS" || { echo "ERROR: check button hidden style missing"; exit 1; }

echo "[12/15] run guard/xHTTP"
if [ -x /usr/bin/podcop-sub-v666-guard ]; then
  /usr/bin/podcop-sub-v666-guard || echo "WARN: guard returned non-zero"
fi
[ -x /usr/bin/podcop-sub-v666-xhttp-patch ] && /usr/bin/podcop-sub-v666-xhttp-patch >/tmp/podcop-sub-v666-xhttp-patch.log 2>&1 || true

echo "[13/15] write local version"
echo "274" > /etc/sub-sync/module-build
echo "v274" > /etc/sub-sync/module-version

echo "[14/15] clear LuCI cache"
rm -rf /tmp/luci-modulecache /tmp/luci-modulecache/* /tmp/luci-indexcache /tmp/luci-indexcache* /tmp/luci-sessions /tmp/luci-sessions/* 2>/dev/null || true
find /tmp -maxdepth 1 -type d -name 'luci-*cache*' -exec rm -rf {} + 2>/dev/null || true
find /tmp -maxdepth 1 -type f -name 'luci-*cache*' -delete 2>/dev/null || true
sync

echo "[15/15] final install verification"
ls -l "$SRC_JS" "$DST/sub_sync_v221.js" "$ACL"
uci get luci.main.mediaurlbase 2>/dev/null || true
grep -RsnE 'sub_sync|Подписки|Мониторинг' /usr/share/luci/menu.d/*.json 2>/dev/null || true
grep -n 'podcop-sub-v666-guard' /etc/crontabs/root 2>/dev/null || true
grep -n -A6 -B2 'var moduleUpdateCheckBtnV236' "$DST/sub_sync_v221.js" 2>/dev/null | head -20

rm -f /tmp/protobyzks95-install.sh 2>/dev/null || true
logger -t sub-sync "Podcop Sub v666 public build v274 installed ACL fallback final" 2>/dev/null || true

echo "DONE_MODULE_OK: Podcop Sub v666 v274 module installed."
if [ "$THEME_OK" = "1" ]; then
  echo "DONE_THEME_OK: ProtoByZKS95/proton2025 theme installed/active."
else
  echo "WARN_THEME_FAILED: Module installed, but theme download/install failed. Re-run install later or install theme separately."
fi
echo "DONE: install.sh finished rc=0"

/etc/init.d/rpcd restart >/dev/null 2>&1 || true
/etc/init.d/uhttpd restart >/dev/null 2>&1 || true
# SUBSYNC_INSTALL_VERSION_FILES_V274_END
