#!/bin/sh

REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-syncv2}"
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
echo "  Podkop Sub Sync — integrated install"
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
BACKUP="/root/luci-app-sub-sync-before-install-$(date +%Y%m%d-%H%M%S).tar.gz"
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
    echo "  ! Podkop уже переключён на Sub Sync view"
else
    cp -f "$PODKOP_MENU" "$PODKOP_BAK"
    chmod 644 "$PODKOP_BAK"
    echo "  ✓ Родное меню сохранено: $PODKOP_BAK"
fi

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

echo "→ Создание ACL Sub Sync..."
cat > "$ACL_FILE" <<'ACLEOF'
{
    "luci-app-sub-sync": {
        "description": "Grant access to Sub Sync",
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

echo "→ Переключение Services → Podkop на интегрированный Sub Sync view..."
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

echo "→ Удаление отдельного пункта Services → Sub Sync, если был..."
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json

echo "→ Очистка LuCI кэша..."
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
touch /usr/lib/opkg/status 2>/dev/null || touch /lib/apk/db/installed 2>/dev/null || true

echo "→ Перезапуск LuCI..."
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo ""
echo "========================================="
echo "  Sub Sync встроен в Podkop"
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
