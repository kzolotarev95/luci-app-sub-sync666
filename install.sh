#!/bin/sh
# SUBSYNC_PUBLIC_BUILD_V332
# SUBSYNC_PUBLIC_BUILD_V277
# SUBSYNC_INSTALL_VERSION_FILES_V277_BEGIN
set -u

REPO_OWNER="${REPO_OWNER:-kzolotarev95}"
REPO_NAME="${REPO_NAME:-luci-app-sub-sync666}"
REPO_REF="${REPO_REF:-main}"
RAW_BASE="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_REF}"

echo "========================================="
echo "  Podcop Sub v666 — public install v277"
echo "========================================="
echo "Backup: disabled for public/friend install"
echo "Downloader: wget strict direct installer v277"

dl() {
  rel="$1"
  dst="$2"
  mkdir -p "$(dirname "$dst")"
  tmp="${dst}.tmp.$$"

  i=1
  while [ "$i" -le 20 ]; do
    echo "=== download $rel try $i ==="
    rm -f "$tmp"

    if wget -O "$tmp" "$RAW_BASE/$rel?v=$(date +%s)-$i"; then
      if [ -s "$tmp" ]; then
        mv "$tmp" "$dst"
        return 0
      fi
    fi

    echo "WARN: failed download $rel"
    i=$((i + 1))
    sleep 3
  done

  rm -f "$tmp"
  echo "ERROR: cannot download $rel"
  return 1
}

write_acl_fallback() {
  cat > /usr/share/rpcd/acl.d/luci-app-sub-sync.json <<'ACL'
{
  "luci-app-sub-sync": {
    "description": "Grant access to Podcop Sub v666",
    "read": {
      "ubus": {
        "file": [ "exec", "read", "stat", "list" ],
        "uci": [ "get", "show" ],
        "session": [ "access" ]
      },
      "uci": [ "podkop" ]
    },
    "write": {
      "ubus": {
        "file": [ "exec", "write", "remove", "stat", "list" ],
        "uci": [ "set", "add", "delete", "commit", "apply" ]
      },
      "uci": [ "podkop" ]
    }
  }
}
ACL
}

patch_js_hide_check() {
  f="$1"
  [ -f "$f" ] || return 0

  if ! grep -q 'SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B' "$f"; then
    tmp="$f.tmp.$$"
    echo '/* SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B */' > "$tmp"
    cat "$f" >> "$tmp"
    mv "$tmp" "$f"
  fi

  grep -A8 'var moduleUpdateCheckBtnV236' "$f" 2>/dev/null | grep -q 'display:none!important' && return 0

  awk '
    /var moduleUpdateCheckBtnV236[[:space:]]*=/ { inbtn=1 }
    {
      print
      if (inbtn && done != 1 && $0 ~ /class/ && $0 ~ /btn cbi-button cbi-button-neutral/) {
        print "                            \"style\": \"display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important\","
        done=1
      }
      if (inbtn && $0 ~ /Проверить/) {
        inbtn=0
      }
    }
  ' "$f" > "$f.tmp.$$" && mv "$f.tmp.$$" "$f"
}

echo "=== cleanup broken/old partial module files ==="
rm -rf /www/luci-static/resources/view/sub_sync 2>/dev/null || true
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json 2>/dev/null || true
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json 2>/dev/null || true

mkdir -p /www/luci-static/resources/view/sub_sync
mkdir -p /usr/share/rpcd/acl.d
mkdir -p /usr/share/luci/menu.d
mkdir -p /etc/sub-sync

echo "=== install UI JS ==="
dl "htdocs/luci-static/resources/view/sub_sync/sub_sync.js" "/www/luci-static/resources/view/sub_sync/sub_sync.js" || exit 1
dl "htdocs/luci-static/resources/view/sub_sync/sub_sync_v221.js" "/www/luci-static/resources/view/sub_sync/sub_sync_v221.js" || exit 1
patch_js_hide_check /www/luci-static/resources/view/sub_sync/sub_sync.js
patch_js_hide_check /www/luci-static/resources/view/sub_sync/sub_sync_v221.js

echo "=== install ACL ==="
if dl "usr/share/rpcd/acl.d/luci-app-sub-sync.json" "/usr/share/rpcd/acl.d/luci-app-sub-sync.json"; then
  if grep -q 'luci-app-sub-sync' /usr/share/rpcd/acl.d/luci-app-sub-sync.json; then
    echo "OK: ACL downloaded"
  else
    echo "WARN: ACL downloaded but bad, writing fallback"
    write_acl_fallback
  fi
else
  echo "WARN: ACL download failed, writing fallback"
  write_acl_fallback
fi

echo "=== install helpers ==="
for rel in \
  usr/bin/podcop-sub-v666-xhttp-patch \
  usr/bin/podcop-sub-v666-guard \
  usr/bin/sub-sync \
  usr/bin/sub-sync.real \
  usr/bin/sub-sync.v51base \
  usr/bin/sub-sync.v164manualbase \
  usr/bin/sub-sync-autoadd \
  usr/bin/sub-sync-donaters \
  usr/bin/sub-sync-happ-json-hy2-import \
  usr/bin/sub-sync-hy2-manager \
  usr/bin/sub-sync-hy2-probe \
  usr/bin/sub-sync-hy2-urltest \
  usr/bin/sub-sync-manual-import \
  usr/bin/sub-sync-manual-link \
  usr/bin/sub-sync-section \
  usr/bin/sub-sync-singbox-log \
  usr/bin/sub-sync-subs-info \
  usr/bin/sub-sync-system-info \
  usr/bin/sub-sync-urltest \
  usr/bin/sub-sync-xhttp-guard \
  usr/bin/sub-sync-module-update
do
  dl "$rel" "/$rel" || exit 1
  chmod 755 "/$rel"
done

echo "=== guard init ==="
if dl "etc/init.d/podcop-sub-v666-guard" "/etc/init.d/podcop-sub-v666-guard"; then
  chmod 755 /etc/init.d/podcop-sub-v666-guard
else
  echo "WARN: guard init download failed, writing fallback"
  cat > /etc/init.d/podcop-sub-v666-guard <<'INIT'
#!/bin/sh /etc/rc.common
START=99
USE_PROCD=1
start_service() {
  [ -x /usr/bin/podcop-sub-v666-guard ] || exit 0
  /usr/bin/podcop-sub-v666-guard >/tmp/podcop-sub-v666-guard.log 2>&1 || true
}
INIT
  chmod 755 /etc/init.d/podcop-sub-v666-guard
fi

echo "=== public donor state ==="
dl "etc/sub-sync/donaters.tsv" "/etc/sub-sync/donaters.tsv" || true

echo "=== integrate into Services -> Podkop ==="
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json 2>/dev/null || true

cp -f /usr/share/luci/menu.d/luci-app-podkop.json /etc/sub-sync/luci-app-podkop.json.before-podcop-sub-v666 2>/dev/null || true

cat > /usr/share/luci/menu.d/luci-app-podkop.json <<'MENU'
{
  "admin/services/podkop": {
    "title": "Podkop",
    "order": 60,
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

echo "=== cron guard ==="
touch /etc/crontabs/root
grep -v '/usr/bin/podcop-sub-v666-guard' /etc/crontabs/root > /tmp/root.cron.v276 2>/dev/null || true
echo '*/5 * * * * /usr/bin/podcop-sub-v666-guard >/tmp/podcop-sub-v666-guard.log 2>&1' >> /tmp/root.cron.v276
cat /tmp/root.cron.v276 > /etc/crontabs/root
rm -f /tmp/root.cron.v276
/etc/init.d/cron restart 2>/dev/null || true

echo "=== version ==="
echo "v332" > /etc/sub-sync/module-version
echo "332" > /etc/sub-sync/module-build

echo "=== apply Podkop xHTTP patch ==="
if [ -x /usr/bin/podcop-sub-v666-xhttp-patch ]; then
  /usr/bin/podcop-sub-v666-xhttp-patch apply || true
fi

echo "=== install ProtoByZKS95/proton2025 theme ==="
theme_ok=0
i=1
while [ "$i" -le 5 ]; do
  echo "--- theme try $i/5 ---"
  rm -f /tmp/protobyzks95-install.sh
  if wget -O /tmp/protobyzks95-install.sh "https://raw.githubusercontent.com/kzolotarev95/luci-theme-protobyzks95/main/install.sh?v=$(date +%s)-$i"; then
    if sh -n /tmp/protobyzks95-install.sh && REPO_OWNER=kzolotarev95 REPO_NAME=luci-theme-protobyzks95 REPO_REF=main sh /tmp/protobyzks95-install.sh; then
      theme_ok=1
      break
    fi
  fi
  i=$((i + 1))
  sleep 5
done

[ "$theme_ok" = "1" ] || echo "WARN: theme failed, module still installed"

echo "=== final verify ==="
[ -s /www/luci-static/resources/view/sub_sync/sub_sync.js ] || { echo "ERROR: sub_sync.js missing"; exit 1; }
[ -s /www/luci-static/resources/view/sub_sync/sub_sync_v221.js ] || { echo "ERROR: sub_sync_v221.js missing"; exit 1; }
[ -s /usr/share/rpcd/acl.d/luci-app-sub-sync.json ] || { echo "ERROR: ACL missing"; exit 1; }
grep -q 'luci-app-sub-sync' /usr/share/rpcd/acl.d/luci-app-sub-sync.json || { echo "ERROR: ACL marker missing"; exit 1; }
grep -q 'sub_sync/sub_sync_v221' /usr/share/luci/menu.d/luci-app-podkop.json || { echo "ERROR: menu missing"; exit 1; }
grep -q 'SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B' /www/luci-static/resources/view/sub_sync/sub_sync.js || { echo "ERROR: hide marker missing in sub_sync.js"; exit 1; }

echo "--- files ---"
ls -l /www/luci-static/resources/view/sub_sync/sub_sync.js
ls -l /www/luci-static/resources/view/sub_sync/sub_sync_v221.js
ls -l /usr/share/rpcd/acl.d/luci-app-sub-sync.json

echo "--- menu refs ---"
grep -RsnE 'sub_sync|Подписки|Мониторинг' /usr/share/luci/menu.d/*.json 2>/dev/null || true

echo "--- theme ---"
uci get luci.main.mediaurlbase 2>/dev/null || true

echo "--- hidden Проверить ---"
grep -Rsn 'SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B' /www/luci-static/resources/view/sub_sync/sub_sync*.js 2>/dev/null | head

echo "=== clear LuCI cache/restart ==="
rm -rf /tmp/luci-modulecache /tmp/luci-modulecache/* /tmp/luci-indexcache /tmp/luci-indexcache* /tmp/luci-sessions /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo "DONE_MODULE_OK: Podcop Sub v666 v277 module installed."
echo "DONE_THEME_STATUS: mediaurlbase=$(uci get luci.main.mediaurlbase 2>/dev/null || true)"
echo "DONE: install.sh v276 finished rc=0"
# SUBSYNC_INSTALL_VERSION_FILES_V277_END

# SUBSYNC_INSTALL_DELETE_PURGE_HELPER_V332_BEGIN
echo "=== install delete purge helper v331/v332 ==="
SUBSYNC_RAW_BASE="https://raw.githubusercontent.com/${REPO_OWNER:-kzolotarev95}/${REPO_NAME:-luci-app-sub-sync666}/${REPO_REF:-main}"
wget -O /usr/bin/sub-sync-delete-purge-active-v331 "$SUBSYNC_RAW_BASE/usr/bin/sub-sync-delete-purge-active-v331?v=$(date +%s)" && chmod +x /usr/bin/sub-sync-delete-purge-active-v331 || echo "WARN: delete purge helper download failed"
# SUBSYNC_INSTALL_DELETE_PURGE_HELPER_V332_END
