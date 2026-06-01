#!/bin/sh
# SUBSYNC_PUBLIC_UNINSTALL_V275
# PODCOP_SUB_V666_PUBLIC_UNINSTALL_CLEAN_V221
set -u

echo "========================================="
echo "  Podcop Sub v666 — public uninstall v275"
echo "========================================="
echo "Backup: disabled for public/friend uninstall"

echo "=== restore Podkop route ==="
mkdir -p /usr/share/luci/menu.d
cat > /usr/share/luci/menu.d/luci-app-podkop.json <<'MENU'
{
  "admin/services/podkop": {
    "title": "Podkop",
    "order": 60,
    "action": {
      "type": "view",
      "path": "podkop/podkop"
    },
    "depends": {
      "acl": [ "luci-app-podkop" ]
    }
  }
}
MENU

echo "=== restore Podkop xHTTP patch if helper exists ==="
if [ -x /usr/bin/podcop-sub-v666-xhttp-patch ]; then
  /usr/bin/podcop-sub-v666-xhttp-patch restore || true
fi

echo "=== remove public module files ==="
rm -rf /www/luci-static/resources/view/sub_sync 2>/dev/null || true
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json 2>/dev/null || true
rm -f /usr/bin/sub-sync* /usr/bin/podcop-sub-v666-xhttp-patch 2>/dev/null || true
rm -f /usr/bin/sub-sync-public-ui-patch /usr/bin/sub-sync-public-ui-patch.disabled-v* 2>/dev/null || true

echo "=== clear LuCI cache ==="
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart >/dev/null 2>&1 || true
/etc/init.d/uhttpd restart >/dev/null 2>&1 || true
/usr/bin/podcop-sub-v666-safe-podkop-restart || true >/dev/null 2>&1 || true

echo "Podcop Sub v666 public uninstall v275 complete"
# SUBSYNC_UNINSTALL_FULL_CLEAN_V271_BEGIN
echo "=== v271 hard remove Podcop Sub v666 module leftovers ==="

if [ -x /etc/init.d/podcop-sub-v666-guard ]; then
  /etc/init.d/podcop-sub-v666-guard disable >/dev/null 2>&1 || true
  /etc/init.d/podcop-sub-v666-guard stop >/dev/null 2>&1 || true
fi

if [ -f /etc/crontabs/root ]; then
  sed -i '\#/usr/bin/podcop-sub-v666-guard#d' /etc/crontabs/root 2>/dev/null || true
fi
/etc/init.d/cron restart >/dev/null 2>&1 || true

rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json 2>/dev/null || true
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json 2>/dev/null || true
rm -rf /www/luci-static/resources/view/sub_sync 2>/dev/null || true

rm -f /usr/bin/podcop-sub-v666-guard /etc/init.d/podcop-sub-v666-guard 2>/dev/null || true
rm -f /usr/bin/podcop-sub-v666-xhttp-patch 2>/dev/null || true
rm -f /usr/bin/sub-sync /usr/bin/sub-sync.real /usr/bin/sub-sync.v51base /usr/bin/sub-sync.v164manualbase 2>/dev/null || true
rm -f /usr/bin/sub-sync-autoadd /usr/bin/sub-sync-donaters /usr/bin/sub-sync-happ-json-hy2-import 2>/dev/null || true
rm -f /usr/bin/sub-sync-hy2-manager /usr/bin/sub-sync-hy2-probe /usr/bin/sub-sync-hy2-urltest 2>/dev/null || true
rm -f /usr/bin/sub-sync-manual-import /usr/bin/sub-sync-manual-link /usr/bin/sub-sync-section 2>/dev/null || true
rm -f /usr/bin/sub-sync-singbox-log /usr/bin/sub-sync-subs-info /usr/bin/sub-sync-system-info 2>/dev/null || true
rm -f /usr/bin/sub-sync-urltest /usr/bin/sub-sync-xhttp-guard /usr/bin/sub-sync-module-update 2>/dev/null || true
rm -f /etc/sub-sync/module-build /etc/sub-sync/module-version 2>/dev/null || true

echo "=== uninstall ProtoByZKS95/proton2025 theme with fallback ==="

subsync_remove_proton2025_local_v271() {
  echo "=== local fallback remove ProtoByZKS95/proton2025 theme ==="
  rm -rf /www/luci-static/proton2025 2>/dev/null || true
  rm -f /usr/share/ucode/luci/template/themes/proton2025* 2>/dev/null || true
  rm -rf /usr/share/ucode/luci/template/themes/proton2025 2>/dev/null || true
  rm -f /usr/libexec/rpcd/proton2025* /usr/bin/proton2025* 2>/dev/null || true
  uci delete luci.themes.ProtoByZKS95 2>/dev/null || true
  if [ "$(uci get luci.main.mediaurlbase 2>/dev/null || true)" = "/luci-static/proton2025" ]; then
    uci set luci.main.mediaurlbase="/luci-static/bootstrap" 2>/dev/null || true
  fi
  uci commit luci 2>/dev/null || true
  echo "OK: local theme fallback cleanup done"
}

THEME_UNINSTALL_URL="${THEME_UNINSTALL_URL:-https://raw.githubusercontent.com/kzolotarev95/luci-theme-protobyzks95/main/uninstall.sh}"
THEME_UNINSTALLED=0
i=1
while [ "$i" -le 3 ]; do
  echo "=== theme uninstall try $i/3 ==="
  if wget -O /tmp/protobyzks95-uninstall.sh "$THEME_UNINSTALL_URL?v=$(date +%s)-$i"; then
    if sh -n /tmp/protobyzks95-uninstall.sh; then
      if sh /tmp/protobyzks95-uninstall.sh; then
        THEME_UNINSTALLED=1
        break
      fi
    fi
  fi
  i=$((i + 1))
  sleep 3
done

if [ "$THEME_UNINSTALLED" != "1" ]; then
  echo "WARN: theme uninstall script failed, using local fallback"
  subsync_remove_proton2025_local_v271
fi

if [ -d /www/luci-static/proton2025 ] || [ "$(uci get luci.main.mediaurlbase 2>/dev/null || true)" = "/luci-static/proton2025" ]; then
  subsync_remove_proton2025_local_v271
fi

rm -f /tmp/protobyzks95-uninstall.sh 2>/dev/null || true

echo "=== clear LuCI cache after uninstall ==="
rm -rf /tmp/luci-modulecache /tmp/luci-modulecache/* /tmp/luci-indexcache /tmp/luci-indexcache* /tmp/luci-sessions /tmp/luci-sessions/* 2>/dev/null || true
find /tmp -maxdepth 1 -type d -name 'luci-*cache*' -exec rm -rf {} + 2>/dev/null || true
find /tmp -maxdepth 1 -type f -name 'luci-*cache*' -delete 2>/dev/null || true
sync

nohup sh -c 'sleep 3; /etc/init.d/rpcd restart >/dev/null 2>&1 || true; /etc/init.d/uhttpd restart >/dev/null 2>&1 || true' >/tmp/subsync-v271-uninstall-delayed-restart.log 2>&1 &

echo "DONE: Podcop Sub v666 v271 fully removed. Module files/menu/ACL/theme cleaned."
# SUBSYNC_UNINSTALL_FULL_CLEAN_V271_END
# SUBSYNC_FULL_PUBLIC_UNINSTALL_V275_BEGIN
echo "=== v275 full public cleanup: remove every Podcop Sub v666 file ==="

echo "--- stop/disable guard ---"
/etc/init.d/podcop-sub-v666-guard disable 2>/dev/null || true
/etc/init.d/podcop-sub-v666-guard stop 2>/dev/null || true

echo "--- remove guard from cron ---"
if [ -f /etc/crontabs/root ]; then
  sed -i '\#/usr/bin/podcop-sub-v666-guard#d' /etc/crontabs/root 2>/dev/null || true
fi
/etc/init.d/cron restart 2>/dev/null || true

echo "--- restore Podkop xHTTP files if helper still exists ---"
if [ -x /usr/bin/podcop-sub-v666-xhttp-patch ]; then
  /usr/bin/podcop-sub-v666-xhttp-patch restore >/tmp/podcop-sub-v666-xhttp-restore.log 2>&1 || true
fi

echo "--- remove module LuCI files/menu/ACL ---"
rm -rf /www/luci-static/resources/view/sub_sync 2>/dev/null || true
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json 2>/dev/null || true
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json 2>/dev/null || true

echo "--- remove module helpers ---"
rm -f /usr/bin/podcop-sub-v666-guard /etc/init.d/podcop-sub-v666-guard 2>/dev/null || true
rm -f /usr/bin/podcop-sub-v666-xhttp-patch 2>/dev/null || true
rm -f /usr/bin/sub-sync /usr/bin/sub-sync.real /usr/bin/sub-sync.v51base /usr/bin/sub-sync.v164manualbase 2>/dev/null || true
rm -f /usr/bin/sub-sync-autoadd /usr/bin/sub-sync-donaters /usr/bin/sub-sync-happ-json-hy2-import 2>/dev/null || true
rm -f /usr/bin/sub-sync-hy2-manager /usr/bin/sub-sync-hy2-probe /usr/bin/sub-sync-hy2-urltest 2>/dev/null || true
rm -f /usr/bin/sub-sync-manual-import /usr/bin/sub-sync-manual-link /usr/bin/sub-sync-section 2>/dev/null || true
rm -f /usr/bin/sub-sync-singbox-log /usr/bin/sub-sync-subs-info /usr/bin/sub-sync-system-info 2>/dev/null || true
rm -f /usr/bin/sub-sync-urltest /usr/bin/sub-sync-xhttp-guard /usr/bin/sub-sync-module-update 2>/dev/null || true

echo "--- remove module configs/data ---"
rm -rf /etc/sub-sync 2>/dev/null || true

echo "--- remove theme files and uci registration ---"
uci -q set luci.main.mediaurlbase='/luci-static/bootstrap' 2>/dev/null || true
uci -q delete luci.themes.ProtoByZKS95 2>/dev/null || true
uci -q commit luci 2>/dev/null || true

rm -rf /www/luci-static/proton2025 2>/dev/null || true
rm -rf /www/luci-static/resources/proton2025 2>/dev/null || true
rm -f /usr/share/ucode/luci/template/themes/proton2025*.ut 2>/dev/null || true
rm -f /usr/bin/proton2025-* /usr/libexec/rpcd/proton2025-* /etc/init.d/proton2025-* 2>/dev/null || true
rm -f /usr/share/rpcd/acl.d/proton2025*.json 2>/dev/null || true

echo "--- remove public installer/theme backups and tmp leftovers ---"
rm -f /root/proton2025-before-install-*.tar.gz /root/proton2025-before-uninstall-*.tar.gz 2>/dev/null || true
rm -f /tmp/subsync-install*.sh /tmp/subsync-uninstall*.sh /tmp/protobyzks95-install.sh /tmp/protobyzks95-uninstall.sh 2>/dev/null || true
rm -f /tmp/podcop-sub-v666-*.log /tmp/subsync-v*-delayed-restart.log 2>/dev/null || true
rm -rf /tmp/luci-theme-protobyzks95-* /tmp/protobyzks95-* 2>/dev/null || true

echo "--- clear LuCI cache ---"
rm -rf /tmp/luci-modulecache /tmp/luci-modulecache/* /tmp/luci-indexcache /tmp/luci-indexcache* /tmp/luci-sessions /tmp/luci-sessions/* 2>/dev/null || true
find /tmp -maxdepth 1 -type d -name 'luci-*cache*' -exec rm -rf {} + 2>/dev/null || true
find /tmp -maxdepth 1 -type f -name 'luci-*cache*' -delete 2>/dev/null || true

sync

echo "--- verify v275 cleanup ---"
[ ! -e /www/luci-static/resources/view/sub_sync ] || echo "WARN: sub_sync dir still exists"
[ ! -e /usr/share/luci/menu.d/luci-app-sub-sync.json ] || echo "WARN: duplicate menu still exists"
[ ! -e /usr/share/rpcd/acl.d/luci-app-sub-sync.json ] || echo "WARN: ACL still exists"
[ ! -e /etc/sub-sync ] || echo "WARN: /etc/sub-sync still exists"
[ ! -e /www/luci-static/proton2025 ] || echo "WARN: proton2025 theme dir still exists"

echo "DONE: Podcop Sub v666 v275 full cleanup complete. No module/theme files should remain."
# SUBSYNC_FULL_PUBLIC_UNINSTALL_V275_END
