'use strict';
/* SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B */
/* SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269 */
/* SUBSYNC_DIRECT_REMOVE_MANUAL_HIDE_LOAD_V266B */
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
/* SUBSYNC_DELETE_UI_REFRESH_V43 */
(function() {
        if (typeof window === 'undefined')
                return;
        if (window.__SUBSYNC_DELETE_UI_REFRESH_V43__)
                return;

        window.__SUBSYNC_DELETE_UI_REFRESH_V43__ = true;

        function bodyText() {
                return String((document.body && document.body.innerText) || '');
        }

        function reloadedRecently() {
                try {
                        var t = Number(sessionStorage.getItem('subsync_delete_refresh_v43') || 0);
                        return t && Date.now() - t < 9000;
                } catch(e) {
                        return false;
                }
        }

        function markReload() {
                try {
                        sessionStorage.setItem('subsync_delete_refresh_v43', String(Date.now()));
                } catch(e) {}
        }

        window.setInterval(function() {
                var t = bodyText();

                if (/Подписка\s+#?\d+\s+удалена/.test(t) && /(^|\s)OK(\s|$)/.test(t)) {
                        if (reloadedRecently())
                                return;

                        markReload();

                        window.setTimeout(function() {
                                try {
                                        var u = new URL(window.location.href);
                                        u.searchParams.set('_subsync_refresh', String(Date.now()));
                                        window.location.replace(u.toString());
                                } catch(e) {
                                        window.location.reload();
                                }
                        }, 900);
                }
        }, 700);
})();

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

			var sectionTypes = {};
			for (var sti2 = 0; sti2 < sections.length; sti2++) {
				sectionTypes[sections[sti2].name] = sections[sti2].type || 'url';
			}

			function getCurrentActiveLinks() {
				var sec = globalSectionSelect ? globalSectionSelect.value : (sections.length > 0 ? sections[0].name : '');
				return activeLinksBySection[sec] || [];
			}

var SUBSYNC_ACTIVE_BADGE_STICKY_V28 = true;
function ssNormLinkV28(x) {
return String(x || "").trim();
}

function ssLinkInListV28(link, list) {
var nl = ssNormLinkV28(link);
if (!nl) return false;
list = list || [];
for (var i = 0; i < list.length; i++) {
if (ssNormLinkV28(list[i]) === nl) return true;
}
return false;
}

function ssHydrateActiveBadgesV28(sec3) {
if (!serverTable || !sec3 || typeof fs === "undefined") return;
var rows = serverTable.querySelectorAll(".tr[data-link]");
var curLinks = activeLinksBySection[sec3] || [];
for (var i = 0; i < rows.length; i++) {
(function(row) {
var btn = row.querySelector("button[data-idx]");
if (!btn) return;
var sid = btn.getAttribute("data-idx");
if (!sid || row.dataset.link) return;
fs.exec("/usr/bin/sub-sync", ["link", String(sid)]).then(function(res) {
var link = (res.stdout || "").trim();
if (!link || link.indexOf("://") === -1) return;
row.dataset.link = link;
if (ssLinkInListV28(link, curLinks)) {
markBtnSelected(btn, link);
row.style.borderLeft = "3px solid #4caf50";
var badge2 = row.querySelector(".ss-active-badge");
if (!badge2) {
var nameCell = row.querySelector(".td[data-title=\"Имя\"]");
if (nameCell) {
var b = document.createElement("span");
b.className = "ss-active-badge";
b.style.cssText = "color:#4caf50;font-size:10px;margin-left:6px;font-weight:bold";
b.textContent = "✔ используется";
nameCell.appendChild(b);
}
}
}
syncAllBtnStates(sec3);
}).catch(function() {});
})(rows[i]);
}
syncAllBtnStates(sec3);
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
						var secType2 = sectionTypes[sec2.name] || sec2.type;
						if (secType2 === 'url') {
							var ps3 = uci.get('podkop', sec2.name, 'proxy_string');
							if (ps3) {
								var nm3 = extractAddrPortFromLink(ps3);
								for (var fi3 = 0; fi3 < servers.length; fi3++) {
									if (servers[fi3].link && servers[fi3].link.trim() === ps3.trim()) { nm3 = (servers[fi3].name || '').trim() || nm3; break; }
								}
								newBadges.push({ section: sec2.name, name: nm3, link: '', type: 'url' });
							}
							continue;
						} else if (secType2 === 'outbound') {
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
							newBadges.push({ section: sec2.name, name: nm, link: lnk, type: secType2 });
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
									if (lastLine === 'Активна') {
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
						if (lastLine === 'Активна') {
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
				'class': 'cbi-button cbi-button-apply',
				'style': 'display:none!important;visibility:hidden!important;padding:2px 12px',
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
				'class': 'cbi-button cbi-button-action',
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

                    /* SUBSYNC_MANUAL_BLOCK_V53B */
                    var manualBodyV53B = E('div', {
                            'style': 'display:none;margin-top:12px;padding:12px;border-radius:10px;background:rgba(127,127,127,.08);line-height:1.55'
                    }, [
                            E('h3', { 'style': 'margin-top:0' }, 'Как пользоваться Podcop Sub v666'),

                            E('h4', {}, '1. Добавление подписки'),
                            E('p', {}, 'Вставь ссылку подписки в поле подписок и нажми кнопку добавления. После добавления Podcop Sub v666 сам загрузит серверы и сохранит их в список.'),

                            E('h4', {}, '2. Создание Podkop-секции'),
                            E('p', {}, 'В блоке создания Podkop-секции введи имя секции латиницей, цифрами или подчёркиванием. Например: NetHavenE, urltest1, my_section. Нажми кнопку создания. Эта секция станет текущей target-секцией.'),

                            E('h4', {}, '3. Выбор серверов'),
                            E('p', {}, 'Серверы выбирай именно в Podcop Sub v666, а не руками внутри обычных настроек Podkop. Можно выбирать xHTTP, TCP / Reality и другие серверы из списка. После выбора Podcop Sub v666 сам добавит их в выбранную секцию.'),

                            E('h4', {}, '4. После выбора серверов'),
                            E('p', {}, 'После добавления серверов просто обнови страницу. Нижнюю кнопку LuCI Сохранить/Применить обычно нажимать не нужно, потому что Podcop Sub v666 уже записывает серверы в конфиг сам.'),

                            E('h4', {}, '5. Удаление подписки'),
                            E('p', {}, 'Если удалить подписку, Podcop Sub v666 пересоберёт список серверов. В рабочей версии v51 тестовая target-секция с серверами удаляется безопасно, если после удаления подписки она больше не нужна.'),

                            E('h4', {}, '6. AutoPick / AutoAdd'),
                            E('p', {}, 'AutoPick помогает выбрать подходящие серверы по пингу. AutoAdd добавляет выбранные серверы в текущую target-секцию Podkop. Перед использованием проверь, что нужная секция выбрана.'),

                            E('h4', {}, '7. Автосинхронизация'),
                            E('p', {}, 'Автосинхронизация обновляет серверы из подписок по расписанию. Если подписка изменилась, Podcop Sub v666 подтянет свежий список серверов.'),

                            E('h4', {}, '8. Что делать при ошибке'),
                            E('p', {}, 'Если что-то пошло не так: не жми много раз подряд Применить. Сначала посмотри логи. Главные ошибки для проверки: fatal, jq invalid, Sing-box configuration invalid, Access denied, SyntaxError, TypeError.'),

                            E('pre', { 'style': 'white-space:pre-wrap;overflow:auto' }, [
                                    'logread | grep -Ei "sub-sync|subsync|sub_sync|podkop|sing-box|urltest|jq: invalid|configuration .* invalid|fatal|error|failed|SyntaxError|TypeError|Access denied|Доступ запрещ|invalid|Nice" | tail -n 220',
                                    E('br'),
                                    'logread -f',
                                    E('br'),
                                    E('br'),
                                    'Откат стабильной точки:',
                                    E('br'),
                                    'sh /root/STABLE-SUBSYNC-V51-WORKING-20260528-020113/rollback-stable-subsync-v51-working.sh'
                            ])
                    ]);

                    /* SUBSYNC_CONSOLE_MANUAL_ORANGE_FLAT_V89 */
                    /* SUBSYNC_MANUAL_CONSOLE_ROW_V94 */
                    var manualBtnV53B = E('button', {
                            'class': 'cbi-button cbi-button-neutral',
                            'style': 'display:none!important;margin:0!important;padding:0!important;width:0!important;height:0!important;overflow:hidden!important;border:0!important;background:transparent;color:transparent;font-size:0!important;text-align:left!important',
                            'click': function(ev) {
                                    if (ev && ev.preventDefault)
                                            ev.preventDefault();

                                    var isHidden = manualBodyV53B.style.display === 'none';
                                    manualBodyV53B.style.display = isHidden ? 'block' : 'none';
                                    manualBtnV53B.textContent = '';
                            }
                    }, '');

                    /* SUBSYNC_SINGBOX_CONSOLE_LOGS_V81 */
                    var singboxConsoleTimerV81 = null;

                    var singboxConsoleStatusV81 = E('span', {
                            'class': 'ss-label',
                            'style': 'font-size:12px;color:#888;display:inline-block;min-width:155px;text-align:left;font-family:monospace'
                    }, 'выключено');

                    var singboxConsolePreV81 = E('pre', {
                            'style': 'margin:10px 0 0 0;max-height:360px;overflow:auto;white-space:pre-wrap;background:rgba(127,127,127,.10);color:inherit;border-radius:10px;padding:10px;font-size:11px;line-height:1.35;border:1px solid rgba(127,127,127,.25)'
                    }, 'Нажми "Консоль Логи", чтобы открыть realtime sing-box логи.');

                    /* SUBSYNC_CONSOLE_COPY_GREY_V82 */
                    var singboxConsoleCopyBtnV82 = E('button', {
                            'class': 'cbi-button cbi-button-neutral',
                            'style': 'padding:3px 10px;font-size:12px;border-radius:9px;border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.10);font-weight:800',
                            'click': function(ev) {
                                    if (ev && ev.preventDefault)
                                            ev.preventDefault();

                                    var text = singboxConsolePreV81 ? String(singboxConsolePreV81.textContent || '') : '';
                                    if (!text)
                                            text = 'Логи пустые';

                                    function copiedOkV82() {
                                            var old = singboxConsoleCopyBtnV82.textContent;
                                            singboxConsoleCopyBtnV82.textContent = 'Скопировано';
                                            window.setTimeout(function() { singboxConsoleCopyBtnV82.textContent = old || 'Копировать логи'; }, 1200);
                                    }

                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                            navigator.clipboard.writeText(text).then(copiedOkV82).catch(function() {
                                                    var ta = document.createElement('textarea');
                                                    ta.value = text;
                                                    ta.style.position = 'fixed';
                                                    ta.style.left = '-9999px';
                                                    document.body.appendChild(ta);
                                                    ta.focus();
                                                    ta.select();
                                                    try { document.execCommand('copy'); copiedOkV82(); } catch(e) { singboxConsoleCopyBtnV82.textContent = 'Ошибка копирования'; }
                                                    document.body.removeChild(ta);
                                            });
                                    } else {
                                            var ta2 = document.createElement('textarea');
                                            ta2.value = text;
                                            ta2.style.position = 'fixed';
                                            ta2.style.left = '-9999px';
                                            document.body.appendChild(ta2);
                                            ta2.focus();
                                            ta2.select();
                                            try { document.execCommand('copy'); copiedOkV82(); } catch(e2) { singboxConsoleCopyBtnV82.textContent = 'Ошибка копирования'; }
                                            document.body.removeChild(ta2);
                                    }
                            }
                    }, 'Копировать логи');

                    function stopSingboxConsoleV81() {
                            if (singboxConsoleTimerV81) {
                                    window.clearInterval(singboxConsoleTimerV81);
                                    singboxConsoleTimerV81 = null;
                            }
                            singboxConsoleStatusV81.textContent = 'выключено';
                    }

                    function renderSingboxConsoleV81() {
                            singboxConsoleStatusV81.textContent = 'обновление...';

                            return fs.exec('/usr/bin/sub-sync-singbox-log', ['160']).then(function(res) {
                                    var out = '';

                                    if (res && res.stdout)
                                            out = res.stdout;
                                    else if (res && res.stderr)
                                            out = res.stderr;

                                    if (!out)
                                            out = 'Лог пустой или sing-box пока ничего не писал.';

                                    singboxConsolePreV81.textContent = out;

                                    try {
                                            singboxConsolePreV81.scrollTop = singboxConsolePreV81.scrollHeight;
                                    } catch(e) {}

                                    singboxConsoleStatusV81.textContent = 'обновлено ' + new Date().toLocaleTimeString();
                            }).catch(function(err) {
                                    singboxConsolePreV81.textContent = 'Ошибка чтения логов: ' + (err && err.message ? err.message : err);
                                    singboxConsoleStatusV81.textContent = 'ошибка';
                            });
                    }

                    var singboxConsoleBodyV81 = E('div', {
                            'style': 'display:none;margin-top:10px;padding:10px;border-radius:10px;background:rgba(127,127,127,.08);border:1px solid rgba(76,175,80,.25)'
                    }, [
                            E('div', {
                                    'style': 'display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap'
                            }, [
                                    E('div', { 'class': 'ss-label' }, 'Sing-box / Podkop логи. Автообновление каждые 15 секунд, только когда блок раскрыт.'),
                            ]),
                            singboxConsolePreV81,
                            /* SUBSYNC_CONSOLE_FOOTER_STABLE_V83B */
                            E('div', {
                                    'style': 'margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:32px'
                            }, [
                                    singboxConsoleStatusV81,
                                    E('div', {
                                            'style': 'margin-left:auto;display:flex;justify-content:flex-end;min-width:145px'
                                    }, [ singboxConsoleCopyBtnV82 ])
                            ])
                    ]);

                    var singboxConsoleBtnV81 = E('button', {
                            'class': 'cbi-button cbi-button-neutral',
                            'style': 'display:none!important;margin:0!important;padding:0!important;width:0!important;height:0!important;overflow:hidden!important;border:0!important;background:transparent;color:transparent;font-size:0!important;text-align:left!important',
                            'click': function(ev) {
                                    if (ev && ev.preventDefault)
                                            ev.preventDefault();

                                    var open = singboxConsoleBodyV81.style.display === 'none';
                                    singboxConsoleBodyV81.style.display = open ? 'block' : 'none';
                                    singboxConsoleBtnV81.textContent = open ? 'Скрыть Консоль Логи' : 'Консоль Логи';

                                    if (open) {
                                            renderSingboxConsoleV81();
                                            if (singboxConsoleTimerV81)
                                                    window.clearInterval(singboxConsoleTimerV81);
                                            singboxConsoleTimerV81 = /* SUBSYNC_CONSOLE_REFRESH_15S_V84 */ window.setInterval(renderSingboxConsoleV81, 15000);
                                    } else {
                                            stopSingboxConsoleV81();
                                    }
                            }
                    }, 'Консоль Логи');

                    /* SUBSYNC_MANUAL_CONSOLE_ROW_FIX_V94B */
                    /* SUBSYNC_MANUAL_CONSOLE_COLUMN_V95 */
                    /* SUBSYNC_MANUAL_CONSOLE_ALIGN_LEFT_V95B */
                    var singboxConsoleCardV81 = E('div', {
                            'style': 'width:100%;margin-top:8px;padding:0!important'
                    }, [
                            E('div', {
                                    'style': 'display:grid;grid-template-columns:max-content;justify-items:start;align-items:start;row-gap:6px;margin:0!important;padding:0!important'
                            }, [
                                    E('div', { 'style': 'display:block;margin:0!important;padding:0!important;text-align:left!important' }, [ manualBtnV53B ]),
                                    E('div', { 'style': 'display:block;margin:0!important;padding:0!important;text-align:left!important' }, [ singboxConsoleBtnV81 ])
                            ]),
                            singboxConsoleBodyV81
                    ]);

                    /* SUBSYNC_DONATERS_PUBLIC_ONLY_V261 */
                    /* SUBSYNC_DONATERS_PUBLIC_CARDS_V134_COMPACT_CARDS */
                    var donatersPublicListV128 = E('div', {
                            'class': 'ss-donaters-grid-v134'
                    }, []);

                    function ssClearDonatersPublicV128() {
                            while (donatersPublicListV128.firstChild)
                                    donatersPublicListV128.removeChild(donatersPublicListV128.firstChild);
                    }

                    function ssRenderDonatersPublicV128(data) {
                            ssClearDonatersPublicV128();

                            var items = Array.isArray(data && data.items) ? data.items : [];

                            for (var i = 0; i < items.length; i++) {
                                    var it = items[i] || {};

                                    if (!it.enabled || !it.nick)
                                            continue;

                                    var href = it.url || '#';

                                    donatersPublicListV128.appendChild(E('a', {
                                            'href': href,
                                            'target': '_blank',
                                            'rel': 'noopener noreferrer',
                                            'class': 'ss-donater-mini-v134'
                                    }, [
                                            E('span', { 'class': 'ss-donater-mini-icon-v134' }, '✦'),
                                            E('span', { 'class': 'ss-donater-mini-name-v134' }, it.nick)
                                    ]));
                            }
                    }

                    function ssLoadDonatersPublicV128() {
                            return fs.exec('/usr/bin/sub-sync-donaters', ['get']).then(function(res) {
                                    var txt = String((res && res.stdout) || '').trim();
                                    var data = {};

                                    try {
                                            data = JSON.parse(txt || '{}');
                                    } catch(e) {
                                            data = { items: [] };
                                    }

                                    ssRenderDonatersPublicV128(data);
                            }).catch(function() {
                                    ssRenderDonatersPublicV128({ items: [] });
                            });
                    }

                    var donatersPublicCardV128 = E('div', {
                            'class': 'ss-card ss-donaters-card-v134'
                    }, [
                            E('h3', {
                                    'class': 'ss-donaters-title-v134'
                            }, '💎 Донатеры'),
                            donatersPublicListV128
                    ]);

                    window.setTimeout(function() {
                            try { ssLoadDonatersPublicV128(); } catch(e) {}
                    }, 700);





                    /* SUBSYNC_MODULE_UPDATE_SLOT_VAR_V249 */
                    var moduleUpdateSlotV249 = E('div', { 'class': 'ss-module-update-slot-v246 ss-module-update-slot-v249' }, []);
                    var manualCardV53B = E('div', {
                            'class': 'ss-manual-flat-v94',
                           /* SUBSYNC_MANUAL_CARD_NO_LEFT_LINE_V62 */
                            'style': 'background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important'
                    }, [
                            E('div', { 'style': 'display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap' }, [
                                    E('div', {}, [
                                            /* SUBSYNC_VERSION_CONSOLE_ORANGE_V92 */
                                            E('div', {
                                            /* SUBSYNC_VERSION_BORDER_V93 */
                                                    'class': 'ss-version-orange-v92',
                                                    'style': 'display:inline-block;margin:0 0 8px 0;padding:3px 10px;border-radius:9px;border:1px solid #ff9800;background:transparent;color:#ff9800!important;font-size:12px;font-weight:900;line-height:1.35;text-shadow:0 0 8px rgba(255,152,0,.28)'
                                            }, [
                                                    'Podcop Sub v666 Version 666. Автор Модуля ',
                                                    E('a', {
                                                            'href': 'https://t.me/kzolotarev95',
                                                            'target': '_blank',
                                                            'rel': 'noopener noreferrer',
                                                            'style': 'color:#ff9800 !important;text-decoration:underline;font-weight:900'
                                                    }, 'kzolotarev95')
                                            ]),
                                            E('h3', { 'style': 'margin:0 0 4px 0' }, [
                            /* SUBSYNC_MODULE_UPDATE_HELP_SLOT_PLACE_V249 */
                            moduleUpdateSlotV249,
                                                'Помощь по ',
                                                E('a', {
                                                    'class': 'ss-subsync-shine-v115 ss-podcop-sub-v666-shine-v115',
                                                    'href': 'https://t.me/+LZDsQJhUfcNhYWEy',
                                                    'target': '_blank',
                                                    'rel': 'noopener noreferrer',
                                                    'style': [
                                                        'display:inline-block',
                                                        'font-weight:900',
                                                        'letter-spacing:.35px',
                                                        'background-image:linear-gradient(90deg,#00d5ff,#ffffff,#ffd84d,#ff4fd8,#7c4dff,#00d5ff)',
                                                        'background-size:320% 100%',
                                                        'background-position:0% 50%',
                                                        '-webkit-background-clip:text',
                                                        'background-clip:text',
                                                        '-webkit-text-fill-color:transparent',
                                                        'color:transparent',
                                                        'animation:ssSubSyncGradientFlowV115 2.2s linear infinite',
                                                        'text-shadow:0 0 8px rgba(0,213,255,.35),0 0 16px rgba(255,79,216,.25)'
                                                    ].join(';')
                                                }, 'Podcop Sub v666')
                                            ]),
                                            E('div', { 'class': 'ss-label' }, 'Краткая инструкция по подпискам, секциям, выбору серверов и логам.')
                                    ]),
                            ]),
                            singboxConsoleCardV81,
                            manualBodyV53B
                    ]);

			var wServerCard = E('div', { 'class': 'ss-card', 'style': 'margin-top:10px' }, [
				E('div', { 'style': 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px' }, [
					E('span', { 'class': 'ss-card__title' }, 'Активные серверы (' + activeServerCount + ')')
				]),
				activeServerEl
			]);

                    /* SUBSYNC_MODULE_UPDATE_BUTTON_V236 */
                    /* SUBSYNC_MODULE_UPDATE_UI_COLLAPSE_V239 */
                    var moduleUpdateUserOpenV239 = false;
                    var moduleUpdateHasUpdateV239 = false;

                    var moduleUpdateStatusV236 = E('div', {
                            'class': 'ss-module-update-status-v239',
                            'style': 'font-size:12px;margin:4px 0 10px 0;color:#888'
                    }, 'Проверка обновлений ещё не запускалась.');

                    var moduleUpdateOutV236 = E('pre', {
                            'class': 'ss-module-update-log-v239',
                            'style': 'display:none;margin-top:10px;max-height:220px;overflow:auto;white-space:pre-wrap;font-size:12px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:10px;'
                    }, '');

                    function ssModuleUpdateOpenV239(open, manual) {
                            if (manual)
                                    moduleUpdateUserOpenV239 = !!open;

                            moduleUpdateDetailsV239.style.display = open ? 'block' : 'none';
                            moduleUpdateOutV236.style.display = open ? 'block' : 'none';
                            moduleUpdateToggleBtnV239.textContent = open ? 'Скрыть детали' : 'Детали';
                    }

                    /* SUBSYNC_MODULE_UPDATE_CARD_COLORS_V251 */
                    function ssModuleUpdateColorV251(state) {
                            try {
                                    if (!moduleUpdateCardV236 || !moduleUpdateCardV236.classList)
                                            return;
                                    moduleUpdateCardV236.classList.remove('ss-module-update-ok-v251', 'ss-module-update-warn-v251', 'ss-module-update-neutral-v251');
                                    if (state === 'ok')
                                            moduleUpdateCardV236.classList.add('ss-module-update-ok-v251');
                                    else if (state === 'warn')
                                            moduleUpdateCardV236.classList.add('ss-module-update-warn-v251');
                                    else
                                            moduleUpdateCardV236.classList.add('ss-module-update-neutral-v251');
                            } catch(e) {}
                    }
                    function ssModuleUpdateSetV236(text) {
                            var out = text || '';
                            moduleUpdateOutV236.textContent = out;

                            if (out.indexOf('UPDATE_AVAILABLE') >= 0) {
                                    moduleUpdateHasUpdateV239 = true;
                                    moduleUpdateStatusV236.textContent = 'Вышло обновление. Можно нажать «Обновление Модуля».';
                                    moduleUpdateStatusV236.style.color = '#f3d66f';
                                    ssModuleUpdateColorV251('warn');
                                    moduleUpdateRunBtnV236.style.display = '';
                                    ssModuleUpdateOpenV239(true, false);
                            } else if (out.indexOf('UP_TO_DATE') >= 0) {
                                    moduleUpdateHasUpdateV239 = false;
                                    moduleUpdateStatusV236.textContent = 'У вас последняя версия. Обновление не требуется.';
                                    moduleUpdateStatusV236.style.color = '#7bd88f';
                                    ssModuleUpdateColorV251('ok');
                                    moduleUpdateRunBtnV236.style.display = 'none';
                                    if (!moduleUpdateUserOpenV239)
                                            ssModuleUpdateOpenV239(false, false);
                            } else if (out.indexOf('NO_REMOTE_VERSION') >= 0) {
                                    moduleUpdateHasUpdateV239 = false;
                                    moduleUpdateStatusV236.textContent = 'GitHub version.json ещё не опубликован.';
                                    moduleUpdateStatusV236.style.color = '#aaa';
                                    moduleUpdateRunBtnV236.style.display = 'none';
                                    if (!moduleUpdateUserOpenV239)
                                            ssModuleUpdateOpenV239(false, false);
                            } else if (out.indexOf('SAFE_STOP') >= 0 || out.indexOf('ERROR') >= 0) {
                                    moduleUpdateStatusV236.textContent = 'Обновление остановлено защитой. Подробности ниже.';
                                    moduleUpdateStatusV236.style.color = '#ff8a8a';
                                    moduleUpdateRunBtnV236.style.display = 'none';
                                    ssModuleUpdateOpenV239(true, false);
                            }
                    }

                    function ssModuleUpdateRunV236(mode, btn) {
                            var old = btn ? btn.textContent : '';
                            if (btn) {
                                    btn.disabled = true;
                                    btn.textContent = mode === 'run' ? 'Обновляю...' : 'Проверяю...';
                            }

                            moduleUpdateOutV236.textContent = 'Запуск: /usr/bin/sub-sync-module-update ' + mode;

                            fs.exec('/usr/bin/sub-sync-module-update', [ mode ]).then(function(res) {
                                    var out = '';
                                    if (res && res.stdout)
                                            out += res.stdout;
                                    if (res && res.stderr)
                                            out += (out ? '\n' : '') + res.stderr;
                                    if (!out)
                                            out = 'code=' + ((res && res.code) || 0);

                                    ssModuleUpdateSetV236(out);

                                    if (btn) {
                                            btn.disabled = false;
                                            btn.textContent = old;
                                    }
                            }, function(err) {
                                    ssModuleUpdateSetV236('ERROR: ' + err);
                                    if (btn) {
                                            btn.disabled = false;
                                            btn.textContent = old;
                                    }
                            });
                    }

                    var moduleUpdateCheckBtnV236 = E('button', {
                            'class': 'btn cbi-button cbi-button-neutral',
                            'style': 'display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important',
                            'click': function(ev) {
                                    ev.preventDefault();
                                    ssModuleUpdateRunV236('check', moduleUpdateCheckBtnV236);
                            }
                    }, 'Проверить');

                    var moduleUpdateToggleBtnV239 = E('button', {
                            'class': 'btn cbi-button cbi-button-neutral',
                            'style': 'margin-left:8px',
                            'click': function(ev) {
                                    ev.preventDefault();
                                    ssModuleUpdateOpenV239(moduleUpdateDetailsV239.style.display === 'none', true);
                            }
                    }, 'Детали');

                    var moduleUpdateRunBtnV236 = E('button', {
                            'class': 'btn cbi-button cbi-button-apply',
                            'style': 'display:none;margin-top:8px',
                            'click': function(ev) {
                                    ev.preventDefault();
                                    if (!window.confirm('Скачать и установить последнюю публичную версию Podcop Sub v666 из GitHub?'))
                                            return;
                                    ssModuleUpdateRunV236('run', moduleUpdateRunBtnV236);
                            }
                    }, 'Обновление Модуля');

                    var moduleUpdateDetailsV239 = E('div', {
                            'class': 'ss-module-update-details-v239',
                            'style': 'display:none;margin-top:10px'
                    }, [
                            moduleUpdateRunBtnV236,
                            moduleUpdateOutV236
                    ]);

                    /* SUBSYNC_DONATE_BANNER_TEXT_CARD_V257 */
                    /* SUBSYNC_DONATE_COPY_BUTTON_V258 */
                    function ssDonateCopyNumberV258(ev) {
                            if (ev) {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                            }

                            var num = '4817760258323256';
                            var btn = ev && ev.currentTarget ? ev.currentTarget : null;
                            var old = btn ? btn.textContent : '';

                            function setBtnText(txt) {
                                    if (!btn)
                                            return;

                                    btn.textContent = txt;
                                    window.setTimeout(function() {
                                            btn.textContent = old || 'Копировать номер';
                                    }, 1300);
                            }

                            function fallbackCopy() {
                                    try {
                                            var ta = document.createElement('textarea');
                                            ta.value = num;
                                            ta.setAttribute('readonly', 'readonly');
                                            ta.style.position = 'fixed';
                                            ta.style.left = '-9999px';
                                            document.body.appendChild(ta);
                                            ta.select();
                                            document.execCommand('copy');
                                            document.body.removeChild(ta);
                                            setBtnText('Скопировано');
                                    } catch(e) {
                                            setBtnText('Не скопировано');
                                    }
                            }

                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                    navigator.clipboard.writeText(num).then(function() {
                                            setBtnText('Скопировано');
                                    }).catch(fallbackCopy);
                            } else {
                                    fallbackCopy();
                            }
                    }

                    var donateBannerV257 = E('div', { 'class': 'ss-donate-banner-v257 ss-card' }, [
                            E('div', { 'class': 'ss-donate-banner-v257__glow' }, []),
                            E('div', { 'class': 'ss-donate-banner-v257__top' }, 'Буду благодарен каждому из вас.'),
                            E('div', { 'class': 'ss-donate-banner-v257__sub' }, 'Поддержать Донатом'),
                            E('div', { 'class': 'ss-donate-banner-v257__pay' }, [
                                    E('span', { 'class': 'ss-donate-banner-v257__bank' }, 'Сбербанк:'),
                                    E('span', { 'class': 'ss-donate-banner-v257__num' }, '4817760258323256'),
                                    E('button', {
                                            'class': 'ss-donate-banner-v258__copy cbi-button',
                                            'type': 'button',
                                            'click': ssDonateCopyNumberV258
                                    }, 'Копировать номер')
                            ])
                    ]);

                    var moduleUpdateCardV236 = E('div', {
                            'class': 'ss-card ss-module-update-card-v236'
                    }, [
                            E('div', { 'class': 'ss-card__title' }, 'Обновление Модуля'),
                            moduleUpdateStatusV236,
                            E('div', { 'class': 'ss-module-update-actions-v239' }, [
                                    moduleUpdateCheckBtnV236,
                                    moduleUpdateToggleBtnV239
                            ]),
                            moduleUpdateDetailsV239
                    ]);

                    window.setTimeout(function() {
                            ssModuleUpdateRunV236('check', null);
                    /* SUBSYNC_MODULE_UPDATE_HIDE_DEBUG_DETAILS_V253 */
                    function ssModuleUpdateHideDebugDetailsV253() {
                            try {
                                    var card = null;

                                    try {
                                            card = moduleUpdateCardV236;
                                    } catch(e) {}

                                    if (!card && typeof document !== 'undefined')
                                            card = document.querySelector('.ss-module-update-card-v236');

                                    if (!card)
                                            return;

                                    var rawRe = /LOCAL_BUILD=|REMOTE_VERSION=|REMOTE_BUILD=|TITLE=|MESSAGE=|UP_TO_DATE|UPDATE_AVAILABLE|REMOTE_/;

                                    var nodes = card.querySelectorAll('pre, code, textarea');
                                    for (var i = 0; i < nodes.length; i++) {
                                            var txt = nodes[i].textContent || nodes[i].value || '';
                                            if (rawRe.test(txt)) {
                                                    if ('value' in nodes[i])
                                                            nodes[i].value = '';
                                                    nodes[i].textContent = '';
                                                    nodes[i].style.setProperty('display', 'none', 'important');
                                            }
                                    }

                                    var btns = card.querySelectorAll('button, a, input, .cbi-button');
                                    for (var j = 0; j < btns.length; j++) {
                                            var label = (btns[j].textContent || btns[j].value || '').replace(/\s+/g, ' ').trim().toLowerCase();
                                            if (label === 'детали' || label === 'details') {
                                                    btns[j].style.setProperty('display', 'none', 'important');
                                                    btns[j].setAttribute('aria-hidden', 'true');
                                            }
                                    }
                            } catch(e) {}
                    }

                    ssModuleUpdateHideDebugDetailsV253();
                    window.setTimeout(ssModuleUpdateHideDebugDetailsV253, 250);
                    window.setTimeout(ssModuleUpdateHideDebugDetailsV253, 1200);

                    /* SUBSYNC_MODULE_UPDATE_ONE_BLOCK_ONLY_V247 */
                    function ssModuleUpdateOneBlockOnlyV247() {
                            window.setTimeout(function() {
                                    try {
                                            if (typeof ssModuleUpdateAttachWidgetV242 !== 'undefined')
                                                    ssModuleUpdateAttachWidgetV242 = function(){};
                                            if (typeof ssModuleUpdatePlaceBeforeHelpV242 !== 'undefined')
                                                    ssModuleUpdatePlaceBeforeHelpV242 = function(){};
                                            if (typeof ssModuleUpdateCopyHelpStyleV244 !== 'undefined')
                                                    ssModuleUpdateCopyHelpStyleV244 = function(){};
                                            if (typeof ssModuleUpdateFitWidgetV241 !== 'undefined')
                                                    ssModuleUpdateFitWidgetV241 = function(){};
                                    } catch(e) {}

                                    var slot = document.querySelector('.ss-module-update-slot-v246');
                                    if (!slot)
                                            return;

                                    var cards = Array.prototype.slice.call(document.querySelectorAll('.ss-module-update-card-v236'));
                                    if (!cards.length)
                                            return;

                                    var keep = null;

                                    for (var i = 0; i < cards.length; i++) {
                                            if (slot.contains(cards[i])) {
                                                    keep = cards[i];
                                                    break;
                                            }
                                    }

                                    if (!keep)
                                            keep = cards[0];

                                    if (keep.parentNode !== slot)
                                            slot.appendChild(keep);

                                    keep.classList.add('ss-module-update-inside-help-v247');

                                    for (var j = 0; j < cards.length; j++) {
                                            if (cards[j] !== keep && cards[j].parentNode)
                                                    cards[j].parentNode.removeChild(cards[j]);
                                    }

                                    keep.style.setProperty('display', 'block', 'important');
                                    keep.style.setProperty('max-width', 'none', 'important');
                                    keep.style.setProperty('width', '100%', 'important');
                                    keep.style.setProperty('margin', '0', 'important');
                                    keep.style.setProperty('padding', '0', 'important');
                                    keep.style.setProperty('background', 'transparent', 'important');
                                    keep.style.setProperty('border', '0', 'important');
                                    keep.style.setProperty('box-shadow', 'none', 'important');
                                    keep.style.setProperty('color', 'inherit', 'important');
                                    keep.style.setProperty('box-sizing', 'border-box', 'important');
                                    keep.style.setProperty('overflow', 'visible', 'important');
                            }, 0);
                    }

                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */

                    /* SUBSYNC_MODULE_UPDATE_HELP_SLOT_FINAL_V246 */
                    function ssModuleUpdateAttachToHelpSlotV246() {
                            window.setTimeout(function() {
                                    var slot = document.querySelector('.ss-module-update-slot-v246');
                                    if (!slot)
                                            return;

                                    if (typeof moduleUpdateCardV236 === 'undefined' || !moduleUpdateCardV236)
                                            return;

                                    moduleUpdateCardV236.classList.add('ss-module-update-inside-help-v246');

                                    if (moduleUpdateCardV236.parentNode !== slot)
                                            slot.appendChild(moduleUpdateCardV236);

                                    moduleUpdateCardV236.style.setProperty('display', 'block', 'important');
                                    moduleUpdateCardV236.style.setProperty('max-width', 'none', 'important');
                                    moduleUpdateCardV236.style.setProperty('width', '100%', 'important');
                                    moduleUpdateCardV236.style.setProperty('margin', '0', 'important');
                                    moduleUpdateCardV236.style.setProperty('padding', '0', 'important');
                                    moduleUpdateCardV236.style.setProperty('background', 'transparent', 'important');
                                    moduleUpdateCardV236.style.setProperty('border', '0', 'important');
                                    moduleUpdateCardV236.style.setProperty('box-shadow', 'none', 'important');
                                    moduleUpdateCardV236.style.setProperty('color', 'inherit', 'important');
                                    moduleUpdateCardV236.style.setProperty('box-sizing', 'border-box', 'important');
                                    moduleUpdateCardV236.style.setProperty('overflow', 'visible', 'important');
                            }, 0);
                    }

                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */

                    /* SUBSYNC_MODULE_UPDATE_STATIC_FIRST_NO_JUMP_V244 */
                    function ssModuleUpdateCopyHelpStyleV244() {
                            window.setTimeout(function() {
                                    var card = document.querySelector('.ss-module-update-card-v236');
                                    if (!card)
                                            return;

                                    var h3s = document.querySelectorAll('h3');
                                    var helpTitle = null;

                                    for (var i = 0; i < h3s.length; i++) {
                                            if ((h3s[i].textContent || '').indexOf('Помощь по') >= 0) {
                                                    helpTitle = h3s[i];
                                                    break;
                                            }
                                    }

                                    if (!helpTitle)
                                            return;

                                    var helpCard = helpTitle;
                                    while (helpCard && (!helpCard.classList || !helpCard.classList.contains('ss-card')))
                                            helpCard = helpCard.parentNode;

                                    if (!helpCard || helpCard === card || !window.getComputedStyle)
                                            return;

                                    var cs = window.getComputedStyle(helpCard);
                                    [
                                            'background',
                                            'background-color',
                                            'border',
                                            'border-radius',
                                            'box-shadow',
                                            'color',
                                            'padding'
                                    ].forEach(function(p) {
                                            try {
                                                    card.style.setProperty(p, cs.getPropertyValue(p), 'important');
                                            } catch(e) {}
                                    });

                                    card.style.setProperty('max-width', 'none', 'important');
                                    card.style.setProperty('width', 'auto', 'important');
                                    card.style.setProperty('margin', '0 0 10px 0', 'important');
                                    card.style.setProperty('box-sizing', 'border-box', 'important');
                                    card.style.setProperty('overflow', 'hidden', 'important');
                            }, 0);
                    }

                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */


                    /* SUBSYNC_MODULE_UPDATE_SAFE_WIDGET_ATTACH_V242 */
                    function ssModuleUpdateAttachWidgetV242() {
                            window.setTimeout(function() {
                                    var card = document.querySelector('.ss-module-update-card-v236');
                                    var row = document.querySelector('.ss-widgets');

                                    if (!card || !row)
                                            return;

                                    if (card.parentNode !== row)
                                            row.appendChild(card);

                                    card.classList.add('ss-widget');
                                    card.classList.add('ss-module-update-widget-v242');

                                    var title = card.querySelector('.ss-card__title');
                                    if (title) {
                                            title.classList.remove('ss-card__title');
                                            title.classList.add('ss-widget__title');
                                    }

                                    var src = row.querySelector('.ss-widget:not(.ss-module-update-card-v236)');
                                    if (src && window.getComputedStyle) {
                                            var cs = window.getComputedStyle(src);
                                            [
                                                    'background',
                                                    'background-color',
                                                    'border',
                                                    'border-radius',
                                                    'box-shadow',
                                                    'color',
                                                    'padding',
                                                    'min-height'
                                            ].forEach(function(p) {
                                                    try {
                                                            card.style.setProperty(p, cs.getPropertyValue(p), 'important');
                                                    } catch(e) {}
                                            });
                                    }

                                    card.style.setProperty('max-width', 'none', 'important');
                                    card.style.setProperty('width', 'auto', 'important');
                                    card.style.setProperty('margin', '0', 'important');
                                    card.style.setProperty('box-sizing', 'border-box', 'important');
                                    card.style.setProperty('overflow', 'hidden', 'important');
                            }, 250);
                    }

                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */
                    /* SUBSYNC_MODULE_UPDATE_DISABLED_OLD_MOVER_TIMER_V249 */

                    }, 1200);

			var widgetsRow = E('div', { 'class': 'ss-widgets' }, [wStatus, wConnection, wSingbox]);
                    /* SUBSYNC_MODULE_UPDATE_SYNC_ATTACH_NO_JUMP_V249 */
                    if (moduleUpdateSlotV249 && moduleUpdateCardV236) {
                            moduleUpdateCardV236.classList.add('ss-module-update-inside-help-v249');
                            moduleUpdateSlotV249.appendChild(moduleUpdateCardV236);
                    }
                    /* SUBSYNC_SYSTEM_WIDGETS_V96 */
                    var sysMemValueV96 = E('div', { 'class': 'ss-widget__value' }, 'загрузка...');
                    var sysStorageValueV96 = E('div', { 'class': 'ss-widget__value' }, 'загрузка...');
                    var sysTempValueV96 = E('div', { 'class': 'ss-widget__value' }, 'загрузка...');

                    function formatKbV96(kb) {
                            var n = Number(kb || 0);
                            if (!n || n < 0)
                                    return '—';

                            var mb = n / 1024;
                            if (mb >= 1024)
                                    return (mb / 1024).toFixed(2) + ' GB';

                            return mb.toFixed(0) + ' MB';
                    }

                    function clearNodeV96(node) {
                            while (node.firstChild)
                                    node.removeChild(node.firstChild);
                    }

                    function setSysErrorV96(node, text) {
                            clearNodeV96(node);
                            node.appendChild(E('span', { 'style': 'color:#f44336;font-weight:800' }, text || 'ошибка'));
                    }

                    function renderSysInfoV96(data) {
                            data = data || {};

                            var mem = data.memory || {};
                            var storage = data.storage || {};
                            var temp = data.temperature || {};
                            var updated = data.time || '';

                            clearNodeV96(sysMemValueV96);
                            sysMemValueV96.appendChild(E('div', { 'class': 'ss-row' }, [
                                    E('span', { 'class': 'ss-dot ss-dot--ok' }, '●'),
                                    E('span', { 'class': 'ss-val ss-val--ok' },
                                            formatKbV96(mem.used_kb) + ' / ' + formatKbV96(mem.total_kb) + ' (' + Number(mem.percent || 0).toFixed(1) + '%)')
                            ]));
                            sysMemValueV96.appendChild(E('div', {
                                    'style': 'color:#999;font-size:12px;margin-top:4px'
                            }, 'свободно ' + formatKbV96(mem.available_kb) + (updated ? ' · ' + updated : '')));

                            clearNodeV96(sysStorageValueV96);
                            sysStorageValueV96.appendChild(E('div', { 'class': 'ss-row' }, [
                                    E('span', { 'class': Number(storage.percent || 0) >= 90 ? 'ss-dot ss-dot--bad' : 'ss-dot ss-dot--ok' }, '●'),
                                    E('span', { 'class': Number(storage.percent || 0) >= 90 ? 'ss-val ss-val--bad' : 'ss-val ss-val--ok' },
                                            formatKbV96(storage.used_kb) + ' / ' + formatKbV96(storage.total_kb) + ' (' + Number(storage.percent || 0).toFixed(0) + '%)')
                            ]));
                            sysStorageValueV96.appendChild(E('div', {
                                    'style': 'color:#999;font-size:12px;margin-top:4px'
                            }, 'свободно ' + formatKbV96(storage.available_kb)));

                            clearNodeV96(sysTempValueV96);
                            if (temp.celsius === null || temp.celsius === undefined) {
                                    sysTempValueV96.appendChild(E('div', { 'class': 'ss-row' }, [
                                            E('span', { 'class': 'ss-dot' }, '●'),
                                            E('span', { 'class': 'ss-label' }, 'датчик не найден')
                                    ]));
                            } else {
                                    var tc = Number(temp.celsius || 0);
                                    sysTempValueV96.appendChild(E('div', { 'class': 'ss-row' }, [
                                            E('span', { 'class': tc >= 80 ? 'ss-dot ss-dot--bad' : 'ss-dot ss-dot--ok' }, '●'),
                                            E('span', { 'class': tc >= 80 ? 'ss-val ss-val--bad' : 'ss-val ss-val--ok' }, tc.toFixed(1) + ' °C')
                                    ]));
                                    sysTempValueV96.appendChild(E('div', {
                                            'style': 'color:#999;font-size:12px;margin-top:4px'
                                    }, String(temp.label || 'thermal')));
                            }
                    }

                    function refreshSysWidgetsV96() {
                            return fs.exec('/usr/bin/sub-sync-system-info', []).then(function(res) {
                                    var out = res && res.stdout ? String(res.stdout).trim() : '';
                                    var data = out ? JSON.parse(out) : {};
                                    renderSysInfoV96(data);
                            }).catch(function(err) {
                                    setSysErrorV96(sysMemValueV96, 'ошибка RAM');
                                    setSysErrorV96(sysStorageValueV96, 'ошибка хранилища');
                                    setSysErrorV96(sysTempValueV96, 'ошибка температуры');
                            });
                    }

                    var sysWidgetsRowV96 = E('div', {
                            'class': 'ss-widgets',
                            'style': 'margin-top:10px'
                    }, [
                            E('div', { 'class': 'ss-widget' }, [
                                    E('div', { 'class': 'ss-widget__title' }, 'Оперативная память'),
                                    sysMemValueV96
                            ]),
                            E('div', { 'class': 'ss-widget' }, [
                                    E('div', { 'class': 'ss-widget__title' }, 'Хранилище'),
                                    sysStorageValueV96
                            ]),
                            E('div', { 'class': 'ss-widget' }, [
                                    E('div', { 'class': 'ss-widget__title' }, 'Температура'),
                                    sysTempValueV96
                            ])
                    ]);

                    refreshSysWidgetsV96();

                    if (window.subsyncSysWidgetsTimerV96)
                            window.clearInterval(window.subsyncSysWidgetsTimerV96);

                    window.subsyncSysWidgetsTimerV96 = window.setInterval(refreshSysWidgetsV96, 5000);

                        var SUBSYNC_MULTI_SUBS_V16 = true;

                        var subBulkInput = E('textarea', {
                                'class': 'cbi-input-text',
                                placeholder: 'https://example.com/sub-1\nhttps://example.com/sub-2\nhttps://example.com/sub-3',
                                style: 'width:100%;min-height:78px;resize:vertical;font-family:monospace;font-size:12px'
                        });

                        var subBulkStatus = E('span', {
                                'class': 'ss-label',
                                style: 'color:#999'
                        }, '');

                        function subBulkUrlsV16() {
                                var raw = String(subBulkInput.value || '');
                                var parts = raw.split(/[\s,;]+/);
                                var seen = {};
                                var out = [];

                                for (var i = 0; i < parts.length; i++) {
                                        var u = String(parts[i] || '').trim();
                                        if (!u) continue;
                                        if (u.indexOf('http://') !== 0 && u.indexOf('https://') !== 0) continue;
                                        if (seen[u]) continue;
                                        seen[u] = true;
                                        out.push(u);
                                }

                                return out;
                        }

                        function subBulkSetV16(txt, color) {
                                subBulkStatus.textContent = txt || '';
                                subBulkStatus.style.color = color || '#999';
                        }

                        function subBulkRefreshV16() {
                                return fs.exec('/usr/bin/sub-sync', ['list-subs']).then(function(r) {
                                        try {
                                                var newSubs = JSON.parse((r.stdout || '[]').trim());
                                                subscriptions = newSubs;
                                                rebuildSubsList(newSubs);
                                        } catch(e) {}
                                });
                        }

                        function subBulkAddV16(doSync) {
                                var urls = subBulkUrlsV16();

                                if (urls.length === 0) {
                                        ui.addNotification(null, E('p', {}, 'Вставь одну или несколько ссылок подписок'), 'warning');
                                        return;
                                }

                                subBulkAddBtn.disabled = true;
                                subBulkAddSyncBtn.disabled = true;

                                var idx = 0;
                                var added = 0;
                                var skipped = 0;
                                var errors = 0;

                                subBulkSetV16('Добавление: 0 из ' + urls.length, '#999');

                                function next() {
                                        if (idx >= urls.length) {
                                                subBulkRefreshV16().then(function() {
                                                        subBulkAddBtn.disabled = false;
                                                        subBulkAddSyncBtn.disabled = false;

                                                        var msg = 'Добавлено: ' + added + ', пропущено: ' + skipped + ', ошибок: ' + errors;
                                                        subBulkSetV16(msg, errors > 0 ? '#ff9800' : '#4caf50');

                                                        if (!doSync) {
                                                                ui.addNotification(null, E('p', {}, msg), 'info');
                                                                return;
                                                        }

                                                        subBulkSetV16(msg + '. Загружаю серверы...', '#999');

                                                        fs.exec('/usr/bin/sub-sync', ['sync']).then(function(r) {
                                                                subBulkSetV16('Серверы загружены из всех рабочих подписок. Страница обновится...', '#4caf50');
                                                                ui.addNotification(null, E('p', {}, 'Подписки добавлены, серверы загружены'), 'info');
                                                                window.setTimeout(function() { window.location.reload(); }, 1200);
                                                        }).catch(function(err) {
                                                                subBulkSetV16('Подписки добавлены, но sync вернул ошибку', '#ff9800');
                                                                ui.addNotification(null, E('p', {}, 'Sync failed: ' + (err.message || err)), 'danger');
                                                        });
                                                });

                                                return;
                                        }

                                        var url = urls[idx++];

                                        subBulkSetV16('Добавление: ' + idx + ' из ' + urls.length, '#999');

                                        fs.exec('/usr/bin/sub-sync', ['add-sub', url]).then(function(res) {
                                                var out = (res.stdout || '').trim();

                                                if (out.split('\n').pop().trim() === 'Активна') {
                                                        added++;
                                                } else if (out.indexOf('уже добавлена') >= 0 || out.indexOf('подписка уже добавлена') >= 0) {
                                                        skipped++;
                                                } else {
                                                        errors++;
                                                }

                                                window.setTimeout(next, 80);
                                        }).catch(function(err) {
                                                errors++;
                                                window.setTimeout(next, 80);
                                        });
                                }

                                next();
                        }

                        var subBulkAddBtn = E('button', {
                                'class': 'cbi-button',
                                style: 'padding:2px 10px;font-size:12px;background:transparent;color:#4caf50;border:1px solid #4caf50',
                                click: function() { subBulkAddV16(false); }
                        }, 'Добавить список');

                        var subBulkAddSyncBtn = E('button', {
                                'class': 'cbi-button cbi-button-action',
                                style: 'padding:2px 10px;font-size:12px',
                                click: function() { subBulkAddV16(true); }
                        }, 'Добавить + загрузить серверы');

                        var subBulkBox = E('div', {
                                'class': 'ss-card',
                                style: 'padding:8px;margin:8px 0;background:rgba(255,255,255,.025)'
                        }, [
                                E('div', { 'class': 'ss-card__title', style: 'font-size:13px;margin-bottom:6px' }, 'Добавить одну или несколько подписок'),
                                E('div', { 'class': 'ss-label', style: 'margin-bottom:6px;color:#999' }, 'Вставь одну или несколько ссылок, каждую с новой строки. Если одна подписка просрочилась, остальные продолжат работать при загрузке серверов.'),
                                subBulkInput,
                                E('div', { 'class': 'ss-controls', style: 'margin-top:8px' }, [
                                        subBulkAddBtn,
                                        subBulkAddSyncBtn,
                                        subBulkStatus
                                ])
                        ]);
                        var SUBSYNC_SUB_INFO_UI_V17 = true;
                        var SUBSYNC_SUB_INFO_LABELS_V27B = true;
                        var SUBSYNC_SUB_INFO_LABELS_V27C = true;
                        if (typeof window !== 'undefined' && !window.__SUBSYNC_LABELS_V27B) {
                                window.__SUBSYNC_LABELS_V27B = true;
                                window.setInterval(function() {
                                        try {
                                                var badges = document.querySelectorAll('.ss-badge');
                                                for (var i = 0; i < badges.length; i++) {
                                                        if ((badges[i].textContent || '').trim() === 'OK')
                                                                badges[i].textContent = 'Активна';
                                                }
                                        } catch (e) {}
                                }, 700);
                        }
                        var SUBSYNC_SUB_INFO_LABELS_V27 = true;
                        var SUBSYNC_SUB_INFO_FAST_V23 = true;
                        var SUBSYNC_HIDE_SINGLE_SUB_ROW_V26 = true;
                        var SUBSYNC_SUB_INFO_MANUAL_EXPIRE_V25 = true;
                        var SUBSYNC_SUB_INFO_TRUTH_V22 = true;

                        var subInfoStatus = E('span', { 'class': 'ss-label', style: 'color:#999' }, '');
                        var subInfoList = E('div', { style: 'display:flex;flex-direction:column;gap:8px;margin-top:8px' });

                        function subInfoGbV17(bytes) {
                                var n = Number(bytes || 0);
                                if (!n || n <= 0) return 'нет данных';
                                return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
                        }

                        function subInfoDateV17(epoch) {
                                var n = Number(epoch || 0);
                                if (!n || n <= 0) return 'нет данных';
                                try {
                                        return new Date(n * 1000).toLocaleString();
                                } catch(e) {
                                        return 'нет данных';
                                }
                        }

                        function subInfoShortUrlV17(url) {
                                var s = String(url || '');
                                if (s.length <= 72) return s;
                                return s.slice(0, 44) + '…' + s.slice(-18);
                        }

                        function subInfoDomainV17(url) {
                                var m = String(url || '').match(/^https?:\/\/([^\/]+)/);
                                return m ? m[1] : 'подписка';
                        }

                        function subInfoClearV17() {
                                while (subInfoList.firstChild) subInfoList.removeChild(subInfoList.firstChild);
                        }

                        function subInfoCardV17(s) {
                                var used = Number(s.upload || 0) + Number(s.download || 0);
                                var total = Number(s.total || 0);
                                var left = total > 0 ? Math.max(0, total - used) : 0;
                                var expire = Number(s.expire || 0);
                                var nowSec = Math.floor(Date.now() / 1000);
                                var expired = expire > 0 && expire < nowSec;
                                var warnSoon = expire > 0 && expire >= nowSec && expire < nowSec + 7 * 86400;

                                var statusText = 'Активна';
                                var statusColor = '#4caf50';

                                if (s.status === 'no_userinfo') {
                                        statusText = 'нет данных от провайдера';
                                        statusColor = '#ff9800';
                                }

                                if (expired) {
                                        statusText = 'истекла';
                                        statusColor = '#f44336';
                                } else if (warnSoon) {
                                        statusText = 'скоро истекает';
                                        statusColor = '#ff9800';
                                }

                                var percent = '';
                                if (total > 0) {
                                        percent = ' / ' + Math.round((used / total) * 100) + '%';
                                }

                                return E('div', {
                                        'class': 'ss-card',
                                        style: 'padding:8px;background:rgba(255,255,255,.025);border-left:3px solid ' + statusColor
                                }, [
                                        E('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap' }, [
                                                E('div', { 'class': 'ss-card__title', style: 'font-size:13px' },
                                                        'Подписка #' + String(s.index || '?') + ' — ' + (s.title || subInfoDomainV17(s.url))),
                                                E('span', { 'class': 'ss-badge', style: 'color:' + statusColor }, statusText)
                                        ]),
                                        E('div', { 'class': 'ss-label', style: 'font-family:monospace;font-size:12px;margin-top:4px' }, subInfoShortUrlV17(s.url)),
                                        E('div', { 'class': 'ss-controls', style: 'margin-top:8px' }, [
                                                E('span', { 'class': 'ss-label' }, 'Проверено:'),
                                                E('span', { 'class': 'ss-val' }, subInfoDateV17(s.checked_at)),
                                                E('span', { 'class': 'ss-label' }, 'Добавлена локально:'),
                                                E('span', { 'class': 'ss-val' }, subInfoDateV17(s.first_seen)),
                                                E('span', { 'class': 'ss-label' }, 'Истекает:'),
                                                E('span', { 'class': 'ss-val', style: 'color:' + statusColor }, subInfoDateV17(s.expire))
                                        ]),
                                        E('div', { 'class': 'ss-controls', style: 'margin-top:6px' }, [
                                                E('span', { 'class': 'ss-label' }, 'Использовано:'),
                                                E('span', { 'class': 'ss-val' }, subInfoGbV17(used) + percent),
                                                E('span', { 'class': 'ss-label' }, 'Лимит:'),
                                                E('span', { 'class': 'ss-val' }, subInfoGbV17(total)),
                                                E('span', { 'class': 'ss-label' }, 'Осталось:'),
                                                E('span', { 'class': 'ss-val', style: 'color:#4caf50' }, subInfoGbV17(left))
                                        ]),
                                        E('div', { 'class': 'ss-label', style: 'margin-top:4px;color:#999' },
                                                s.status === 'no_userinfo'
                                                        ? 'Провайдер не отдал subscription-userinfo header. URL всё равно может работать, просто нет данных по GB/сроку.'
                                                        : ('Обновление профиля: ' + (s.profile_update_interval || 'нет данных')))
                                ]);
                        }

                        function subInfoLoadV17() {
                                subInfoStatus.textContent = 'Загружаю информацию по подпискам...';
                                subInfoStatus.style.color = '#999';

                                fs.exec('/usr/bin/sub-sync', ['subs-info']).then(function(r) {
                                        var data = {};
                                        try {
                                                data = JSON.parse((r.stdout || '{}').trim());
                                        } catch(e) {
                                                data = {};
                                        }

                                        var list = data.subscriptions || [];
                                        subInfoClearV17();

                                        if (list.length === 0) {
                                                subInfoList.appendChild(E('div', { 'class': 'ss-label' }, 'Подписок пока нет.'));
                                                subInfoStatus.textContent = '';
                                                return;
                                        }

                                        for (var i = 0; i < list.length; i++) {
                                                subInfoList.appendChild(subInfoCardV17(list[i]));
                                        }

                                        subInfoStatus.textContent = 'Обновлено: ' + subInfoDateV17(data.checked_at);
                                        subInfoStatus.style.color = '#4caf50';
                                }).catch(function(err) {
                                        subInfoStatus.textContent = 'Ошибка загрузки информации подписок';
                                        subInfoStatus.style.color = '#f44336';
                                        ui.addNotification(null, E('p', {}, 'subs-info failed: ' + (err.message || err)), 'danger');
                                });
                        }

                        var subInfoRefreshBtn = E('button', {
                                'class': 'cbi-button',
                                style: 'padding:2px 10px;font-size:12px;background:transparent;color:#4caf50;border:1px solid #4caf50',
                                click: subInfoLoadV17
                        }, 'Обновить инфо');

                        var subInfoBox = E('div', {
                                'class': 'ss-card',
                                style: 'padding:8px;margin:8px 0;background:rgba(255,255,255,.025)'
                        }, [
                                E('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap' }, [
                                        E('div', { 'class': 'ss-card__title', style: 'font-size:13px' }, 'Информация по подпискам'),
                                        E('div', { style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap' }, [subInfoRefreshBtn, subInfoStatus])
                                ]),
                                E('div', { 'class': 'ss-label', style: 'margin-top:6px;color:#999' },
                                        ''),
                                subInfoList
                        ]);

                        window.setTimeout(subInfoLoadV17, 800);
                    /* SUBSYNC_SECTION_CREATE_UI_V45B */
                    var sectionCreateStatusV45B = E('span', { 'class': 'ss-label', 'style': 'margin-left:8px;color:#888' }, '');
                    var sectionCreateInputV45B = E('input', {
                            'type': 'text',
                            'placeholder': 'например urlzks95',
                            'style': 'min-width:220px;margin-right:8px'
                    });

                    function ssCleanSectionNameV45B(v) {
                            return String(v || '').trim().replace(/[^A-Za-z0-9_]/g, '');
                    }

                    function ssReloadPageV45B() {
                            window.setTimeout(function() {
                                    try {
                                            var u = new URL(window.location.href);
                                            u.searchParams.set('_subsync_section_v45b', String(Date.now()));
                                            window.location.replace(u.toString());
                                    } catch(e) {
                                            window.location.reload();
                                    }
                            }, 900);
                    }

                    function ssCreatePodkopSectionV45B(ev) {
                            if (ev && ev.preventDefault)
                                    ev.preventDefault();

                            var raw = String(sectionCreateInputV45B.value || '').trim();
                            var name = ssCleanSectionNameV45B(raw);

                            if (!name) {
                                    sectionCreateStatusV45B.textContent = 'Введите имя секции';
                                    return;
                            }

                            if (name !== raw) {
                                    sectionCreateInputV45B.value = name;
                                    sectionCreateStatusV45B.textContent = 'Имя очищено: ' + name;
                            }

                            sectionCreateStatusV45B.textContent = 'Создаю...';

                            return fs.exec('/usr/bin/sub-sync-section', [ 'create', name ]).then(function(res) {
                                    var out = String((res && res.stdout) || '').trim();
                                    sectionCreateStatusV45B.textContent = out || 'OK';

                                    ui.addNotification(null, E('p', {}, 'Podkop-секция создана и выбрана как AutoAdd target: ' + name), 'info');
                                    ssReloadPageV45B();
                            }).catch(function(e) {
                                    sectionCreateStatusV45B.textContent = 'Ошибка создания';
                                    ui.addNotification(null, E('p', {}, 'Ошибка создания секции: ' + (e && e.message ? e.message : e)), 'danger');
                            });
                    }

                           /* SUBSYNC_SECTION_CARD_NO_LEFT_LINE_V63 */
                    var sectionCreateCardV45B = E('div', { 'class': 'ss-card', 'style': 'margin-top:10px' }, [
                            E('h3', {}, 'Создать Podkop-секцию'),
                            E('div', { 'class': 'ss-label', 'style': 'margin-bottom:8px' },
                                    'Порядок: создай секцию → выбери серверы ниже в Podcop Sub v666 → серверы сразу попадут в выбранную секцию → обнови страницу. Нижнюю кнопку LuCI "Сохранить/Применить" не нажимай.'),
                            E('div', { 'class': 'ss-controls' }, [
                                    sectionCreateInputV45B,
                                    E('button', {
                                            'class': 'btn cbi-button cbi-button-positive',
                                            'click': ssCreatePodkopSectionV45B
                                    }, 'Создать и выбрать секцию'),
                                    sectionCreateStatusV45B
                            ])
                    ]);

                    window.setTimeout(function() {
                            fs.exec('/usr/bin/sub-sync-section', [ 'target' ]).then(function(res) {
                                    var t = String((res && res.stdout) || '').trim();
                                    if (t && !sectionCreateInputV45B.value)
                                            sectionCreateInputV45B.value = t;
                            }).catch(function() {});
                    }, 150);

			var subsCard = E('div', { 'class': 'ss-card' }, [
				E('div', { 'class': 'ss-card__header' }, [
					E('div', { 'class': 'ss-card__title' }, 'Подписки (' + subscriptions.length + ')')
				]),
                                /* SUBSYNC_HIDE_SINGLE_SUB_ROW_V26: old single subscription input row hidden; use bulk add block only */
                                subInfoBox,
                                subBulkBox,
				subsListEl,
				E('div', { 'class': 'ss-controls' }, [
					E('span', { 'class': 'ss-label' }, 'Автообновление:'),
					intervalSelect, intervalSaveBtn,
					syncBtn
				])
			]);

			var LIMIT = 25; /* SUBSYNC_SERVER_TABLE_LIMIT_V179B */

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
				var t = sectionTypes[sn];
				if (!t) {
					for (var sti = 0; sti < sections.length; sti++) {
						if (sections[sti].name === sn) { t = sections[sti].type || 'url'; break; }
					}
				}
				sectionTypeSelect.value = t || 'url';
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
            var xhttpTable = null;
            var xhttpHeading = null;
            var xhttpTableContainer = null;
            var xhttpEmptyMsg = null;
            var xhttpSectionSelect = null;
            var ssXhttpAutoApplyBtn = null;
            var SUBSYNC_XHTTP_URLTEST_V5 = true;
            var SUBSYNC_XHTTP_USED_STATUS_V6 = true;
            var SUBSYNC_XHTTP_GREEN_BUTTON_V7 = true;
            var SUBSYNC_XHTTP_PING_BUTTON_V9 = true;
            var SUBSYNC_XHTTP_PING_BADGE_V8 = true;
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
                var xhttpBtns = [];
                if (serverTable) xhttpBtns = xhttpBtns.concat(Array.prototype.slice.call(serverTable.querySelectorAll('button[data-xhttp="1"]')));
                if (xhttpTable) xhttpBtns = xhttpBtns.concat(Array.prototype.slice.call(xhttpTable.querySelectorAll('button[data-xhttp="1"]')));
				for (var xbi = 0; xbi < xhttpBtns.length; xbi++) {
					var xb = xhttpBtns[xbi];
					if (xb.dataset.selected === '1') continue;
                                            if (xb.dataset.urltest !== '1' && mode !== 'outbound') {
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
if (sec3) { syncAllBtnStates(sec3); ssHydrateActiveBadgesV28(sec3); }
				updateXhttpButtons();
			});
			sectionTypeSelect.addEventListener('change', function() {
				var sec3 = globalSectionSelect.value;
				var newType = sectionTypeSelect.value;
				if (sec3) {
					var oldType = sectionTypes[sec3] || 'url';
					sectionTypes[sec3] = newType;
					if (oldType !== newType) {
						activeLinksBySection[sec3] = [];
						if (oldType === 'url') uci.unset('podkop', sec3, 'proxy_string');
						else if (oldType === 'outbound') uci.unset('podkop', sec3, 'outbound_json');
						else if (oldType === 'selector') uci.unset('podkop', sec3, 'selector_proxy_links');
						else uci.unset('podkop', sec3, 'urltest_proxy_links');
						uci.set('podkop', sec3, 'proxy_config_type', newType);
						resetAllSelectBtns();
						syncAllBtnStates(sec3);
						rebuildActiveServers();
						showApplyNeeded();
					}
				}
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
					/* SUBSYNC_PING_SORT_NO_JUMP_V80 */
rows[j].className = 'tr ' + (j % 2 === 0 ? 'cbi-rowstyle-1' : 'cbi-rowstyle-2') + (!serverLimitExpandedV79 && j >= LIMIT ? ' ss-server-hidden-v79' : '');
					serverTable.appendChild(rows[j]);
					var numCell = rows[j].querySelector('.td[data-title="#"]');
					if (numCell) numCell.textContent = String(j + 1);
				}
			}

                              /* SUBSYNC_HY2_PING_UI_V172 */
                              function isHy2ServerPingV172(s) {
                                      var p = String((s && (s.proto || s.protocol || s.scheme)) || "").toLowerCase();
                                      var t = String((s && (s.type || s.transport)) || "").toLowerCase();
                                      var l = String((s && s.link) || "").toLowerCase();
                                      return p === "hy2" || p === "hysteria2" || l.indexOf("hy2://") === 0 || l.indexOf("hysteria2://") === 0 || (p === "hysteria2" && t === "quic");
                              }
                              function createHy2PingCellV172(s) {
                                      return E("span", {
                                              "data-hy2-ping-v172": "1",
                                              "style": "font-size:11px;cursor:help;color:#4caf50;font-weight:600",
                                              "title": "HYSTERIA2/QUIC: обычный TCP/HTTPS ping неприменим. Проверка: выбрать в секцию, sing-box check и Podkop Nice."
                                      }, "QUIC");
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
                                   parts.push(t === 'xhttp' ? 'xHTTP' : t === 'quic' ? 'QUIC' : t === 'ok' ? 'Активна' : String(t || '?').toUpperCase());
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
					uci.save().then(function() {
						if (typeof L !== 'undefined' && L.ui && L.ui.changes) {
							L.ui.changes.renderChangeIndicator();
						}
					}).catch(function(err) {
					});
				}, 400);
			}

			function markBtnSelected(btn, link2) {
				btn.dataset.selected = '1';
btn.dataset.link = ssNormLinkV28(link2 || btn.dataset.link || "");
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
                        if (ssXhttpAutoApplyBtn) {
                                var apBtn = ssXhttpAutoApplyBtn;
                                ssXhttpAutoApplyBtn = null;
                                apBtn.disabled = true;
                                apBtn.textContent = 'Applying...';
                                uci.save().then(function() {
                                        return uci.apply();
                                }).then(function() {
                                        apBtn.disabled = false;
                                        if (apBtn.dataset.selected === '1') {
                                                apBtn.className = 'cbi-button cbi-button-neutral';
                                                apBtn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px;border-color:#4caf50;color:#4caf50';
                                                apBtn.title = 'Этот сервер выбран в URL Test';
                                                apBtn.textContent = 'Выбрано';
                                        } else {
                                                apBtn.className = 'cbi-button cbi-button-action';
                                                apBtn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px';
                                                apBtn.title = 'Нажми, чтобы применить в URL Test';
                                                apBtn.textContent = 'Выбрать';
                                        }
                                        ui.addNotification(null, E('p', {}, 'xHTTP applied to URL Test'), 'info');
                                        try { ssRebuildXhttpCardV2(servers); } catch(e) {}
                                }).catch(function(err) {
                                        apBtn.disabled = false;
                                        if (apBtn.dataset.selected === '1') {
                                                apBtn.className = 'cbi-button cbi-button-neutral';
                                                apBtn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px;border-color:#4caf50;color:#4caf50';
                                                apBtn.title = 'Этот сервер выбран в URL Test';
                                                apBtn.textContent = 'Выбрано';
                                        } else {
                                                apBtn.className = 'cbi-button cbi-button-action';
                                                apBtn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px';
                                                apBtn.title = 'Нажми, чтобы применить в URL Test';
                                                apBtn.textContent = 'Выбрать';
                                        }
                                        ui.addNotification(null, E('p', {}, 'URL Test apply error: ' + (err.message || err)), 'danger');
                                });
                                return;
                        }
				debouncedSave();
			}

			function syncAllBtnStates(sec3) {
				if (!serverTable) return;
				var curLinks = activeLinksBySection[sec3] || [];

				var rows = serverTable.querySelectorAll('.tr[data-link]');
				for (var ri2 = 0; ri2 < rows.length; ri2++) {
					var row = rows[ri2];
					var rowLink = row.dataset.link;
var isAct = ssLinkInListV28(rowLink, curLinks);
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
                            var btnXhttpUrlTest = btn.dataset.urltest === '1';
						if (btn.disabled) return;
                            var sec3 = btnXhttpUrlTest && xhttpSectionSelect ? xhttpSectionSelect.value : globalSectionSelect.value;
						if (!sec3) { ui.addNotification(null, E('p', {}, 'Выберите секцию'), 'danger'); return; }
                            var secType = btnXhttpUrlTest ? 'urltest' : (sectionTypeSelect ? sectionTypeSelect.value : 'url');
						var isMulti = (secType === 'selector' || secType === 'urltest');
						var listKey = secType === 'selector' ? 'selector_proxy_links' : 'urltest_proxy_links';


						if (btn.dataset.selected === '1') {
var savedLink = btn.dataset.link || (btn.closest(".tr") ? btn.closest(".tr").dataset.link : "");

							btn.disabled = true; btn.textContent = '...';
							if (secType === 'outbound') {
								uci.unset('podkop', sec3, 'outbound_json');
								activeLinksBySection[sec3] = [];
							} else if (secType === 'url') {
								uci.unset('podkop', sec3, 'proxy_string');
								activeLinksBySection[sec3] = [];
							} else {
								var myLinks = (activeLinksBySection[sec3] || []).filter(function(l) { return ssNormLinkV28(l) !== ssNormLinkV28(savedLink); });
								activeLinksBySection[sec3] = myLinks;
								if (myLinks.length > 0) uci.set('podkop', sec3, listKey, myLinks);
								else uci.unset('podkop', sec3, listKey);
							}
							if (isMulti) {
								markBtnDeselected(btn);
								syncAllBtnStates(sec3);
                                                                    if (btnXhttpUrlTest) ssXhttpAutoApplyBtn = btn;
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
							if (secType === 'outbound') {
								uci.set('podkop', sec3, 'proxy_config_type', secType);
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
								uci.set('podkop', sec3, 'proxy_config_type', secType);
								resetAllSelectBtns();
								uci.set('podkop', sec3, 'proxy_string', link2);
								uci.unset('podkop', sec3, 'outbound_json');
								activeLinksBySection[sec3] = [link2];
							} else {
								sectionTypes[sec3] = secType;
								var myLinks = (activeLinksBySection[sec3] || []).slice();
if (!ssLinkInListV28(link2, myLinks)) {
									myLinks.push(link2);
								}
								activeLinksBySection[sec3] = myLinks;
								uci.set('podkop', sec3, 'proxy_config_type', secType);
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
                                   'class': 'tr' + (idx % 2 === 0 ? ' cbi-rowstyle-1' : ' cbi-rowstyle-2') + (!serverLimitExpandedV79 && idx >= LIMIT ? ' ss-server-hidden-v79' : ''),
                                   'style': (isActive ? 'border-left:3px solid #4caf50' : ''),
					'data-link': s.link || ''
				}, [
					E('div', { 'class': 'td', 'data-title': '#' }, String(s.id || idx + 1)),
                                   E('div', { 'class': 'td', 'data-title': 'Протокол' }, (s.proto || '?') === 'ok' ? 'Активна' : (s.proto || '?').toUpperCase()),
					E('div', { 'class': 'td', 'data-title': 'Транспорт', 'style': 'font-size:12px' }, formatTransport(s)),
					E('div', { 'class': 'td', 'data-title': 'Имя' }, nameChildren),
					E('div', { 'class': 'td', 'data-title': 'Адрес', 'style': 'font-family:monospace;font-size:12px' },
						(s.addr || '') + ':' + (s.port || '')),
					E('div', { 'class': 'td', 'data-title': 'Пинг', 'style': 'text-align:center' }, [(isHy2ServerPingV172(s) ? createHy2PingCellV172(s) : createPingCell(s.id || (idx + 1)))]),
					E('div', { 'class': 'td', 'style': 'text-align:right' }, E('div', { 'style': 'display:flex;gap:4px;justify-content:flex-end' }, [selectBtn, copyBtn]))
				]);
			}

			var currentActiveLinks = getCurrentActiveLinks();
			for (var ri = 0; ri < servers.length; ri++) {
var isActive = ssLinkInListV28(servers[ri].link, currentActiveLinks);
				sRows.push(createServerRow(servers[ri], ri, isActive));
			}

			serverTable = E('div', { 'class': 'table' }, sRows);
/* SUBSYNC_ACTIVE_BADGE_STICKY_V28_RENDER_CALL */
if (typeof window !== "undefined") window.setTimeout(function() { try { ssHydrateActiveBadgesV28(globalSectionSelect ? globalSectionSelect.value : ""); } catch(e) {} }, 350);
			var serversHeading = E('h3', {}, 'Серверы (' + servers.length + ')');

			var pingAllBtn = E('button', {
				'class': 'cbi-button',
				'style': 'padding:2px 10px;font-size:12px;background:transparent;color:#4caf50;border:1px solid #4caf50',
				'click': function() {
					if (pingAllBtn.disabled) return;
					pingAllBtn.disabled = true;
					pingAllBtn.textContent = 'Проверка...';
                                   /* SUBSYNC_SERVER_LIMIT_PING_V79_PING */
                                   var pingCells = [];
                                   var pingRowsV79 = serverTable.querySelectorAll('.tr[data-link]');
                                   var expandedPingV79 = !!serverLimitExpandedV79;
                                   var maxPingV79 = expandedPingV79 ? pingRowsV79.length : Math.min(LIMIT, pingRowsV79.length);
                                   try { if (!expandedPingV79 && typeof applyServerLimitV79 === 'function') applyServerLimitV79(); } catch(e) {}
                                   for (var prV79 = 0; prV79 < pingRowsV79.length; prV79++) {
                                           if (!expandedPingV79 && prV79 >= LIMIT) break;
                                           var cellV79 = pingRowsV79[prV79].querySelector('.td[data-title="Пинг"] span');
                                           if (cellV79) pingCells.push(cellV79);
                                           if (pingCells.length >= maxPingV79) break;
                                   }
					var idx2 = 0;
					function pingNext() {
						if (idx2 >= pingCells.length) {
							pingAllBtn.disabled = false;
							pingAllBtn.textContent = 'Проверить пинг';
							return;
						}
						pingCells[idx2].click();
                                           try {
                                                   if (!serverLimitExpandedV79 && typeof applyServerLimitV79 === 'function') {
                                                           window.setTimeout(applyServerLimitV79, 20);
                                                           window.setTimeout(applyServerLimitV79, 200);
                                                           window.setTimeout(applyServerLimitV79, 700);
                                                   }
                                           } catch(e) {}
						idx2++;
						window.setTimeout(pingNext, 300);
					}
					pingNext();
				}
			}, 'Проверить пинг');

                   /* SUBSYNC_SERVER_LIMIT_PING_V79 */
                   var serverLimitExpandedV79 = false;
                   var toggleBtnContainer = E('div', { 'style': 'margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-start' });

                   function setServerRowHiddenV79(row, hidden) {
                           if (!row) return;
                           var cls = row.className || '';
                           if (hidden) {
                                   if ((' ' + cls + ' ').indexOf(' ss-server-hidden-v79 ') < 0)
                                           row.className = cls + ' ss-server-hidden-v79';
                           } else {
                                   row.className = (' ' + cls + ' ').replace(/ ss-server-hidden-v79 /g, ' ').replace(/^\s+|\s+$/g, '');
                           }
                   }

                   function renderServerLimitButtonV79(total) {
                           while (toggleBtnContainer.firstChild) toggleBtnContainer.removeChild(toggleBtnContainer.firstChild);
                           if (total <= LIMIT) return;
                           toggleBtnContainer.appendChild(E('button', {
                                   'class': 'cbi-button cbi-button-neutral',
                                   'style': 'margin-top:0',
                                   'click': function() {
                                           serverLimitExpandedV79 = !serverLimitExpandedV79;
                                           applyServerLimitV79();
                                   }
                           }, serverLimitExpandedV79 ? 'Свернуть' : 'Показать все (' + total + ')'));
                   }

                   function applyServerLimitV79() {
                           var rows = serverTable.querySelectorAll('.tr[data-link]');
                           for (var hi = 0; hi < rows.length; hi++) {
                                   setServerRowHiddenV79(rows[hi], !serverLimitExpandedV79 && hi >= LIMIT);
                           }
                           renderServerLimitButtonV79(rows.length);
                   }

                   applyServerLimitV79();
			function rebuildServerTable(newServers) {
				while (serverTable.firstChild) serverTable.removeChild(serverTable.firstChild);
				serverTable.appendChild(headerRow);
				var curActive = getCurrentActiveLinks();
				for (var ni = 0; ni < newServers.length; ni++) {
					var nsActive = newServers[ni].link ? curActive.indexOf(newServers[ni].link.trim()) >= 0 : false;
					serverTable.appendChild(createServerRow(newServers[ni], ni, nsActive));
				}
				serversHeading.textContent = 'Серверы (' + newServers.length + ')';
                ssRebuildXhttpCardV2(newServers);
				if (tableContainer) tableContainer.style.display = newServers.length > 0 ? '' : 'none';
				if (emptyMsg) emptyMsg.style.display = newServers.length > 0 ? 'none' : '';
                           serverLimitExpandedV79 = false;
                           applyServerLimitV79();
			}

			var emptyMsg = E('em', { 'style': servers.length > 0 ? 'display:none' : '', 'class': 'ss-label' }, 'Серверы ещё не загружены. Добавьте подписку и нажмите "Загрузить серверы".');
			var tableContainer = E('div', { 'style': servers.length > 0 ? '' : 'display:none' }, [
                   E('style', {}, '.ss-table-wrap .table .tr.ss-server-hidden-v79{display:none!important;}'),
                   E('div', { 'class': 'ss-table-wrap' }, [serverTable]),
                   toggleBtnContainer
			]);
                        var SUBSYNC_AUTOPICK_UI_V13 = true;
                        var SUBSYNC_AUTOPICK_CLEAN_V15 = true;

                        var apSection = E('select', { 'class': 'cbi-input-select ss-select' });
                        for (var apSi = 0; apSi < sections.length; apSi++) {
                                apSection.appendChild(E('option', { value: sections[apSi].name }, sections[apSi].name + ' (' + (sections[apSi].type || 'urltest') + ')'));
                        }
                        if (sections.length === 0) {
                                apSection.appendChild(E('option', { value: 'TEST123' }, 'TEST123'));
                        }

                        var apOldMode = E('select', { 'class': 'cbi-input-select ss-select' }, [
                                E('option', { value: 'replace' }, 'заменить'),
                                E('option', { value: 'append' }, 'добавить')
                        ]);

                        var apMaxPing = E('input', { type: 'text', value: '700', style: 'width:90px' });
                        var apLimit = E('input', { type: 'text', value: '60', style: 'width:90px' });

                        var apUsePing = E('input', { type: 'checkbox' });
                        var apUseTransport = E('input', { type: 'checkbox' });
                        var apUseProto = E('input', { type: 'checkbox' });
                        var apUseCountry = E('input', { type: 'checkbox' });
                        var apAutoLogic = E('input', { type: 'checkbox' });

                        var apTransport = E('select', { 'class': 'cbi-input-select ss-select' }, [
                                E('option', { value: 'any' }, 'любой'),
                                E('option', { value: 'xhttp' }, 'xHTTP'),
                                E('option', { value: 'ws' }, 'WS'),
                                E('option', { value: 'tcp' }, 'TCP'),
                                E('option', { value: 'grpc' }, 'gRPC'),
                                E('option', { value: 'quic' }, 'QUIC')
                        ]);

                        var apProto = E('select', { 'class': 'cbi-input-select ss-select' }, [
                                E('option', { value: 'any' }, 'любой'),
                                E('option', { value: 'vless' }, 'VLESS'),
                                E('option', { value: 'trojan' }, 'TROJAN'),
                                E('option', { value: 'ss' }, 'SS'),
                                E('option', { value: 'hy2' }, 'HY2')
                        ]);

                        var apCountry = E('input', {
                                type: 'text',
                                value: 'ru, de, nl, turkey',
                                placeholder: 'ru, de, nl, turkey',
                                style: 'width:190px'
                        });

                        var apStatus = E('div', { 'class': 'ss-label', style: 'margin-top:8px' }, '');
                        var apRows = E('div', { 'class': 'table', style: 'margin-top:10px' });
                        var apSelected = [];

                        function apInt(v, def) {
                                var n = parseInt(String(v || '').replace(/[^0-9]/g, ''), 10);
                                return isNaN(n) ? def : n;
                        }

                        function apList(v) {
                                return String(v || '').split(',').map(function(x) {
                                        return x.trim().toLowerCase();
                                }).filter(function(x) { return x.length > 0; });
                        }

                        function apTransportOf(s) {
                                return String((s && s.type) || '').toLowerCase() || 'tcp';
                        }

                        function apProtoOf(s) {
                                return String((s && s.proto) || '').toLowerCase();
                        }

                        function apCountryTextOf(s) {
                                return String((s && (s.name || s.tag || s.addr)) || '').toLowerCase();
                        }

                        function apMatchBase(s) {
                                if (apUseTransport.checked && apTransport.value !== 'any') {
                                        if (apTransportOf(s) !== apTransport.value) return false;
                                }

                                if (apUseProto.checked && apProto.value !== 'any') {
                                        if (apProtoOf(s) !== apProto.value) return false;
                                }

                                if (apUseCountry.checked) {
                                        var lst = apList(apCountry.value);
                                        var text = apCountryTextOf(s);
                                        var ok = false;
                                        for (var i = 0; i < lst.length; i++) {
                                                if (text.indexOf(lst[i]) >= 0) { ok = true; break; }
                                        }
                                        if (!ok) return false;
                                }

                                return true;
                        }

                        function apClearRows() {
                                while (apRows.firstChild) apRows.removeChild(apRows.firstChild);
                                apRows.appendChild(E('div', { 'class': 'tr table-titles' }, [
                                        E('div', { 'class': 'th', style: 'width:38px' }, ''),
                                        E('div', { 'class': 'th', style: 'width:55px' }, '#'),
                                        E('div', { 'class': 'th', style: 'width:70px' }, 'Пинг'),
                                        E('div', { 'class': 'th', style: 'width:90px' }, 'Транспорт'),
                                        E('div', { 'class': 'th' }, 'Сервер'),
                                        E('div', { 'class': 'th', style: 'width:70px' }, 'Протокол')
                                ]));
                        }

                        function apAddRow(s, ms, checked) {
                                var cb = E('input', { type: 'checkbox' });
                                cb.checked = checked !== false;
                                cb.dataset.id = String(s.id || '');

                                apRows.appendChild(E('div', { 'class': 'tr' }, [
                                        E('div', { 'class': 'td', style: 'width:38px' }, cb),
                                        E('div', { 'class': 'td', style: 'width:55px' }, '#' + String(s.id || '')),
                                        E('div', { 'class': 'td', style: 'width:70px;color:#4caf50;font-weight:700;font-family:monospace' }, ms ? (ms + 'мс') : '—'),
                                        E('div', { 'class': 'td', style: 'width:90px' }, apTransportOf(s)),
                                        E('div', { 'class': 'td' }, s.name || s.addr || ''),
                                        E('div', { 'class': 'td', style: 'width:70px' }, apProtoOf(s) === 'ok' ? 'Активна' : apProtoOf(s).toUpperCase())
                                ]));
                        }

                        function apPickCandidates() {
                                var out = [];
                                var limit = apInt(apLimit.value, 60);

                                for (var i = 0; i < servers.length; i++) {
                                        if (!apMatchBase(servers[i])) continue;
                                        out.push(servers[i]);
                                        if (out.length >= limit) break;
                                }

                                return out;
                        }

                        function apPingAndPick() {
                                apClearRows();
                                apSelected = [];

                                var candidates = apPickCandidates();
                                var maxPing = apInt(apMaxPing.value, 700);
                                var usePing = apUsePing.checked;
                                var idx = 0;
                                var okCount = 0;

                                apStatus.textContent = 'Проверка: 0 из ' + candidates.length;

                                function next() {
                                        if (idx >= candidates.length) {
                                                apStatus.textContent = 'Готово. Найдено рабочих/подходящих: ' + okCount + '. Проверь галки и нажми применить.';
                                                return;
                                        }

                                        var s = candidates[idx++];
                                        if (!usePing) {
                                                apSelected.push(s);
                                                apAddRow(s, 0, true);
                                                okCount++;
                                                apStatus.textContent = 'Отобрано: ' + okCount + ' из ' + candidates.length;
                                                window.setTimeout(next, 20);
                                                return;
                                        }

                                        fs.exec('/usr/bin/sub-sync', ['ping', String(s.id)]).then(function(r) {
                                                var data = {};
                                                try { data = JSON.parse((r.stdout || '{}').trim()); } catch(e) { data = {}; }

                                                var ms = parseInt(data.ms || 0, 10);
                                                if (data.status === 'ok' && ms > 0 && ms <= maxPing) {
                                                        apSelected.push(s);
                                                        apAddRow(s, ms, true);
                                                        okCount++;
                                                }

                                                apStatus.textContent = 'Проверка: ' + idx + ' из ' + candidates.length + ', подходит: ' + okCount;
                                                window.setTimeout(next, 120);
                                        }).catch(function() {
                                                apStatus.textContent = 'Проверка: ' + idx + ' из ' + candidates.length + ', подходит: ' + okCount;
                                                window.setTimeout(next, 120);
                                        });
                                }

                                next();
                        }

                        function apCheckedIds() {
                                var ids = [];
                                var boxes = apRows.querySelectorAll('input[type="checkbox"][data-id]');
                                for (var i = 0; i < boxes.length; i++) {
                                        if (boxes[i].checked && boxes[i].dataset.id)
                                                ids.push(boxes[i].dataset.id);
                                }
                                return ids;
                        }

                        function apSaveConfig() {
                                var transports = apTransport.value === 'any' ? 'xhttp,ws,tcp,grpc,quic' : apTransport.value;
                                var protos = apProto.value === 'any' ? 'vless,trojan,ss,hy2' : apProto.value;

                                var args = [
                                        'config-set',
                                        apAutoLogic.checked ? '1' : '0',
                                        apSection.value || 'TEST123',
                                        apOldMode.value || 'replace',
                                        String(apInt(apLimit.value, 60)),
                                        apUsePing.checked ? '1' : '0',
                                        String(apInt(apMaxPing.value, 700)),
                                        apUseTransport.checked ? '1' : '0',
                                        transports,
                                        apUseProto.checked ? '1' : '0',
                                        protos,
                                        apUseCountry.checked ? '1' : '0',
                                        apCountry.value || '',
                                        '1'
                                ];

                                return fs.exec('/usr/bin/sub-sync-autoadd', args).then(function(r) {
                                        apStatus.textContent = 'Автологика сохранена.';
                                        return r;
                                });
                        }

                        function apApplySelected() {
                                var ids = apCheckedIds();
                                if (ids.length === 0) {
                                        ui.addNotification(null, E('p', {}, 'Ничего не выбрано'), 'warning');
                                        return;
                                }

                                var args = ['apply-ids', apSection.value || 'TEST123', apOldMode.value || 'replace'].concat(ids);

                                apStatus.textContent = 'Применяю выбранные...';

                                fs.exec('/usr/bin/sub-sync-autoadd', args).then(function(r) {
                                        apStatus.textContent = (r.stdout || '').trim() || 'Применено.';
                                        ui.addNotification(null, E('p', {}, apStatus.textContent), 'info');
                                }).catch(function(err) {
                                        apStatus.textContent = 'Ошибка применения.';
                                        ui.addNotification(null, E('p', {}, 'AutoPick apply failed: ' + (err.message || err)), 'danger');
                                });
                        }

                        function apUpdatePickApply() {
                                apStatus.textContent = 'Сохраняю автологику и обновляю подписки...';
                                apSaveConfig().then(function() {
                                        return fs.exec('/usr/bin/sub-sync', ['sync']);
                                }).then(function(r) {
                                        apStatus.textContent = 'Обновление выполнено. AutoAdd применит текущую автологику.';
                                        ui.addNotification(null, E('p', {}, 'Обновлено и применено по автологике'), 'info');
                                }).catch(function(err) {
                                        apStatus.textContent = 'Ошибка обновления.';
                                        ui.addNotification(null, E('p', {}, 'Update failed: ' + (err.message || err)), 'danger');
                                });
                        }

                        var apPingBtn = E('button', {
                                'class': 'cbi-button',
                                style: 'padding:2px 10px;font-size:12px;background:transparent;color:#4caf50;border:1px solid #4caf50',
                                click: apPingAndPick
                        }, 'Пинг + отобрать');

                        var apApplyBtn = E('button', {
                                'class': 'cbi-button cbi-button-action',
                                style: 'padding:2px 10px;font-size:12px',
                                click: apApplySelected
                        }, 'Применить выбранные в urltest');

                        var apUpdateBtn = E('button', {
                                'class': 'cbi-button',
                                style: 'padding:2px 10px;font-size:12px',
                                click: apUpdatePickApply
                        }, 'Обновить + отобрать + применить');

                        var apSaveBtn = E('button', {
                                'class': 'cbi-button',
                                style: 'padding:2px 10px;font-size:12px;background:transparent;color:#4caf50;border:1px solid #4caf50',
                                click: function() {
                                        apSaveConfig().then(function() {
                                                ui.addNotification(null, E('p', {}, 'Автологика сохранена'), 'info');
                                        });
                                }
                        }, 'Сохранить автологику');

                        var autoPickCard = E('div', { 'class': 'ss-card', style: 'margin-top:10px' }, [
                                E('div', { 'class': 'ss-card__header' }, [
                                        E('div', { 'class': 'ss-card__title' }, 'Автоподбор серверов после обновления')
                                ]),
                                E('div', { 'class': 'ss-label', style: 'margin-bottom:10px' },
                                        'Меню для рутины: обновить подписки, отфильтровать серверы, пропинговать рабочие и применить выбранные в urltest. Фильтр по стране ищет текст в названии/адресе/ссылке, если страна есть в подписке.'),
                                E('div', { 'class': 'ss-controls' }, [
                                        E('span', { 'class': 'ss-label' }, 'Секция Podkop'), apSection,
                                        E('span', { 'class': 'ss-label' }, 'Старые серверы'), apOldMode,
                                        E('span', { 'class': 'ss-label' }, 'Макс. пинг, мс'), apMaxPing,
                                        E('span', { 'class': 'ss-label' }, 'Сколько проверять'), apLimit
                                ]),
                                E('div', { 'class': 'ss-controls' }, [
                                        apUsePing, E('span', { 'class': 'ss-label' }, 'отфильтрованные по пингу'),
                                        apUseTransport, E('span', { 'class': 'ss-label' }, 'тип транспорта'),
                                        apTransport,
                                        apUseProto, E('span', { 'class': 'ss-label' }, 'тип протокола'),
                                        apProto
                                ]),
                                E('div', { 'class': 'ss-controls' }, [
                                        apUseCountry, E('span', { 'class': 'ss-label' }, 'страна / текст'),
                                        apCountry,
                                        apPingBtn,
                                        apApplyBtn,
                                        apUpdateBtn
                                ]),
                                E('div', { 'class': 'ss-card', style: 'padding:8px;margin-top:8px' }, [
                                        E('div', { 'class': 'ss-controls' }, [
                                                apAutoLogic,
                                                E('span', { 'class': 'ss-label' }, 'применять эту логику при автообновлении подписок'),
                                                apSaveBtn
                                        ]),
                                        /* SUBSYNC_AUTO_LOGIC_BLOCK_V32 */
                                        E('div', { 'class': 'ss-label' },
                                                'При включении cron-обновление sub-sync после загрузки подписок само отберёт серверы по текущим фильтрам и применит их.'),
                                        E('div', {
                                                'class': 'ss-label',
                                                'style': 'color:#f44336;font-weight:bold;margin-top:4px;animation:ssAutologicWarningBlinkV59 5s ease-in-out infinite'
                                        }, 'Важно: при включении автологики Podkop/sing-box может перезапускаться.'),
                                        E('div', {
                                                'class': 'ss-label',
                                                'style': 'margin-top:4px'
                                        }, 'Если cron стоит каждый час - перезапуск может быть каждый час. Лучше ставить автообновление раз в сутки ночью или запускать вручную.'),
                                        E('div', {
                                                'class': 'ss-controls',
                                                'style': 'margin-top:8px'
                                        }, [
                                                E('span', { 'class': 'ss-label' }, 'Время автообновления подписок:'),
                                                E('input', {
                                                        'id': 'subsync-cron-time-v32',
                                                        'type': 'time',
                                                        'value': '04:10',
                                                        'style': 'height:24px;max-width:105px'
                                                }),
                                                E('button', {
                                                        'class': 'cbi-button',
                                                        'style': 'padding:2px 10px;font-size:12px;background:transparent;color:#4caf50;border:1px solid #4caf50',
                                                        'click': function() {
                                                                var inp = document.getElementById('subsync-cron-time-v32');
                                                                var msg = document.getElementById('subsync-cron-msg-v32');
                                                                var tm = String((inp && inp.value) || '').trim();
                                                                var p = tm.split(':');

                                                                if (!/^[0-2][0-9]:[0-5][0-9]$/.test(tm) || Number(p[0]) > 23) {
                                                                        if (msg) msg.textContent = 'Неверное время cron';
                                                                        return;
                                                                }

                                                                if (msg) msg.textContent = 'Сохраняю время cron...';

                                                                fs.exec('/usr/bin/sub-sync-autoadd', ['cron-set', tm]).then(function() {
                                                                        if (msg) msg.textContent = 'Время cron сохранено: ' + tm + '. Обновление будет раз в сутки.';
                                                                }).catch(function() {
                                                                        if (msg) msg.textContent = 'Ошибка сохранения cron';
                                                                });
                                                        }
                                                }, 'Сохранить время')
                                        ]),
                                        E('div', {
                                                'id': 'subsync-cron-msg-v32',
                                                'class': 'ss-label',
                                                'style': 'margin-top:4px;font-size:11px;opacity:.85'
                                        }, 'Сохранение времени включает ежедневное cron-обновление подписок.')
                                ]),
                                apStatus,
                                apRows
                        ]);

                        apClearRows();
                        /* SUBSYNC_ADD_BUTTONS_V33B */
                        window.setTimeout(function subsyncAddButtonsV33BStart() {
                                function run(n) {
                                        try {
                                                var btns = document.querySelectorAll('button');
                                                var foundAddOnly = 0;
                                                var foundAddLoad = 0;

                                                for (var i = 0; i < btns.length; i++) {
                                                        var txt = String(btns[i].textContent || '').trim();

                                                        if (txt === 'Добавить список') {
                                                                btns[i].style.display = 'none';
                                                                foundAddOnly = 1;
                                                        }

                                                        if (txt === 'Добавить + загрузить серверы') {
                                                                btns[i].style.cssText =
                                                                        'padding:2px 10px;font-size:12px;' +
                                                                        'background:transparent;color:#4caf50;' +
                                                                        'border:1px solid #4caf50';
                                                                foundAddLoad = 1;
                                                        }
                                                }

                                                var els = document.querySelectorAll('.ss-label,h1,h2,h3,h4,p,legend,span');
                                                for (var j = 0; j < els.length; j++) {
                                                        var t = String(els[j].textContent || '').trim();

                                                        if (t === 'Добавить несколько подписок') {
                                                                els[j].textContent = 'Добавить одну или несколько подписок';
                                                        }

                                                        if (t.indexOf('Вставь несколько ссылок, каждую с новой строки.') === 0) {
                                                                els[j].textContent =
                                                                        'Вставь одну или несколько ссылок, каждую с новой строки. ' +
                                                                        'Если одна подписка просрочилась, остальные продолжат работать при загрузке серверов.';
                                                        }
                                                }

                                                if ((foundAddOnly === 0 || foundAddLoad === 0) && n < 20) {
                                                        window.setTimeout(function() { run(n + 1); }, 300);
                                                }
                                        } catch(e) {}
                                }

                                run(0);
                        }, 300);

                        window.setTimeout(function() {
                                fs.exec('/usr/bin/sub-sync-autoadd', ['config-get']).then(function(r) {
                                        var cfg = {};
                                        try { cfg = JSON.parse((r.stdout || '{}').trim()); } catch(e) { cfg = {}; }

                                        if (cfg.target_section) apSection.value = cfg.target_section;
                                        if (cfg.mode) apOldMode.value = cfg.mode;
                                        if (cfg.max_ping) apMaxPing.value = String(cfg.max_ping);
                                        if (cfg.limit) apLimit.value = String(cfg.limit);

                                        apUsePing.checked = cfg.use_ping_filter === 1 || cfg.use_ping_filter === '1';
                                        apUseTransport.checked = cfg.use_transport_filter === 1 || cfg.use_transport_filter === '1';
                                        apUseProto.checked = cfg.use_proto_filter === 1 || cfg.use_proto_filter === '1';
                                        apUseCountry.checked = cfg.use_country_filter === 1 || cfg.use_country_filter === '1';
                                        apAutoLogic.checked = cfg.enabled === 1 || cfg.enabled === '1';

                                        if (cfg.transports && String(cfg.transports).indexOf(',') < 0) apTransport.value = cfg.transports;
                                        if (cfg.protocols && String(cfg.protocols).indexOf(',') < 0) apProto.value = cfg.protocols;
                                        if (cfg.countries) apCountry.value = cfg.countries;
                                });
                        }, 100);
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



            function ssIsXhttpServerV2(s) {
                var t = String((s && s.type) || "").toLowerCase();
                return t === "xhttp" || t === "splithttp";
            }

            function ssBuildXhttpListV2(list) {
                var out = [];
                for (var xi = 0; xi < list.length; xi++) {
                    if (ssIsXhttpServerV2(list[xi])) out.push(list[xi]);
                }
                return out;
            }

            function ssGetXhttpActiveLinksV6() {
                var sec = xhttpSectionSelect && xhttpSectionSelect.value ? xhttpSectionSelect.value : '';
                if (!sec) return [];
                var links = uci.get('podkop', sec, 'urltest_proxy_links') || activeLinksBySection[sec] || [];
                if (!Array.isArray(links)) links = links ? [links] : [];
                var out = [];
                for (var ai = 0; ai < links.length; ai++) {
                    var v = String(links[ai] || '').trim();
                    if (v) out.push(v);
                }
                return out;
            }

            function ssRebuildXhttpCardV2(list) {
                var xs = ssBuildXhttpListV2(list || []);
                if (!xhttpTable) return;
                while (xhttpTable.firstChild) xhttpTable.removeChild(xhttpTable.firstChild);
                xhttpTable.appendChild(headerRow.cloneNode(true));
                var curActiveX = ssGetXhttpActiveLinksV6();
                for (var xri = 0; xri < xs.length; xri++) {
                    var xa = xs[xri].link ? curActiveX.indexOf(xs[xri].link.trim()) >= 0 : false;
                    var xrNode = createServerRow(xs[xri], xri, xa);
                    var xrBtn = xrNode.querySelector('button[data-xhttp="1"]');
                    if (xrBtn) {
                            xrBtn.dataset.urltest = '1';
                            xrBtn.disabled = false;
                            if (xrBtn.dataset.selected === '1') {
                                    xrBtn.className = 'cbi-button cbi-button-neutral';
                                    xrBtn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px;border-color:#4caf50;color:#4caf50';
                                    xrBtn.title = 'Этот сервер выбран в URL Test';
                                    xrBtn.textContent = 'Выбрано';
                            } else {
                                    xrBtn.className = 'cbi-button cbi-button-action';
                                    xrBtn.style.cssText = 'padding:2px 6px;font-size:11px;min-width:62px';
                                    xrBtn.title = 'Нажми, чтобы применить в URL Test';
                                    xrBtn.textContent = 'Выбрать';
                            }
                    }
                    xhttpTable.appendChild(xrNode);
                }
                if (xhttpHeading) xhttpHeading.textContent = "xHTTP серверы (" + xs.length + ", используется " + curActiveX.length + ")";
                if (xhttpTableContainer) xhttpTableContainer.style.display = xs.length > 0 ? "" : "none";
                if (xhttpEmptyMsg) xhttpEmptyMsg.style.display = xs.length > 0 ? "none" : "";
                updateXhttpButtons();
            }

            xhttpSectionSelect = globalSectionSelect.cloneNode(true);
            xhttpSectionSelect.disabled = globalSectionSelect.disabled;
            for (var xoi = 0; xoi < xhttpSectionSelect.options.length; xoi++) {
                    var xo = xhttpSectionSelect.options[xoi];
                    var xt = sectionTypes[xo.value] || '';
                    var xn = String(xo.value || '').toLowerCase().replace(/[ _-]/g, '');
                    if (xt === 'urltest' || xn.indexOf('urltest') >= 0) {
                            xhttpSectionSelect.value = xo.value;
                            break;
                    }
            }
            xhttpSectionSelect.addEventListener('change', function() {
                    ssRebuildXhttpCardV2(servers);
            });
            xhttpHeading = E('h3', {}, 'xHTTP серверы (0)');
            xhttpTable = E('div', { 'class': 'table' }, [headerRow.cloneNode(true)]);
            xhttpTableContainer = E('div', { 'style': 'display:none' }, [
                E('div', { 'class': 'ss-table-wrap' }, [xhttpTable])
            ]);
            xhttpEmptyMsg = E('em', { 'class': 'ss-label' }, 'xHTTP серверы не найдены. Добавь подписку и нажми "Загрузить серверы".');
            var xhttpCard = E('div', { 'class': 'ss-card ss-xhttp-card-v2', 'style': 'border-left:3px solid #4caf50' }, [
                E('div', { 'class': 'ss-card__header' }, [
                    /* SUBSYNC_XHTTP_TITLE_NOTE_V69C */
                    E('div', { 'style': 'display:flex;flex-direction:column;gap:3px;align-items:flex-start' }, [
                        xhttpHeading,
                        E('div', {
                            'class': 'ss-label',
                            'style': 'font-size:12px;line-height:1.35;margin-top:-2px;color:#888'
                        }, [
                            '⚠️ xHTTP серверы требуют sing-box extended. Установить можно его ',
                            E('a', {
                                'href': 'https://github.com/EikeiDev/OpenWRT-sing-box-extended',
                                'target': '_blank',
                                'rel': 'noopener noreferrer',
                                'style': 'color:#4caf50;font-weight:900;text-decoration:underline'
                            }, 'ТУТ'),
                            '.'
                        ])
                    ]),
                E('button', {
                    'class': 'cbi-button ss-xhttp-ping-v9',
                    'style': 'padding:2px 10px;font-size:12px;background:transparent;color:#4caf50;border:1px solid #4caf50',
                    'title': 'Проверить пинг xHTTP серверов',
                    'click': function(ev) {
                        var pb = ev.currentTarget || ev.target;
                        if (pb.disabled) return;
                        pb.disabled = true;
                        pb.textContent = 'Пинг...';
                        var cells = xhttpTable ? xhttpTable.querySelectorAll('.td[data-title="Пинг"] span') : [];
                        var pi = 0;
                        function pingNextXhttpV8() {
                            if (pi >= cells.length) {
                                pb.disabled = false;
                                pb.textContent = 'Проверить пинг';
                                return;
                            }
                            if (cells[pi] && cells[pi].click) cells[pi].click();
                            pi++;
                            window.setTimeout(pingNextXhttpV8, 350);
                        }
                        pingNextXhttpV8();
                    }
                }, 'Проверить пинг')
                ]),
                E('div', { 'class': 'ss-toolbar', 'style': 'margin-bottom:8px' }, [
                    E('span', { 'class': 'ss-label' }, 'URL Test section:'),
                    xhttpSectionSelect
                ]),
                xhttpTableContainer,
                xhttpEmptyMsg
            ]);
            ssRebuildXhttpCardV2(servers);

			var ssPage = E('div', { 'class': 'ss-page' }, [
                           E('style', {}, '/* SUBSYNC_AUTOLOGIC_WARNING_BLINK_V59 */ @keyframes ssAutologicWarningBlinkV59{0%,86%,100%{opacity:1;text-shadow:none}90%{opacity:.20;text-shadow:0 0 12px rgba(244,67,54,.95)}94%{opacity:1;text-shadow:0 0 18px rgba(244,67,54,.75)}}'),
                           E('style', {}, [
                                   '/* SUBSYNC_STATUS_WIDGETS_V60B */',
                                   '.ss-widgets{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;gap:12px!important;margin:12px 0 14px 0!important}',
                                   '.ss-widget{position:relative!important;overflow:hidden!important;border-radius:15px!important;padding:14px!important;border:1px solid rgba(127,127,127,.20)!important;background:linear-gradient(180deg,rgba(127,127,127,.10),rgba(127,127,127,.045))!important;box-shadow:0 8px 22px rgba(0,0,0,.16)!important}',
                                   '.ss-widget:before{content:"";position:absolute;left:0;top:0;right:0;height:4px;background:linear-gradient(90deg,#4caf50,#03a9f4,#00bcd4)!important}',
                                   '.ss-widget:hover{box-shadow:0 10px 26px rgba(0,0,0,.24)!important;border-color:rgba(76,175,80,.42)!important}',
                                   '.ss-widget__title{font-size:12px!important;text-transform:uppercase!important;letter-spacing:.08em!important;color:#9aa0a6!important;font-weight:900!important;margin-bottom:10px!important}',
                                   '.ss-widget__value{font-size:14px!important;line-height:1.55!important}',
                                   '.ss-widget__value strong{font-size:18px!important;line-height:1.2!important}',
                                   '.ss-widget__value .ss-row{display:flex!important;align-items:center!important;gap:4px!important;flex-wrap:wrap!important}',
                                   '.ss-widget__value .ss-dot{font-size:12px!important;margin-right:2px!important}',
                                   '.ss-widget__value .ss-val--ok{font-weight:800!important}',
                                   '.ss-widget__value .ss-label{color:#aeb4bb!important}',
                                   '.ss-widget__value .ss-val{word-break:break-word!important}'
                           ].join('\n')),
                           E("style", {}, `
/* SUBSYNC_WIDGET_CENTER_IN_RENDER_V216 */
/* SUBSYNC_MODULE_UPDATE_CARD_STYLE_V237 */
/* SUBSYNC_MODULE_UPDATE_COLLAPSE_STYLE_V239 */
/* SUBSYNC_MODULE_UPDATE_COMPACT_THEME_AUTO_V240 */
.ss-module-update-card-v236{
  max-width:440px!important;
  width:auto!important;
  min-width:0!important;
  padding:10px 12px!important;
  margin:8px 0 10px 0!important;
  border-radius:12px!important;
  background:var(--background-color-medium,var(--background-color-high,transparent))!important;
  color:inherit!important;
  border:1px solid color-mix(in srgb,currentColor 16%,transparent)!important;
  box-shadow:none!important;
}
.ss-module-update-card-v236:before{
  width:3px!important;
  background:color-mix(in srgb,currentColor 42%,transparent)!important;
  opacity:.45!important;
}
.ss-module-update-card-v236 .ss-card__title{
  margin:0 0 6px 0!important;
  gap:6px!important;
  font-size:13px!important;
  line-height:1.2!important;
  font-weight:850!important;
  color:inherit!important;
  -webkit-text-fill-color:currentColor!important;
  text-shadow:none!important;
}
.ss-module-update-card-v236 .ss-card__title:before{
  content:"↻"!important;
  width:19px!important;
  height:19px!important;
  min-width:19px!important;
  border-radius:7px!important;
  background:color-mix(in srgb,currentColor 8%,transparent)!important;
  border:1px solid color-mix(in srgb,currentColor 18%,transparent)!important;
  color:inherit!important;
  opacity:.82!important;
}
.ss-module-update-card-v236 .ss-card__title:after{
  content:""!important;
  display:none!important;
}
.ss-module-update-card-v236 .ss-module-update-status-v239{
  margin:0 0 8px 0!important;
  padding:0!important;
  background:transparent!important;
  border:0!important;
  font-size:12px!important;
  line-height:1.25!important;
}
.ss-module-update-card-v236 .ss-module-update-actions-v239{
  display:flex!important;
  gap:6px!important;
  flex-wrap:wrap!important;
  align-items:center!important;
  margin:0!important;
}
.ss-module-update-card-v236 .cbi-button{
  min-height:28px!important;
  padding:4px 9px!important;
  margin:0!important;
  border-radius:8px!important;
  font-size:11px!important;
  font-weight:750!important;
  line-height:1.15!important;
  background:color-mix(in srgb,currentColor 7%,transparent)!important;
  color:inherit!important;
  border:1px solid color-mix(in srgb,currentColor 18%,transparent)!important;
  box-shadow:none!important;
  text-shadow:none!important;
}
.ss-module-update-card-v236 .cbi-button:hover{
  transform:none!important;
  background:color-mix(in srgb,currentColor 11%,transparent)!important;
  box-shadow:none!important;
}
.ss-module-update-card-v236 .cbi-button-apply{
  background:color-mix(in srgb,#35a852 14%,transparent)!important;
  border-color:color-mix(in srgb,#35a852 30%,transparent)!important;
  color:inherit!important;
}
.ss-module-update-card-v236 .ss-module-update-details-v239{
  margin-top:8px!important;
  padding-top:8px!important;
  border-top:1px solid color-mix(in srgb,currentColor 12%,transparent)!important;
}
.ss-module-update-card-v236 .ss-module-update-log-v239,
.ss-module-update-card-v236 pre{
  margin-top:8px!important;
  max-height:180px!important;
  font-size:11px!important;
  line-height:1.35!important;
  color:inherit!important;
  background:color-mix(in srgb,currentColor 5%,transparent)!important;
  border:1px solid color-mix(in srgb,currentColor 14%,transparent)!important;
  border-radius:9px!important;
  padding:8px!important;
}
@supports not (background:color-mix(in srgb,black 10%,transparent)){
  .ss-module-update-card-v236{background:transparent!important;border:1px solid rgba(127,127,127,.25)!important;}
  .ss-module-update-card-v236 .cbi-button{background:transparent!important;border:1px solid rgba(127,127,127,.25)!important;}
  .ss-module-update-card-v236 pre{background:transparent!important;border:1px solid rgba(127,127,127,.20)!important;}
}
@media(max-width:800px){
  .ss-module-update-card-v236{max-width:none!important;width:100%!important;}
  .ss-module-update-card-v236 .ss-module-update-actions-v239{flex-direction:row!important;align-items:center!important;}
  .ss-module-update-card-v236 .ss-module-update-actions-v239 .cbi-button{width:auto!important;margin-left:0!important;}
}
.ss-module-update-card-v236 .ss-module-update-actions-v239{display:flex!important;gap:8px!important;flex-wrap:wrap!important;align-items:center!important;margin:0!important;}
.ss-module-update-card-v236 .ss-module-update-details-v239{border-top:1px solid rgba(255,255,255,.08)!important;padding-top:10px!important;margin-top:10px!important;}
.ss-module-update-card-v236 .ss-module-update-log-v239{margin-top:10px!important;}
@media(max-width:800px){.ss-module-update-card-v236 .ss-module-update-actions-v239{flex-direction:column!important;align-items:stretch!important}.ss-module-update-card-v236 .ss-module-update-actions-v239 .cbi-button{width:100%!important;margin-left:0!important}}
.ss-module-update-card-v236{
  position:relative!important;
  overflow:hidden!important;
  padding:16px!important;
  border-radius:16px!important;
  border:1px solid rgba(83,190,255,.28)!important;
  background:linear-gradient(135deg,rgba(17,24,34,.96),rgba(13,18,28,.92) 52%,rgba(25,35,48,.88))!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 24px rgba(0,0,0,.18),0 0 20px rgba(83,190,255,.10)!important;
}
.ss-module-update-card-v236:before{
  content:""!important;
  position:absolute!important;
  left:0!important;
  top:0!important;
  bottom:0!important;
  width:4px!important;
  background:linear-gradient(180deg,#53beff,#7bd88f,#f3d66f)!important;
  opacity:.95!important;
}
.ss-module-update-card-v236 .ss-card__title{
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  margin:0 0 10px 0!important;
  font-size:15px!important;
  font-weight:950!important;
  color:#dff5ff!important;
  -webkit-text-fill-color:#dff5ff!important;
  text-shadow:none!important;
}
.ss-module-update-card-v236 .ss-card__title:before{
  content:"↻"!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:24px!important;
  height:24px!important;
  border-radius:9px!important;
  background:rgba(83,190,255,.14)!important;
  border:1px solid rgba(83,190,255,.28)!important;
  color:#8edcff!important;
}
.ss-module-update-card-v236 .ss-card__title:after{
  content:"OTA"!important;
  margin-left:auto!important;
  padding:3px 8px!important;
  border-radius:999px!important;
  border:1px solid rgba(123,216,143,.30)!important;
  background:rgba(123,216,143,.10)!important;
  color:#9df0b0!important;
  -webkit-text-fill-color:#9df0b0!important;
  font-size:10px!important;
  font-weight:950!important;
  letter-spacing:.5px!important;
}
.ss-module-update-card-v236>div:nth-child(2){
  display:block!important;
  margin:0 0 12px 0!important;
  padding:9px 11px!important;
  border-radius:12px!important;
  border:1px solid rgba(255,255,255,.09)!important;
  background:rgba(0,0,0,.16)!important;
  color:#b9c6d3!important;
  font-size:12px!important;
  line-height:1.35!important;
}
.ss-module-update-card-v236>div:nth-child(3){
  display:flex!important;
  flex-wrap:wrap!important;
  gap:8px!important;
  align-items:center!important;
  margin:0!important;
}
.ss-module-update-card-v236 .cbi-button{
  min-height:34px!important;
  padding:7px 13px!important;
  margin:0!important;
  border-radius:11px!important;
  font-size:12px!important;
  font-weight:850!important;
  line-height:1.15!important;
  text-decoration:none!important;
  transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease!important;
}
.ss-module-update-card-v236 .cbi-button-neutral{
  border:1px solid rgba(83,190,255,.30)!important;
  background:linear-gradient(135deg,rgba(83,190,255,.16),rgba(83,190,255,.06))!important;
  color:#ccefff!important;
}
.ss-module-update-card-v236 .cbi-button-apply{
  border:1px solid rgba(123,216,143,.36)!important;
  background:linear-gradient(135deg,rgba(123,216,143,.22),rgba(243,214,111,.10))!important;
  color:#e9ffe9!important;
  box-shadow:0 0 12px rgba(123,216,143,.12)!important;
}
.ss-module-update-card-v236 .cbi-button:hover{
  transform:translateY(-1px)!important;
  box-shadow:0 7px 16px rgba(0,0,0,.18)!important;
}
.ss-module-update-card-v236 .cbi-button:disabled{
  opacity:.62!important;
  transform:none!important;
  cursor:wait!important;
}
.ss-module-update-card-v236 pre{
  margin-top:12px!important;
  max-height:260px!important;
  overflow:auto!important;
  white-space:pre-wrap!important;
  font-size:12px!important;
  line-height:1.42!important;
  color:#d7e9f7!important;
  background:rgba(2,6,12,.42)!important;
  border:1px solid rgba(83,190,255,.14)!important;
  border-radius:12px!important;
  padding:11px!important;
}
@media(max-width:800px){
  .ss-module-update-card-v236>div:nth-child(3){flex-direction:column!important;align-items:stretch!important;}
  .ss-module-update-card-v236 .cbi-button{width:100%!important;}
}
/* SUBSYNC_HIDE_DONATERS_SAFE_V236 */
.ss-card.ss-donaters-card-v134{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;}
.ss-card.ss-donaters-card-v134 *{display:none!important;visibility:hidden!important;}
/* SUBSYNC_DONATERS_TITLE_SMALL_HIDE_VERSION_V222 */
/* SUBSYNC_DONATERS_MINI_CARDS_STYLE_V223 */
.ss-donaters-card-v134{
  padding:14px 16px!important;
}
.ss-donaters-grid-v134{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:7px!important;
  width:100%!important;
  margin:8px 0 0 0!important;
}
@media(max-width:800px){
  .ss-donaters-grid-v134{grid-template-columns:1fr!important;}
}
.ss-donater-mini-v134{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:7px!important;
  min-height:30px!important;
  padding:6px 12px!important;
  box-sizing:border-box!important;
  border-radius:8px!important;
  border:1px solid rgba(255,205,75,.34)!important;
  background:linear-gradient(90deg,rgba(255,205,75,.10),rgba(60,70,55,.18))!important;
  color:#ffe89a!important;
  font-size:13px!important;
  font-weight:900!important;
  line-height:1.2!important;
  text-decoration:none!important;
  text-align:center!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 0 1px rgba(0,0,0,.12)!important;
}
.ss-donater-mini-v134:hover{
  border-color:rgba(255,220,95,.55)!important;
  background:linear-gradient(90deg,rgba(255,205,75,.15),rgba(60,70,55,.24))!important;
  text-decoration:none!important;
}
.ss-donater-mini-icon-v134{
  display:inline!important;
  width:auto!important;
  height:auto!important;
  min-width:0!important;
  min-height:0!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  border-radius:0!important;
  background:none!important;
  box-shadow:none!important;
  color:#ffe89a!important;
  font-size:12px!important;
  font-weight:900!important;
  line-height:1!important;
  text-shadow:0 0 7px rgba(255,220,95,.38)!important;
}
.ss-donater-mini-name-v134{
  display:inline!important;
  color:#ffe89a!important;
  font-size:13px!important;
  font-weight:900!important;
  line-height:1.2!important;
  text-shadow:0 0 6px rgba(255,220,95,.22)!important;
}
.ss-donaters-title-v134{
  font-size:18px!important;
  line-height:1.22!important;
  margin:6px 0 10px 0!important;
}
.ss-version-orange-v92{
  display:none!important;
  visibility:hidden!important;
  height:0!important;
  min-height:0!important;
  margin:0!important;
  padding:0!important;
  border:0!important;
  overflow:hidden!important;
}
.ss-widgets,.ss-system-widgets-v96{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;width:100%!important;align-items:stretch!important;margin:12px 0 14px 0!important}
@media (max-width:900px){.ss-widgets,.ss-system-widgets-v96{grid-template-columns:1fr!important}}
.ss-widgets>*,.ss-system-widgets-v96>*{min-height:82px!important;padding:14px 16px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important}
.ss-widgets>* *,.ss-system-widgets-v96>* *{text-align:center!important;justify-content:center!important;align-items:center!important}
.ss-widgets .ss-muted,.ss-system-widgets-v96 .ss-muted,.ss-widgets small,.ss-system-widgets-v96 small{display:block!important;width:100%!important;text-align:center!important}
.ss-widgets h3,.ss-system-widgets-v96 h3,.ss-widgets .ss-card-title,.ss-system-widgets-v96 .ss-card-title,.ss-widgets .ss-widget-title,.ss-system-widgets-v96 .ss-widget-title,.ss-widgets [class*=title],.ss-system-widgets-v96 [class*=title]{display:block!important;width:100%!important;text-align:center!important}
/* SUBSYNC_DONATERS_TITLE_TINY_ANIM_V224 */
.ss-donaters-title-v134{
  font-size:14px!important;
  line-height:1.12!important;
  margin:2px 0 8px 0!important;
  letter-spacing:.2px!important;
  animation:ssDonatersTitleSoftV224 10s ease-in-out infinite!important;
  transform-origin:center center!important;
}
@keyframes ssDonatersTitleSoftV224{
  0%,100%{
    opacity:.84;
    transform:scale(1);
    text-shadow:0 0 4px rgba(255,230,120,.18),0 0 8px rgba(0,220,255,.14);
  }
  50%{
    opacity:1;
    transform:scale(1.035);
    text-shadow:0 0 7px rgba(255,230,120,.42),0 0 14px rgba(0,220,255,.28);
  }
}
/* SUBSYNC_DONATERS_TITLE_TYPING_ANIM_V225 */
.ss-donaters-title-v134{
  display:block!important;
  width:0ch!important;
  max-width:max-content!important;
  margin:2px auto 8px auto!important;
  overflow:hidden!important;
  white-space:nowrap!important;
  font-size:13px!important;
  line-height:1.12!important;
  letter-spacing:.25px!important;
  border-right:2px solid rgba(255,235,130,.88)!important;
  padding-right:3px!important;
  animation:ssDonatersTypingV225 10s steps(10,end) infinite,ssDonatersCaretV225 .72s step-end infinite!important;
  text-shadow:0 0 6px rgba(255,230,120,.35),0 0 12px rgba(0,220,255,.22)!important;
}
@keyframes ssDonatersTypingV225{
  0%{width:0ch;}
  14%{width:0ch;}
  45%{width:10.7ch;}
  82%{width:10.7ch;}
  100%{width:0ch;}
}
@keyframes ssDonatersCaretV225{
  0%,100%{border-right-color:transparent;}
  50%{border-right-color:rgba(255,235,130,.9);}
}
/* SUBSYNC_DONATERS_TITLE_REAL_TYPING_V226 */
.ss-donaters-title-v134{
  display:block!important;
  width:auto!important;
  max-width:none!important;
  overflow:visible!important;
  white-space:nowrap!important;
  margin:2px auto 8px auto!important;
  padding:0!important;
  border:0!important;
  animation:none!important;
  font-size:0!important;
  line-height:1!important;
  text-align:center!important;
}
.ss-donaters-title-v134::after{
  content:"💎 Донатеры";
  display:inline-block!important;
  overflow:hidden!important;
  white-space:nowrap!important;
  vertical-align:bottom!important;
  max-width:0;
  padding-right:3px!important;
  border-right:2px solid rgba(255,235,130,.92)!important;
  color:#fff39a!important;
  font-size:13px!important;
  font-weight:900!important;
  line-height:1.14!important;
  letter-spacing:.25px!important;
  text-shadow:0 0 6px rgba(255,230,120,.42),0 0 12px rgba(0,220,255,.22)!important;
  animation:ssDonatersRealTypingV226 10s steps(10,end) infinite,ssDonatersRealCaretV226 .72s step-end infinite!important;
}
@keyframes ssDonatersRealTypingV226{
  0%{max-width:0;}
  12%{max-width:0;}
  44%{max-width:8.8em;}
  82%{max-width:8.8em;}
  100%{max-width:0;}
}
@keyframes ssDonatersRealCaretV226{
  0%,100%{border-right-color:transparent;}
  50%{border-right-color:rgba(255,235,130,.92);}
}
/* SUBSYNC_DONATERS_TITLE_MEGA_ANIM_V227 */
.ss-donaters-title-v134{
  display:block!important;
  width:auto!important;
  max-width:none!important;
  overflow:visible!important;
  white-space:nowrap!important;
  margin:2px auto 9px auto!important;
  padding:0!important;
  border:0!important;
  animation:none!important;
  font-size:0!important;
  line-height:1!important;
  text-align:center!important;
}
.ss-donaters-title-v134::after{
  content:"💎 Донатеры";
  display:inline-block!important;
  position:relative!important;
  overflow:visible!important;
  white-space:nowrap!important;
  padding:1px 8px!important;
  border-radius:10px!important;
  border:1px solid rgba(255,220,90,.26)!important;
  background:linear-gradient(90deg,#fff2a8,#00e5ff,#ff4df0,#9dff4a,#ffb300,#ffffff,#7cf7ff,#ff4d6d,#d68cff,#fff2a8)!important;
  background-size:420% 100%!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  color:transparent!important;
  font-size:13px!important;
  font-weight:950!important;
  line-height:1.18!important;
  letter-spacing:.35px!important;
  transform-origin:center center!important;
  text-shadow:0 0 7px rgba(255,230,120,.45),0 0 14px rgba(0,225,255,.22)!important;
  box-shadow:0 0 10px rgba(255,215,80,.13), inset 0 0 10px rgba(255,255,255,.04)!important;
  animation:ssDonatersMegaV227 10s linear infinite,ssDonatersGradientV227 2.2s linear infinite!important;
}
@keyframes ssDonatersGradientV227{
  0%{background-position:0% 50%;}
  100%{background-position:420% 50%;}
}
@keyframes ssDonatersMegaV227{
  0%{opacity:.88;transform:scale(1) translateY(0) rotate(0deg);filter:drop-shadow(0 0 2px rgba(255,225,90,.35));letter-spacing:.2px;}
  10%{opacity:1;transform:scale(1.06) translateY(-1px) rotate(-1deg);filter:drop-shadow(0 0 7px rgba(0,229,255,.55));letter-spacing:.8px;}
  20%{opacity:.96;transform:scale(1.02) translateX(1px) rotate(1.4deg);filter:drop-shadow(0 0 8px rgba(255,77,240,.58));letter-spacing:.35px;}
  30%{opacity:1;transform:scale(1.08) translateY(0) skewX(-5deg);filter:drop-shadow(0 0 9px rgba(157,255,74,.55));letter-spacing:1px;}
  40%{opacity:.92;transform:scale(1) translateX(-1px) skewX(5deg);filter:drop-shadow(0 0 6px rgba(255,179,0,.7));letter-spacing:.25px;}
  50%{opacity:1;transform:scale(1.12) translateY(-2px) rotate(0deg);filter:drop-shadow(0 0 13px rgba(255,255,255,.75));letter-spacing:1.2px;}
  60%{opacity:.98;transform:scale(1.04) translateY(1px) rotate(-2deg);filter:drop-shadow(0 0 10px rgba(124,247,255,.62));letter-spacing:.45px;}
  70%{opacity:1;transform:scale(1.09) translateX(2px) rotate(2deg);filter:drop-shadow(0 0 12px rgba(255,77,109,.64));letter-spacing:.9px;}
  80%{opacity:.94;transform:scale(1.03) translateX(-2px) rotate(-1deg);filter:drop-shadow(0 0 10px rgba(214,140,255,.62));letter-spacing:.35px;}
  90%{opacity:1;transform:scale(1.07) translateY(-1px) rotate(0deg);filter:drop-shadow(0 0 13px rgba(255,215,80,.75));letter-spacing:1px;}
  100%{opacity:.88;transform:scale(1) translateY(0) rotate(0deg);filter:drop-shadow(0 0 2px rgba(255,225,90,.35));letter-spacing:.2px;}
}
/* SUBSYNC_DONATERS_TITLE_CLEAR_ANIM_V228 */
.ss-donaters-title-v134{
  display:block!important;
  width:auto!important;
  max-width:none!important;
  overflow:visible!important;
  white-space:nowrap!important;
  margin:2px auto 9px auto!important;
  padding:0!important;
  border:0!important;
  animation:none!important;
  font-size:0!important;
  line-height:1!important;
  text-align:center!important;
}
.ss-donaters-title-v134::after{
  content:"💎 Донатеры";
  display:inline-block!important;
  position:relative!important;
  overflow:visible!important;
  white-space:nowrap!important;
  padding:1px 8px!important;
  border-radius:9px!important;
  border:1px solid rgba(255,210,80,.34)!important;
  background:rgba(25,25,18,.20)!important;
  -webkit-background-clip:border-box!important;
  background-clip:border-box!important;
  color:#ffe889!important;
  -webkit-text-fill-color:#ffe889!important;
  font-size:13px!important;
  font-weight:950!important;
  line-height:1.18!important;
  letter-spacing:.35px!important;
  transform-origin:center center!important;
  filter:none!important;
  text-shadow:0 0 2px rgba(255,230,120,.45)!important;
  box-shadow:0 0 6px rgba(255,210,80,.12)!important;
  animation:ssDonatersClearAnimV228 10s linear infinite!important;
}
@keyframes ssDonatersClearAnimV228{
  0%{color:#ffe889;-webkit-text-fill-color:#ffe889;transform:scale(1) translateY(0) rotate(0deg);text-shadow:0 0 2px rgba(255,230,120,.45);border-color:rgba(255,210,80,.34);}
  10%{color:#fff7bd;-webkit-text-fill-color:#fff7bd;transform:scale(1.035) translateY(-1px);text-shadow:0 0 4px rgba(255,245,170,.70);border-color:rgba(255,245,170,.50);}
  20%{color:#8ff6ff;-webkit-text-fill-color:#8ff6ff;transform:scale(1.015) translateX(1px);text-shadow:0 0 4px rgba(120,235,255,.62);border-color:rgba(120,235,255,.42);}
  30%{color:#ff9df3;-webkit-text-fill-color:#ff9df3;transform:scale(1.035) translateX(-1px);text-shadow:0 0 4px rgba(255,130,240,.58);border-color:rgba(255,130,240,.42);}
  40%{color:#b7ff83;-webkit-text-fill-color:#b7ff83;transform:scale(1.02) rotate(-1deg);text-shadow:0 0 4px rgba(170,255,120,.56);border-color:rgba(170,255,120,.42);}
  50%{color:#ffffff;-webkit-text-fill-color:#ffffff;transform:scale(1.055) translateY(-1px);text-shadow:0 0 5px rgba(255,255,255,.70);border-color:rgba(255,255,255,.44);}
  60%{color:#ffd36e;-webkit-text-fill-color:#ffd36e;transform:scale(1.02) rotate(1deg);text-shadow:0 0 4px rgba(255,190,70,.62);border-color:rgba(255,190,70,.46);}
  70%{color:#9bc7ff;-webkit-text-fill-color:#9bc7ff;transform:scale(1.04) translateX(1px);text-shadow:0 0 4px rgba(130,180,255,.58);border-color:rgba(130,180,255,.42);}
  80%{color:#ff8a8a;-webkit-text-fill-color:#ff8a8a;transform:scale(1.02) translateX(-1px);text-shadow:0 0 4px rgba(255,110,110,.58);border-color:rgba(255,110,110,.42);}
  90%{color:#e2b2ff;-webkit-text-fill-color:#e2b2ff;transform:scale(1.04) translateY(-1px);text-shadow:0 0 4px rgba(210,150,255,.58);border-color:rgba(210,150,255,.42);}
  100%{color:#ffe889;-webkit-text-fill-color:#ffe889;transform:scale(1) translateY(0) rotate(0deg);text-shadow:0 0 2px rgba(255,230,120,.45);border-color:rgba(255,210,80,.34);}
}
/* SUBSYNC_DONATERS_SIMPLE_TITLE_NEW_CARDS_V229 */
.ss-donaters-title-v134{
  display:block!important;
  width:auto!important;
  max-width:none!important;
  overflow:visible!important;
  white-space:nowrap!important;
  margin:2px 0 9px 0!important;
  padding:0!important;
  border:0!important;
  background:none!important;
  box-shadow:none!important;
  filter:none!important;
  animation:none!important;
  font-size:0!important;
  line-height:1!important;
  text-align:left!important;
  color:inherit!important;
  text-shadow:none!important;
}
.ss-donaters-title-v134::after{
  content:"Донатеры"!important;
  display:inline-block!important;
  color:#f3d66f!important;
  -webkit-text-fill-color:#f3d66f!important;
  background:none!important;
  -webkit-background-clip:border-box!important;
  background-clip:border-box!important;
  font-size:13px!important;
  font-weight:900!important;
  line-height:1.15!important;
  letter-spacing:.25px!important;
  text-shadow:none!important;
  border:0!important;
  box-shadow:none!important;
  filter:none!important;
  animation:none!important;
  transform:none!important;
}
.ss-donaters-grid-v134{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
  width:100%!important;
  margin:7px 0 0 0!important;
}
@media(max-width:800px){
  .ss-donaters-grid-v134{grid-template-columns:1fr!important;}
}
.ss-donater-mini-v134{
  position:relative!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:7px!important;
  min-height:34px!important;
  padding:7px 12px!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
  border-radius:11px!important;
  border:1px solid rgba(243,214,111,.34)!important;
  background:linear-gradient(135deg,rgba(30,31,38,.88),rgba(58,48,24,.42))!important;
  color:#f3d66f!important;
  text-decoration:none!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 5px 14px rgba(0,0,0,.14)!important;
  transform:translateZ(0)!important;
  transition:transform .18s ease,border-color .18s ease,background .18s ease!important;
}
.ss-donater-mini-v134::before{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  background:linear-gradient(90deg,transparent,rgba(255,225,120,.14),transparent)!important;
  transform:translateX(-120%)!important;
  animation:ssDonaterCardSweepV229 5.8s ease-in-out infinite!important;
  pointer-events:none!important;
}
.ss-donater-mini-v134:nth-child(2)::before{animation-delay:1.1s!important;}
.ss-donater-mini-v134:nth-child(3)::before{animation-delay:2.2s!important;}
.ss-donater-mini-v134:hover{
  transform:translateY(-1px)!important;
  border-color:rgba(255,230,130,.62)!important;
  background:linear-gradient(135deg,rgba(38,40,48,.92),rgba(83,67,31,.52))!important;
  text-decoration:none!important;
}
.ss-donater-mini-icon-v134{
  position:relative!important;
  z-index:1!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:17px!important;
  height:17px!important;
  min-width:17px!important;
  border-radius:50%!important;
  border:1px solid rgba(243,214,111,.42)!important;
  background:rgba(243,214,111,.10)!important;
  color:#ffe48a!important;
  font-size:10px!important;
  font-weight:900!important;
  line-height:1!important;
  text-shadow:none!important;
  box-shadow:none!important;
}
.ss-donater-mini-name-v134{
  position:relative!important;
  z-index:1!important;
  display:inline-block!important;
  color:#f7dc76!important;
  -webkit-text-fill-color:#f7dc76!important;
  font-size:13px!important;
  font-weight:950!important;
  line-height:1.15!important;
  letter-spacing:.2px!important;
  text-shadow:none!important;
  filter:none!important;
  animation:ssDonaterNickColorV229 4.8s ease-in-out infinite!important;
}
.ss-donater-mini-v134:nth-child(2) .ss-donater-mini-name-v134{animation-delay:.8s!important;}
.ss-donater-mini-v134:nth-child(3) .ss-donater-mini-name-v134{animation-delay:1.6s!important;}
@keyframes ssDonaterCardSweepV229{
  0%,62%,100%{transform:translateX(-120%);}
  74%{transform:translateX(120%);}
}
@keyframes ssDonaterNickColorV229{
  0%,100%{color:#f7dc76;-webkit-text-fill-color:#f7dc76;letter-spacing:.2px;}
  25%{color:#fff3aa;-webkit-text-fill-color:#fff3aa;letter-spacing:.45px;}
  50%{color:#8ff4ff;-webkit-text-fill-color:#8ff4ff;letter-spacing:.2px;}
  75%{color:#ffb4f4;-webkit-text-fill-color:#ffb4f4;letter-spacing:.45px;}
}
/* SUBSYNC_DONATERS_CENTER_VISIBLE_NICK_ANIM_V230 */
.ss-donaters-title-v134{
  text-align:center!important;
  margin:2px 0 10px 0!important;
  animation:none!important;
}
.ss-donaters-title-v134::after{
  content:"Донатеры"!important;
  display:inline-block!important;
  color:#f3d66f!important;
  -webkit-text-fill-color:#f3d66f!important;
  background:none!important;
  font-size:13px!important;
  font-weight:900!important;
  line-height:1.15!important;
  text-align:center!important;
  text-shadow:none!important;
  animation:none!important;
  transform:none!important;
}
.ss-donater-mini-name-v134{
  position:relative!important;
  z-index:2!important;
  display:inline-block!important;
  color:#ffe17a!important;
  -webkit-text-fill-color:#ffe17a!important;
  font-size:13px!important;
  font-weight:950!important;
  line-height:1.15!important;
  letter-spacing:.25px!important;
  text-shadow:0 0 4px rgba(255,225,110,.35)!important;
  transform-origin:center center!important;
  will-change:transform,color,text-shadow!important;
  animation:ssDonaterNickBounceV230 2.2s ease-in-out infinite, ssDonaterNickColorV230 3.6s linear infinite!important;
}
.ss-donater-mini-name-v134::after{
  content:""!important;
  position:absolute!important;
  left:0!important;
  right:0!important;
  bottom:-3px!important;
  height:2px!important;
  border-radius:999px!important;
  background:linear-gradient(90deg,transparent,#ffe17a,#7ef7ff,#ff8cf2,transparent)!important;
  background-size:220% 100%!important;
  opacity:.9!important;
  transform:scaleX(.2)!important;
  transform-origin:center!important;
  animation:ssDonaterNickLineV230 2.2s ease-in-out infinite, ssDonaterNickLineMoveV230 1.6s linear infinite!important;
}
.ss-donater-mini-v134:nth-child(2) .ss-donater-mini-name-v134,
.ss-donater-mini-v134:nth-child(2) .ss-donater-mini-name-v134::after{animation-delay:.35s!important;}
.ss-donater-mini-v134:nth-child(3) .ss-donater-mini-name-v134,
.ss-donater-mini-v134:nth-child(3) .ss-donater-mini-name-v134::after{animation-delay:.7s!important;}
@keyframes ssDonaterNickBounceV230{
  0%,100%{transform:translateY(0) scale(1);}
  28%{transform:translateY(-2px) scale(1.08);}
  56%{transform:translateY(0) scale(1.02);}
}
@keyframes ssDonaterNickColorV230{
  0%,100%{color:#ffe17a;-webkit-text-fill-color:#ffe17a;text-shadow:0 0 4px rgba(255,225,110,.38);}
  25%{color:#ffffff;-webkit-text-fill-color:#ffffff;text-shadow:0 0 7px rgba(255,255,255,.72);}
  50%{color:#7ef7ff;-webkit-text-fill-color:#7ef7ff;text-shadow:0 0 7px rgba(126,247,255,.70);}
  75%{color:#ff8cf2;-webkit-text-fill-color:#ff8cf2;text-shadow:0 0 7px rgba(255,140,242,.65);}
}
@keyframes ssDonaterNickLineV230{
  0%,100%{transform:scaleX(.18);opacity:.42;}
  35%{transform:scaleX(1);opacity:1;}
  70%{transform:scaleX(.45);opacity:.75;}
}
@keyframes ssDonaterNickLineMoveV230{
  0%{background-position:0% 50%;}
  100%{background-position:220% 50%;}
}
/* SUBSYNC_DONATERS_TOP12_RANK_CARDS_V231 */
.ss-donaters-title-v134{
  display:block!important;
  text-align:center!important;
  margin:2px 0 10px 0!important;
  padding:0!important;
  font-size:0!important;
  line-height:1!important;
  animation:none!important;
  background:none!important;
  border:0!important;
  box-shadow:none!important;
  filter:none!important;
}
.ss-donaters-title-v134::after{
  content:"Донатеры"!important;
  display:inline-block!important;
  color:#f3d66f!important;
  -webkit-text-fill-color:#f3d66f!important;
  background:none!important;
  font-size:13px!important;
  font-weight:900!important;
  line-height:1.15!important;
  letter-spacing:.25px!important;
  text-shadow:none!important;
  animation:none!important;
}
.ss-donaters-grid-v134{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
  width:100%!important;
  margin:8px 0 0 0!important;
}
@media(max-width:800px){.ss-donaters-grid-v134{grid-template-columns:1fr!important;}}
.ss-donaters-grid-v134 a.ss-donater-mini-v134,
.ss-donaters-grid-v134 a.ss-donater-mini-v134:link,
.ss-donaters-grid-v134 a.ss-donater-mini-v134:visited,
.ss-donaters-grid-v134 a.ss-donater-mini-v134[href="#"]{
  --rank-main:#f3d66f;
  --rank-soft:rgba(243,214,111,.16);
  --rank-border:rgba(243,214,111,.36);
  --rank-shadow:rgba(243,214,111,.24);
  position:relative!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:7px!important;
  min-height:36px!important;
  padding:7px 12px!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
  border-radius:12px!important;
  border:1px solid var(--rank-border)!important;
  background:linear-gradient(135deg,rgba(22,23,28,.92),var(--rank-soft))!important;
  color:var(--rank-main)!important;
  text-decoration:none!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 5px 14px rgba(0,0,0,.15),0 0 10px var(--rank-shadow)!important;
  transform:translateZ(0)!important;
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease!important;
}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:hover{
  transform:translateY(-1px)!important;
  text-decoration:none!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 7px 17px rgba(0,0,0,.18),0 0 14px var(--rank-shadow)!important;
}
.ss-donater-mini-v134::before{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  background:linear-gradient(90deg,transparent,var(--rank-soft),transparent)!important;
  transform:translateX(-125%)!important;
  animation:ssDonaterCardSweepV231 4.8s ease-in-out infinite!important;
  pointer-events:none!important;
}
.ss-donater-mini-v134::after{
  content:"★"!important;
  position:absolute!important;
  right:6px!important;
  top:4px!important;
  color:var(--rank-main)!important;
  font-size:9px!important;
  line-height:1!important;
  opacity:.65!important;
  pointer-events:none!important;
}
.ss-donater-mini-v134:nth-child(1){--rank-main:#ffd76a;--rank-soft:rgba(255,183,40,.28);--rank-border:rgba(255,215,90,.72);--rank-shadow:rgba(255,190,55,.55);min-height:42px!important;border-width:2px!important;}
.ss-donater-mini-v134:nth-child(1)::after{content:"TOP 1"!important;font-size:9px!important;font-weight:950!important;opacity:.95!important;}
.ss-donater-mini-v134:nth-child(2){--rank-main:#dfe8ff;--rank-soft:rgba(190,210,255,.22);--rank-border:rgba(210,225,255,.55);--rank-shadow:rgba(190,210,255,.36);}
.ss-donater-mini-v134:nth-child(2)::after{content:"2"!important;}
.ss-donater-mini-v134:nth-child(3){--rank-main:#ffb37b;--rank-soft:rgba(255,145,70,.22);--rank-border:rgba(255,178,120,.55);--rank-shadow:rgba(255,145,70,.34);}
.ss-donater-mini-v134:nth-child(3)::after{content:"3"!important;}
.ss-donater-mini-v134:nth-child(4){--rank-main:#8ff7ff;--rank-soft:rgba(80,220,255,.18);--rank-border:rgba(120,235,255,.42);--rank-shadow:rgba(80,220,255,.28);}
.ss-donater-mini-v134:nth-child(5){--rank-main:#ff95f2;--rank-soft:rgba(255,80,220,.16);--rank-border:rgba(255,130,235,.40);--rank-shadow:rgba(255,80,220,.24);}
.ss-donater-mini-v134:nth-child(6){--rank-main:#b6ff83;--rank-soft:rgba(120,255,90,.16);--rank-border:rgba(170,255,130,.40);--rank-shadow:rgba(120,255,90,.23);}
.ss-donater-mini-v134:nth-child(7){--rank-main:#9bbcff;--rank-soft:rgba(90,130,255,.16);--rank-border:rgba(140,170,255,.40);--rank-shadow:rgba(90,130,255,.23);}
.ss-donater-mini-v134:nth-child(8){--rank-main:#ff8c8c;--rank-soft:rgba(255,80,80,.15);--rank-border:rgba(255,130,130,.38);--rank-shadow:rgba(255,80,80,.22);}
.ss-donater-mini-v134:nth-child(9){--rank-main:#dac0ff;--rank-soft:rgba(170,100,255,.15);--rank-border:rgba(200,160,255,.38);--rank-shadow:rgba(170,100,255,.22);}
.ss-donater-mini-v134:nth-child(10){--rank-main:#ffee99;--rank-soft:rgba(255,235,90,.14);--rank-border:rgba(255,235,120,.36);--rank-shadow:rgba(255,235,90,.20);}
.ss-donater-mini-v134:nth-child(11){--rank-main:#98ffd6;--rank-soft:rgba(90,255,200,.14);--rank-border:rgba(130,255,215,.36);--rank-shadow:rgba(90,255,200,.20);}
.ss-donater-mini-v134:nth-child(12){--rank-main:#ffb3d1;--rank-soft:rgba(255,100,170,.14);--rank-border:rgba(255,150,195,.36);--rank-shadow:rgba(255,100,170,.20);}
.ss-donater-mini-icon-v134{
  position:relative!important;
  z-index:2!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:17px!important;
  height:17px!important;
  min-width:17px!important;
  border-radius:50%!important;
  border:1px solid var(--rank-border)!important;
  background:rgba(0,0,0,.12)!important;
  color:var(--rank-main)!important;
  font-size:10px!important;
  font-weight:900!important;
  line-height:1!important;
}
.ss-donater-mini-name-v134{
  position:relative!important;
  z-index:2!important;
  display:inline-block!important;
  color:var(--rank-main)!important;
  -webkit-text-fill-color:var(--rank-main)!important;
  font-size:13px!important;
  font-weight:950!important;
  line-height:1.15!important;
  letter-spacing:.2px!important;
  text-shadow:0 0 4px var(--rank-shadow)!important;
  transform-origin:center center!important;
  animation:ssDonaterNickVisibleV231 1.9s ease-in-out infinite!important;
}
.ss-donater-mini-name-v134::after{
  content:""!important;
  position:absolute!important;
  left:0!important;
  right:0!important;
  bottom:-3px!important;
  height:2px!important;
  border-radius:999px!important;
  background:var(--rank-main)!important;
  opacity:.8!important;
  transform:scaleX(.25)!important;
  animation:ssDonaterNickUnderlineV231 1.9s ease-in-out infinite!important;
}
.ss-donater-mini-v134:nth-child(2) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(2) .ss-donater-mini-name-v134::after{animation-delay:.2s!important;}
.ss-donater-mini-v134:nth-child(3) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(3) .ss-donater-mini-name-v134::after{animation-delay:.4s!important;}
.ss-donater-mini-v134:nth-child(4) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(4) .ss-donater-mini-name-v134::after{animation-delay:.6s!important;}
.ss-donater-mini-v134:nth-child(5) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(5) .ss-donater-mini-name-v134::after{animation-delay:.8s!important;}
.ss-donater-mini-v134:nth-child(6) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(6) .ss-donater-mini-name-v134::after{animation-delay:1s!important;}
@keyframes ssDonaterCardSweepV231{0%,58%,100%{transform:translateX(-125%);}72%{transform:translateX(125%);}}
@keyframes ssDonaterNickVisibleV231{0%,100%{transform:translateY(0) scale(1);filter:brightness(1);}35%{transform:translateY(-2px) scale(1.09);filter:brightness(1.35);}65%{transform:translateY(0) scale(1.02);filter:brightness(1.08);}}
@keyframes ssDonaterNickUnderlineV231{0%,100%{transform:scaleX(.22);opacity:.45;}35%{transform:scaleX(1);opacity:1;}65%{transform:scaleX(.55);opacity:.75;}}
/* SUBSYNC_DONATERS_TOP1_VISIBLE_V232 */
.ss-donaters-title-v134{
  text-align:center!important;
}
.ss-donaters-grid-v134{
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
}
@media(max-width:800px){.ss-donaters-grid-v134{grid-template-columns:1fr!important;}}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:nth-child(1){
  grid-column:1/-1!important;
  min-height:58px!important;
  padding:12px 16px!important;
  border-width:2px!important;
  border-color:rgba(255,215,80,.92)!important;
  border-radius:15px!important;
  background:
    radial-gradient(circle at 18% 20%,rgba(255,255,255,.18),transparent 22%),
    linear-gradient(135deg,rgba(82,55,0,.76),rgba(22,23,28,.96) 44%,rgba(105,74,0,.62))!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.16),
    0 0 0 1px rgba(255,220,90,.18),
    0 8px 22px rgba(0,0,0,.28),
    0 0 22px rgba(255,190,55,.42)!important;
  animation:ssDonaterTop1CardV232 3.8s ease-in-out infinite!important;
}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:nth-child(1)::after{
  content:"👑 1 МЕСТО"!important;
  right:10px!important;
  top:7px!important;
  padding:2px 7px!important;
  border-radius:999px!important;
  border:1px solid rgba(255,230,120,.65)!important;
  background:rgba(0,0,0,.24)!important;
  color:#ffe27a!important;
  font-size:10px!important;
  font-weight:950!important;
  opacity:1!important;
}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:nth-child(1) .ss-donater-mini-icon-v134{
  width:24px!important;
  height:24px!important;
  min-width:24px!important;
  font-size:13px!important;
  border-color:rgba(255,230,120,.78)!important;
  background:rgba(255,215,80,.18)!important;
  color:#ffe27a!important;
  animation:ssDonaterTop1IconV232 2.4s ease-in-out infinite!important;
}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:nth-child(1) .ss-donater-mini-name-v134{
  font-size:16px!important;
  letter-spacing:.55px!important;
  color:#ffe27a!important;
  -webkit-text-fill-color:#ffe27a!important;
  text-shadow:0 0 5px rgba(255,225,90,.55),0 0 11px rgba(255,190,40,.38)!important;
  animation:ssDonaterTop1NickV232 2.2s ease-in-out infinite!important;
}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:nth-child(2)::after{
  content:"🥈 2"!important;
  font-size:10px!important;
  opacity:.95!important;
}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:nth-child(3)::after{
  content:"🥉 3"!important;
  font-size:10px!important;
  opacity:.95!important;
}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:nth-child(n+4)::after{
  content:counter(donater-rank)!important;
}
.ss-donaters-grid-v134{counter-reset:donater-rank 0!important;}
.ss-donater-mini-v134{counter-increment:donater-rank!important;}
@keyframes ssDonaterTop1CardV232{
  0%,100%{transform:translateY(0) scale(1);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 0 0 1px rgba(255,220,90,.18),0 8px 22px rgba(0,0,0,.28),0 0 18px rgba(255,190,55,.34);}
  50%{transform:translateY(-2px) scale(1.015);box-shadow:inset 0 1px 0 rgba(255,255,255,.20),0 0 0 1px rgba(255,230,120,.30),0 10px 26px rgba(0,0,0,.30),0 0 30px rgba(255,205,70,.62);}
}
@keyframes ssDonaterTop1IconV232{
  0%,100%{transform:rotate(0deg) scale(1);}
  35%{transform:rotate(-8deg) scale(1.12);}
  70%{transform:rotate(8deg) scale(1.05);}
}
@keyframes ssDonaterTop1NickV232{
  0%,100%{transform:translateY(0) scale(1);filter:brightness(1);}
  45%{transform:translateY(-2px) scale(1.10);filter:brightness(1.45);}
}
/* SUBSYNC_DONATERS_RANK_SHIMMER_CARDS_V233 */
.ss-donaters-title-v134{
  display:block!important;
  text-align:center!important;
  margin:2px 0 10px 0!important;
  padding:0!important;
  border:0!important;
  background:none!important;
  box-shadow:none!important;
  filter:none!important;
  animation:none!important;
  font-size:0!important;
  line-height:1!important;
}
.ss-donaters-title-v134::after{
  content:"Донатеры"!important;
  color:#f0d36d!important;
  -webkit-text-fill-color:#f0d36d!important;
  font-size:13px!important;
  font-weight:900!important;
  line-height:1.15!important;
  text-shadow:none!important;
  background:none!important;
  border:0!important;
  box-shadow:none!important;
  filter:none!important;
  animation:none!important;
}
.ss-donaters-grid-v134{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:9px!important;
  width:100%!important;
  margin:8px 0 0 0!important;
  counter-reset:ssDonaterRank!important;
}
@media(max-width:800px){.ss-donaters-grid-v134{grid-template-columns:1fr!important;}}
.ss-donaters-grid-v134 a.ss-donater-mini-v134,
.ss-donaters-grid-v134 a.ss-donater-mini-v134:link,
.ss-donaters-grid-v134 a.ss-donater-mini-v134:visited,
.ss-donaters-grid-v134 a.ss-donater-mini-v134[href="#"]{
  --r1:#f2d36b;
  --r2:#fff2a7;
  --r3:#d99a2b;
  --rb:rgba(242,211,107,.34);
  --rs:rgba(242,211,107,.20);
  counter-increment:ssDonaterRank!important;
  position:relative!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:8px!important;
  min-height:38px!important;
  padding:8px 12px!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
  border-radius:13px!important;
  border:1px solid var(--rb)!important;
  background:linear-gradient(135deg,rgba(19,20,26,.96),rgba(39,39,48,.78))!important;
  color:var(--r1)!important;
  text-decoration:none!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 6px 16px rgba(0,0,0,.18),0 0 11px var(--rs)!important;
  transform:none!important;
  transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease!important;
}
.ss-donaters-grid-v134 a.ss-donater-mini-v134:hover{
  transform:translateY(-1px)!important;
  text-decoration:none!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 8px 18px rgba(0,0,0,.22),0 0 16px var(--rs)!important;
}
.ss-donater-mini-v134::before{
  content:""!important;
  position:absolute!important;
  left:0!important;
  top:0!important;
  bottom:0!important;
  width:4px!important;
  background:linear-gradient(180deg,var(--r1),var(--r2),var(--r3))!important;
  opacity:.95!important;
}
.ss-donater-mini-v134::after{
  content:counter(ssDonaterRank)!important;
  position:absolute!important;
  right:7px!important;
  top:6px!important;
  min-width:15px!important;
  height:15px!important;
  padding:0 4px!important;
  border-radius:999px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:1px solid var(--rb)!important;
  background:rgba(0,0,0,.24)!important;
  color:var(--r2)!important;
  -webkit-text-fill-color:var(--r2)!important;
  font-size:9px!important;
  font-weight:950!important;
  line-height:1!important;
  opacity:.92!important;
  pointer-events:none!important;
}
.ss-donater-mini-v134:nth-child(1){--r1:#ffc83d;--r2:#fff6b4;--r3:#ff9d00;--rb:rgba(255,205,70,.78);--rs:rgba(255,185,40,.46);border-width:2px!important;background:linear-gradient(135deg,rgba(72,48,0,.86),rgba(23,22,26,.96) 52%,rgba(88,57,0,.62))!important;}
.ss-donater-mini-v134:nth-child(1)::after{content:"👑1"!important;}
.ss-donater-mini-v134:nth-child(2){--r1:#cfd8e8;--r2:#ffffff;--r3:#8fa2c4;--rb:rgba(220,230,255,.58);--rs:rgba(200,215,255,.32);}
.ss-donater-mini-v134:nth-child(2)::after{content:"🥈2"!important;}
.ss-donater-mini-v134:nth-child(3){--r1:#d77a35;--r2:#ffc18a;--r3:#9a4f20;--rb:rgba(255,165,95,.56);--rs:rgba(255,135,60,.30);}
.ss-donater-mini-v134:nth-child(3)::after{content:"🥉3"!important;}
.ss-donater-mini-v134:nth-child(4){--r1:#55e7ff;--r2:#d8fbff;--r3:#2195ff;--rb:rgba(85,231,255,.42);--rs:rgba(85,231,255,.24);}
.ss-donater-mini-v134:nth-child(5){--r1:#ff62dc;--r2:#ffd4f5;--r3:#a85cff;--rb:rgba(255,98,220,.42);--rs:rgba(255,98,220,.23);}
.ss-donater-mini-v134:nth-child(6){--r1:#83ff6b;--r2:#d9ffd0;--r3:#28b463;--rb:rgba(131,255,107,.40);--rs:rgba(131,255,107,.22);}
.ss-donater-mini-v134:nth-child(7){--r1:#8da2ff;--r2:#d8deff;--r3:#4b5dff;--rb:rgba(141,162,255,.40);--rs:rgba(141,162,255,.22);}
.ss-donater-mini-v134:nth-child(8){--r1:#ff7070;--r2:#ffd1d1;--r3:#ff3d5a;--rb:rgba(255,112,112,.40);--rs:rgba(255,112,112,.22);}
.ss-donater-mini-v134:nth-child(9){--r1:#c28cff;--r2:#ead9ff;--r3:#7b4dff;--rb:rgba(194,140,255,.40);--rs:rgba(194,140,255,.22);}
.ss-donater-mini-v134:nth-child(10){--r1:#fff078;--r2:#fffbd0;--r3:#d7b900;--rb:rgba(255,240,120,.38);--rs:rgba(255,240,120,.20);}
.ss-donater-mini-v134:nth-child(11){--r1:#6dffd2;--r2:#d5fff2;--r3:#00a98b;--rb:rgba(109,255,210,.38);--rs:rgba(109,255,210,.20);}
.ss-donater-mini-v134:nth-child(12){--r1:#ff9abd;--r2:#ffe0eb;--r3:#ff4f93;--rb:rgba(255,154,189,.38);--rs:rgba(255,154,189,.20);}
.ss-donater-mini-icon-v134{
  position:relative!important;
  z-index:2!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:18px!important;
  height:18px!important;
  min-width:18px!important;
  border-radius:7px!important;
  border:1px solid var(--rb)!important;
  background:rgba(255,255,255,.06)!important;
  color:var(--r2)!important;
  -webkit-text-fill-color:var(--r2)!important;
  font-size:10px!important;
  font-weight:900!important;
  line-height:1!important;
  box-shadow:0 0 8px var(--rs)!important;
}
.ss-donater-mini-name-v134{
  position:relative!important;
  z-index:2!important;
  display:inline-block!important;
  color:var(--r1)!important;
  -webkit-text-fill-color:var(--r1)!important;
  font-size:13px!important;
  font-weight:950!important;
  line-height:1.15!important;
  letter-spacing:.25px!important;
  text-shadow:0 0 4px var(--rs)!important;
  animation:ssDonaterNickPlaceFlowV233 2.7s ease-in-out infinite!important;
}
.ss-donater-mini-v134:nth-child(1) .ss-donater-mini-name-v134{font-size:14px!important;animation-duration:2.1s!important;}
.ss-donater-mini-name-v134::after{
  content:""!important;
  position:absolute!important;
  left:0!important;
  right:0!important;
  bottom:-3px!important;
  height:2px!important;
  border-radius:999px!important;
  background:linear-gradient(90deg,var(--r1),var(--r2),var(--r3),var(--r1))!important;
  background-size:240% 100%!important;
  opacity:.9!important;
  transform:scaleX(.28)!important;
  animation:ssDonaterNickLineV233 2.7s ease-in-out infinite,ssDonaterNickLineMoveV233 1.4s linear infinite!important;
}
.ss-donater-mini-v134:nth-child(2) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(2) .ss-donater-mini-name-v134::after{animation-delay:.18s!important;}
.ss-donater-mini-v134:nth-child(3) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(3) .ss-donater-mini-name-v134::after{animation-delay:.36s!important;}
.ss-donater-mini-v134:nth-child(4) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(4) .ss-donater-mini-name-v134::after{animation-delay:.54s!important;}
.ss-donater-mini-v134:nth-child(5) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(5) .ss-donater-mini-name-v134::after{animation-delay:.72s!important;}
.ss-donater-mini-v134:nth-child(6) .ss-donater-mini-name-v134,.ss-donater-mini-v134:nth-child(6) .ss-donater-mini-name-v134::after{animation-delay:.90s!important;}
@keyframes ssDonaterNickPlaceFlowV233{
  0%,100%{color:var(--r1);-webkit-text-fill-color:var(--r1);transform:translateY(0) scale(1);text-shadow:0 0 3px var(--rs);}
  35%{color:var(--r2);-webkit-text-fill-color:var(--r2);transform:translateY(-1px) scale(1.07);text-shadow:0 0 7px var(--rs);}
  70%{color:var(--r3);-webkit-text-fill-color:var(--r3);transform:translateY(0) scale(1.02);text-shadow:0 0 5px var(--rs);}
}
@keyframes ssDonaterNickLineV233{
  0%,100%{transform:scaleX(.25);opacity:.45;}
  45%{transform:scaleX(1);opacity:1;}
  75%{transform:scaleX(.55);opacity:.75;}
}
@keyframes ssDonaterNickLineMoveV233{
  0%{background-position:0% 50%;}
  100%{background-position:240% 50%;}
}
/* SUBSYNC_REMOVE_DONATERS_BLOCK_SAFE_V235 */
.ss-card.ss-donaters-card-v134{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;}
.ss-card.ss-donaters-card-v134 *{display:none!important;visibility:hidden!important;}
/* SUBSYNC_MODULE_UPDATE_NATIVE_WIDGET_CSS_V242 */
.ss-widgets>.ss-module-update-card-v236,
.ss-module-update-card-v236.ss-module-update-widget-v242{
  max-width:none!important;
  width:auto!important;
  min-width:0!important;
  margin:0!important;
  align-self:stretch!important;
  box-sizing:border-box!important;
  color:inherit!important;
}
.ss-module-update-card-v236:before,
.ss-module-update-card-v236 .ss-card__title:before,
.ss-module-update-card-v236 .ss-card__title:after{display:none!important;}
.ss-module-update-card-v236 .ss-widget__title{
  margin:0 0 6px 0!important;
  padding:0!important;
  color:inherit!important;
  -webkit-text-fill-color:currentColor!important;
  text-shadow:none!important;
}
.ss-module-update-card-v236 .ss-module-update-status-v239{
  margin:0 0 7px 0!important;
  padding:0!important;
  background:transparent!important;
  border:0!important;
  font-size:12px!important;
  line-height:1.25!important;
}
.ss-module-update-card-v236 .ss-module-update-actions-v239{
  display:flex!important;
  flex-wrap:wrap!important;
  gap:6px!important;
  align-items:center!important;
  margin:0!important;
}
.ss-module-update-card-v236 .cbi-button{
  min-height:26px!important;
  padding:4px 8px!important;
  margin:0!important;
  border-radius:7px!important;
  font-size:11px!important;
  line-height:1.1!important;
  box-shadow:none!important;
  text-shadow:none!important;
}
.ss-module-update-card-v236 .ss-module-update-details-v239{
  margin-top:7px!important;
  padding-top:7px!important;
  border-top:1px solid rgba(127,127,127,.20)!important;
}
.ss-module-update-card-v236 .ss-module-update-log-v239,
.ss-module-update-card-v236 pre{
  margin-top:7px!important;
  max-height:150px!important;
  font-size:11px!important;
  line-height:1.3!important;
  color:inherit!important;
  background:transparent!important;
  border:1px solid rgba(127,127,127,.22)!important;
  border-radius:8px!important;
  padding:7px!important;
}
/* SUBSYNC_MODULE_UPDATE_BEFORE_HELP_CSS_V242 */
.ss-module-update-card-v236.ss-module-update-before-help-v242{
  max-width:none!important;
  width:auto!important;
  min-width:0!important;
  margin:0 0 10px 0!important;
  box-sizing:border-box!important;
  color:inherit!important;
}
.ss-module-update-card-v236:before,
.ss-module-update-card-v236 .ss-card__title:before,
.ss-module-update-card-v236 .ss-card__title:after{display:none!important;}
.ss-module-update-card-v236 .ss-card__title{
  margin:0 0 6px 0!important;
  padding:0!important;
  color:inherit!important;
  -webkit-text-fill-color:currentColor!important;
  text-shadow:none!important;
  font-size:14px!important;
  font-weight:900!important;
}
.ss-module-update-card-v236 .ss-module-update-status-v239{
  margin:0 0 7px 0!important;
  padding:0!important;
  background:transparent!important;
  border:0!important;
  font-size:12px!important;
  line-height:1.25!important;
}
.ss-module-update-card-v236 .ss-module-update-actions-v239{
  display:flex!important;
  flex-wrap:wrap!important;
  gap:6px!important;
  align-items:center!important;
  margin:0!important;
}
.ss-module-update-card-v236 .cbi-button{
  min-height:27px!important;
  padding:4px 9px!important;
  margin:0!important;
  border-radius:7px!important;
  font-size:11px!important;
  line-height:1.1!important;
  box-shadow:none!important;
  text-shadow:none!important;
}
.ss-module-update-card-v236 .ss-module-update-details-v239{
  margin-top:7px!important;
  padding-top:7px!important;
  border-top:1px solid rgba(127,127,127,.20)!important;
}
.ss-module-update-card-v236 .ss-module-update-log-v239,
.ss-module-update-card-v236 pre{
  margin-top:7px!important;
  max-height:150px!important;
  font-size:11px!important;
  line-height:1.3!important;
  color:inherit!important;
  background:transparent!important;
  border:1px solid rgba(127,127,127,.22)!important;
  border-radius:8px!important;
  padding:7px!important;
}
/* SUBSYNC_MODULE_UPDATE_FIRST_BEFORE_HELP_V243 */
.ss-module-update-card-v236.ss-module-update-before-help-v242{
  max-width:none!important;
  width:auto!important;
  margin:0 0 10px 0!important;
  box-sizing:border-box!important;
  color:inherit!important;
}
/* SUBSYNC_MODULE_UPDATE_STATIC_FIRST_CSS_V244 */
.ss-module-update-card-v236{
  max-width:none!important;
  width:auto!important;
  min-width:0!important;
  margin:0 0 10px 0!important;
  box-sizing:border-box!important;
  color:inherit!important;
}
.ss-module-update-card-v236:before,
.ss-module-update-card-v236 .ss-card__title:before,
.ss-module-update-card-v236 .ss-card__title:after{display:none!important;}
/* SUBSYNC_MODULE_UPDATE_HELP_SLOT_CSS_V246 */
.ss-module-update-slot-v246{
  display:block!important;
  width:100%!important;
  margin:0 0 12px 0!important;
  padding:0 0 12px 0!important;
  border-bottom:1px solid rgba(127,127,127,.20)!important;
  box-sizing:border-box!important;
}
.ss-module-update-slot-v246>.ss-module-update-card-v236{
  display:block!important;
  max-width:none!important;
  width:100%!important;
  margin:0!important;
  padding:0!important;
  background:transparent!important;
  border:0!important;
  border-radius:0!important;
  box-shadow:none!important;
  color:inherit!important;
  overflow:visible!important;
}
.ss-module-update-slot-v246>.ss-module-update-card-v236:before,
.ss-module-update-slot-v246>.ss-module-update-card-v236 .ss-card__title:before,
.ss-module-update-slot-v246>.ss-module-update-card-v236 .ss-card__title:after{display:none!important;}
.ss-module-update-slot-v246 .ss-card__title{
  margin:0 0 5px 0!important;
  padding:0!important;
  color:inherit!important;
  -webkit-text-fill-color:currentColor!important;
  background:none!important;
  text-shadow:none!important;
  font-size:14px!important;
  font-weight:900!important;
}
.ss-module-update-slot-v246 .ss-module-update-status-v239{
  margin:0 0 7px 0!important;
  padding:0!important;
  background:transparent!important;
  border:0!important;
  font-size:12px!important;
  line-height:1.25!important;
}
.ss-module-update-slot-v246 .ss-module-update-actions-v239{
  display:flex!important;
  flex-wrap:wrap!important;
  gap:6px!important;
  align-items:center!important;
  margin:0!important;
}
.ss-module-update-slot-v246 .cbi-button{
  min-height:27px!important;
  padding:4px 9px!important;
  margin:0!important;
  border-radius:7px!important;
  font-size:11px!important;
  line-height:1.1!important;
  box-shadow:none!important;
  text-shadow:none!important;
}
.ss-module-update-slot-v246 .ss-module-update-details-v239{
  margin-top:7px!important;
  padding-top:7px!important;
  border-top:1px solid rgba(127,127,127,.18)!important;
}
.ss-module-update-slot-v246 pre{
  margin-top:7px!important;
  max-height:150px!important;
  font-size:11px!important;
  line-height:1.3!important;
  color:inherit!important;
  background:transparent!important;
  border:1px solid rgba(127,127,127,.22)!important;
  border-radius:8px!important;
  padding:7px!important;
}
/* SUBSYNC_MODULE_UPDATE_ONE_BLOCK_ONLY_CSS_V247 */
.ss-module-update-slot-v246{
  display:block!important;
  width:100%!important;
  margin:0 0 12px 0!important;
  padding:0 0 12px 0!important;
  border-bottom:1px solid rgba(127,127,127,.20)!important;
  box-sizing:border-box!important;
}
.ss-module-update-slot-v246>.ss-module-update-card-v236{
  display:block!important;
  width:100%!important;
  max-width:none!important;
  margin:0!important;
  padding:0!important;
  background:transparent!important;
  border:0!important;
  border-radius:0!important;
  box-shadow:none!important;
  color:inherit!important;
}
.ss-module-update-slot-v246>.ss-module-update-card-v236:before,
.ss-module-update-slot-v246>.ss-module-update-card-v236 .ss-card__title:before,
.ss-module-update-slot-v246>.ss-module-update-card-v236 .ss-card__title:after{display:none!important;}
.ss-module-update-slot-v246 .ss-card__title{
  margin:0 0 5px 0!important;
  padding:0!important;
  color:inherit!important;
  -webkit-text-fill-color:currentColor!important;
  background:none!important;
  text-shadow:none!important;
  font-size:14px!important;
  font-weight:900!important;
}
.ss-module-update-slot-v246 .ss-module-update-status-v239{margin:0 0 7px 0!important;padding:0!important;background:transparent!important;border:0!important;font-size:12px!important;line-height:1.25!important;}
.ss-module-update-slot-v246 .ss-module-update-actions-v239{display:flex!important;flex-wrap:wrap!important;gap:6px!important;align-items:center!important;margin:0!important;}
.ss-module-update-slot-v246 .cbi-button{min-height:27px!important;padding:4px 9px!important;margin:0!important;border-radius:7px!important;font-size:11px!important;line-height:1.1!important;box-shadow:none!important;text-shadow:none!important;}
.ss-module-update-slot-v246 .ss-module-update-details-v239{margin-top:7px!important;padding-top:7px!important;border-top:1px solid rgba(127,127,127,.18)!important;}
.ss-module-update-slot-v246 pre{margin-top:7px!important;max-height:150px!important;font-size:11px!important;line-height:1.3!important;color:inherit!important;background:transparent!important;border:1px solid rgba(127,127,127,.22)!important;border-radius:8px!important;padding:7px!important;}
/* SUBSYNC_MODULE_UPDATE_NO_JUMP_REAL_CSS_V249 */
.ss-module-update-slot-v249{display:block!important;width:100%!important;margin:0 0 12px 0!important;padding:0 0 12px 0!important;border-bottom:1px solid rgba(127,127,127,.20)!important;box-sizing:border-box!important;}
.ss-module-update-slot-v249>.ss-module-update-card-v236{display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:inherit!important;overflow:visible!important;}
.ss-module-update-slot-v249>.ss-module-update-card-v236:before,.ss-module-update-slot-v249>.ss-module-update-card-v236 .ss-card__title:before,.ss-module-update-slot-v249>.ss-module-update-card-v236 .ss-card__title:after{display:none!important;}
.ss-module-update-slot-v249 .ss-card__title{margin:0 0 5px 0!important;padding:0!important;color:inherit!important;-webkit-text-fill-color:currentColor!important;background:none!important;text-shadow:none!important;font-size:14px!important;font-weight:900!important;}
.ss-module-update-slot-v249 .ss-module-update-status-v239{margin:0 0 7px 0!important;padding:0!important;background:transparent!important;border:0!important;font-size:12px!important;line-height:1.25!important;}
.ss-module-update-slot-v249 .ss-module-update-actions-v239{display:flex!important;flex-wrap:wrap!important;gap:6px!important;align-items:center!important;margin:0!important;}
.ss-module-update-slot-v249 .cbi-button{min-height:27px!important;padding:4px 9px!important;margin:0!important;border-radius:7px!important;font-size:11px!important;line-height:1.1!important;box-shadow:none!important;text-shadow:none!important;}
.ss-module-update-slot-v249 .ss-module-update-details-v239{margin-top:7px!important;padding-top:7px!important;border-top:1px solid rgba(127,127,127,.18)!important;}
.ss-module-update-slot-v249 pre{margin-top:7px!important;max-height:150px!important;font-size:11px!important;line-height:1.3!important;color:inherit!important;background:transparent!important;border:1px solid rgba(127,127,127,.22)!important;border-radius:8px!important;padding:7px!important;}
/* SUBSYNC_MODULE_UPDATE_CARD_COLORS_CSS_V251 */
.ss-module-update-card-v236.ss-module-update-ok-v251{background:rgba(76,175,80,.12)!important;border:1px solid rgba(76,175,80,.46)!important;border-radius:10px!important;box-shadow:0 0 0 1px rgba(76,175,80,.08) inset!important;}
.ss-module-update-card-v236.ss-module-update-warn-v251{background:rgba(255,193,7,.13)!important;border:1px solid rgba(255,193,7,.50)!important;border-radius:10px!important;box-shadow:0 0 0 1px rgba(255,193,7,.10) inset!important;}
.ss-module-update-card-v236.ss-module-update-ok-v251 .ss-module-update-status-v239{color:#4caf50!important;font-weight:800!important;}
.ss-module-update-card-v236.ss-module-update-warn-v251 .ss-module-update-status-v239{color:#d8a300!important;font-weight:800!important;}
/* SUBSYNC_MODULE_UPDATE_THEME_BG_TEXT_ONLY_V252 */
.ss-module-update-card-v236.ss-module-update-ok-v251,
.ss-module-update-card-v236.ss-module-update-warn-v251,
.ss-module-update-card-v236.ss-module-update-neutral-v251{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
  color:inherit!important;
}
.ss-module-update-slot-v249>.ss-module-update-card-v236.ss-module-update-ok-v251,
.ss-module-update-slot-v249>.ss-module-update-card-v236.ss-module-update-warn-v251,
.ss-module-update-slot-v249>.ss-module-update-card-v236.ss-module-update-neutral-v251,
.ss-module-update-slot-v248>.ss-module-update-card-v236.ss-module-update-ok-v251,
.ss-module-update-slot-v248>.ss-module-update-card-v236.ss-module-update-warn-v251,
.ss-module-update-slot-v248>.ss-module-update-card-v236.ss-module-update-neutral-v251,
.ss-module-update-slot-v246>.ss-module-update-card-v236.ss-module-update-ok-v251,
.ss-module-update-slot-v246>.ss-module-update-card-v236.ss-module-update-warn-v251,
.ss-module-update-slot-v246>.ss-module-update-card-v236.ss-module-update-neutral-v251{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
  color:inherit!important;
}
.ss-module-update-card-v236.ss-module-update-ok-v251 .ss-module-update-status-v239{
  color:#4caf50!important;
  font-weight:800!important;
}
.ss-module-update-card-v236.ss-module-update-warn-v251 .ss-module-update-status-v239{
  color:#d8a300!important;
  font-weight:800!important;
}
.ss-module-update-card-v236.ss-module-update-neutral-v251 .ss-module-update-status-v239{
  color:inherit!important;
  font-weight:700!important;
}
/* SUBSYNC_MODULE_UPDATE_HIDE_DEBUG_DETAILS_CSS_V253 */
.ss-module-update-card-v236 .ss-module-update-details-v239{display:block!important;}
.ss-module-update-card-v236 pre{display:none!important;}
/* SUBSYNC_DONATE_BANNER_TEXT_CARD_CSS_V257 */
@keyframes ssDonatePulseV257{0%,100%{box-shadow:0 0 0 rgba(67,255,151,0),0 0 18px rgba(67,255,151,.18)}50%{box-shadow:0 0 28px rgba(67,255,151,.22),0 0 46px rgba(255,207,83,.16)}}
@keyframes ssDonateShineV257{0%{transform:translateX(-130%) skewX(-18deg);opacity:0}18%{opacity:.7}45%{opacity:.35}100%{transform:translateX(180%) skewX(-18deg);opacity:0}}
.ss-donate-banner-v257{position:relative;overflow:hidden;margin:0 0 14px 0!important;padding:13px 16px!important;border-radius:14px!important;border:1px solid rgba(115,255,170,.34)!important;background:linear-gradient(135deg,rgba(18,35,30,.82),rgba(12,16,20,.92) 48%,rgba(48,36,12,.75))!important;color:inherit!important;box-sizing:border-box!important;animation:ssDonatePulseV257 3.2s ease-in-out infinite!important;}
.ss-donate-banner-v257:before{content:"";position:absolute;inset:-2px;background:radial-gradient(circle at 10% 20%,rgba(92,255,158,.24),transparent 34%),radial-gradient(circle at 90% 20%,rgba(255,211,86,.20),transparent 32%);pointer-events:none;}
.ss-donate-banner-v257__glow{position:absolute;top:0;bottom:0;left:0;width:34%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:ssDonateShineV257 4.2s ease-in-out infinite;pointer-events:none;}
.ss-donate-banner-v257__top{position:relative;font-size:17px;font-weight:900;line-height:1.25;color:#7dff9d!important;text-shadow:0 0 10px rgba(92,255,158,.45);letter-spacing:.2px;}
.ss-donate-banner-v257__sub{position:relative;margin-top:4px;font-size:13px;font-weight:800;color:#ffd86b!important;text-shadow:0 0 9px rgba(255,216,107,.28);}
.ss-donate-banner-v257__pay{position:relative;margin-top:8px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:9px 11px;border-radius:11px;border:1px solid rgba(255,216,107,.30);background:rgba(0,0,0,.20)!important;}
.ss-donate-banner-v257__bank{font-size:13px;font-weight:800;color:#ffd86b!important;}
.ss-donate-banner-v257__num{font-family:monospace;font-size:20px;font-weight:900;letter-spacing:1px;color:#9dff9f!important;text-shadow:0 0 10px rgba(117,255,132,.42);user-select:text;}
@media(max-width:700px){.ss-donate-banner-v257{padding:11px 12px!important}.ss-donate-banner-v257__top{font-size:15px}.ss-donate-banner-v257__num{font-size:17px;letter-spacing:.4px}}
/* SUBSYNC_DONATE_COPY_BUTTON_CSS_V258 */
.ss-donate-banner-v258__copy{
  margin-left:auto!important;
  min-height:30px!important;
  padding:5px 11px!important;
  border-radius:9px!important;
  font-size:12px!important;
  font-weight:900!important;
  color:#07140b!important;
  background:linear-gradient(135deg,#7dff9d,#ffd86b)!important;
  border:1px solid rgba(255,255,255,.28)!important;
  box-shadow:0 0 14px rgba(125,255,157,.24)!important;
  cursor:pointer!important;
  text-shadow:none!important;
}
.ss-donate-banner-v258__copy:hover{
  filter:brightness(1.08)!important;
  box-shadow:0 0 20px rgba(255,216,107,.34)!important;
}
@media(max-width:700px){
  .ss-donate-banner-v258__copy{
    margin-left:0!important;
    width:100%!important;
  }
}
                           `),
				donateBannerV257, manualCardV53B, widgetsRow, sysWidgetsRowV96, wServerCard, sectionCreateCardV45B, subsCard, xhttpCard, autoPickCard, serversCard, 
				E('div', { 'style': 'text-align:right;margin-top:8px' }, [
                                        E('span', { 'class': 'ss-version ss-version-hidden-v90', 'style': 'display:none!important' }, '')
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
                                                   E('div', { 'class': 'td', 'style': 'font-size:11px' }, (meta.network || '?') === 'ok' ? 'Активна' : (meta.network || '?').toUpperCase()),
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

/* SUBSYNC_HY2_MODULE_CARD_V169D_APPLIED */
(function() {
  'use strict';

  var timer = null;
  var tries = 0;
  var observer = null;

  function ubusExec(command, params) {
    var sid = window.L && L.env && L.env.sessionid ? L.env.sessionid : null;
    if (!sid) return Promise.reject(new Error('LuCI sessionid not found. Re-login and Ctrl+F5.'));

    return fetch('/ubus', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'call',
        params: [ sid, 'file', 'exec', { command: command, params: params || [] } ]
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(j) {
      if (j.error) throw new Error(JSON.stringify(j.error));

      var data = j.result && j.result[1] ? j.result[1] : {};
      var out = '';

      if (data.stdout) out += data.stdout;
      if (data.stderr) out += (out ? '\n' : '') + data.stderr;

      if (typeof data.code !== 'undefined' && data.code !== 0) {
        throw new Error(out || ('command failed, code=' + data.code));
      }

      return out || 'OK';
    });
  }

  function findCreateSectionCard() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.ss-card'));

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var inp = card.querySelector('input[type="text"]');
      var ph = inp ? (inp.getAttribute('placeholder') || '') : '';
      var txt = card.textContent || '';

      if (ph.indexOf('urlzks95') !== -1) return card;
      if (txt.indexOf('urlzks95') !== -1 && txt.indexOf('Podkop') !== -1) return card;
    }

    return null;
  }

  function getTopSectionName() {
    var card = findCreateSectionCard();
    if (!card) return '';

    var inp = card.querySelector('input[type="text"]');
    return inp && inp.value ? inp.value.trim() : '';
  }

  function setOut(text) {
    var out = document.getElementById('ss-hy2-v169d-out');
    if (out) out.textContent = text;
  }

  function setStatus(text, color) {
    var s = document.getElementById('ss-hy2-v169d-status');
    if (!s) return;
    s.textContent = text || '';
    s.style.color = color || '#888';
  }

  function syncSection() {
    var inp = document.getElementById('ss-hy2-v169d-section');
    if (!inp) return;

    var top = getTopSectionName();
    if (top && !inp.value.trim()) inp.value = top;
  }

  function ensureBlock() {
    var createCard = findCreateSectionCard();

    /*
      Strict module-only placement:
      no body/main/header/cascade.css/theme insertion.
      If target card not found, do nothing.
    */
    if (!createCard || !createCard.parentNode) return false;

    var old = document.getElementById('ss-hy2-v169d-card');

    if (old) {
      if (old.previousElementSibling !== createCard) {
        createCard.parentNode.insertBefore(old, createCard.nextSibling);
      }
      syncSection();
      return true;
    }

    var box = document.createElement('div');
    box.id = 'ss-hy2-v169d-card';
    box.className = 'ss-card';
    box.style.marginTop = '10px';

    var section = getTopSectionName();

    box.innerHTML =
      '<h3>HYSTERIA2 / HY2</h3>' +
      '<div class="ss-label" style="margin-bottom:8px">' +
        '<div class="ss-label" style="margin-bottom:8px"><!-- SUBSYNC_HY2_MANUAL_TEXT_V183 --><b>Ручной если у вас нет подписки.</b><br>Вставь hy2:// или hysteria2://. Кнопка ниже применяет.</div>' +
      '</div>' +
      '<div class="ss-controls">' +
        '<input id="ss-hy2-v169d-section" type="text" value="' + section.replace(/"/g, '&quot;') + '" placeholder="Podkop-секция" style="min-width:220px;margin-right:8px">' +
        '<input id="ss-hy2-v169d-name" type="text" value="Manual HY2" placeholder="Название" style="min-width:180px;margin-right:8px">' +
      '</div>' +
      '<textarea id="ss-hy2-v169d-link" placeholder="hysteria2://..." style="width:100%;min-height:58px;box-sizing:border-box;font-family:monospace;margin-top:6px"></textarea>' +
      '<div class="ss-controls" style="margin-top:8px">' +
        '<button id="ss-hy2-v169d-select" class="btn cbi-button cbi-button-positive">Выбрать HYSTERIA2 в секцию</button>' +
        '<button id="ss-hy2-v169d-delete" class="btn cbi-button cbi-button-remove" style="margin-left:8px">Удалить HYSTERIA2</button>' +
        '<button id="ss-hy2-v169d-list" class="btn cbi-button" style="margin-left:8px">Подсказка</button>' +
        '<button id="ss-hy2-v169d-check" class="btn cbi-button" style="margin-left:8px">Проверить sing-box</button>' +
        '<button id="ss-hy2-v180-probe" class="btn cbi-button" style="margin-left:8px">Проверить HY2 сервер</button>' +
        '<span class="ss-label" id="ss-hy2-v169d-status" style="margin-left:8px;color:#888"></span>' +
      '</div>' +
      '<pre id="ss-hy2-v169d-out" style="white-space:pre-wrap;word-break:break-word;max-height:240px;overflow:auto;margin-top:10px;padding:10px;border-radius:10px;background:rgba(0,0,0,.18)">Готово. Укажи секцию, вставь HY2-ссылку и нажми “Выбрать HYSTERIA2 в секцию”.</pre>';

    createCard.parentNode.insertBefore(box, createCard.nextSibling);

    document.getElementById('ss-hy2-v169d-select').onclick = function() {
      /* SUBSYNC_HY2_SELECT_AUTO_REFRESH_V181 */
      try {
        var __hy2AutoRefreshLinkV181 = document.getElementById('ss-hy2-v169d-link');
        if (__hy2AutoRefreshLinkV181 && /^(hy2|hysteria2):\/\//i.test((__hy2AutoRefreshLinkV181.value || '').trim())) {
          setStatus('применяю, обновлю страницу через 5 сек...' , '#888');
          window.setTimeout(function() {
            try { window.location.reload(); } catch(e) {}
          }, 5000);
        }
      } catch(e) {}
      syncSection();

      var section = document.getElementById('ss-hy2-v169d-section').value.trim();
      var name = document.getElementById('ss-hy2-v169d-name').value.trim() || 'Manual HY2';
      var link = document.getElementById('ss-hy2-v169d-link').value.trim();

      if (!section) {
        setStatus('ошибка', '#f66');
        setOut('ERROR: укажи Podkop-секцию');
        return;
      }

      if (!/^[A-Za-z0-9_]+$/.test(section)) {
        setStatus('ошибка', '#f66');
        setOut('ERROR: имя секции только A-Z a-z 0-9 _');
        return;
      }

      if (!/^(hy2|hysteria2):\/\//i.test(link)) {
        setStatus('ошибка', '#f66');
        setOut('ERROR: вставь полную ссылку hy2:// или hysteria2://');
        return;
      }

      setStatus('применяю...', '#888');
      setOut('Применяю HYSTERIA2 в секцию ' + section + '...');

      ubusExec('/usr/bin/sub-sync-hy2-manager', ['select', section, name, link])
        .then(function(out) {
          setStatus('готово', '#2ecc71');
          setOut(out);
        })
        .catch(function(e) {
          setStatus('ошибка', '#f66');
          setOut('ERROR:\\n' + e.message);
        });
    };

    document.getElementById('ss-hy2-v169d-delete').onclick = function() {
      /* SUBSYNC_HY2_DELETE_EMPTY_GUARD_V184 */
      try {
        var __hy2DelLinkV184 = document.getElementById('ss-hy2-v169d-link');
        var __hy2DelValV184 = (__hy2DelLinkV184 && __hy2DelLinkV184.value ? __hy2DelLinkV184.value : '').trim();
        if (!/^(hy2|hysteria2):\/\//i.test(__hy2DelValV184)) {
          setStatus('нет ключа', '#f66');
          setOut('Нет HY2 ключа — удалять нечего. Вставь hy2:// или hysteria2://, чтобы удалить только этот ключ из указанной секции.');
          return;
        }
      } catch(e) {
        setStatus('ошибка проверки ключа', '#f66');
        setOut('ERROR: не смог проверить HY2 ключ перед удалением\n' + e.message);
        return;
      }
      /* SUBSYNC_HY2_DELETE_AUTO_REFRESH_V182 */
      try {
        setStatus('удаляю, обновлю страницу через 5 сек...' , '#888');
        window.setTimeout(function() {
          try { window.location.reload(); } catch(e) {}
        }, 5000);
      } catch(e) {}
      var name = document.getElementById('ss-hy2-v169d-name').value.trim() || 'Manual HY2';
      var link = document.getElementById('ss-hy2-v169d-link').value.trim();

      setStatus('удаляю...', '#888');
      setOut('Удаляю HYSTERIA2...');

      syncSection();
      var section = document.getElementById('ss-hy2-v169d-section').value.trim();
      if (!section) {
        setStatus('ошибка', '#f66');
        setOut('ERROR: укажи Podkop-секцию для удаления');
        return;
      }
      ubusExec('/usr/bin/sub-sync-hy2-manager', ['delete', section, link])
        .then(function(out) {
          setStatus('удалено', '#2ecc71');
          setOut(out);
        })
        .catch(function(e) {
          setStatus('ошибка', '#f66');
          setOut('ERROR:\\n' + e.message);
        });
    };

    document.getElementById('ss-hy2-v169d-list').onclick = function() {
      setStatus('читаю...', '#888');
      setOut('Загружаю список...');

      ubusExec('/usr/bin/sub-sync-hy2-manager', ['list'])
        .then(function(out) {
          setStatus('готово', '#2ecc71');
          setOut(out);
        })
        .catch(function(e) {
          setStatus('ошибка', '#f66');
          setOut('ERROR:\\n' + e.message);
        });
    };

    /* SUBSYNC_HY2_WORK_CHECK_BUTTON_V180 */
    document.getElementById('ss-hy2-v180-probe').onclick = function() {
      var link = document.getElementById('ss-hy2-v169d-link').value.trim();
      if (!/^(hy2|hysteria2):\/\//i.test(link)) {
        setStatus('ошибка', '#f66');
        setOut('ERROR: вставь HY2 ссылку в поле выше');
        return;
      }
      setStatus('проверяю сервер.', '#888');
      setOut('Проверяю HY2 сервер через временный sing-box. Жди 10-15 сек...');
      ubusExec('/usr/bin/sub-sync-hy2-probe', [link])
        .then(function(out) {
          var ok = /(^|\n)WORK:/.test(out);
          setStatus(ok ? 'WORK' : 'NO WORK', ok ? '#2ecc71' : '#f66');
          setOut(out);
        })
        .catch(function(e) {
          setStatus('NO WORK', '#f66');
          setOut('ERROR:\n' + e.message);
        });
    };

    /* SUBSYNC_HY2_MANUAL_ONLY_V187 */
    var __ssHy2ManualHintBtnV187 = document.getElementById('ss-hy2-v169d-list');
    if (__ssHy2ManualHintBtnV187) {
      __ssHy2ManualHintBtnV187.textContent = 'Подсказка';
      __ssHy2ManualHintBtnV187.onclick = function() {
        setStatus('ручной режим', '#888');
        setOut(
          'HYSTERIA2 / HY2 — ручной режим.\n\n' +
          'Если сервер пришёл из подписки — выбирай его в общем блоке “Серверы”.\n' +
          'Если подписки нет — вставь сюда hy2:// или hysteria2:// и нажми “Выбрать HYSTERIA2 в секцию”.\n\n' +
          'Ключи и пароли в этом окне не показываю.'
        );
      };
    }

    document.getElementById('ss-hy2-v169d-check').onclick = function() {
      setStatus('проверяю...', '#888');
      setOut('Проверяю sing-box...');

      ubusExec('/usr/bin/sub-sync-hy2-manager', ['check'])
        .then(function(out) {
          setStatus('готово', '#2ecc71');
          setOut(out);
        })
        .catch(function(e) {
          setStatus('ошибка', '#f66');
          setOut('ERROR:\\n' + e.message);
        });
    };

    return true;
  }

  function startScopedObserver() {
    var createCard = findCreateSectionCard();
    if (!createCard || !createCard.parentNode || observer) return;

    try {
      observer = new MutationObserver(function() {
        ensureBlock();
      });
      observer.observe(createCard.parentNode, { childList: true });
    } catch(e) {}
  }

  function boot() {
    ensureBlock();
    startScopedObserver();

    if (!timer) {
      timer = setInterval(function() {
        tries++;
        ensureBlock();
        startScopedObserver();

        if (tries > 240) {
          clearInterval(timer);
          timer = null;
        }
      }, 1000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
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

;/* SUBSYNC_MODULE_UPDATE_HIDE_RAW_LINES_V254 */
(function(){
  try {
    if (window.__subsyncModuleUpdateHideRawLinesV254)
      return;

    window.__subsyncModuleUpdateHideRawLinesV254 = true;

    function cleanModuleUpdateLogs() {
      var pres = document.querySelectorAll('.ss-module-update-log-v239');
      if (!pres || !pres.length)
        return;

      for (var i = 0; i < pres.length; i++) {
        var pre = pres[i];
        var raw = String(pre.textContent || '');
        if (!raw)
          continue;

        var clean = raw.split(/\r?\n/).filter(function(line) {
          line = String(line || '').trim();
          if (!line)
            return false;

          if (/^=== Podcop Sub v666 update check v236 ===$/.test(line)) return false;
          if (/^LOCAL_BUILD=/.test(line)) return false;
          if (/^REMOTE_VERSION=/.test(line)) return false;
          if (/^REMOTE_BUILD=/.test(line)) return false;
          if (/^TITLE=/.test(line)) return false;
          if (/^MESSAGE=/.test(line)) return false;
          if (/^UPDATE_AVAILABLE$/.test(line)) return false;
          if (/^UP_TO_DATE$/.test(line)) return false;
          if (/^NO_REMOTE_VERSION$/.test(line)) return false;

          return true;
        }).join('\n').trim();

        if (clean !== raw.trim())
          pre.textContent = clean;

        if (!clean)
          pre.style.display = 'none';
      }
    }

    cleanModuleUpdateLogs();
    setInterval(cleanModuleUpdateLogs, 700);
  } catch (e) {}
})();

;/* SUBSYNC_MODULE_UPDATE_SHOW_UPDATE_BUTTON_V255 */
(function(){
  try {
    if (window.__subsyncModuleUpdateShowButtonV255)
      return;

    window.__subsyncModuleUpdateShowButtonV255 = true;

    function cleanAndShowUpdateButtonV255() {
      var card = document.querySelector('.ss-module-update-card-v236');
      if (!card)
        return;

      var statusText = '';
      var st = card.querySelector('.ss-module-update-status-v239');
      if (st)
        statusText = String(st.textContent || '');

      var isUpdate = /вышло обновление|update_available|можно нажать/i.test(statusText);

      var rawRe = /LOCAL_BUILD=|REMOTE_VERSION=|REMOTE_BUILD=|TITLE=|MESSAGE=|UPDATE_AVAILABLE|UP_TO_DATE|REQUIRED_MARKER=|Download install\.sh|SAFE_STOP|Podcop Sub v666 update/i;

      var rawNodes = card.querySelectorAll('pre, code, textarea');
      for (var i = 0; i < rawNodes.length; i++) {
        var n = rawNodes[i];
        var txt = String(n.textContent || n.value || '');
        if (rawRe.test(txt)) {
          if ('value' in n)
            n.value = '';
          n.textContent = '';
          n.style.setProperty('display', 'none', 'important');
        }
      }

      var details = card.querySelectorAll('.ss-module-update-details-v239');
      for (var d = 0; d < details.length; d++) {
        var box = details[d];
        var hasUpdateButton = false;
        var controls = box.querySelectorAll('button, a, input, .cbi-button');

        for (var c = 0; c < controls.length; c++) {
          var label = String(controls[c].textContent || controls[c].value || '').replace(/\s+/g, ' ').trim();

          if (/^(детали|скрыть детали|details|hide details)$/i.test(label)) {
            controls[c].style.setProperty('display', 'none', 'important');
            continue;
          }

          if (/обновление модуля|обновить/i.test(label)) {
            hasUpdateButton = true;
            controls[c].style.setProperty('display', isUpdate ? 'inline-block' : 'none', 'important');
            controls[c].style.setProperty('margin-top', '8px', 'important');
          }
        }

        if (hasUpdateButton && isUpdate)
          box.style.setProperty('display', 'block', 'important');
        else if (!isUpdate)
          box.style.setProperty('display', 'none', 'important');
      }

      var topControls = card.querySelectorAll('button, a, input, .cbi-button');
      for (var t = 0; t < topControls.length; t++) {
        var topLabel = String(topControls[t].textContent || topControls[t].value || '').replace(/\s+/g, ' ').trim();
        if (/^(детали|скрыть детали|details|hide details)$/i.test(topLabel)) {
          topControls[t].style.setProperty('display', 'none', 'important');
        }
      }
    }

    cleanAndShowUpdateButtonV255();
    window.setTimeout(cleanAndShowUpdateButtonV255, 150);
    window.setTimeout(cleanAndShowUpdateButtonV255, 700);
    window.setTimeout(cleanAndShowUpdateButtonV255, 1600);
    window.setInterval(cleanAndShowUpdateButtonV255, 1500);
  } catch(e) {}
})();

;/* SUBSYNC_POST_UPDATE_AUTO_RELOAD_V259 */
/* SUBSYNC_INSTALL_CACHE_AND_STALE_CLEANUP_V259_JS */
(function(){
  try {
    if (window.__subsyncPostUpdateAutoReloadV259)
      return;

    window.__subsyncPostUpdateAutoReloadV259 = true;

    function ssAutoReloadV259() {
      var last = parseInt(sessionStorage.getItem('subsync_post_update_reload_v259') || '0', 10);
      var now = Date.now();

      if (last && (now - last) < 15000)
        return;

      sessionStorage.setItem('subsync_post_update_reload_v259', String(now));

      try {
        if (window.caches && caches.keys) {
          caches.keys().then(function(keys) {
            keys.forEach(function(k) { caches.delete(k); });
          }).catch(function(){});
        }
      } catch(e) {}

      window.setTimeout(function() {
        var url = location.pathname + '?_subsync_refresh=' + Date.now();
        if (location.hash)
          url += location.hash;

        location.replace(url);
      }, 900);
    }

    function ssCheckUpdateDoneV259() {
      var card = document.querySelector('.ss-module-update-card-v236');
      if (!card)
        return;

      var txt = String(card.textContent || '');

      if (/DONE:\s*install\.sh finished rc=0|Podcop Sub v666 public build v[0-9]+ installed|public build v[0-9]+ installed/i.test(txt)) {
        ssAutoReloadV259();
      }
    }

    window.setInterval(ssCheckUpdateDoneV259, 700);

    window.setTimeout(function() {
      try {
        if (document.body && typeof MutationObserver !== 'undefined') {
          new MutationObserver(ssCheckUpdateDoneV259).observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
          });
        }
      } catch(e) {}
    }, 1000);
  } catch(e) {}
})();

/* SUBSYNC_SAFE_OTA_REPORT_UI_V260 */

/* SUBSYNC_UPDATE_CHECK_TEXT_V261 */
/* SUBSYNC_UPDATE_REAL_REPORT_TIMER_V261 */

/* SUBSYNC_UI_UPDATE_LIVE_TIMER_V263 */
(function(){
  try {
    if (window.__subsyncUiUpdateLiveTimerV263) return;
    window.__subsyncUiUpdateLiveTimerV263 = true;

    function pad(n){ n = Number(n)||0; return n < 10 ? '0' + n : String(n); }
    function fmt(sec){ sec = Number(sec)||0; return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); }

    function findCard(el) {
      var n = el;
      while (n && n !== document.body) {
        var text = String(n.textContent || '');
        var cls = String(n.className || '');
        if (/Обновление Модуля|module-update/i.test(text) || /module-update|ss-module/i.test(cls))
          return n;
        n = n.parentNode;
      }

      var nodes = document.querySelectorAll('div,section,fieldset');
      for (var i = 0; i < nodes.length; i++) {
        if (/Обновление Модуля/i.test(String(nodes[i].textContent || '')))
          return nodes[i];
      }

      return document.body;
    }

    function ensureBox(card) {
      if (!card) return null;
      var box = card.querySelector ? card.querySelector('.ss-update-live-timer-v263') : null;
      if (box) return box;

      box = document.createElement('div');
      box.className = 'ss-update-live-timer-v263';
      box.style.cssText = [
        'margin-top:10px',
        'padding:10px 12px',
        'border-radius:12px',
        'border:1px solid rgba(125,255,157,.35)',
        'background:rgba(0,0,0,.24)',
        'color:#eaffef',
        'font-size:13px',
        'line-height:1.45',
        'box-shadow:0 0 16px rgba(125,255,157,.12)'
      ].join(';');

      try { card.appendChild(box); } catch(e) { document.body.appendChild(box); }
      return box;
    }

    function startUpdateTimer(card) {
      var box = ensureBox(card);
      if (!box) return;

      if (window.__subsyncUiUpdateLiveTimerV263Interval)
        clearInterval(window.__subsyncUiUpdateLiveTimerV263Interval);

      var started = Date.now();
      var steps = [
        'Скачиваю version.json',
        'Проверяю доступность обновления',
        'Скачиваю install.sh',
        'Проверяю защитный marker',
        'Запускаю установку',
        'Ставлю тему и меню',
        'Очищаю LuCI cache',
        'Ожидаю перезапуск LuCI'
      ];

      function render() {
        var sec = Math.floor((Date.now() - started) / 1000);
        var idx = Math.min(steps.length - 1, Math.floor(sec / 3));
        box.innerHTML =
          '<b style="color:#7dff9d">Обновление модуля запущено</b><br>' +
          'Время: <b>' + fmt(sec) + '</b><br>' +
          'Текущий шаг: <b>' + steps[idx] + '</b><br>' +
          '<span style="opacity:.78">Не закрывайте страницу. Если LuCI перезапустится — войдите заново.</span>';
      }

      render();
      window.__subsyncUiUpdateLiveTimerV263Interval = setInterval(render, 1000);
    }

    function showChecking(card) {
      var box = ensureBox(card);
      if (!box) return;
      box.innerHTML =
        '<b style="color:#ffd86b">Проверяю версию...</b><br>' +
        'Сравниваю локальную и последнюю версию.';
    }

    function stopWithText(text) {
      if (window.__subsyncUiUpdateLiveTimerV263Interval)
        clearInterval(window.__subsyncUiUpdateLiveTimerV263Interval);

      var box = document.querySelector('.ss-update-live-timer-v263');
      if (box)
        box.innerHTML = text;
    }

    document.addEventListener('click', function(ev) {
      var t = ev.target;
      if (!t) return;

      var txt = String(t.textContent || '').trim();
      var card = findCard(t);

      if (/обнов/i.test(txt) && !/провер/i.test(txt))
        startUpdateTimer(card);

      if (/провер/i.test(txt))
        showChecking(card);
    }, true);

    setInterval(function() {
      var body = String(document.body && document.body.textContent || '');

      if (/У вас последняя версия|Обновление не требуется|UP_TO_DATE|Обновлений нет/i.test(body)) {
        stopWithText(
          '<b style="color:#7dff9d">Проверка завершена</b><br>' +
          'У вас последняя версия. Обновление не требуется.'
        );
      }

      if (/DONE:\s*install\.sh finished rc=0|installed\. LuCI will restart/i.test(body)) {
        stopWithText(
          '<b style="color:#7dff9d">Обновление установлено</b><br>' +
          'LuCI сейчас перезапустится. После входа откройте Services → Podkop.'
        );
      }

      if (/UPDATE_AVAILABLE|Доступно обновление|Вышло обновление/i.test(body) && !/У вас последняя версия/i.test(body)) {
        var box = document.querySelector('.ss-update-live-timer-v263');
        if (box && !window.__subsyncUiUpdateLiveTimerV263Interval)
          box.innerHTML = '<b style="color:#ffd86b">Доступно обновление.</b><br>Нажмите «Обновить модуль».';
      }
    }, 1000);
  } catch(e) {}
})();
