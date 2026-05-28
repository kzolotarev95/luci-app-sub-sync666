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
                            'style': 'display:inline-block!important;margin:0!important;padding:3px 10px!important;font-size:12px;border-radius:9px;border:1px solid #ff9800;background:transparent;color:#ff9800;font-weight:800;text-align:left!important',
                            'click': function(ev) {
                                    if (ev && ev.preventDefault)
                                            ev.preventDefault();

                                    var isHidden = manualBodyV53B.style.display === 'none';
                                    manualBodyV53B.style.display = isHidden ? 'block' : 'none';
                                    manualBtnV53B.textContent = isHidden ? 'Скрыть мануал' : 'Мануал: как пользоваться модулем';
                            }
                    }, 'Мануал: как пользоваться модулем');

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
                            'style': 'display:inline-block!important;margin:0!important;padding:3px 10px!important;font-size:12px;border-radius:9px;border:1px solid #ff9800;background:transparent;color:#ff9800;font-weight:800;text-align:left!important',
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

			var widgetsRow = E('div', { 'class': 'ss-widgets' }, [wStatus, wConnection, wSingbox]);
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
					E('div', { 'class': 'td', 'data-title': 'Пинг', 'style': 'text-align:center' }, [createPingCell(s.id || (idx + 1))]),
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
				manualCardV53B, widgetsRow, sysWidgetsRowV96, wServerCard, sectionCreateCardV45B, subsCard, xhttpCard, autoPickCard, serversCard, donatersPublicCardV128, 
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
