#!/bin/sh

REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-syncv2}"
BRANCH="${SUBSYNC_BRANCH:-main}"
RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

VIEW_DIR="/www/luci-static/resources/view/sub_sync"
VIEW_FILE="${VIEW_DIR}/sub_sync.js"
BIN_FILE="/usr/bin/sub-sync"
MENU_FILE="/usr/share/luci/menu.d/luci-app-sub-sync.json"
ACL_FILE="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"

echo ""
echo "========================================="
echo "  Podkop Sub Sync — safe install"
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

echo "→ Бэкап перед установкой..."
BACKUP="/root/luci-app-sub-sync-before-install-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" -C / \
  usr/share/luci/menu.d/luci-app-sub-sync.json \
  usr/share/rpcd/acl.d/luci-app-sub-sync.json \
  www/luci-static/resources/view/sub_sync \
  usr/bin/sub-sync \
  etc/sub-sync \
  2>/dev/null || true
echo "  ✓ Бэкап: $BACKUP"

echo "→ Проверка зависимостей..."
opkg update >/dev/null 2>&1 || true
command -v wget >/dev/null 2>&1 || opkg install wget >/dev/null 2>&1 || true
[ -f /etc/ssl/certs/ca-certificates.crt ] || opkg install ca-certificates >/dev/null 2>&1 || true

echo "→ Установка файлов Sub Sync..."
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

echo "→ Создание LuCI menu..."
cat > "$MENU_FILE" <<'MENUEOF'
{
    "admin/services/sub-sync": {
        "title": "Sub Sync",
        "order": 44,
        "action": {
            "type": "view",
            "path": "sub_sync/sub_sync"
        },
        "depends": {
            "acl": [ "luci-app-sub-sync" ],
            "uci": { "podkop": true }
        }
    }
}
MENUEOF
chmod 644 "$MENU_FILE"

echo "→ Создание ACL..."
cat > "$ACL_FILE" <<'ACLEOF'
{
    "luci-app-sub-sync": {
        "description": "Grant access to Sub Sync",
        "read": {
            "ubus": {
                "file": [ "exec" ]
            },
            "uci": [ "podkop" ]
        },
        "write": {
            "ubus": {
                "file": [ "exec" ]
            },
            "uci": [ "podkop" ]
        }
    }
}
ACLEOF
chmod 644 "$ACL_FILE"

echo "→ Очистка LuCI кэша..."
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
touch /usr/lib/opkg/status 2>/dev/null || touch /lib/apk/db/installed 2>/dev/null || true

echo "→ Перезапуск LuCI..."
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo ""
echo "========================================="
echo "  Sub Sync установлен безопасно"
echo "========================================="
echo ""
echo "  Страница:"
echo "  Services → Sub Sync"
echo ""
echo "  Бэкап:"
echo "  $BACKUP"
echo ""
echo "  Откат:"
echo "  tar -xzf $BACKUP -C /"
echo ""
echo "  Обнови страницу: Ctrl+F5"
echo ""
