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

subsync_cleanup_stale_luci_js_v118b "install"
# SUBSYNC_STALE_JS_CLEANUP_V118B_END




REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
BRANCH="${SUBSYNC_BRANCH:-main}"
RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

VIEW_DIR="/www/luci-static/resources/view/sub_sync"
VIEW_FILE="${VIEW_DIR}/sub_sync.js"
BIN_FILE="/usr/bin/sub-sync"
ACL_FILE="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"

PODKOP_MENU="/usr/share/luci/menu.d/luci-app-podkop.json"
PODKOP_BAK="/usr/share/luci/menu.d/luci-app-podkop.json.bak.subsync"

echo ""
echo "========================================="
echo "  Podcop Sub v666 — integrated install"
echo "========================================="
echo ""

if [ ! -f /etc/openwrt_release ]; then
    echo "ОШИБКА: требуется OpenWrt"
    exit 1
fi

if [ ! -f /etc/config/podkop ]; then
    echo "ОШИБКА: Podkop не установлен"
    exit 1
fi

if [ ! -f "$PODKOP_MENU" ]; then
    echo "ОШИБКА: не найдено меню Podkop: $PODKOP_MENU"
    exit 1
fi

echo "→ Бэкап перед установкой..."
BACKUP="/root/podcop-sub-v666-before-install-$(date +%Y%m%d-%H%M%S).tar.gz"
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

echo "→ Сохранение родного меню Podkop..."
if grep -q 'sub_sync/sub_sync' "$PODKOP_MENU" 2>/dev/null; then
    echo "  ! Podkop уже переключён на Podcop Sub v666 view"
else
    cp -f "$PODKOP_MENU" "$PODKOP_BAK"
    chmod 644 "$PODKOP_BAK"
    echo "  ✓ Родное меню сохранено: $PODKOP_BAK"
fi

echo "→ Проверка зависимостей..."
opkg update >/dev/null 2>&1 || true
command -v wget >/dev/null 2>&1 || opkg install wget >/dev/null 2>&1 || true
[ -f /etc/ssl/certs/ca-certificates.crt ] || opkg install ca-certificates >/dev/null 2>&1 || true

echo "→ Установка файлов Podcop Sub v666..."
mkdir -p "$VIEW_DIR"
mkdir -p /etc/sub-sync

wget -O "$VIEW_FILE" "${RAW}/htdocs/luci-static/resources/view/sub_sync/sub_sync.js?v=$(date +%s)" || {
    echo "ОШИБКА: не удалось скачать LuCI view"
    exit 1
}

wget -O "$BIN_FILE" "${RAW}/root/usr/bin/sub-sync?v=$(date +%s)" || {
    echo "ОШИБКА: не удалось скачать /usr/bin/sub-sync"
    exit 1
}

sed -i 's/\r$//' "$BIN_FILE" "$VIEW_FILE" 2>/dev/null || true
chmod 755 "$BIN_FILE"
chmod 644 "$VIEW_FILE"

echo "→ Создание ACL Podcop Sub v666..."
cat > "$ACL_FILE" <<'ACLEOF'
{
    "luci-app-sub-sync": {
        "description": "Grant access to Podcop Sub v666",
        "read": {
            "ubus": {
                "file": [ "exec" ]
            },
            "uci": [ "podkop" ],
            "file": {
                "/usr/bin/sub-sync": [ "exec" ]
            }
        },
        "write": {
            "ubus": {
                "file": [ "exec" ]
            },
            "uci": [ "podkop" ],
            "file": {
                "/usr/bin/sub-sync": [ "exec" ]
            }
        }
    }
}
ACLEOF
chmod 644 "$ACL_FILE"

echo "→ Переключение Services → Podkop на интегрированный Podcop Sub v666 view..."
cat > "$PODKOP_MENU" <<'MENUEOF'
{
    "admin/services/podkop": {
        "title": "Podkop",
        "order": 42,
        "action": {
            "type": "view",
            "path": "sub_sync/sub_sync"
        },
        "depends": {
            "acl": [ "luci-app-podkop", "luci-app-sub-sync" ],
            "uci": { "podkop": true }
        }
    }
}
MENUEOF
chmod 644 "$PODKOP_MENU"

echo "→ Удаление отдельного пункта Services → Podcop Sub v666, если был..."
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json

# SUBSYNC_INSTALL_HELPERS_ACL_V120_BEGIN
echo "→ Установка helper файлов Podcop Sub v666..."

for helper in \
    sub-sync.v51base \
    sub-sync-section \
    sub-sync-autoadd \
    sub-sync-subs-info \
    sub-sync-system-info \
    sub-sync-singbox-log
do
    echo "  - /usr/bin/$helper"
    if ! wget -qO "/usr/bin/$helper" "$RAW/root/usr/bin/$helper?v=$(date +%s)"; then
        echo "ERROR: helper не скачался: $helper"
        exit 1
    fi
    chmod 755 "/usr/bin/$helper"
    sh -n "/usr/bin/$helper" || {
        echo "ERROR: helper syntax bad: $helper"
        exit 1
    }
done

echo "  - /usr/bin/sub-sync-donaters optional"
if wget -qO "/usr/bin/sub-sync-donaters" "$RAW/root/usr/bin/sub-sync-donaters?v=$(date +%s)"; then
    chmod 755 "/usr/bin/sub-sync-donaters" 2>/dev/null || true
    sh -n "/usr/bin/sub-sync-donaters" || rm -f "/usr/bin/sub-sync-donaters"
else
    rm -f "/usr/bin/sub-sync-donaters" 2>/dev/null || true
fi

echo "→ Установка полного ACL Podcop Sub v666..."
mkdir -p /usr/share/rpcd/acl.d
if wget -qO /tmp/luci-app-sub-sync.acl "$RAW/root/usr/share/rpcd/acl.d/luci-app-sub-sync.json?v=$(date +%s)"; then
    cp -f /tmp/luci-app-sub-sync.acl /usr/share/rpcd/acl.d/luci-app-sub-sync.json
else
    echo "ERROR: ACL из GitHub не скачался"
    exit 1
fi

chmod 644 /usr/share/rpcd/acl.d/luci-app-sub-sync.json 2>/dev/null || true
# SUBSYNC_INSTALL_HELPERS_ACL_V120_END

# SUBSYNC_PODCOP_SUB_V666_SHINE_INSTALL_V122_BEGIN
echo "→ Установка CSS анимации Podcop Sub v666..."

cat > /tmp/podcop-sub-v666-shine-v122.css <<'CSS'

/* SUBSYNC_PODCOP_SUB_V666_SHINE_V122_BEGIN */
@keyframes ssSubSyncGradientFlowV115 {
    0%   { background-position: 0% 50%; }
    100% { background-position: 320% 50%; }
}

@keyframes ssPodcopSubV666GradientFlowV122 {
    0%   { background-position: 0% 50%; }
    100% { background-position: 320% 50%; }
}

.ss-subsync-shine-v115,
.ss-podcop-sub-v666-shine-v122 {
    display: inline-block !important;
    font-weight: 900 !important;
    letter-spacing: .35px !important;
    background-image: linear-gradient(90deg,#00d5ff,#ffffff,#ffd84d,#ff4fd8,#7c4dff,#00d5ff) !important;
    background-size: 320% 100% !important;
    background-position: 0% 50% !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    color: transparent !important;
    animation: ssPodcopSubV666GradientFlowV122 2.2s linear infinite !important;
    text-shadow: 0 0 8px rgba(0,213,255,.35), 0 0 16px rgba(255,79,216,.25) !important;
}

@media (prefers-reduced-motion: reduce) {
    .ss-subsync-shine-v115,
    .ss-podcop-sub-v666-shine-v122 {
        animation: none !important;
    }
}
/* SUBSYNC_PODCOP_SUB_V666_SHINE_V122_END */
CSS

for css in /www/luci-static/*/cascade.css; do
    [ -f "$css" ] || continue
    sed -i '/SUBSYNC_PODCOP_SUB_V666_SHINE_V122_BEGIN/,/SUBSYNC_PODCOP_SUB_V666_SHINE_V122_END/d' "$css"
    cat /tmp/podcop-sub-v666-shine-v122.css >> "$css"
done

rm -f /tmp/podcop-sub-v666-shine-v122.css
# SUBSYNC_PODCOP_SUB_V666_SHINE_INSTALL_V122_END

echo "→ Очистка LuCI кэша..."
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
touch /usr/lib/opkg/status 2>/dev/null || touch /lib/apk/db/installed 2>/dev/null || true

echo "→ Перезапуск LuCI..."
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo ""
echo "========================================="
echo "  Podcop Sub v666 встроен в Podkop"
echo "========================================="
echo ""
echo "  Открывать:"
echo "  Services → Podkop"
echo ""
echo "  Бэкап:"
echo "  $BACKUP"
echo ""
echo "  Откат:"
echo "  tar -xzf $BACKUP -C /"
echo ""
echo "  Обнови страницу: Ctrl+F5"
echo ""
