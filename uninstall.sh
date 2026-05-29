#!/bin/sh

# SUBSYNC_STALE_JS_CLEANUP_V118B_BEGIN
subsync_remove_file_v118b() {
    f="$1"
    [ -e "$f" ] || return 0
    echo "[Podcop Sub v666] remove stale JS: $f"
    rm -f "$f" 2>/dev/null || true
}

subsync_cleanup_subsync_stale_dir_v118b() {
    dir="$1"
    [ -d "$dir" ] || return 0

    for f in "$dir"/sub_sync_v*.js; do
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/sub_sync_live*.js; do
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/sub_sync_*.js; do
        [ "$f" = "$dir/sub_sync.js" ] && continue
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/sub_sync-*.js; do
        [ "$f" = "$dir/sub_sync.js" ] && continue
        subsync_remove_file_v118b "$f"
    done
}

subsync_cleanup_subsync_uninstall_live_dir_v118b() {
    dir="$1"
    [ -d "$dir" ] || return 0

    for f in "$dir"/*.js; do
        subsync_remove_file_v118b "$f"
    done

    rmdir "$dir" 2>/dev/null || true
}

subsync_cleanup_podkop_stale_dir_v118b() {
    dir="$1"
    [ -d "$dir" ] || return 0

    for f in "$dir"/podkop_subsync_*.js; do
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/main_subsync_*.js; do
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/*_subsync_*.js; do
        subsync_remove_file_v118b "$f"
    done
}

subsync_cleanup_stale_luci_js_v118b() {
    mode="${1:-install}"

    echo "[Podcop Sub v666] cleanup stale LuCI JS files v118b, mode=$mode"

    live_subsync_dir="/www/luci-static/resources/view/sub_sync"
    live_podkop_dir="/www/luci-static/resources/view/podkop"

    repo_subsync_dir="/root/luci-app-sub-sync/htdocs/luci-static/resources/view/sub_sync"
    repo_podkop_dir="/root/luci-app-sub-sync/htdocs/luci-static/resources/view/podkop"

    if [ "$mode" = "uninstall" ]; then
        subsync_cleanup_subsync_uninstall_live_dir_v118b "$live_subsync_dir"
    else
        subsync_cleanup_subsync_stale_dir_v118b "$live_subsync_dir"
    fi

    subsync_cleanup_podkop_stale_dir_v118b "$live_podkop_dir"

    # Repo cleanup is always conservative:
    # remove only old generated/versioned leftovers, never the main source file.
    subsync_cleanup_subsync_stale_dir_v118b "$repo_subsync_dir"
    subsync_cleanup_podkop_stale_dir_v118b "$repo_podkop_dir"

    rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
}

subsync_cleanup_stale_luci_js_v118b "uninstall"
# SUBSYNC_STALE_JS_CLEANUP_V118B_END




echo ""
echo "========================================="
echo "  Podcop Sub v666 — integrated uninstall"
echo "========================================="
echo ""

PODKOP_MENU="/usr/share/luci/menu.d/luci-app-podkop.json"
PODKOP_BAK="/usr/share/luci/menu.d/luci-app-podkop.json.bak.subsync"

BACKUP="/root/podcop-sub-v666-before-uninstall-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "→ Бэкап перед удалением..."
tar -czf "$BACKUP" -C / \
  usr/share/luci/menu.d/luci-app-podkop.json \
  usr/share/luci/menu.d/luci-app-podkop.json.bak.subsync \
  usr/share/luci/menu.d/luci-app-sub-sync.json \
  usr/share/rpcd/acl.d/luci-app-sub-sync.json \
  www/luci-static/resources/view/sub_sync \
  usr/bin/sub-sync \
  etc/sub-sync \
  2>/dev/null || true
echo "  ✓ Бэкап: $BACKUP"

echo "→ Восстановление родного меню Podkop..."
if [ -f "$PODKOP_BAK" ]; then
    cp -f "$PODKOP_BAK" "$PODKOP_MENU"
    chmod 644 "$PODKOP_MENU"
    rm -f "$PODKOP_BAK"
    echo "  ✓ Меню Podkop восстановлено из бэкапа"
else
    echo "  ! Бэкап меню не найден, ставлю безопасный стандартный route podkop/podkop"
    cat > "$PODKOP_MENU" <<'MENUEOF'
{
    "admin/services/podkop": {
        "title": "Podkop",
        "order": 42,
        "action": {
            "type": "view",
            "path": "podkop/podkop"
        },
        "depends": {
            "acl": [ "luci-app-podkop" ],
            "uci": { "podkop": true }
        }
    }
}
MENUEOF
    chmod 644 "$PODKOP_MENU"
fi

echo "→ Удаление cron-задачи..."
sed -i '/\/usr\/bin\/sub-sync/d;/sub-sync/d;/subsync/d;/sub_sync/d' /etc/crontabs/root 2>/dev/null || true
/etc/init.d/cron restart 2>/dev/null || true

echo "→ Удаление файлов Podcop Sub v666..."
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json
rm -rf /www/luci-static/resources/view/sub_sync
rm -f /usr/bin/sub-sync
rm -rf /etc/sub-sync
rm -f /tmp/sub-sync-status /tmp/sub-sync-response /tmp/sub-sync-decoded
rm -rf /tmp/sub-sync* /tmp/subsync-* /tmp/luci-app-sub-sync* 2>/dev/null || true

# SUBSYNC_UNINSTALL_HELPERS_ACL_V120_BEGIN
# SUBSYNC_PODCOP_XHTTP_UNINSTALL_V123_BEGIN
echo "→ Восстановление Podkop xHTTP patch, если был установлен Podcop Sub v666..."
if [ -x /usr/bin/podcop-sub-v666-xhttp-patch ]; then
    /usr/bin/podcop-sub-v666-xhttp-patch restore || true
fi
rm -f /usr/bin/podcop-sub-v666-xhttp-patch 2>/dev/null || true
# SUBSYNC_PODCOP_XHTTP_UNINSTALL_V123_END

echo "→ Удаление helper файлов Podcop Sub v666..."
rm -f \
    /usr/bin/sub-sync \
    /usr/bin/sub-sync.v51base \
    /usr/bin/sub-sync-section \
    /usr/bin/sub-sync-autoadd \
    /usr/bin/sub-sync-subs-info \
    /usr/bin/sub-sync-system-info \
    /usr/bin/sub-sync-singbox-log \
    /usr/bin/sub-sync-donaters \
    /usr/share/rpcd/acl.d/luci-app-sub-sync.json \
    2>/dev/null || true
# SUBSYNC_UNINSTALL_HELPERS_ACL_V120_END


# SUBSYNC_OLD_WORKING_GRADIENT_UNINSTALL_V115_BEGIN
echo "→ Удаление старого рабочего градиентного перелива Podcop Sub v666 v115..."
for css in /www/luci-static/*/cascade.css; do
    [ -f "$css" ] || continue
    sed -i '/SUBSYNC_OLD_WORKING_GRADIENT_V115_BEGIN/,/SUBSYNC_OLD_WORKING_GRADIENT_V115_END/d' "$css"
    sed -i '/SUBSYNC_PODCOP_SUB_V666_SHINE_V122_BEGIN/,/SUBSYNC_PODCOP_SUB_V666_SHINE_V122_END/d' "$css"
    sed -i '/SUBSYNC_PODCOP_SUB_V666_GRADIENT_V124_BEGIN/,/SUBSYNC_PODCOP_SUB_V666_GRADIENT_V124_END/d' "$css"
done
# SUBSYNC_OLD_WORKING_GRADIENT_UNINSTALL_V115_END

echo "→ Очистка LuCI кэша..."
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
touch /usr/lib/opkg/status 2>/dev/null || touch /lib/apk/db/installed 2>/dev/null || true

echo "→ Перезапуск LuCI..."
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo "→ Проверка Podkop route..."
grep -n '"path"' "$PODKOP_MENU" 2>/dev/null || true

echo ""
echo "========================================="
echo "  Podcop Sub v666 удалён, Podkop восстановлен"
echo "========================================="
echo ""
echo "  Бэкап:"
echo "  $BACKUP"
echo ""
echo "  Откат:"
echo "  tar -xzf $BACKUP -C /"
echo ""
echo "  Обнови страницу: Ctrl+F5"
echo ""


# SUBSYNC_DONATERS_PUBLIC_UNINSTALL_V134B_BEGIN
echo "[Podcop Sub v666] Removing public Donaters helper/style..."

rm -f /usr/bin/sub-sync-donaters 2>/dev/null || true

for css in /www/luci-static/*/cascade.css /www/luci-static/cascade.css; do
    [ -f "$css" ] || continue

    tmp="/tmp/podcop-sub-v666-cascade-donaters-remove-$$.css"

    awk '
        /SUBSYNC_DONATERS_STYLE_V134_BEGIN/ { skip=1; next }
        /SUBSYNC_DONATERS_STYLE_V134_END/ { skip=0; next }
        skip != 1 { print }
    ' "$css" > "$tmp"

    mv "$tmp" "$css"
done

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
# SUBSYNC_DONATERS_PUBLIC_UNINSTALL_V134B_END


# SUBSYNC_REAL_BACKEND_V138_BEGIN
rm -f /usr/bin/sub-sync.real 2>/dev/null || true
# SUBSYNC_REAL_BACKEND_V138_END

# SUBSYNC_MIXED_URLTEST_UNINSTALL_V165B_BEGIN
rm -f \
  /usr/bin/sub-sync-urltest \
  /usr/bin/sub-sync-hy2-urltest \
  /usr/bin/sub-sync-manual-link

if [ -f /usr/bin/sub-sync ] && grep -q 'SUBSYNC_MANUAL_HY2_VISIBLE_WRAPPER_V164' /usr/bin/sub-sync 2>/dev/null && [ -f /usr/bin/sub-sync.v164manualbase ]; then
  cp -f /usr/bin/sub-sync.v164manualbase /usr/bin/sub-sync
  chmod 755 /usr/bin/sub-sync
fi

rm -f /usr/bin/sub-sync.v164manualbase

if [ -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json ] && command -v jq >/dev/null 2>&1; then
  _acl="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"
  _tmp="/tmp/luci-app-sub-sync.acl.uninstall.v165b.$$"
  jq '
    if .["luci-app-sub-sync"] then
      del(.["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-urltest"]) |
      del(.["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-urltest"]) |
      del(.["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-hy2-urltest"]) |
      del(.["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-hy2-urltest"]) |
      del(.["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-manual-link"]) |
      del(.["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-manual-link"])
    else . end
  ' "$_acl" > "$_tmp" && jq empty "$_tmp" && cp -f "$_tmp" "$_acl"
  rm -f "$_tmp"
fi

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart || true
/etc/init.d/uhttpd restart || true
# SUBSYNC_MIXED_URLTEST_UNINSTALL_V165B_END

# SUBSYNC_PUBLIC_UI_FORCE_UNINSTALL_V166_BEGIN
rm -f /usr/bin/sub-sync-public-ui-patch /usr/bin/sub-sync-singbox-check /usr/bin/sub-sync-singbox-log

if [ -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json ] && command -v jq >/dev/null 2>&1; then
  _acl="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"
  _tmp="/tmp/luci-app-sub-sync.acl.uninstall.v166force.$$"
  jq '
    if .["luci-app-sub-sync"] then
      del(.["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-public-ui-patch"]) |
      del(.["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-public-ui-patch"]) |
      del(.["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-singbox-check"]) |
      del(.["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-singbox-check"]) |
      del(.["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-singbox-log"]) |
      del(.["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-singbox-log"])
    else . end
  ' "$_acl" > "$_tmp" && jq empty "$_tmp" && cp -f "$_tmp" "$_acl"
  rm -f "$_tmp"
fi

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart || true
/etc/init.d/uhttpd restart || true
# SUBSYNC_PUBLIC_UI_FORCE_UNINSTALL_V166_END

# SUBSYNC_MANUAL_LINK_IMPORT_UNINSTALL_V167_BEGIN
rm -f /usr/bin/sub-sync-manual-import

if [ -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json ] && command -v jq >/dev/null 2>&1; then
  _acl="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"
  _tmp="/tmp/luci-app-sub-sync.acl.uninstall.v167.$$"
  jq '
    if .["luci-app-sub-sync"] then
      del(.["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-manual-import"]) |
      del(.["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-manual-import"])
    else . end
  ' "$_acl" > "$_tmp" && jq empty "$_tmp" && cp -f "$_tmp" "$_acl"
  rm -f "$_tmp"
fi

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart || true
/etc/init.d/uhttpd restart || true
# SUBSYNC_MANUAL_LINK_IMPORT_UNINSTALL_V167_END

# SUBSYNC_PUBLIC_UNINSTALL_V193_BEGIN
[ -x /usr/bin/podcop-sub-v666-xhttp-patch ] && /usr/bin/podcop-sub-v666-xhttp-patch uninstall >/dev/null 2>&1 || true

rm -f \
  /usr/bin/sub-sync-happ-json-hy2-import \
  /usr/bin/sub-sync-hy2-manager \
  /usr/bin/sub-sync-urltest \
  /usr/bin/sub-sync-manual-import \
  /usr/bin/sub-sync-system-info \
  /usr/bin/sub-sync-singbox-log \
  /usr/bin/podcop-sub-v666-xhttp-patch

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart >/dev/null 2>&1 || true
/etc/init.d/uhttpd restart >/dev/null 2>&1 || true
# SUBSYNC_PUBLIC_UNINSTALL_V193_END
