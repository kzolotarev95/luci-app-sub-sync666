#!/bin/sh

SUBSYNC_VIEW="/www/luci-static/resources/view/sub_sync/sub_sync.js"

echo ""
echo "========================================="
echo "  Podkop Sub Sync — Установка"
echo "========================================="
echo ""

if [ ! -f /etc/openwrt_release ]; then
    echo "ОШИБКА: Требуется OpenWrt"
    exit 1
fi

if [ ! -f /etc/config/podkop ]; then
    echo "ОШИБКА: Podkop не установлен"
    exit 1
fi

echo "-> Проверка зависимостей..."
opkg update >/dev/null 2>&1 || true

[ -d /usr/bin/sub-sync ] && rm -rf /usr/bin/sub-sync

if ! command -v curl >/dev/null 2>&1; then
    opkg install curl >/dev/null 2>&1 || true
fi
if [ ! -f /etc/ssl/certs/ca-certificates.crt ]; then
    opkg install ca-certificates >/dev/null 2>&1 || true
fi

echo "-> Установка скрипта синхронизации..."
mkdir -p /etc/sub-sync
cat > /usr/bin/sub-sync << 'SCRIPTEOF'
#!/bin/sh

PODKOP_CONFIG="/etc/config/podkop"
LOG_TAG="sub-sync"
DATA_DIR="/etc/sub-sync"
SERVERS_FILE="$DATA_DIR/servers.json"
SUBS_FILE="$DATA_DIR/subscriptions.txt"
STATUS_FILE="/tmp/sub-sync-status"
TMP_FILE="/tmp/sub-sync-response"
TMP_DECODED="/tmp/sub-sync-decoded"

urldecode() {
    local _hex
    _hex=$(echo "$1" | sed 's/+/ /g;s/%/\\x/g')
    /usr/bin/printf "$_hex" 2>/dev/null | tr -d '\r'
}

json_escape() {
    echo "$1" | sed 's/\\/\\\\/g;s/"/\\"/g' | tr -d '\n\r'
}

log() {
    logger -t "$LOG_TAG" "$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1"
}

plural_servers() {
    local n=$1 m
    m=$((n % 100))
    if [ $m -ge 11 ] && [ $m -le 19 ]; then echo "серверов"; return; fi
    case $((n % 10)) in
        1) echo "сервер" ;;
        2|3|4) echo "сервера" ;;
        *) echo "серверов" ;;
    esac
}

write_status() {
    local _st="$1" _msg="$2" _cnt="${3:-0}" _now
    _now="$(date '+%Y-%m-%d %H:%M:%S')"
    printf '{"status":"%s","message":"%s","servers":%s,"time":"%s"}\n' \
        "$_st" "$_msg" "$_cnt" "$_now" > "$STATUS_FILE"
    cp -f "$STATUS_FILE" "$DATA_DIR/last-status" 2>/dev/null
}

ensure_data_dir() {
    mkdir -p "$DATA_DIR"
    [ -f "$SUBS_FILE" ] || touch "$SUBS_FILE"
}

cmd_status() {
    if [ -f "$STATUS_FILE" ]; then
        cat "$STATUS_FILE"
    elif [ -f "$DATA_DIR/last-status" ]; then
        cp -f "$DATA_DIR/last-status" "$STATUS_FILE" 2>/dev/null
        cat "$DATA_DIR/last-status"
    else
        echo '{"status":"idle","message":"Ещё не запускалось","servers":0,"time":""}'
    fi
}

cmd_info() {
    local _interval _sub_count=0 _server_count=0
    _interval=$(crontab -l 2>/dev/null | grep '/usr/bin/sub-sync' | sed 's|0 \*/\([0-9]*\).*|\1|')
    [ -z "$_interval" ] && _interval="0"
    if [ -f "$DATA_DIR/links.txt" ]; then
        _server_count=$(grep -c '://' "$DATA_DIR/links.txt" 2>/dev/null) || true
        _server_count=${_server_count:-0}
    fi
    if [ -f "$SUBS_FILE" ]; then
        _sub_count=$(grep -c '[^ ]' "$SUBS_FILE" 2>/dev/null) || true
        _sub_count=${_sub_count:-0}
    fi
    printf '{"interval_hours":%s,"servers_synced":%s,"subscriptions":%s}\n' \
        "$_interval" "$_server_count" "$_sub_count"
}

cmd_servers() {
    if [ -f "$SERVERS_FILE" ]; then
        cat "$SERVERS_FILE"
    else
        echo '[]'
    fi
}

cmd_sections() {
    echo '['
    local _first=1
    for _sec in $(uci show podkop 2>/dev/null | grep '=section$' | sed 's|podkop\.\([^=]*\)=.*|\1|'); do
        local _ptype _lcount=0
        _ptype=$(uci -q get "podkop.${_sec}.proxy_config_type" 2>/dev/null)
        case "$_ptype" in
            url)      [ -n "$(uci -q get "podkop.${_sec}.proxy_string" 2>/dev/null)" ] && _lcount=1 ;;
            outbound) [ -n "$(uci -q get "podkop.${_sec}.outbound_json" 2>/dev/null)" ] && _lcount=1 ;;
            selector) _lcount=$(uci -q get "podkop.${_sec}.selector_proxy_links" 2>/dev/null | grep -c '://') ;;
            *)        _lcount=$(uci -q get "podkop.${_sec}.urltest_proxy_links" 2>/dev/null | grep -c '://') ;;
        esac
        [ "$_first" = "1" ] && _first=0 || printf ','
        printf '{"name":"%s","type":"%s","servers":%d}' "$_sec" "$_ptype" "$_lcount"
    done
    echo ']'
}

section_has_link() {
    local _target="$1" _link="$2" _ptype _current
    _ptype=$(uci -q get "podkop.${_target}.proxy_config_type" 2>/dev/null)
    case "$_ptype" in
        url)
            _current=$(uci -q get "podkop.${_target}.proxy_string" 2>/dev/null)
            [ "$_current" = "$_link" ]
            return
            ;;
        selector)
            _current=$(uci -q get "podkop.${_target}.selector_proxy_links" 2>/dev/null)
            ;;
        *)
            _current=$(uci -q get "podkop.${_target}.urltest_proxy_links" 2>/dev/null)
            ;;
    esac
    printf '%s\n' "$_current" | tr ' ' '\n' | grep -Fxq "$_link"
}

cmd_apply() {
    local _target="$1"
    if [ -z "$_target" ]; then
        echo "ОШИБКА: укажите имя секции"
        return 1
    fi
    if [ ! -f "$DATA_DIR/links.txt" ]; then
        echo "ОШИБКА: серверы не загружены, сначала выполните sync"
        return 1
    fi
    local _exists
    _exists=$(uci -q get "podkop.${_target}" 2>/dev/null)
    if [ -z "$_exists" ]; then
        echo "ОШИБКА: секция '$_target' не найдена"
        return 1
    fi
    local _ptype
    _ptype=$(uci -q get "podkop.${_target}.proxy_config_type" 2>/dev/null)
    local _added=0
    case "$_ptype" in
        url)
            local _first_link=""
            while IFS= read -r _line; do
                case "$_line" in
                    vless://*|ss://*|trojan://*|hy2://*|hysteria2://*)
                        _first_link="$_line"
                        break
                        ;;
                esac
            done < "$DATA_DIR/links.txt"
            if [ -n "$_first_link" ]; then
                uci set "podkop.${_target}.proxy_string=${_first_link}"
                _added=1
            fi
            ;;
        selector)
            uci -q delete "podkop.${_target}.selector_proxy_links" 2>/dev/null || true
            while IFS= read -r _line; do
                case "$_line" in
                    vless://*|ss://*|trojan://*|hy2://*|hysteria2://*)
                        uci add_list "podkop.${_target}.selector_proxy_links=${_line}"
                        _added=$((_added + 1))
                        ;;
                esac
            done < "$DATA_DIR/links.txt"
            ;;
        *)
            uci -q delete "podkop.${_target}.urltest_proxy_links" 2>/dev/null || true
            while IFS= read -r _line; do
                case "$_line" in
                    vless://*|ss://*|trojan://*|hy2://*|hysteria2://*)
                        uci add_list "podkop.${_target}.urltest_proxy_links=${_line}"
                        _added=$((_added + 1))
                        ;;
                esac
            done < "$DATA_DIR/links.txt"
            ;;
    esac
    if [ "$_added" = "0" ]; then
        echo "ОШИБКА: нет валидных ссылок"
        return 1
    fi
    uci commit podkop
    /etc/init.d/podkop restart 2>/dev/null || true
    log "Применено $_added сервер(ов) в секцию '$_target'"
    echo "OK: $_added"
}

cmd_apply_one() {
    local _target="$1" _id="$2"
    if [ -z "$_target" ] || [ -z "$_id" ]; then
        echo "ОШИБКА: использование: apply-one <секция> <id>"
        return 1
    fi
    case "$_id" in
        ''|*[!0-9]*) echo "ОШИБКА: неверный id"; return 1 ;;
    esac
    if [ ! -f "$DATA_DIR/links.txt" ]; then
        echo "ОШИБКА: серверы не загружены"
        return 1
    fi
    local _exists
    _exists=$(uci -q get "podkop.${_target}" 2>/dev/null)
    if [ -z "$_exists" ]; then
        echo "ОШИБКА: секция '$_target' не найдена"
        return 1
    fi
    local _link="" _idx=0
    while IFS= read -r _line; do
        case "$_line" in
            vless://*|ss://*|trojan://*|hy2://*|hysteria2://*)
                _idx=$((_idx + 1))
                if [ "$_idx" = "$_id" ]; then
                    _link="$_line"
                    break
                fi
                ;;
        esac
    done < "$DATA_DIR/links.txt"
    if [ -z "$_link" ]; then
        echo "ОШИБКА: сервер #$_id не найден"
        return 1
    fi
    if section_has_link "$_target" "$_link"; then
        echo "SKIP: уже существует"
        return 0
    fi
    local _ptype
    _ptype=$(uci -q get "podkop.${_target}.proxy_config_type" 2>/dev/null)
    case "$_ptype" in
        url)
            uci set "podkop.${_target}.proxy_string=${_link}"
            ;;
        selector)
            uci add_list "podkop.${_target}.selector_proxy_links=${_link}"
            ;;
        *)
            uci add_list "podkop.${_target}.urltest_proxy_links=${_link}"
            ;;
    esac
    uci commit podkop
    log "Применён сервер #$_id в секцию '$_target'"
    echo "OK"
}

cmd_interval() {
    local _hours="$1"
    if [ -z "$_hours" ] || [ "$_hours" -lt 1 ] || [ "$_hours" -gt 48 ] 2>/dev/null; then
        echo "ОШИБКА: интервал должен быть 1-48 часов"
        return 1
    fi
    sed -i '/\/usr\/bin\/sub-sync/d' /etc/crontabs/root 2>/dev/null
    echo "0 */${_hours} * * * /usr/bin/sub-sync sync" >> /etc/crontabs/root
    /etc/init.d/cron restart 2>/dev/null
    log "Интервал изменён на ${_hours}ч"
    echo "OK: interval=${_hours}h"
}

cmd_interval_off() {
    sed -i '/\/usr\/bin\/sub-sync/d' /etc/crontabs/root 2>/dev/null
    /etc/init.d/cron restart 2>/dev/null
    log "Автообновление выключено"
    echo "OK"
}

cmd_link() {
    local _id="$1"
    case "$_id" in
        ''|*[!0-9]*) echo "ОШИБКА: неверный id"; return 1 ;;
    esac
    if [ ! -f "$DATA_DIR/links.txt" ]; then
        echo "ОШИБКА: нет загруженных данных"
        return 1
    fi
    local _idx=0
    while IFS= read -r _line; do
        case "$_line" in
            vless://*|ss://*|trojan://*|hy2://*|hysteria2://*)
                _idx=$((_idx + 1))
                if [ "$_idx" = "$_id" ]; then
                    echo "$_line"
                    return 0
                fi
                ;;
        esac
    done < "$DATA_DIR/links.txt"
    echo "ОШИБКА: не найдено"
    return 1
}

cmd_ping() {
    local _id="$1"
    case "$_id" in
        ''|*[!0-9]*) echo '{"error":"id required"}'; return 1 ;;
    esac
    if [ ! -f "$SERVERS_FILE" ]; then
        echo '{"error":"no servers"}'
        return 1
    fi
    local _addr _port
    if command -v jq >/dev/null 2>&1; then
        _addr=$(jq -r ".[] | select(.id == ${_id}) | .addr" "$SERVERS_FILE" 2>/dev/null)
        _port=$(jq -r ".[] | select(.id == ${_id}) | .port" "$SERVERS_FILE" 2>/dev/null)
    else
        _addr=$(grep "\"id\":${_id}," "$SERVERS_FILE" | sed 's/.*"addr":"\([^"]*\)".*/\1/' | head -1)
        _port=$(grep "\"id\":${_id}," "$SERVERS_FILE" | sed 's/.*"port":"\([^"]*\)".*/\1/' | head -1)
    fi
    if [ -z "$_addr" ] || [ -z "$_port" ]; then
        echo '{"error":"server not found"}'
        return 1
    fi
    case "$_addr" in
        *[!a-zA-Z0-9._-]*) echo '{"error":"invalid addr"}'; return 1 ;;
    esac
    case "$_port" in
        *[!0-9]*) echo '{"error":"invalid port"}'; return 1 ;;
    esac
    local _time
    _time=$(curl -sk -o /dev/null -w '%{time_connect}' --connect-timeout 3 "https://${_addr}:${_port}/" 2>/dev/null)
    case "$_time" in
        0.000*|"")
            echo "{\"status\":\"error\",\"ms\":0,\"addr\":\"$_addr\",\"port\":\"$_port\"}"
            return 0
            ;;
    esac
    local _ms
    _ms=$(echo "$_time" | awk '{printf "%d", $1 * 1000}')
    [ "$_ms" = "0" ] && _ms=1
    echo "{\"status\":\"ok\",\"ms\":$_ms,\"addr\":\"$_addr\",\"port\":\"$_port\"}"
}

cmd_podkop_status() {
    local _pk='{"enabled":0,"status":"unknown"}'
    local _sb='{"running":0,"status":"unknown"}'
    if [ -x /usr/bin/podkop ]; then
        _pk=$(/usr/bin/podkop get_status 2>/dev/null || echo '{"enabled":0,"status":"error"}')
        _sb=$(/usr/bin/podkop get_sing_box_status 2>/dev/null || echo '{"running":0,"status":"error"}')
    fi
    printf '{"podkop":%s,"sing_box":%s}\n' "$_pk" "$_sb"
}

cmd_connections() {
    local _clash_addr=""
    _clash_addr=$(netstat -tlnp 2>/dev/null | grep sing-box | grep ':9090' | awk '{print $4}' | head -1)
    [ -z "$_clash_addr" ] && _clash_addr=$(ss -tlnp 2>/dev/null | grep sing-box | grep ':9090' | awk '{print $4}' | sed 's/\[//;s/\]//' | head -1)
    [ -z "$_clash_addr" ] && _clash_addr="127.0.0.1:9090"
    case "$_clash_addr" in
        0.0.0.0:*) _clash_addr="127.0.0.1:${_clash_addr#*:}" ;;
    esac
    curl -s --connect-timeout 2 --max-time 5 "http://${_clash_addr}/connections" 2>/dev/null || echo '{"error":"Clash API недоступен ('$_clash_addr')"}'
}

cmd_add_sub() {
    local _url="$1"
    if [ -z "$_url" ]; then
        echo "ОШИБКА: укажите URL подписки"
        return 1
    fi
    case "$_url" in
        http://*|https://*) ;;
        *) echo "ОШИБКА: URL должен начинаться с http:// или https://"; return 1 ;;
    esac
    ensure_data_dir
    if grep -Fxq "$_url" "$SUBS_FILE" 2>/dev/null; then
        echo "ОШИБКА: подписка уже добавлена"
        return 1
    fi
    echo "$_url" >> "$SUBS_FILE"
    log "Подписка добавлена: $_url"
    echo "OK"
}

cmd_del_sub() {
    local _id="$1"
    case "$_id" in
        ''|*[!0-9]*) echo "ОШИБКА: неверный id"; return 1 ;;
    esac
    if [ ! -f "$SUBS_FILE" ]; then
        echo "ОШИБКА: нет подписок"
        return 1
    fi
    local _total
    _total=$(grep -c '[^ ]' "$SUBS_FILE" 2>/dev/null) || true
    _total=${_total:-0}
    if [ "$_id" -lt 1 ] || [ "$_id" -gt "$_total" ]; then
        echo "ОШИБКА: подписка #$_id не найдена"
        return 1
    fi
    sed -i "${_id}d" "$SUBS_FILE"
    sed -i '/^$/d' "$SUBS_FILE"
    log "Подписка #$_id удалена"
    echo "OK"
}

cmd_list_subs() {
    ensure_data_dir
    if [ ! -s "$SUBS_FILE" ]; then
        echo '[]'
        return 0
    fi
    printf '['
    local _first=1 _idx=0
    while IFS= read -r _line; do
        _line=$(printf '%s' "$_line" | tr -d '\r\n')
        [ -z "$_line" ] && continue
        _idx=$((_idx + 1))
        _escaped=$(json_escape "$_line")
        [ "$_first" = "1" ] && _first=0 || printf ','
        printf '{"id":%d,"url":"%s"}' "$_idx" "$_escaped"
    done < "$SUBS_FILE"
    printf ']\n'
}

cmd_singbox_info() {
    local _ver _tags _xhttp="false"
    _ver=$(sing-box version 2>/dev/null | head -1 | sed 's/.*version //')
    _tags=$(sing-box version 2>/dev/null | grep 'Tags:' | sed 's/Tags: //')
    case "$_tags" in *xhttp*|*XHTTP*) _xhttp="true" ;; esac
    printf '{"version":"%s","tags":"%s","xhttp":%s}\n' "$_ver" "$_tags" "$_xhttp"
}

cleanup() {
    rm -f "$TMP_FILE" "$TMP_DECODED"
}
trap cleanup EXIT

case "$1" in
    status)        cmd_status; exit 0 ;;
    info)          cmd_info; exit 0 ;;
    servers)       cmd_servers; exit 0 ;;
    sections)      cmd_sections; exit 0 ;;
    apply)         cmd_apply "$2"; exit $? ;;
    apply-one)     cmd_apply_one "$2" "$3"; exit $? ;;
    interval)      cmd_interval "$2"; exit $? ;;
    interval-off)  cmd_interval_off; exit $? ;;
    link)          cmd_link "$2"; exit $? ;;
    ping)          cmd_ping "$2"; exit $? ;;
    podkop-status) cmd_podkop_status; exit 0 ;;
    connections)   cmd_connections; exit 0 ;;
    singbox-info)  cmd_singbox_info; exit 0 ;;
    add-sub)       cmd_add_sub "$2"; exit $? ;;
    del-sub)       cmd_del_sub "$2"; exit $? ;;
    list-subs)     cmd_list_subs; exit 0 ;;
    sync)          ;;
    "")            ;;
    *) echo "Usage: $0 [sync|status|info|servers|sections|apply <sec>|apply-one <sec> <id>|interval <h>|interval-off|link <id>|ping <id>|podkop-status|connections|add-sub <url>|del-sub <id>|list-subs]"; exit 1 ;;
esac

ensure_data_dir

if [ ! -s "$SUBS_FILE" ]; then
    log "ОШИБКА: нет подписок. Добавьте через 'add-sub <url>'"
    write_status "error" "Нет подписок" "0"
    exit 1
fi

log "Загрузка серверов из подписок..."
write_status "syncing" "Синхронизация..." "0"

> "$DATA_DIR/links.txt.tmp"

_sub_idx=0
_sub_errors=0
while IFS= read -r _sub_url; do
    _sub_url=$(printf '%s' "$_sub_url" | tr -d '\r\n')
    [ -z "$_sub_url" ] && continue
    _sub_idx=$((_sub_idx + 1))

    log "Подписка #$_sub_idx: $_sub_url"

    HTTP_CODE=$(curl -sk -o "$TMP_FILE" -w "%{http_code}" \
        -H 'User-Agent: v2rayN/6.42' \
        --connect-timeout 15 --max-time 30 \
        "$_sub_url" 2>/dev/null)

    if [ "$HTTP_CODE" != "200" ]; then
        log "ВНИМАНИЕ: подписка #$_sub_idx вернула HTTP $HTTP_CODE"
        _sub_errors=$((_sub_errors + 1))
        continue
    fi

    if [ ! -s "$TMP_FILE" ]; then
        log "ВНИМАНИЕ: подписка #$_sub_idx — пустой ответ"
        _sub_errors=$((_sub_errors + 1))
        continue
    fi

    base64 -d < "$TMP_FILE" > "$TMP_DECODED" 2>/dev/null

    _dec_links=$(grep -c '://' "$TMP_DECODED" 2>/dev/null) || true
    _dec_links=${_dec_links:-0}
    if [ "$_dec_links" = "0" ]; then
        cp "$TMP_FILE" "$TMP_DECODED"
    fi

    _found=$(grep -c '://' "$TMP_DECODED" 2>/dev/null) || true
    _found=${_found:-0}
    if [ "$_found" = "0" ]; then
        log "ВНИМАНИЕ: подписка #$_sub_idx — нет прокси-ссылок"
        _sub_errors=$((_sub_errors + 1))
        continue
    fi

    sed 's/\r$//' "$TMP_DECODED" >> "$DATA_DIR/links.txt.tmp"
    echo >> "$DATA_DIR/links.txt.tmp"
    log "Подписка #$_sub_idx: найдено $_found ссылок"

done < "$SUBS_FILE"

awk 'NF && !seen[$0]++' "$DATA_DIR/links.txt.tmp" > "$DATA_DIR/links.txt"
rm -f "$DATA_DIR/links.txt.tmp"

LINK_COUNT=$(grep -c '://' "$DATA_DIR/links.txt" 2>/dev/null) || true
LINK_COUNT=${LINK_COUNT:-0}
if [ "$LINK_COUNT" = "0" ]; then
    log "ОШИБКА: не найдено прокси-ссылок ни в одной подписке"
    write_status "error" "Нет прокси-ссылок" "0"
    exit 1
fi

log "Получено $LINK_COUNT уникальных сервер(ов) из $_sub_idx $(plural_servers $_sub_idx)"

{
    printf '['
    _first=1
    _idx=0
    while IFS= read -r _line; do
        _line=$(printf '%s' "$_line" | tr -d '\r\n')
        case "$_line" in
            vless://*|ss://*|trojan://*|hy2://*|hysteria2://*|socks://*|socks4://*|socks5://*)
                _idx=$((_idx + 1))
                _proto="${_line%%://*}"
                _raw_frag=""
                case "$_line" in *"#"*) _raw_frag="${_line##*#}" ;; esac
                _name=""
                if [ -n "$_raw_frag" ]; then
                    _name=$(urldecode "$_raw_frag" | tr -d '\r\n')
                fi
                [ -z "$_name" ] && _name=$(printf '%s' "$_line" | sed 's|.*://[^@]*@||;s|:.*||;s|?.*||')
                _name=$(json_escape "$_name")
                _addr=$(printf '%s' "$_line" | sed 's|.*://[^@]*@||;s|:.*||;s|?.*||' | tr -d '\r\n\t ')
                _port=$(printf '%s' "$_line" | sed 's|.*://[^@]*@[^:]*:||;s|[?/\#].*||' | tr -d '\r\n\t ')
                _query=""
                case "$_line" in *"?"*) _query=$(printf '%s' "$_line" | sed 's|[^?]*?||;s|#.*||') ;; esac
                _type="" _security=""
                if [ -n "$_query" ]; then
                    _type=$(printf '%s' "$_query" | tr '&' '\n' | sed -n 's/^type=//p' | head -1)
                    _security=$(printf '%s' "$_query" | tr '&' '\n' | sed -n 's/^security=//p' | head -1)
                fi
                case "$_proto" in
                    ss)
                        _userinfo=$(printf '%s' "$_line" | sed 's|^ss://||;s|@.*||;s|#.*||')
                        _cipher=$(printf '%s' "$_userinfo" | base64 -d 2>/dev/null | sed 's|:.*||')
                        [ -n "$_cipher" ] && _type="$_cipher"
                        ;;
                    hy2|hysteria2)
                        [ -z "$_type" ] && _type="quic"
                        if [ -n "$_query" ]; then
                            _obfs=$(printf '%s' "$_query" | tr '&' '\n' | sed -n 's/^obfs=//p' | head -1)
                            [ -n "$_obfs" ] && _security="$_obfs"
                        fi
                        ;;
                esac
                _link_escaped=$(json_escape "$_line")
                [ "$_first" = "1" ] && _first=0 || printf ','
                printf '\n{"id":%d,"proto":"%s","name":"%s","addr":"%s","port":"%s","type":"%s","security":"%s","link":"%s"}' \
                    "$_idx" "$_proto" "$_name" "$_addr" "$_port" "$_type" "$_security" "$_link_escaped"
                ;;
        esac
    done < "$DATA_DIR/links.txt"
    printf '\n]\n'
} > "$SERVERS_FILE"

if [ "$_sub_errors" -gt 0 ]; then
    write_status "ok" "OK (ошибок: $_sub_errors)" "$LINK_COUNT"
else
    write_status "ok" "OK" "$LINK_COUNT"
fi
log "Синхронизация завершена — серверы сохранены в $SERVERS_FILE"
SCRIPTEOF
chmod 755 /usr/bin/sub-sync

echo "-> Установка LuCI модуля..."
mkdir -p /www/luci-static/resources/view/sub_sync
cat > "$SUBSYNC_VIEW" << 'JSEOF'
'use strict';
'require view';
'require form';
'require ui';
'require fs';
'require uci';
'require view.podkop.main as main';
'require view.podkop.settings as settings';
'require view.podkop.section as section';
'require view.podkop.dashboard as dashboard';
'require view.podkop.diagnostic as diagnostic';

var SUB_SYNC_VERSION = 'v2';


var ssStyles = '\
#cbi-podkop-sub_sync, #cbi-podkop-ss_monitor { border: none !important; padding: 0 !important; margin: 0 !important; background: none !important; box-shadow: none !important; }\
#cbi-podkop-sub_sync .cbi-section-node, #cbi-podkop-ss_monitor .cbi-section-node { border: none !important; padding: 0 !important; margin: 0 !important; background: none !important; box-shadow: none !important; }\
.cbi-map { width: 100% !important; max-width: none !important; }\
#cbi-podkop-sub_sync .cbi-value-field, #cbi-podkop-ss_monitor .cbi-value-field { max-width: none !important; flex: 1 !important; width: 100% !important; }\
#cbi-podkop-sub_sync .cbi-value, #cbi-podkop-ss_monitor .cbi-value { flex-wrap: nowrap !important; }\
#cbi-podkop-sub_sync .cbi-value > .cbi-value-title, #cbi-podkop-ss_monitor .cbi-value > .cbi-value-title { display: none !important; }\
#cbi-podkop-sub_sync > h3, #cbi-podkop-ss_monitor > h3 { display: none; }\
.ss-page { width: 100%; box-sizing: border-box; overflow: hidden; }\
.ss-widgets { margin-top: 10px; display: grid; grid-template-columns: repeat(3, 1fr); grid-gap: 10px; align-items: start; }\
@media (max-width: 900px) { .ss-widgets { grid-template-columns: repeat(2, 1fr); } }\
@media (max-width: 500px) { .ss-widgets { grid-template-columns: 1fr; } }\
.ss-widget { border: 1px solid var(--background-color-low, #444); border-radius: 4px; padding: 12px; }\
.ss-widget:hover { border-color: var(--border-color-medium, #555); }\
.ss-widget__title { font-weight: 700; margin-bottom: 6px; font-size: 13px; }\
.ss-widget__value { font-size: 14px; }\
.ss-card { margin-top: 10px; border: 1px solid var(--background-color-low, #444); border-radius: 4px; padding: 14px; overflow: hidden; }\
.ss-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }\
.ss-card__title { font-weight: 700; font-size: 15px; }\
.ss-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\
.ss-dot { font-size: 14px; margin-right: 2px; }\
.ss-dot--ok { color: #4caf50; }\
.ss-dot--warn { color: #ff9800; }\
.ss-dot--err { color: #f44336; }\
.ss-label { font-size: 13px; }\
.ss-val { font-weight: 600; font-size: 13px; }\
.ss-val--ok { color: #4caf50; }\
.ss-val--warn { color: #ff9800; }\
.ss-val--err { color: #f44336; }\
.ss-badge { font-size: 13px; padding: 3px 10px; border-radius: 4px; border: 1px solid #4caf50; }\
.ss-sub-row { display: flex; align-items: center; gap: 6px; padding: 6px 0; border-bottom: 1px solid var(--background-color-low, #333); overflow: hidden; min-width: 0; }\
.ss-sub-row:last-child { border-bottom: none; }\
.ss-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; }\
.ss-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }\
.ss-version { font-size: 11px; opacity: 0.5; }\
.ss-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }\
.ss-table-wrap > .table { min-width: 700px; width: 100%; display: table !important; border-collapse: collapse !important; border-spacing: 0 !important; box-shadow: none !important; overflow: visible !important; }\
.ss-table-wrap .table .tr { display: table-row !important; transform: none !important; animation: none !important; cursor: default !important; padding: 0 !important; }\
.ss-table-wrap .table .tr:hover { transform: none !important; box-shadow: none !important; }\
.ss-table-wrap .table .th, .ss-table-wrap .table .td { display: table-cell !important; vertical-align: middle !important; border-right: none !important; padding: 8px 6px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }\
.ss-table-wrap .table .tr.table-titles { position: static !important; background: inherit !important; border-bottom: 2px solid var(--border-color-medium, #555) !important; }\
.ss-table-wrap .table .tr.table-titles .th { border-bottom: none !important; border-top: none !important; }\
.ss-page select, .ss-page input[type="text"] { height: auto !important; padding: 3px 6px !important; font-size: 13px !important; line-height: 1.3 !important; width: auto !important; max-width: none !important; box-sizing: border-box !important; }\
.ss-page .ss-toolbar select, .ss-page .ss-controls select { min-width: 80px !important; }\
.ss-page .cbi-button { height: auto !important; }\
.ss-page .ss-toolbar, .ss-page .ss-controls { display: flex !important; align-items: center !important; gap: 10px !important; flex-wrap: wrap !important; }\
.ss-page .ss-toolbar > *, .ss-page .ss-controls > * { flex-shrink: 0 !important; }\
.ss-page .ss-select { min-width: 120px !important; width: 120px !important; }\
';

var ssStyleInjected = false;
function injectStyles() {
	if (ssStyleInjected) return;
	ssStyleInjected = true;
	var el = document.createElement('style');
	el.textContent = ssStyles;
	document.head.appendChild(el);
}

function extractAddrPortFromLink(link) {
	try {
		var parts = link.split('://');
		if (parts.length < 2) return '';
		var rest = parts[1];
		var atIdx = rest.indexOf('@');
		if (atIdx >= 0) rest = rest.substring(atIdx + 1);
		rest = rest.split('?')[0].split('#')[0].split('/')[0];
		return rest;
	} catch(e) { return ''; }
}

function formatBytes(b) {
	if (b < 1024) return b + ' B';
	if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
	if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
	return (b / 1073741824).toFixed(2) + ' GB';
}

function formatSpeed(bps) {
	if (bps < 1024) return bps.toFixed(0) + ' B/s';
	if (bps < 1048576) return (bps / 1024).toFixed(1) + ' KB/s';
	return (bps / 1048576).toFixed(1) + ' MB/s';
}

function formatDuration(startISO) {
	var d = Math.floor((Date.now() - new Date(startISO).getTime()) / 1000);
	if (d < 0) d = 0;
	if (d < 60) return d + 'с';
	if (d < 3600) return Math.floor(d / 60) + 'м ' + (d % 60) + 'с';
	return Math.floor(d / 3600) + 'ч ' + Math.floor((d % 3600) / 60) + 'м';
}

function pluralConns(n) {
	var m = n % 100;
	if (m >= 11 && m <= 19) return 'подключений';
	switch (n % 10) {
		case 1: return 'подключение';
		case 2: case 3: case 4: return 'подключения';
		default: return 'подключений';
	}
}

function linkToOutbound(url) {
	try {
		var schemeSep = url.indexOf('://');
		if (schemeSep < 0) return null;
		var proto = url.substring(0, schemeSep).toLowerCase();
		var rest = url.substring(schemeSep + 3);
		var tag = '';
		var fragIdx = rest.indexOf('#');
		if (fragIdx >= 0) {
			tag = decodeURIComponent(rest.substring(fragIdx + 1));
			rest = rest.substring(0, fragIdx);
		}
		var qIdx = rest.indexOf('?');
		var q = {};
		if (qIdx >= 0) {
			var pairs = rest.substring(qIdx + 1).split('&');
			for (var pi = 0; pi < pairs.length; pi++) {
				var eq = pairs[pi].indexOf('=');
				if (eq > 0) q[pairs[pi].substring(0, eq)] = decodeURIComponent(pairs[pi].substring(eq + 1));
			}
			rest = rest.substring(0, qIdx);
		}
		var atIdx = rest.indexOf('@');
		var userinfo = atIdx >= 0 ? rest.substring(0, atIdx) : '';
		var hp = (atIdx >= 0 ? rest.substring(atIdx + 1) : rest).split('/')[0];
		var ci = hp.lastIndexOf(':');
		var addr = ci >= 0 ? hp.substring(0, ci) : hp;
		var port = ci >= 0 ? parseInt(hp.substring(ci + 1)) : 443;
		if (addr.charAt(0) === '[' && addr.charAt(addr.length - 1) === ']') addr = addr.substring(1, addr.length - 1);
		var ob = {}, sec2, t2, si2, dec;
		var sni = q.sni || '';
		var fp = q.fp || 'chrome';
		var security = (q.security || '').toLowerCase();
		function addTls(def) {
			sec2 = security || (def || '').toLowerCase();
			if (sec2 === 'tls' || sec2 === 'reality' || sec2 === 'xtls') {
				ob.tls = { enabled: true, server_name: sni || addr };
				var alpnArray = [];
				if (q.alpn) {
					alpnArray = q.alpn.split(',');
				} else {
					t2 = (q.type || '').toLowerCase();
					if (t2 === 'xhttp' || t2 === 'splithttp') alpnArray = ['h2', 'http/1.1'];
				}
				if (alpnArray.length > 0) ob.tls.alpn = alpnArray;
				if (sec2 === 'reality') {
					ob.tls.reality = { enabled: true };
					if (q.pbk) ob.tls.reality.public_key = q.pbk;
					if (q.sid) ob.tls.reality.short_id = q.sid;
					ob.tls.utls = { enabled: true, fingerprint: fp };
				} else {
					if (q.allowInsecure === '1') ob.tls.insecure = true;
					if (q.fp) ob.tls.utls = { enabled: true, fingerprint: fp };
				}
			}
		}
		function addTransport() {
			t2 = (q.type || '').toLowerCase();
			if (t2 === 'ws') {
				ob.transport = { type: 'ws' };
				if (q.path) ob.transport.path = q.path;
				if (q.host) ob.transport.headers = { Host: q.host };
			} else if (t2 === 'grpc') {
				ob.transport = { type: 'grpc' };
				if (q.serviceName) ob.transport.service_name = q.serviceName;
			} else if (t2 === 'xhttp' || t2 === 'splithttp') {
				var tr = { type: 'xhttp' };
				tr.path = q.path || '/';
				tr.host = q.host || sni || addr;
				if (q.mode) tr.mode = q.mode;
				tr.x_padding_bytes = q.x_padding_bytes || '100-1000';
				try {
					if (q.extra) {
						var extra = JSON.parse(q.extra);
						if (extra.xPaddingBytes !== undefined) tr.x_padding_bytes = String(extra.xPaddingBytes);
						if (extra.noGRPCHeader !== undefined) tr.no_grpc_header = extra.noGRPCHeader;
						if (extra.scMaxEachPostBytes !== undefined) tr.sc_max_each_post_bytes = extra.scMaxEachPostBytes;
						if (extra.scMinPostsIntervalMs !== undefined) tr.sc_min_posts_interval_ms = extra.scMinPostsIntervalMs;
						if (extra.scStreamUpServerSecs !== undefined) tr.sc_stream_up_server_secs = String(extra.scStreamUpServerSecs);
						if (extra.xmux && typeof extra.xmux === 'object') {
							var xmux = {};
							if (extra.xmux.maxConcurrency !== undefined) xmux.max_concurrency = String(extra.xmux.maxConcurrency);
							if (extra.xmux.maxConnections !== undefined) xmux.max_connections = extra.xmux.maxConnections;
							if (extra.xmux.cMaxReuseTimes !== undefined) xmux.c_max_reuse_times = extra.xmux.cMaxReuseTimes;
							if (extra.xmux.hMaxRequestTimes !== undefined) xmux.h_max_request_times = String(extra.xmux.hMaxRequestTimes);
							if (extra.xmux.hMaxReusableSecs !== undefined) xmux.h_max_reusable_secs = String(extra.xmux.hMaxReusableSecs);
							if (extra.xmux.hKeepAlivePeriod !== undefined) xmux.h_keep_alive_period = extra.xmux.hKeepAlivePeriod;
							var xmuxKeys = 0; for (var xk in xmux) xmuxKeys++;
							if (xmuxKeys > 0) tr.xmux = xmux;
						}
					}
				} catch(extraErr) {}
				ob.transport = tr;
			} else if (t2 === 'httpupgrade') {
				ob.transport = { type: 'httpupgrade' };
				if (q.path) ob.transport.path = q.path;
				if (q.host) ob.transport.host = q.host;
			}
		}
		if (proto === 'vless') {
			ob = { type: 'vless', server: addr, server_port: port, uuid: userinfo };
			if (tag) ob.tag = tag;
			if (q.flow) ob.flow = q.flow;
			addTls(''); addTransport();
		} else if (proto === 'trojan') {
			ob = { type: 'trojan', server: addr, server_port: port, password: userinfo };
			if (tag) ob.tag = tag;
			addTls('tls'); addTransport();
		} else if (proto === 'ss') {
			var method, password;
			try { dec = atob(userinfo); si2 = dec.indexOf(':'); method = dec.substring(0, si2); password = dec.substring(si2 + 1); }
			catch(e2) { si2 = userinfo.indexOf(':'); method = userinfo.substring(0, si2); password = decodeURIComponent(userinfo.substring(si2 + 1)); }
			ob = { type: 'shadowsocks', server: addr, server_port: port, method: method, password: password };
			if (tag) ob.tag = tag;
		} else if (proto === 'hy2' || proto === 'hysteria2') {
			ob = { type: 'hysteria2', server: addr, server_port: port, password: userinfo };
			if (tag) ob.tag = tag;
			ob.tls = { enabled: true };
			if (sni) ob.tls.server_name = sni;
			if (q.insecure === '1') ob.tls.insecure = true;
			if (q.obfs) { ob.obfs = { type: q.obfs }; if (q['obfs-password']) ob.obfs.password = q['obfs-password']; }
		} else { return null; }
		return ob;
	} catch(e) { return null; }
}

function createSubSyncContent(section) {
	var o = section.option(form.DummyValue, '_sub_sync_ui');
	o.rawhtml = true;
	o.cfgvalue = function() {
		return Promise.all([
			fs.exec('/usr/bin/sub-sync', ['status']).then(function(r) {
				try { return JSON.parse((r.stdout || '{}').trim()); } catch(e) { return {}; }
			}).catch(function() { return {}; }),
			fs.exec('/usr/bin/sub-sync', ['info']).then(function(r) {
				try { return JSON.parse((r.stdout || '{}').trim()); } catch(e) { return {}; }
			}).catch(function() { return {}; }),
			fs.exec('/usr/bin/sub-sync', ['servers']).then(function(r) {
				try { return JSON.parse((r.stdout || '[]').trim()); } catch(e) { return []; }
			}).catch(function() { return []; }),
			fs.exec('/usr/bin/sub-sync', ['sections']).then(function(r) {
				try { return JSON.parse((r.stdout || '[]').trim()); } catch(e) { return []; }
			}).catch(function() { return []; }),
			fs.exec('/usr/bin/sub-sync', ['podkop-status']).then(function(r) {
				try { return JSON.parse((r.stdout || '{}').trim()); } catch(e) { return {}; }
			}).catch(function() { return {}; }),
			fs.exec('/usr/bin/sub-sync', ['list-subs']).then(function(r) {
				try { return JSON.parse((r.stdout || '[]').trim()); } catch(e) { return []; }
			}).catch(function() { return []; }),
			uci.load('podkop').then(function() { return true; }).catch(function() { return false; }),
			fs.exec('/usr/bin/sub-sync', ['singbox-info']).then(function(r) {
				try { return JSON.parse((r.stdout || '{}').trim()); } catch(e) { return {}; }
			}).catch(function() { return {}; })
		]).then(function(results) {
			var status = results[0];
			var info = results[1];
			var servers = results[2];
			var sections = results[3];
			var podkopStatus = results[4];
			var subscriptions = results[5];
			var uciLoaded = results[6];
			var singboxInfo = results[7];
			var hasXhttp = false;
			var versionStr = (singboxInfo.version || '') + ' ' + (singboxInfo.tags || '');
			if (singboxInfo.xhttp === true || /extended/i.test(versionStr) || /with_xhttp/i.test(versionStr) || /xhttp/i.test(versionStr)) {
				hasXhttp = true;
			}

			function pluralServers(n) {
				var m = n % 100;
				if (m >= 11 && m <= 19) return 'серверов';
				switch (n % 10) {
					case 1: return 'сервер';
					case 2: case 3: case 4: return 'сервера';
					default: return 'серверов';
				}
			}

			function loadedPrefix(n) {
				var m = n % 100;
				if (m >= 11 && m <= 19) return 'Загружено';
				switch (n % 10) {
					case 1: return 'Загружен';
					case 2: case 3: case 4: return 'Загружено';
					default: return 'Загружено';
				}
			}

			var activeLinksBySection = {};
			if (uciLoaded && sections.length > 0) {
				for (var ai = 0; ai < sections.length; ai++) {
					var aSec = sections[ai];
					var links = [];
					if (aSec.type === 'url') {
						var ps = uci.get('podkop', aSec.name, 'proxy_string');
						if (ps) links.push(ps.trim());
					} else if (aSec.type === 'outbound') {
						var oj = uci.get('podkop', aSec.name, 'outbound_json');
						if (oj) {
							try {
								var ojParsed = JSON.parse(oj);
								var ojAddr = (ojParsed.server || '').toLowerCase();
								var ojPort = String(ojParsed.server_port || 0);
								for (var fi2 = 0; fi2 < servers.length; fi2++) {
									if ((servers[fi2].addr || '').toLowerCase() === ojAddr && String(servers[fi2].port) === ojPort && servers[fi2].link) {
										links.push(servers[fi2].link.trim());
										break;
									}
								}
							} catch(e) {}
						}
					} else if (aSec.type === 'selector') {
						var sl = uci.get('podkop', aSec.name, 'selector_proxy_links') || [];
						if (!Array.isArray(sl)) sl = sl ? [sl] : [];
						for (var sli = 0; sli < sl.length; sli++) { if (sl[sli]) links.push(sl[sli].trim()); }
					} else {
						var ul = uci.get('podkop', aSec.name, 'urltest_proxy_links') || [];
						if (!Array.isArray(ul)) ul = ul ? [ul] : [];
						for (var uli = 0; uli < ul.length; uli++) { if (ul[uli]) links.push(ul[uli].trim()); }
					}
					activeLinksBySection[aSec.name] = links;
				}
			}

			function getCurrentActiveLinks() {
				var sec = globalSectionSelect ? globalSectionSelect.value : (sections.length > 0 ? sections[0].name : '');
				return activeLinksBySection[sec] || [];
			}

			var serverCount = info.servers_synced || servers.length || 0;
			var statusEl = E('span', {});
			switch (status.status) {
				case 'ok':
					statusEl.appendChild(E('strong', { 'style': 'color:#4caf50' }, loadedPrefix(serverCount) + ' ' + serverCount + ' ' + pluralServers(serverCount)));
					if (status.time) statusEl.appendChild(E('div', { 'style': 'color:#999;font-size:12px;margin-top:4px' }, 'обновлено ' + status.time));
					break;
				case 'error':
					statusEl.appendChild(E('strong', { 'style': 'color:#f44336' }, 'Ошибка: ' + (status.message || 'неизвестная')));
					break;
				case 'syncing':
					statusEl.appendChild(E('strong', { 'style': 'color:#2196f3' }, 'Идёт загрузка серверов...'));
					break;
				default:
					statusEl.appendChild(E('strong', { 'style': 'color:#ff9800' }, 'Серверы ещё не загружены'));
			}

			var pkStatus = (podkopStatus || {}).podkop || {};
			var sbStatus = (podkopStatus || {}).sing_box || {};

			var activeServerEl = E('div', { 'style': 'display:flex;align-items:center;gap:6px;flex-wrap:wrap' });
			if (uciLoaded && sections.length > 0) {
				var serverBadges = [];
				for (var si = 0; si < sections.length; si++) {
					var sec = sections[si];
					var secLinks = [];
					if (sec.type === 'url') {
						var ps2 = uci.get('podkop', sec.name, 'proxy_string');
						if (ps2) secLinks.push(ps2);
					} else if (sec.type === 'outbound') {
						var oj2 = uci.get('podkop', sec.name, 'outbound_json');
						if (oj2) {
							var ojName = '';
							try {
								var parsed = JSON.parse(oj2);
								ojName = parsed.tag ? decodeURIComponent(parsed.tag) : (parsed.server || '');
							} catch(e) { ojName = 'outbound'; }
							serverBadges.push({ section: sec.name, name: ojName || 'Outbound JSON' });
						}
					} else if (sec.type === 'selector') {
						var sl2 = uci.get('podkop', sec.name, 'selector_proxy_links') || [];
						if (!Array.isArray(sl2)) sl2 = sl2 ? [sl2] : [];
						secLinks = sl2;
					} else {
						var ul2 = uci.get('podkop', sec.name, 'urltest_proxy_links') || [];
						if (!Array.isArray(ul2)) ul2 = ul2 ? [ul2] : [];
						secLinks = ul2;
					}
					for (var li = 0; li < secLinks.length; li++) {
						var link = (secLinks[li] || '').trim();
						if (!link) continue;
						var srvName = extractAddrPortFromLink(link);
						for (var fi = 0; fi < servers.length; fi++) {
							if (servers[fi].link && servers[fi].link.trim() === link) {
								srvName = (servers[fi].name || '').trim() || srvName;
								break;
							}
						}
						serverBadges.push({ section: sec.name, name: srvName, link: link, type: sec.type });
					}
				}
				if (serverBadges.length === 0) {
					activeServerEl.appendChild(E('span', { 'style': 'color:#888;font-size:13px' }, 'не назначен'));
				}

				var badgesPerSection = {};
				for (var bci = 0; bci < serverBadges.length; bci++) {
					var bsec = serverBadges[bci].section;
					badgesPerSection[bsec] = (badgesPerSection[bsec] || 0) + 1;
				}

				function removeActiveServer(badge) {
					var sec3 = badge.section;
					var secType = badge.type;
					var link = badge.link;
					if (!link) return;
					var isMulti = (secType === 'selector' || secType === 'urltest');
					if (!isMulti) return;
					var listKey = secType === 'selector' ? 'selector_proxy_links' : 'urltest_proxy_links';
					var myLinks = (activeLinksBySection[sec3] || []).filter(function(l) { return l !== link; });
					activeLinksBySection[sec3] = myLinks;
					if (myLinks.length > 0) uci.set('podkop', sec3, listKey, myLinks);
					else uci.unset('podkop', sec3, listKey);
					syncAllBtnStates(sec3);
					showApplyNeeded();
					rebuildActiveServers();
				}

				function rebuildActiveServers() {
					while (activeServerEl.firstChild) activeServerEl.removeChild(activeServerEl.firstChild);
					var newBadges = [];
					for (var si2 = 0; si2 < sections.length; si2++) {
						var sec2 = sections[si2];
						if (sec2.type === 'url') {
							var ps3 = uci.get('podkop', sec2.name, 'proxy_string');
							if (ps3) {
								var nm3 = extractAddrPortFromLink(ps3);
								for (var fi3 = 0; fi3 < servers.length; fi3++) {
									if (servers[fi3].link && servers[fi3].link.trim() === ps3.trim()) { nm3 = (servers[fi3].name || '').trim() || nm3; break; }
								}
								newBadges.push({ section: sec2.name, name: nm3, link: '', type: 'url' });
							}
							continue;
						} else if (sec2.type === 'outbound') {
							var oj3 = uci.get('podkop', sec2.name, 'outbound_json');
							if (oj3) {
								var ojn = '';
								try { var p2 = JSON.parse(oj3); ojn = p2.tag ? decodeURIComponent(p2.tag) : (p2.server || ''); } catch(e) { ojn = 'outbound'; }
								newBadges.push({ section: sec2.name, name: ojn || 'Outbound JSON', link: '', type: 'outbound' });
							}
							continue;
						}
						var links2 = activeLinksBySection[sec2.name] || [];
						for (var li2 = 0; li2 < links2.length; li2++) {
							var lnk = links2[li2].trim();
							if (!lnk) continue;
							var nm = extractAddrPortFromLink(lnk);
							for (var fi2 = 0; fi2 < servers.length; fi2++) {
								if (servers[fi2].link && servers[fi2].link.trim() === lnk) { nm = (servers[fi2].name || '').trim() || nm; break; }
							}
							newBadges.push({ section: sec2.name, name: nm, link: lnk, type: sec2.type });
						}
					}
					var bps2 = {};
					for (var k = 0; k < newBadges.length; k++) bps2[newBadges[k].section] = (bps2[newBadges[k].section] || 0) + 1;
					if (newBadges.length === 0) {
						activeServerEl.appendChild(E('span', { 'style': 'color:#888;font-size:13px' }, 'не назначен'));
					}
					for (var m = 0; m < newBadges.length; m++) {
						activeServerEl.appendChild(createBadgeEl(newBadges[m], bps2));
					}
					var titleEl = activeServerEl.parentNode ? activeServerEl.parentNode.querySelector('.ss-card__title') : null;
					if (titleEl) titleEl.textContent = 'Активные серверы (' + newBadges.length + ')';
				}

				function createBadgeEl(badge, countMap) {
					var bc = [];
					if (sections.length > 1) {
						bc.push(E('span', { 'style': 'color:#888;font-size:11px;margin-right:4px' }, badge.section + ':'));
					}
					bc.push(E('span', { 'style': 'color:#4caf50;font-weight:bold' }, badge.name));
					var isMulti = (badge.type === 'selector' || badge.type === 'urltest');
					var isLastInSection = (countMap[badge.section] || 0) <= 1;
					if (isMulti && !isLastInSection) {
						var rmBtn = E('span', {
							'style': 'color:#ff6b6b;font-size:12px;cursor:pointer;margin-left:6px;font-weight:bold',
							'title': 'Убрать из секции',
							'click': function(ev) {
								ev.stopPropagation();
								removeActiveServer(badge);
							}
						}, '✕');
						rmBtn.addEventListener('mouseenter', function() { this.style.color = '#ff3333'; });
						rmBtn.addEventListener('mouseleave', function() { this.style.color = '#ff6b6b'; });
						bc.push(rmBtn);
					}
					return E('span', { 'class': 'ss-badge' }, bc);
				}

				for (var bi = 0; bi < serverBadges.length; bi++) {
					activeServerEl.appendChild(createBadgeEl(serverBadges[bi], badgesPerSection));
				}
			} else {
				activeServerEl.appendChild(E('span', { 'style': 'color:#888;font-size:13px' }, '—'));
			}

			var subsListEl = E('div', { 'style': 'margin-top:4px' });

			function rebuildSubsList(subs) {
				while (subsListEl.firstChild) subsListEl.removeChild(subsListEl.firstChild);
				if (subs.length === 0) {
					subsListEl.appendChild(E('em', { 'style': 'color:#888;font-size:13px' }, 'Нет подписок. Добавьте URL подписки выше.'));
					return;
				}
				for (var si2 = 0; si2 < subs.length; si2++) {
					(function(sub, idx) {
						var urlText = sub.url || '';
						var delBtn = E('button', {
							'class': 'cbi-button cbi-button-remove',
							'style': 'padding:1px 8px;font-size:11px;margin-left:8px',
							'click': function() {
								delBtn.disabled = true;
								fs.exec('/usr/bin/sub-sync', ['del-sub', String(sub.id)]).then(function(res) {
									var out = (res.stdout || '').trim();
									var lines = out.split('\n');
									var lastLine = lines[lines.length - 1].trim();
									if (lastLine === 'OK') {
										return fs.exec('/usr/bin/sub-sync', ['list-subs']).then(function(r) {
											try {
												var newSubs = JSON.parse((r.stdout || '[]').trim());
												subscriptions = newSubs;
												rebuildSubsList(newSubs);
											} catch(e) { rebuildSubsList([]); }
										}).then(function() {
											if (subscriptions.length === 0) {
												servers = [];
												rebuildServerTable([]);
												while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
												statusEl.appendChild(E('em', { 'style': 'color:#888' }, 'Нет подписок'));
												return;
											}
											while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
											statusEl.appendChild(E('strong', { 'style': 'color:#2196f3' }, 'Пересинхронизация...'));
											return fs.exec('/usr/bin/sub-sync', ['sync']).then(function() {
												return Promise.all([
													fs.exec('/usr/bin/sub-sync', ['status']).then(function(r2) {
														try { return JSON.parse((r2.stdout || '{}').trim()); } catch(e) { return {}; }
													}).catch(function() { return {}; }),
													fs.exec('/usr/bin/sub-sync', ['servers']).then(function(r2) {
														try { return JSON.parse((r2.stdout || '[]').trim()); } catch(e) { return []; }
													}).catch(function() { return []; })
												]);
											}).then(function(results) {
												var newStatus = results[0];
												var newServers = results[1];
												servers = newServers;
												rebuildServerTable(newServers);
												while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
												var cnt = newServers.length;
												statusEl.appendChild(E('strong', { 'style': 'color:#4caf50' }, loadedPrefix(cnt) + ' ' + cnt + ' ' + pluralServers(cnt)));
												if (newStatus.time) statusEl.appendChild(E('div', { 'style': 'color:#999;font-size:12px;margin-top:4px' }, 'обновлено ' + newStatus.time));
											});
										});
									} else {
										var errMsg = out;
										for (var dli = 0; dli < lines.length; dli++) {
											if (lines[dli].indexOf('ОШИБКА') !== -1) { errMsg = lines[dli].replace(/.*ОШИБКА:\s*/, ''); break; }
										}
										ui.addNotification(null, E('p', {}, errMsg), 'danger');
										delBtn.disabled = false;
									}
								}).catch(function(err) {
									ui.addNotification(null, E('p', {}, 'Ошибка: ' + (err.message || err)), 'danger');
									delBtn.disabled = false;
								});
							}
						}, '✕');
						var row = E('div', { 'class': 'ss-sub-row' }, [
							E('span', { 'style': 'color:#888;font-size:12px;min-width:24px' }, '#' + sub.id),
							E('code', { 'style': 'font-size:12px;word-break:break-all;flex:1', 'title': sub.url }, urlText),
							delBtn
						]);
						subsListEl.appendChild(row);
					})(subs[si2], si2);
				}
			}

			rebuildSubsList(subscriptions);

			var subInput = E('input', {
				'type': 'text',
				'class': 'cbi-input-text',
				'placeholder': 'https://example.com/sub/your-subscription-url',
				'style': 'flex:1;min-width:250px;margin-right:4px'
			});
			var subAddBtn = E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': function() {
					var val = subInput.value.trim();
					if (!val) {
						ui.addNotification(null, E('p', {}, 'Введите URL подписки'), 'warning');
						return;
					}
					if (val.indexOf('http') !== 0) {
						ui.addNotification(null, E('p', {}, 'URL должен начинаться с http:// или https://'), 'warning');
						return;
					}
					subAddBtn.disabled = true;
					subAddBtn.textContent = 'Добавление...';
					fs.exec('/usr/bin/sub-sync', ['add-sub', val]).then(function(res) {
						var out = (res.stdout || '').trim();
						var lines = out.split('\n');
						var lastLine = lines[lines.length - 1].trim();
						if (lastLine === 'OK') {
							subInput.value = '';
							return fs.exec('/usr/bin/sub-sync', ['list-subs']).then(function(r) {
								try {
									var newSubs = JSON.parse((r.stdout || '[]').trim());
									subscriptions = newSubs;
									rebuildSubsList(newSubs);
								} catch(e) {}
							});
						} else {
							var errMsg = out;
							for (var li = 0; li < lines.length; li++) {
								if (lines[li].indexOf('ОШИБКА') !== -1) { errMsg = lines[li].replace(/.*ОШИБКА:\s*/, ''); break; }
							}
							ui.addNotification(null, E('p', {}, errMsg), 'danger');
						}
						subAddBtn.disabled = false;
						subAddBtn.textContent = 'Добавить';
					}).catch(function(err) {
						ui.addNotification(null, E('p', {}, 'Ошибка: ' + (err.message || err)), 'danger');
						subAddBtn.disabled = false;
						subAddBtn.textContent = 'Добавить';
					});
				}
			}, 'Добавить');

			var syncCooldown = 0;
			var syncBtn = E('button', {
				'class': 'cbi-button',
				'style': 'padding:2px 12px',
				'click': function() {
					if (syncCooldown > 0) return;
					if (subscriptions.length === 0) {
						ui.addNotification(null, E('p', {}, 'Сначала добавьте хотя бы одну подписку'), 'warning');
						return;
					}
					syncBtn.disabled = true;
					syncBtn.textContent = 'Загрузка...';
					while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
					statusEl.appendChild(E('strong', { 'style': 'color:#2196f3' }, 'Идёт загрузка серверов...'));
					var oldServerAddrs = {};
					for (var oi = 0; oi < servers.length; oi++) {
						oldServerAddrs[(servers[oi].addr || '') + ':' + (servers[oi].port || '')] = true;
					}
					var oldCount = servers.length;
					fs.exec('/usr/bin/sub-sync', ['sync']).then(function(res) {
						return Promise.all([
							fs.exec('/usr/bin/sub-sync', ['status']).then(function(r) {
								try { return JSON.parse((r.stdout || '{}').trim()); } catch(e) { return {}; }
							}).catch(function() { return {}; }),
							fs.exec('/usr/bin/sub-sync', ['info']).then(function(r) {
								try { return JSON.parse((r.stdout || '{}').trim()); } catch(e) { return {}; }
							}).catch(function() { return {}; }),
							fs.exec('/usr/bin/sub-sync', ['servers']).then(function(r) {
								try { return JSON.parse((r.stdout || '[]').trim()); } catch(e) { return []; }
							}).catch(function() { return []; })
						]);
					}).then(function(results) {
						var newStatus = results[0];
						var newInfo = results[1];
						var newServers = results[2];
						var cnt = newInfo.servers_synced || newServers.length || 0;
						while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
						if (newStatus.status === 'ok') {
							statusEl.appendChild(E('strong', { 'style': 'color:#4caf50' }, loadedPrefix(cnt) + ' ' + cnt + ' ' + pluralServers(cnt)));
							if (newStatus.time) statusEl.appendChild(E('div', { 'style': 'color:#999;font-size:12px;margin-top:4px' }, 'обновлено ' + newStatus.time));
						} else if (newStatus.status === 'error') {
							statusEl.appendChild(E('strong', { 'style': 'color:#f44336' }, 'Ошибка: ' + (newStatus.message || 'неизвестная')));
						} else {
							statusEl.appendChild(E('strong', { 'style': 'color:#4caf50' }, loadedPrefix(cnt) + ' ' + cnt + ' ' + pluralServers(cnt)));
						}
						if (oldCount > 0 && newServers.length > 0) {
							var newServerAddrs = {};
							for (var ni = 0; ni < newServers.length; ni++) {
								newServerAddrs[(newServers[ni].addr || '') + ':' + (newServers[ni].port || '')] = true;
							}
							var added = 0, removed = 0;
							for (var nk in newServerAddrs) { if (!oldServerAddrs[nk]) added++; }
							for (var ok2 in oldServerAddrs) { if (!newServerAddrs[ok2]) removed++; }

						}
						servers = newServers;
						rebuildServerTable(newServers);
						syncCooldown = 30;
						syncBtn.disabled = true;
						var cdTimer = window.setInterval(function() {
							syncCooldown--;
							if (syncCooldown > 0) {
								syncBtn.textContent = 'Загрузить серверы (' + syncCooldown + 'с)';
							} else {
								syncBtn.textContent = 'Загрузить серверы';
								syncBtn.disabled = false;
								window.clearInterval(cdTimer);
							}
						}, 1000);
					}).catch(function(err) {
						while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
						statusEl.appendChild(E('strong', { 'style': 'color:#f44336' }, 'Ошибка: ' + (err.message || err)));
						syncBtn.disabled = false;
						syncBtn.textContent = 'Загрузить серверы';
					});
				}
			}, 'Загрузить серверы');

			var intervalSelect = E('select', { 'class': 'cbi-input-select', 'style': 'margin-right:8px' });
			var intervals = [
				{ val: '0', label: 'Выключено' },
				{ val: '1', label: 'Каждый 1 час' },
				{ val: '3', label: 'Каждые 3 часа' },
				{ val: '6', label: 'Каждые 6 часов' },
				{ val: '12', label: 'Каждые 12 часов' },
				{ val: '24', label: 'Каждые 24 часа' }
			];
			var currentInterval = String(info.interval_hours || '0');
			for (var ii = 0; ii < intervals.length; ii++) {
				var opt = E('option', { value: intervals[ii].val }, intervals[ii].label);
				if (intervals[ii].val === currentInterval) opt.selected = true;
				intervalSelect.appendChild(opt);
			}
			var intervalSaveBtn = E('button', {
				'class': 'cbi-button',
				'style': 'padding:2px 8px;font-size:12px',
				'click': function() {
					var val = intervalSelect.value;
					intervalSaveBtn.disabled = true;
					if (val === '0') {
						fs.exec('/usr/bin/sub-sync', ['interval-off']).then(function() {
							intervalSaveBtn.disabled = false;
						}).catch(function() { intervalSaveBtn.disabled = false; });
					} else {
						fs.exec('/usr/bin/sub-sync', ['interval', val]).then(function() {
							intervalSaveBtn.disabled = false;
						}).catch(function() { intervalSaveBtn.disabled = false; });
					}
				}
			}, 'Применить');

			injectStyles();

			var wStatus = E('div', { 'class': 'ss-widget' }, [
				E('div', { 'class': 'ss-widget__title' }, 'Статус'),
				E('div', { 'class': 'ss-widget__value' }, [statusEl])
			]);

			var wConnection = E('div', { 'class': 'ss-widget' }, [
				E('div', { 'class': 'ss-widget__title' }, 'Сервисы'),
				E('div', { 'class': 'ss-widget__value' }, [
					E('div', { 'class': 'ss-row' }, [
						E('span', { 'class': 'ss-dot ' + (sbStatus.running ? 'ss-dot--ok' : 'ss-dot--err') }, '\u25cf'),
						E('span', { 'class': 'ss-label' }, 'sing-box: '),
						E('span', { 'class': 'ss-val ' + (sbStatus.running ? 'ss-val--ok' : 'ss-val--err') }, sbStatus.running ? 'работает' : 'остановлен')
					]),
					E('div', { 'class': 'ss-row', 'style': 'margin-top:4px' }, [
						E('span', { 'class': 'ss-dot ' + (pkStatus.enabled ? 'ss-dot--ok' : 'ss-dot--warn') }, '\u25cf'),
						E('span', { 'class': 'ss-label' }, 'Podkop: '),
						E('span', { 'class': 'ss-val ' + (pkStatus.enabled ? 'ss-val--ok' : 'ss-val--warn') }, pkStatus.enabled ? 'включен' : 'выключен')
					])
				])
			]);

			var sbVerChildren = [];
			if (singboxInfo.version) {
				sbVerChildren.push(E('div', { 'class': 'ss-row' }, [
					E('span', { 'class': 'ss-label' }, 'Версия: '),
					E('span', { 'class': 'ss-val' }, singboxInfo.version)
				]));
				sbVerChildren.push(E('div', { 'class': 'ss-row', 'style': 'margin-top:4px' }, [
					E('span', { 'class': 'ss-dot ' + (hasXhttp ? 'ss-dot--ok' : 'ss-dot--warn') }, '\u25cf'),
					E('span', { 'class': 'ss-val ' + (hasXhttp ? 'ss-val--ok' : 'ss-val--warn') }, hasXhttp ? 'xHTTP поддерживается' : 'xHTTP не поддерживается')
				]));
			} else {
				sbVerChildren.push(E('span', { 'class': 'ss-label' }, 'не определена'));
			}
			var wSingbox = E('div', { 'class': 'ss-widget' }, [
				E('div', { 'class': 'ss-widget__title' }, 'sing-box'),
				E('div', { 'class': 'ss-widget__value' }, sbVerChildren)
			]);

			var activeServerCount = 0;
			for (var ci = 0; ci < activeServerEl.childNodes.length; ci++) {
				if (activeServerEl.childNodes[ci].classList && activeServerEl.childNodes[ci].classList.contains('ss-badge')) activeServerCount++;
			}

			var wServerCard = E('div', { 'class': 'ss-card', 'style': 'margin-top:10px' }, [
				E('div', { 'style': 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px' }, [
					E('span', { 'class': 'ss-card__title' }, 'Активные серверы (' + activeServerCount + ')')
				]),
				activeServerEl
			]);

			var widgetsRow = E('div', { 'class': 'ss-widgets' }, [wStatus, wConnection, wSingbox]);

			var subsCard = E('div', { 'class': 'ss-card' }, [
				E('div', { 'class': 'ss-card__header' }, [
					E('div', { 'class': 'ss-card__title' }, 'Подписки (' + subscriptions.length + ')')
				]),
				E('div', { 'style': 'display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:8px' }, [subInput, subAddBtn]),
				subsListEl,
				E('div', { 'class': 'ss-controls' }, [
					E('span', { 'class': 'ss-label' }, 'Автообновление:'),
					intervalSelect, intervalSaveBtn,
					syncBtn
				])
			]);

			var LIMIT = 20;

			var globalSectionSelect = E('select', { 'class': 'cbi-input-select ss-select', 'style': 'margin-right:8px' });
			for (var gi = 0; gi < sections.length; gi++) {
				var gsec = sections[gi];
				var glabel = gsec.name;
				globalSectionSelect.appendChild(E('option', { value: gsec.name }, glabel));
			}
			if (sections.length === 0) {
				globalSectionSelect.appendChild(E('option', { value: '' }, 'Нет секций'));
				globalSectionSelect.disabled = true;
			}

			var sectionTypeSelect = E('select', { 'class': 'cbi-input-select ss-select' });
			var typeOpts = [
				{ val: 'url', label: 'URL' },
				{ val: 'outbound', label: 'Outbound JSON' },
				{ val: 'selector', label: 'Selector' },
				{ val: 'urltest', label: 'URL Test' }
			];
			for (var ti = 0; ti < typeOpts.length; ti++) {
				sectionTypeSelect.appendChild(E('option', { value: typeOpts[ti].val }, typeOpts[ti].label));
			}
			function updateTypeSelect() {
				var sn = globalSectionSelect.value;
				for (var sti = 0; sti < sections.length; sti++) {
					if (sections[sti].name === sn) { sectionTypeSelect.value = sections[sti].type || 'url'; break; }
				}
			}
			if (sections.length > 0) updateTypeSelect();

			var headerRow = E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th', 'style': 'width:40px' }, '#'),
				E('div', { 'class': 'th', 'style': 'width:70px' }, 'Протокол'),
				E('div', { 'class': 'th', 'style': 'width:120px' }, 'Транспорт'),
				E('div', { 'class': 'th' }, 'Имя'),
				E('div', { 'class': 'th', 'style': 'width:200px' }, 'Адрес'),
				E('div', { 'class': 'th', 'style': 'width:70px;text-align:center' }, 'Пинг'),
				E('div', { 'class': 'th', 'style': 'width:160px;text-align:right' }, '')
			]);
			var sRows = [headerRow];

			var serverTable;
			function resetAllSelectBtns() {
				if (!serverTable) return;
				var allBtns = serverTable.querySelectorAll('button[data-selected="1"]');
				for (var bi2 = 0; bi2 < allBtns.length; bi2++) {
					allBtns[bi2].dataset.selected = '0';
					allBtns[bi2].dataset.link = '';
					allBtns[bi2].textContent = 'Выбрать';
					allBtns[bi2].className = 'cbi-button cbi-button-action';
					allBtns[bi2].style.cssText = 'padding:2px 6px;font-size:11px';
					allBtns[bi2].disabled = false;
				}
			}

			function updateXhttpButtons() {
				if (!serverTable) return;
				var mode = sectionTypeSelect ? sectionTypeSelect.value : 'url';
				var xhttpBtns = serverTable.querySelectorAll('button[data-xhttp="1"]');
				for (var xbi = 0; xbi < xhttpBtns.length; xbi++) {
					var xb = xhttpBtns[xbi];
					if (xb.dataset.selected === '1') continue;
					if (mode !== 'outbound') {
						xb.disabled = true;
						xb.className = 'cbi-button cbi-button-neutral';
						xb.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px;opacity:0.5;cursor:not-allowed';
						xb.title = 'xHTTP серверы доступны только в режиме Outbound JSON';
						xb.textContent = 'xHTTP';
					} else {
						xb.disabled = false;
						xb.className = 'cbi-button cbi-button-action';
						xb.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px';
						xb.title = '';
						xb.textContent = 'Выбрать';
					}
				}
			}

			globalSectionSelect.addEventListener('change', function() {
	
				updateTypeSelect();
				var sec3 = globalSectionSelect.value;
				if (sec3) syncAllBtnStates(sec3);
				updateXhttpButtons();
			});
			sectionTypeSelect.addEventListener('change', function() {

				updateXhttpButtons();
			});

			function sortTableByPing() {
				if (!serverTable) return;
				var rows = [];
				var header = null;
				for (var i = 0; i < serverTable.childNodes.length; i++) {
					var r = serverTable.childNodes[i];
					if (r.classList && r.classList.contains('tr') && r.querySelector('.th')) {
						header = r;
					} else if (r.classList && r.classList.contains('tr')) {
						rows.push(r);
					}
				}
				rows.sort(function(a, b) {
					var pa = parseInt(a.getAttribute('data-ping') || '999999');
					var pb = parseInt(b.getAttribute('data-ping') || '999999');
					if (pa === -1 && pb === -1) return 0;
					if (pa === -1) return 1;
					if (pb === -1) return 1;
					return pa - pb;
				});
				while (serverTable.firstChild) serverTable.removeChild(serverTable.firstChild);
				if (header) serverTable.appendChild(header);
				for (var j = 0; j < rows.length; j++) {
					rows[j].className = 'tr ' + (j % 2 === 0 ? 'cbi-rowstyle-1' : 'cbi-rowstyle-2');
					serverTable.appendChild(rows[j]);
					var numCell = rows[j].querySelector('.td[data-title="#"]');
					if (numCell) numCell.textContent = String(j + 1);
				}
			}

			function createPingCell(serverId) {
				var pingSpan = E('span', { 'style': 'font-size:11px;cursor:pointer;color:#999', 'title': 'Нажмите для проверки' }, '—');
				var pinging = false;
				pingSpan.addEventListener('click', function() {
					if (pinging) return;
					pinging = true;
					pingSpan.textContent = '...';
					pingSpan.style.color = '#999';
					fs.exec('/usr/bin/sub-sync', ['ping', String(serverId)]).then(function(res) {
						try {
							var data = JSON.parse((res.stdout || '{}').trim());
							if (data.status === 'ok') {
								pingSpan.textContent = data.ms + 'мс';
								pingSpan.style.color = data.ms < 200 ? '#4caf50' : data.ms < 500 ? '#ff9800' : '#f44336';
								pingSpan.title = data.addr + ':' + data.port + ' — ' + data.ms + 'мс';
								var row = pingSpan.closest('.tr');
								if (row) row.setAttribute('data-ping', String(data.ms));
							} else {
								pingSpan.textContent = '✕';
								pingSpan.style.color = '#f44336';
								pingSpan.title = 'Недоступен';
								var row = pingSpan.closest('.tr');
								if (row) row.setAttribute('data-ping', '-1');
							}
						} catch(e) {
							pingSpan.textContent = '✕';
							pingSpan.style.color = '#f44336';
							var row = pingSpan.closest('.tr');
							if (row) row.setAttribute('data-ping', '-1');
						}
						pinging = false;
						sortTableByPing();
					}).catch(function() {
						pingSpan.textContent = '✕';
						pingSpan.style.color = '#f44336';
						var row = pingSpan.closest('.tr');
						if (row) row.setAttribute('data-ping', '-1');
						pinging = false;
						sortTableByPing();
					});
				});
				return pingSpan;
			}

			function formatTransport(s) {
				var t = (s.type || '').toLowerCase();
				var sec = (s.security || '').toLowerCase();
				var proto = (s.proto || '').toLowerCase();
				var parts = [];
				if (proto === 'ss' && t) {
					parts.push(t);
				} else if (t) {
					parts.push(t === 'xhttp' ? 'xHTTP' : t === 'quic' ? 'QUIC' : t.toUpperCase());
				}
				if (sec && sec !== 'none') {
					parts.push(sec === 'reality' ? 'Reality' : sec === 'tls' ? 'TLS' : sec);
				}
				return parts.length > 0 ? parts.join(' / ') : '—';
			}

			var saveTimer = null;

			function debouncedSave() {
				if (saveTimer) clearTimeout(saveTimer);
				saveTimer = setTimeout(function() {
					fs.exec('/bin/rm', ['-f', '/tmp/.uci/podkop']).then(function() {
						uci.unload('podkop');
						return uci.load('podkop');
					}).then(function() {
						for (var di = 0; di < sections.length; di++) {
							var ds = sections[di];
							if (ds.type !== 'selector' && ds.type !== 'urltest') continue;
							var dLinks = activeLinksBySection[ds.name] || [];
							var dKey = ds.type === 'selector' ? 'selector_proxy_links' : 'urltest_proxy_links';
							if (dLinks.length > 0) {
								uci.set('podkop', ds.name, 'proxy_config_type', ds.type);
								uci.set('podkop', ds.name, dKey, dLinks);
							} else {
								uci.unset('podkop', ds.name, dKey);
							}
						}
						return uci.save();
					}).then(function() {
						if (typeof L !== 'undefined' && L.ui && L.ui.changes) {
							L.ui.changes.renderChangeIndicator();
						}
					}).catch(function(err) {
					});
				}, 400);
			}

			function markBtnSelected(btn, link2) {
				btn.dataset.selected = '1';
				btn.dataset.link = link2;
				btn.textContent = 'Выбрано';
				btn.className = 'cbi-button cbi-button-neutral';
				btn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px;border-color:#4caf50;color:#4caf50';
				btn.disabled = false;
			}

			function markBtnDeselected(btn) {
				btn.dataset.selected = '0';
				btn.dataset.link = '';
				btn.textContent = 'Выбрать';
				btn.className = 'cbi-button cbi-button-action';
				btn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px';
				btn.disabled = false;
			}

			function showApplyNeeded() {
				debouncedSave();
			}

			function syncAllBtnStates(sec3) {
				if (!serverTable) return;
				var curLinks = activeLinksBySection[sec3] || [];

				var rows = serverTable.querySelectorAll('.tr[data-link]');
				for (var ri2 = 0; ri2 < rows.length; ri2++) {
					var row = rows[ri2];
					var rowLink = row.dataset.link;
					var isAct = rowLink && curLinks.indexOf(rowLink) >= 0;
					row.style.borderLeft = isAct ? '3px solid #4caf50' : '';
					var badge2 = row.querySelector('.ss-active-badge');
					if (isAct && !badge2) {
						var nameCell = row.querySelector('.td[data-title="Имя"]');
						if (nameCell) {
							var b = document.createElement('span');
							b.className = 'ss-active-badge';
							b.style.cssText = 'color:#4caf50;font-size:10px;margin-left:6px;font-weight:bold';
							b.textContent = '✔ используется';
							nameCell.appendChild(b);
						}
					} else if (!isAct && badge2) {
						badge2.remove();
					}
					var btn2 = row.querySelector('button[data-idx]');
					if (!btn2) continue;
					if (btn2.dataset.xhttp === '1' && btn2.title && btn2.title.indexOf('xHTTP') >= 0) continue;
					if (isAct) {
						markBtnSelected(btn2, rowLink);
					} else if (btn2.dataset.selected === '1') {
						markBtnDeselected(btn2);
					}
				}
			}

			function createServerRow(s, idx, isActive) {
				var sname = (s.name || '').trim();
				if (!sname) sname = s.addr || '—';
				var isXhttp = (s.type || '').toLowerCase() === 'xhttp' || (s.type || '').toLowerCase() === 'splithttp';
				var xhttpNoSupport = isXhttp && !hasXhttp;

				var selectBtn = E('button', {
					'class': 'cbi-button cbi-button-action',
					'style': 'padding:2px 6px;font-size:11px;min-width:62px',
					'data-selected': '0', 'data-link': '', 'data-idx': String(s.id || idx), 'data-xhttp': isXhttp ? '1' : '0',
					'click': function(ev) {
						var btn = ev.currentTarget || ev.target;
						if (btn.disabled) return;
						var sec3 = globalSectionSelect.value;
						if (!sec3) { ui.addNotification(null, E('p', {}, 'Выберите секцию'), 'danger'); return; }
						var secType = sectionTypeSelect ? sectionTypeSelect.value : 'url';
						var isMulti = (secType === 'selector' || secType === 'urltest');
						var listKey = secType === 'selector' ? 'selector_proxy_links' : 'urltest_proxy_links';


						if (btn.dataset.selected === '1') {
							var savedLink = btn.dataset.link;

							btn.disabled = true; btn.textContent = '...';
							if (secType === 'outbound') {
								uci.unset('podkop', sec3, 'outbound_json');
								activeLinksBySection[sec3] = [];
							} else if (secType === 'url') {
								uci.unset('podkop', sec3, 'proxy_string');
								activeLinksBySection[sec3] = [];
							} else {
								var myLinks = (activeLinksBySection[sec3] || []).filter(function(l) { return l !== savedLink; });
								activeLinksBySection[sec3] = myLinks;
								if (myLinks.length > 0) uci.set('podkop', sec3, listKey, myLinks);
								else uci.unset('podkop', sec3, listKey);

							}
							if (isMulti) {
								markBtnDeselected(btn);
								syncAllBtnStates(sec3);
								showApplyNeeded();

							} else {
								uci.save().then(function() {
									markBtnDeselected(btn);
									syncAllBtnStates(sec3);

									return uci.apply();
								}).catch(function(err) {
									ui.addNotification(null, E('p', {}, 'Ошибка сохранения: ' + (err.message || err)), 'danger');
									btn.disabled = false; btn.textContent = 'Выбрано';
								});
							}
							return;
						}

						btn.disabled = true; btn.textContent = '...';

						fs.exec('/usr/bin/sub-sync', ['link', String(s.id || idx)]).then(function(res) {
							var link2 = (res.stdout || '').trim();

							if (!link2 || link2.indexOf('://') === -1) {
								ui.addNotification(null, E('p', {}, 'Не удалось получить ссылку сервера'), 'danger');
								btn.disabled = false; btn.textContent = 'Выбрать'; return;
							}
							uci.set('podkop', sec3, 'proxy_config_type', secType);
							if (secType === 'outbound') {
								var outbound = linkToOutbound(link2);
								if (!outbound) {
									ui.addNotification(null, E('p', {}, 'Не удалось сгенерировать Outbound JSON'), 'danger');
									btn.disabled = false; btn.textContent = 'Выбрать'; return;
								}
								resetAllSelectBtns();
								uci.set('podkop', sec3, 'outbound_json', JSON.stringify(outbound, null, 2));
								uci.unset('podkop', sec3, 'proxy_string');
								activeLinksBySection[sec3] = [link2];
							} else if (secType === 'url') {
								resetAllSelectBtns();
								uci.set('podkop', sec3, 'proxy_string', link2);
								uci.unset('podkop', sec3, 'outbound_json');
								activeLinksBySection[sec3] = [link2];
							} else {
								var myLinks = (activeLinksBySection[sec3] || []).slice();
								if (myLinks.indexOf(link2) === -1) {
									myLinks.push(link2);
								}
								activeLinksBySection[sec3] = myLinks;
								uci.set('podkop', sec3, listKey, myLinks);

							}
							if (isMulti) {
								markBtnSelected(btn, link2);
								syncAllBtnStates(sec3);
								showApplyNeeded();
							} else {
								return uci.save().then(function() {
									markBtnSelected(btn, link2);
									syncAllBtnStates(sec3);

									return uci.apply();
								});
							}
						}).catch(function(err) {
	
							ui.addNotification(null, E('p', {}, 'Ошибка: ' + (err.message || err)), 'danger');
							btn.disabled = false; btn.textContent = 'Выбрать';
						});
					}
				}, 'Выбрать');

				if (xhttpNoSupport) {
					selectBtn.disabled = true;
					selectBtn.className = 'cbi-button cbi-button-neutral';
					selectBtn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px;opacity:0.5;cursor:not-allowed';
					selectBtn.title = 'Требуется sing-box extended для xHTTP';
					selectBtn.textContent = 'xHTTP ⚠';
				} else if (isXhttp) {
					var curMode = sectionTypeSelect ? sectionTypeSelect.value : 'url';
					if (curMode !== 'outbound') {
						selectBtn.disabled = true;
						selectBtn.className = 'cbi-button cbi-button-neutral';
						selectBtn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px;opacity:0.5;cursor:not-allowed';
						selectBtn.title = 'xHTTP серверы доступны только в режиме Outbound JSON';
						selectBtn.textContent = 'xHTTP';
					}
				}


				if (isActive && !xhttpNoSupport) {
					markBtnSelected(selectBtn, s.link || '');
				}

				var copyBtn = E('button', {
					'class': 'cbi-button cbi-button-action',
					'style': 'padding:2px 6px;font-size:11px',
					'click': function(ev) {
						ev.target.disabled = true;
						fs.exec('/usr/bin/sub-sync', ['link', String(s.id || idx)]).then(function(res) {
							var link3 = (res.stdout || '').trim();
							if (link3 && link3.indexOf('://') !== -1) {
								if (navigator.clipboard) { navigator.clipboard.writeText(link3); }
								else { var ta = document.createElement('textarea'); ta.value = link3; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
								ev.target.textContent = '✓';
								window.setTimeout(function() { ev.target.textContent = 'Копировать'; }, 1500);
							} else { ui.addNotification(null, E('p', {}, 'Не удалось получить ссылку'), 'danger'); }
							ev.target.disabled = false;
						}).catch(function() { ev.target.disabled = false; });
					}
				}, 'Копировать');

				var nameChildren = [document.createTextNode(sname)];
				if (isActive) {
					nameChildren.push(E('span', { 'class': 'ss-active-badge', 'style': 'color:#4caf50;font-size:10px;margin-left:6px;font-weight:bold' }, '✔ используется'));
				}

				return E('div', {
					'class': 'tr' + (idx % 2 === 0 ? ' cbi-rowstyle-1' : ' cbi-rowstyle-2'),
					'style': (idx >= LIMIT ? 'display:none' : '') + (isActive ? ';border-left:3px solid #4caf50' : ''),
					'data-link': s.link || ''
				}, [
					E('div', { 'class': 'td', 'data-title': '#' }, String(s.id || idx + 1)),
					E('div', { 'class': 'td', 'data-title': 'Протокол' }, (s.proto || '?').toUpperCase()),
					E('div', { 'class': 'td', 'data-title': 'Транспорт', 'style': 'font-size:12px' }, formatTransport(s)),
					E('div', { 'class': 'td', 'data-title': 'Имя' }, nameChildren),
					E('div', { 'class': 'td', 'data-title': 'Адрес', 'style': 'font-family:monospace;font-size:12px' },
						(s.addr || '') + ':' + (s.port || '')),
					E('div', { 'class': 'td', 'data-title': 'Пинг', 'style': 'text-align:center' }, [createPingCell(s.id || (idx + 1))]),
					E('div', { 'class': 'td', 'style': 'text-align:right' }, E('div', { 'style': 'display:flex;gap:4px;justify-content:flex-end' }, [selectBtn, copyBtn]))
				]);
			}

			var currentActiveLinks = getCurrentActiveLinks();
			for (var ri = 0; ri < servers.length; ri++) {
				var isActive = servers[ri].link ? currentActiveLinks.indexOf(servers[ri].link.trim()) >= 0 : false;
				sRows.push(createServerRow(servers[ri], ri, isActive));
			}

			serverTable = E('div', { 'class': 'table' }, sRows);
			var serversHeading = E('h3', {}, 'Серверы (' + servers.length + ')');

			var pingAllBtn = E('button', {
				'class': 'cbi-button',
				'style': 'padding:2px 10px;font-size:12px;background:transparent;color:#ff0000;border:1px solid #ff0000',
				'click': function() {
					if (pingAllBtn.disabled) return;
					pingAllBtn.disabled = true;
					pingAllBtn.textContent = 'Проверка...';
					var pingCells = serverTable.querySelectorAll('.td[data-title="Пинг"] span');
					var idx2 = 0;
					function pingNext() {
						if (idx2 >= pingCells.length) {
							pingAllBtn.disabled = false;
							pingAllBtn.textContent = 'Ping Test Server';
							return;
						}
						pingCells[idx2].click();
						idx2++;
						window.setTimeout(pingNext, 300);
					}
					pingNext();
				}
			}, 'Ping Test Server');

			var toggleBtnContainer = E('span', {});
			if (servers.length > LIMIT) {
				toggleBtnContainer.appendChild(E('button', {
					'class': 'cbi-button cbi-button-neutral',
					'style': 'margin-top:10px',
					'data-expanded': '0',
					'click': function(ev) {
						var rows = serverTable.querySelectorAll('.tr:not(.table-titles)');
						var exp = ev.target.dataset.expanded === '1';
						for (var hi = LIMIT; hi < rows.length; hi++) { rows[hi].style.display = exp ? 'none' : ''; }
						ev.target.dataset.expanded = exp ? '0' : '1';
						ev.target.textContent = exp ? 'Показать все (' + rows.length + ')' : 'Свернуть';
					}
				}, 'Показать все (' + servers.length + ')'));
			}

			function rebuildServerTable(newServers) {
				while (serverTable.firstChild) serverTable.removeChild(serverTable.firstChild);
				serverTable.appendChild(headerRow);
				var curActive = getCurrentActiveLinks();
				for (var ni = 0; ni < newServers.length; ni++) {
					var nsActive = newServers[ni].link ? curActive.indexOf(newServers[ni].link.trim()) >= 0 : false;
					serverTable.appendChild(createServerRow(newServers[ni], ni, nsActive));
				}
				serversHeading.textContent = 'Серверы (' + newServers.length + ')';
				if (tableContainer) tableContainer.style.display = newServers.length > 0 ? '' : 'none';
				if (emptyMsg) emptyMsg.style.display = newServers.length > 0 ? 'none' : '';
				while (toggleBtnContainer.firstChild) toggleBtnContainer.removeChild(toggleBtnContainer.firstChild);
				if (newServers.length > LIMIT) {
					toggleBtnContainer.appendChild(E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'style': 'margin-top:10px',
						'data-expanded': '0',
						'click': function(ev) {
							var rows = serverTable.querySelectorAll('.tr:not(.table-titles)');
							var exp = ev.target.dataset.expanded === '1';
							for (var hi = LIMIT; hi < rows.length; hi++) { rows[hi].style.display = exp ? 'none' : ''; }
							ev.target.dataset.expanded = exp ? '0' : '1';
							ev.target.textContent = exp ? 'Показать все (' + newServers.length + ')' : 'Свернуть';
						}
					}, 'Показать все (' + newServers.length + ')'));
				}
			}

			var emptyMsg = E('em', { 'style': servers.length > 0 ? 'display:none' : '', 'class': 'ss-label' }, 'Серверы ещё не загружены. Добавьте подписку и нажмите "Загрузить серверы".');
			var tableContainer = E('div', { 'style': servers.length > 0 ? '' : 'display:none' }, [
				E('div', { 'class': 'ss-table-wrap' }, [serverTable]), toggleBtnContainer
			]);
			var serversCard = E('div', { 'class': 'ss-card' }, [
				E('div', { 'class': 'ss-card__header' }, [
					serversHeading,
				E('div', { 'style': 'display:flex;align-items:center;gap:8px' }, [
						pingAllBtn
					])
				]),
				E('div', { 'class': 'ss-toolbar' }, [
					E('span', { 'class': 'ss-label' }, 'Секция:'),
					globalSectionSelect,
					E('span', { 'class': 'ss-label' }, 'Режим:'),
					sectionTypeSelect
				]),
				tableContainer, emptyMsg
			]);



			var ssPage = E('div', { 'class': 'ss-page' }, [
				widgetsRow, wServerCard, subsCard, serversCard,
				E('div', { 'style': 'text-align:right;margin-top:8px' }, [
					E('span', { 'class': 'ss-version' }, [
						'by ',
						E('a', {
							href: 'https://t.me/kzolotarev95',
							target: '_blank',
							style: 'color:inherit;text-decoration:none;'
						}, 'kzolotarev95'),
						' ' + SUB_SYNC_VERSION
					])
				])
			]);

			return ssPage;

		}).catch(function(err) {
			return E('div', { 'class': 'cbi-section' }, [
				E('p', { 'style': 'color:#f44336' }, 'Ошибка загрузки: ' + (err.message || err)),
				E('p', {}, 'Проверьте установку: /usr/bin/sub-sync status')
			]);
		});
	};
}

function createMonitorContent(section) {
	var o = section.option(form.DummyValue, '_sub_monitor_ui');
	o.rawhtml = true;
	o.cfgvalue = function() {
		var connStatsEl = E('div', { 'style': 'margin-bottom:8px;font-size:13px;color:#888' }, 'Загрузка...');
		var connTableBody = E('div', { 'class': 'table' });
		var connTimer = null;
		var connPrev = {};
		var connLastRefresh = 0;

		function refreshConnections() {
			return fs.exec('/usr/bin/sub-sync', ['connections']).then(function(r) {
				try {
					var data = JSON.parse((r.stdout || '{}').trim());
					if (data.error) {
						while (connStatsEl.firstChild) connStatsEl.removeChild(connStatsEl.firstChild);
						connStatsEl.appendChild(document.createTextNode('Ошибка: ' + data.error));
						return;
					}
					var conns = data.connections || [];
					var now = Date.now();
					var elapsed = connLastRefresh > 0 ? (now - connLastRefresh) / 1000 : 0;
					connLastRefresh = now;

					var newPrev = {};
					var totalDlSpeed = 0, totalUlSpeed = 0;
					for (var ci2 = 0; ci2 < conns.length; ci2++) {
						var cc = conns[ci2];
						var prev = connPrev[cc.id];
						cc._dlSpeed = 0;
						cc._ulSpeed = 0;
						if (prev && elapsed > 0) {
							cc._dlSpeed = Math.max(0, (cc.download - prev.dl) / elapsed);
							cc._ulSpeed = Math.max(0, (cc.upload - prev.ul) / elapsed);
						}
						totalDlSpeed += cc._dlSpeed;
						totalUlSpeed += cc._ulSpeed;
						newPrev[cc.id] = { dl: cc.download, ul: cc.upload };
					}
					connPrev = newPrev;
					conns.sort(function(a, b) { return (b.download || 0) - (a.download || 0); });

					while (connStatsEl.firstChild) connStatsEl.removeChild(connStatsEl.firstChild);
					connStatsEl.appendChild(E('span', {}, [
						E('strong', {}, String(conns.length)),
						document.createTextNode(' ' + pluralConns(conns.length) + '    '),
						E('span', { 'style': 'color:#4caf50' }, '↓ ' + formatBytes(data.downloadTotal || 0)),
						elapsed > 0 ? E('span', { 'style': 'color:#4caf50;font-size:11px' }, ' (' + formatSpeed(totalDlSpeed) + ')') : document.createTextNode(''),
						document.createTextNode('    '),
						E('span', { 'style': 'color:#ff9800' }, '↑ ' + formatBytes(data.uploadTotal || 0)),
						elapsed > 0 ? E('span', { 'style': 'color:#ff9800;font-size:11px' }, ' (' + formatSpeed(totalUlSpeed) + ')') : document.createTextNode('')
					]));

					while (connTableBody.firstChild) connTableBody.removeChild(connTableBody.firstChild);
					connTableBody.appendChild(E('div', { 'class': 'tr table-titles' }, [
						E('div', { 'class': 'th' }, 'Хост'),
						E('div', { 'class': 'th', 'style': 'width:45px' }, 'Сеть'),
						E('div', { 'class': 'th', 'style': 'width:75px' }, 'Цепочка'),
						E('div', { 'class': 'th', 'style': 'width:55px' }, 'Время'),
						E('div', { 'class': 'th', 'style': 'width:85px;text-align:right' }, '↓ Скор.'),
						E('div', { 'class': 'th', 'style': 'width:85px;text-align:right' }, '↑ Скор.'),
						E('div', { 'class': 'th', 'style': 'width:75px;text-align:right' }, '↓ Объём'),
						E('div', { 'class': 'th', 'style': 'width:75px;text-align:right' }, '↑ Объём'),
						E('div', { 'class': 'th', 'style': 'width:130px' }, 'Источник')
					]));
					for (var ci3 = 0; ci3 < conns.length; ci3++) {
						var cn = conns[ci3];
						var meta = cn.metadata || {};
						var host = meta.host || meta.destinationIP || '—';
						if (host.length > 40) host = host.substring(0, 37) + '...';
						connTableBody.appendChild(E('div', {
							'class': 'tr' + (ci3 % 2 === 0 ? ' cbi-rowstyle-1' : ' cbi-rowstyle-2')
						}, [
							E('div', { 'class': 'td', 'style': 'word-break:break-all;font-size:12px', 'title': meta.host || '' }, host),
							E('div', { 'class': 'td', 'style': 'font-size:11px' }, (meta.network || '?').toUpperCase()),
							E('div', { 'class': 'td', 'style': 'font-size:11px' }, (cn.chains || ['—'])[0]),
							E('div', { 'class': 'td', 'style': 'font-size:11px' }, formatDuration(cn.start)),
							E('div', { 'class': 'td', 'style': 'text-align:right;font-family:monospace;font-size:11px;color:#4caf50' }, cn._dlSpeed > 0 ? formatSpeed(cn._dlSpeed) : '—'),
							E('div', { 'class': 'td', 'style': 'text-align:right;font-family:monospace;font-size:11px;color:#ff9800' }, cn._ulSpeed > 0 ? formatSpeed(cn._ulSpeed) : '—'),
							E('div', { 'class': 'td', 'style': 'text-align:right;font-family:monospace;font-size:11px' }, formatBytes(cn.download || 0)),
							E('div', { 'class': 'td', 'style': 'text-align:right;font-family:monospace;font-size:11px' }, formatBytes(cn.upload || 0)),
							E('div', { 'class': 'td', 'style': 'font-size:11px;font-family:monospace' }, (meta.sourceIP || '?') + ':' + (meta.sourcePort || ''))
						]));
					}
				} catch(e) {
					while (connStatsEl.firstChild) connStatsEl.removeChild(connStatsEl.firstChild);
					connStatsEl.appendChild(document.createTextNode('Ошибка: ' + e.message));
				}
			}).catch(function(err) {
				while (connStatsEl.firstChild) connStatsEl.removeChild(connStatsEl.firstChild);
				connStatsEl.appendChild(document.createTextNode('Ошибка: ' + (err.message || err)));
			});
		}

		var monitorRoot = E('div', { 'class': 'ss-page' }, [
			E('div', { 'class': 'ss-card' }, [
				E('div', { 'class': 'ss-card__header' }, [
					E('h3', { 'style': 'margin:0' }, 'Подключения')
				]),
				connStatsEl,
				E('div', { 'class': 'ss-table-wrap' }, [connTableBody])
			])
		]);

		function startMonitor() {
			if (!connTimer) { refreshConnections(); connTimer = window.setInterval(refreshConnections, 2000); }
		}
		function stopMonitor() {
			if (connTimer) { window.clearInterval(connTimer); connTimer = null; }
		}

		var checkVisibility = function() {
			var el = monitorRoot;
			while (el) {
				if (el.style && el.style.display === 'none') { stopMonitor(); return; }
				el = el.parentNode;
			}
			startMonitor();
		};

		requestAnimationFrame(function() {
			var tabContainer = monitorRoot.closest('.cbi-tabmenu') ? monitorRoot.closest('.cbi-tabmenu').parentNode : monitorRoot.parentNode;
			if (!tabContainer) tabContainer = document.body;
			var observer = new MutationObserver(checkVisibility);
			observer.observe(tabContainer, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
			checkVisibility();
		});

		window.addEventListener('beforeunload', stopMonitor);
		return monitorRoot;
	};
}

return view.extend({
	render: function() {
		main.injectGlobalStyles();
		injectStyles();

		var m = new form.Map('podkop',
			_('Podkop Settings'),
			_('Configuration for Podkop service'));
		m.tabbed = true;

		var sectionsSection = m.section(form.TypedSection, 'section', _('Sections'));
		sectionsSection.anonymous = false;
		sectionsSection.addremove = true;
		sectionsSection.template = 'cbi/simpleform';
		section.createSectionContent(sectionsSection);

		var settingsSection = m.section(form.TypedSection, 'settings', _('Settings'));
		settingsSection.anonymous = true;
		settingsSection.addremove = false;
		settingsSection.cfgsections = function() { return ['settings']; };
		settings.createSettingsContent(settingsSection);

		var diagnosticSection = m.section(form.TypedSection, 'diagnostic', _('Diagnostics'));
		diagnosticSection.anonymous = true;
		diagnosticSection.addremove = false;
		diagnosticSection.cfgsections = function() { return ['diagnostic']; };
		diagnostic.createDiagnosticContent(diagnosticSection);

		var dashboardSection = m.section(form.TypedSection, 'dashboard', _('Dashboard'));
		dashboardSection.anonymous = true;
		dashboardSection.addremove = false;
		dashboardSection.cfgsections = function() { return ['dashboard']; };
		dashboard.createDashboardContent(dashboardSection);

		var syncSection = m.section(form.TypedSection, 'sub_sync', _('Подписки'));
		syncSection.anonymous = true;
		syncSection.addremove = false;
		syncSection.cfgsections = function() { return ['sub_sync']; };
		createSubSyncContent(syncSection);

		var monSection = m.section(form.TypedSection, 'ss_monitor', _('Мониторинг'));
		monSection.anonymous = true;
		monSection.addremove = false;
		monSection.cfgsections = function() { return ['ss_monitor']; };
		createMonitorContent(monSection);

		main.coreService();

		return m.render();
	}
});
JSEOF
chmod 644 "$SUBSYNC_VIEW"

rm -f /www/luci-static/resources/view/podkop/sub_sync.js 2>/dev/null

echo "-> Настройка меню LuCI..."
PODKOP_MENU="/usr/share/luci/menu.d/luci-app-podkop.json"
SUBSYNC_MENU="/usr/share/luci/menu.d/luci-app-sub-sync.json"

if [ -f "$PODKOP_MENU" ] && [ ! -f "${PODKOP_MENU}.bak.subsync" ]; then
    cp "$PODKOP_MENU" "${PODKOP_MENU}.bak.subsync"
    echo "  ✓ Бэкап меню Podkop: ${PODKOP_MENU}.bak.subsync"
fi

cat > "$PODKOP_MENU" << 'MENUEOF'
{
    "admin/services/podkop": {
        "title": "Podkop",
        "order": 42,
        "action": {
            "type": "view",
            "path": "sub_sync/sub_sync"
        },
        "depends": {
            "acl": [ "luci-app-podkop" ],
            "uci": { "podkop": true }
        }
    }
}
MENUEOF
chmod 644 "$PODKOP_MENU"
echo "  ✓ Меню: Podkop → Sub Sync (все вкладки)"

rm -f "$SUBSYNC_MENU"

echo "-> Установка ACL..."
mkdir -p /usr/share/rpcd/acl.d
cat > /usr/share/rpcd/acl.d/luci-app-sub-sync.json << 'ACLEOF'
{
    "luci-app-sub-sync": {
        "description": "Sub Sync — subscription management for Podkop",
        "read": {
            "file": {
                "/usr/bin/sub-sync": ["exec"],
                "/sbin/uci": ["exec"],
                "/etc/sub-sync/*": ["read"],
                "/tmp/sub-sync-status": ["read"]
            },
            "uci": [ "podkop" ]
        },
        "write": {
            "file": {
                "/usr/bin/sub-sync": ["exec"],
                "/sbin/uci": ["exec"],
                "/etc/crontabs/root": ["write"]
            },
            "uci": [ "podkop" ]
        }
    }
}
ACLEOF
chmod 644 /usr/share/rpcd/acl.d/luci-app-sub-sync.json

echo "-> Перезапуск сервисов..."
/etc/init.d/rpcd restart 2>/dev/null || true
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
touch /lib/apk/db/installed 2>/dev/null; touch /usr/lib/opkg/status 2>/dev/null; true
/etc/init.d/uhttpd restart 2>/dev/null || true

if [ "$SS_SKIP_SYNC" != "1" ] && [ -s /etc/sub-sync/subscriptions.txt ]; then
    echo "-> Первичная синхронизация..."
    /usr/bin/sub-sync sync
fi

echo ""
echo "========================================="
echo "  ✓ Sub Sync установлен"
echo "========================================="
echo ""
echo "  Откройте LuCI → Службы → Podkop"
echo "  Вкладка «Sub Sync» — управление подписками"
echo ""
