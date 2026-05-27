#!/bin/sh

echo ""
echo "========================================="
echo "  Podkop Sub Sync — safe uninstall"
echo "========================================="
echo ""

BACKUP="/root/luci-app-sub-sync-before-uninstall-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "→ Бэкап перед удалением..."
tar -czf "$BACKUP" -C / \
  usr/share/luci/menu.d/luci-app-sub-sync.json \
  usr/share/rpcd/acl.d/luci-app-sub-sync.json \
  www/luci-static/resources/view/sub_sync \
  usr/bin/sub-sync \
  etc/sub-sync \
  2>/dev/null || true
echo "  ✓ Бэкап: $BACKUP"

echo "→ Удаление cron-задачи..."
sed -i '/\/usr\/bin\/sub-sync/d;/sub-sync/d;/subsync/d;/sub_sync/d' /etc/crontabs/root 2>/dev/null || true
/etc/init.d/cron restart 2>/dev/null || true

echo "→ Удаление файлов Sub Sync..."
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json
rm -rf /www/luci-static/resources/view/sub_sync
rm -f /usr/bin/sub-sync
rm -rf /etc/sub-sync
rm -f /tmp/sub-sync-status /tmp/sub-sync-response /tmp/sub-sync-decoded
rm -rf /tmp/sub-sync* /tmp/subsync-* /tmp/luci-app-sub-sync* 2>/dev/null || true

echo "→ Очистка LuCI кэша..."
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
touch /usr/lib/opkg/status 2>/dev/null || touch /lib/apk/db/installed 2>/dev/null || true

echo "→ Перезапуск LuCI..."
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo "→ Финальная проверка..."
find /etc /usr/share/luci/menu.d /usr/share/rpcd/acl.d /www/luci-static/resources/view /tmp \
  \( -iname '*luci-app-sub-sync*' -o -iname '*sub-sync*' -o -iname '*subsync*' -o -iname '*sub_sync*' \) \
  2>/dev/null || true

echo ""
echo "========================================="
echo "  Sub Sync удалён"
echo "========================================="
echo ""
echo "  Podkop не трогался."
echo "  Бэкап:"
echo "  $BACKUP"
echo ""
echo "  Откат:"
echo "  tar -xzf $BACKUP -C /"
echo ""
echo "  Обнови страницу: Ctrl+F5"
echo ""
