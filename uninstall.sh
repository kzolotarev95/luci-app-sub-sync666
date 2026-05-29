#!/bin/sh
# PODCOP_SUB_V666_PUBLIC_UNINSTALL_CLEAN_V205B
set -u

echo "========================================="
echo "  Podcop Sub v666 — public uninstall v205b"
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
rm -f /www/luci-static/resources/view/sub_sync/sub_sync.js 2>/dev/null || true
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json 2>/dev/null || true
rm -f /usr/bin/podcop-sub-v666-xhttp-patch 2>/dev/null || true
rm -f /usr/bin/sub-sync /usr/bin/sub-sync.real /usr/bin/sub-sync.v51base /usr/bin/sub-sync.v164manualbase 2>/dev/null || true
rm -f /usr/bin/sub-sync-autoadd /usr/bin/sub-sync-donaters /usr/bin/sub-sync-happ-json-hy2-import 2>/dev/null || true
rm -f /usr/bin/sub-sync-hy2-manager /usr/bin/sub-sync-hy2-probe /usr/bin/sub-sync-hy2-urltest 2>/dev/null || true
rm -f /usr/bin/sub-sync-manual-import /usr/bin/sub-sync-manual-link /usr/bin/sub-sync-section 2>/dev/null || true
rm -f /usr/bin/sub-sync-singbox-check /usr/bin/sub-sync-singbox-log /usr/bin/sub-sync-subs-info 2>/dev/null || true
rm -f /usr/bin/sub-sync-system-info /usr/bin/sub-sync-urltest /usr/bin/sub-sync-xhttp-guard 2>/dev/null || true
rm -f /usr/bin/sub-sync-public-ui-patch /usr/bin/sub-sync-public-ui-patch.disabled-v* 2>/dev/null || true

echo "=== clear LuCI cache ==="
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart >/dev/null 2>&1 || true
/etc/init.d/uhttpd restart >/dev/null 2>&1 || true
/etc/init.d/podkop restart >/dev/null 2>&1 || true

echo "Podcop Sub v666 public uninstall v205b complete"
