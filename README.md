<p align="center">
  <img alt="Podcop Sub v666" src="https://img.shields.io/badge/Podcop%20Sub-v666-black?style=for-the-badge">
</p>

<h1 align="center">Podcop Sub v666 by ZKS95</h1>

<p align="center">
  LuCI-модуль для OpenWrt: синхронизация proxy-подписок, управление серверами, интеграция в Podkop, поддержка xHTTP/VLESS, AutoPick, ping-проверка и публичный блок донатеров.
</p>

<p align="center">
  <img alt="OpenWrt" src="https://img.shields.io/badge/OpenWrt-24.10.x-blue?style=for-the-badge">
  <img alt="LuCI" src="https://img.shields.io/badge/LuCI-25.x-green?style=for-the-badge">
  <img alt="Podkop" src="https://img.shields.io/badge/Podkop-Compatible-orange?style=for-the-badge">
  <img alt="sing-box" src="https://img.shields.io/badge/sing--box-supported-purple?style=for-the-badge">
  <img alt="Author" src="https://img.shields.io/badge/by-kzolotarev95-black?style=for-the-badge">
</p>

---

## Описание

**Podcop Sub v666 by ZKS95** — это LuCI-модуль для OpenWrt, который добавляет удобную работу с proxy-подписками прямо в интерфейс **Services → Podkop**.

Модуль позволяет добавлять подписки, синхронизировать серверы, проверять ping, выбирать рабочие конфиги, добавлять серверы в Podkop-секции и использовать xHTTP/VLESS-ссылки через sing-box.

Public-сборка не содержит админ-панель донатеров.

---

## Установка

```sh
wget -O- "https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main/install.sh?v=$(date +%s)" | sh
```

---

## Удаление

```sh
wget -O /tmp/subsync-uninstall.sh "https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main/uninstall.sh?v=$(date +%s)" && sh /tmp/subsync-uninstall.sh
```

---

## Возможности

### Интеграция в Podkop

- Модуль открывается внутри стандартного раздела **Services → Podkop**
- Не создаёт лишнюю отдельную страницу
- Использует LuCI view `sub_sync/sub_sync`
- Работает через стандартные `rpcd` и `uhttpd`
- После установки очищает LuCI-кэш и перезапускает нужные службы

---

## Работа с подписками

- Добавление proxy-подписок
- Синхронизация серверов из подписок
- Сохранение серверов в `/etc/sub-sync/servers.json`
- Поддержка нескольких подписок
- Фильтрация и удаление подписок
- Быстрая ручная синхронизация
- Автоматическая cron-синхронизация

---

## Серверы и AutoPick

Модуль добавляет удобную таблицу серверов:

- Название сервера
- Тип подключения
- Страна / имя / meta-информация
- Ping-проверка
- Выбор рабочих серверов
- Добавление выбранных серверов в Podkop-секцию
- AutoPick для быстрого выбора подходящих серверов
- Защита от скачков интерфейса при обновлении ping

---

## Поддержка xHTTP / VLESS

Podcop Sub v666 добавляет поддержку xHTTP/VLESS-ссылок для Podkop/sing-box.

Поддерживается:

- `vless://`
- Reality
- TLS
- flow / fingerprint
- xHTTP transport
- совместимость с sing-box outbound JSON

Во время установки применяется patch для Podkop sing-box generator, чтобы Podkop корректно понимал transport `xhttp`.

---

## Публичный блок донатеров

В интерфейс добавлен публичный блок донатеров:

- Компактные карточки
- Telegram-ссылки
- Визуальный стиль в интерфейсе модуля
- Public-сборка без админ-панели донатеров

---

## Системные виджеты

В интерфейсе отображаются полезные системные данные:

- RAM
- Storage
- Temperature
- Статус sing-box
- Статус Podkop
- Консоль логов sing-box
- Кнопка копирования логов

---

## Структура проекта

```text
.
├── htdocs/
│   └── luci-static/
│       └── resources/
│           └── view/
│               └── sub_sync/
│                   └── sub_sync.js
│
├── root/
│   ├── usr/
│   │   └── bin/
│   │       ├── sub-sync
│   │       ├── sub-sync.real
│   │       ├── sub-sync-autoadd
│   │       ├── sub-sync-section
│   │       ├── sub-sync-subs-info
│   │       ├── sub-sync-system-info
│   │       ├── sub-sync-singbox-log
│   │       ├── sub-sync-donaters
│   │       └── podcop-sub-v666-xhttp-patch
│   │
│   └── www/
│       └── luci-static/
│           └── resources/
│               └── view/
│                   └── sub_sync/
│                       └── sub_sync.js
│
├── install.sh
├── uninstall.sh
└── README.md
```

---

## Совместимость

Проверялось на:

```text
OpenWrt 24.10.4
LuCI 25.x
Podkop
sing-box
uhttpd
rpcd
```

---

## Проверка после установки

```sh
head -n 8 /www/luci-static/resources/view/sub_sync/sub_sync.js

grep -n "return view.extend" /www/luci-static/resources/view/sub_sync/sub_sync.js | head

grep -n "SUBSYNC_DONATERS_ADMIN_UI_V143\|donatersAdminCardV143" /www/luci-static/resources/view/sub_sync/sub_sync.js || echo "OK: admin UI absent"

grep -n "SUBSYNC_DONATERS_PUBLIC_CARDS_V134_COMPACT_CARDS" /www/luci-static/resources/view/sub_sync/sub_sync.js | head

/usr/bin/sub-sync sync
```

---

## Логи

```sh
logread | grep -Ei 'sub-sync|subsync|donaters|donater|podkop|podcop|sing-box|rpcd|uhttpd|luci|SyntaxError|TypeError|ReferenceError|Access denied|Доступ запрещ|view.extend|fatal|invalid|xhttp|Unknown transport' | tail -n 220
```

Live-логи:

```sh
logread -f
```

---

## Автор

```text
by kzolotarev95
```
