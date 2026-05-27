#!/bin/sh

echo ""
echo "========================================="
echo "  Podkop Sub Sync — Удаление"
echo "========================================="
echo ""

echo "→ Удаление cron-задачи..."
sed -i '/\/usr\/bin\/sub-sync/d' /etc/crontabs/root 2>/dev/null || true
/etc/init.d/cron restart 2>/dev/null || true

echo "→ Восстановление меню Podkop..."
PODKOP_MENU="/usr/share/luci/menu.d/luci-app-podkop.json"
if [ -f "${PODKOP_MENU}.bak.subsync" ]; then
    mv "${PODKOP_MENU}.bak.subsync" "$PODKOP_MENU"
    echo "  ✓ Меню Podkop восстановлено из бэкапа"
fi
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json

echo "→ Удаление ACL..."
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json

echo "→ Удаление файлов..."
rm -f /usr/bin/sub-sync
rm -rf /www/luci-static/resources/view/sub_sync
rm -f /www/luci-static/resources/view/podkop/sub_sync.js
rm -f /tmp/sub-sync-status
rm -f /tmp/sub-sync-response
rm -f /tmp/sub-sync-decoded
rm -rf /etc/sub-sync

echo "→ Очистка LuCI кэша и сессий..."
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* 2>/dev/null || true
rm -rf /tmp/luci-sessions/* 2>/dev/null || true
touch /usr/lib/opkg/status 2>/dev/null || touch /lib/apk/db/installed 2>/dev/null || true

echo "→ Перезапуск сервисов..."
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo ""
echo "========================================="
echo "  Podkop Sub Sync удалён"
echo "========================================="
echo ""
echo "  Меню Podkop восстановлено."
echo "  Обновите страницу в браузере (Ctrl+F5)."
echo ""
