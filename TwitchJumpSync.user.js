// ==UserScript==
// @name         TwitchJumpSync Hybrid Final
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  Base vv4 intégrale - Stockage Local par défaut + Option Firebase Sync
// @author       User
// @match        https://www.twitch.tv/*
// @match        https://m.twitch.tv/*
// @grant        none
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js
// ==/UserScript==

(function() {
    'use strict';

    const CFG_KEY = 'tw_sync_fb_config';
    const LOCAL_DATA_KEY = 'tw_sync_local_data';
    const sT = 'tw_sync_data';
    
    let sV = [];
    let isSyncEnabled = false;
    let db = null;

    // 1. INITIALISATION DU MODE
    const firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY));
    if (firebaseConfig && firebaseConfig.apiKey) {
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            isSyncEnabled = true;
        } catch(e) { console.error("Firebase fail:", e); isSyncEnabled = false; }
    }

    // 2. SAUVEGARDE HYBRIDE
    const save = () => {
        if (isSyncEnabled && db) {
            db.ref(sT).set(sV);
        } else {
            localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(sV));
            if (typeof render === 'function') render();
        }
    };

    // 3. STYLE ORIGINAL VV4
    const style = document.createElement('style');
    style.innerHTML = `
        #i::selection { background: #0078d7 !important; color: #ffffff !important; }
        #i { -webkit-tap-highlight-color: transparent !important; outline: none !important; caret-color: #0078d7 !important; }
        #twj { transition: height 0.2s ease-out, width 0.2s ease-out; box-shadow: 0 0 15px rgba(0,0,0,0.4); overflow: hidden; will-change: transform, top, left; z-index: 999999999 !important; }
        .minimized { width: 230px !important; height: 105px !important; min-height: 105px !important; }
        .minimized > *:not(#h):not(#min-controls):not(#min):not(#x) { display: none !important; }
        .min-btn-style { background: #e91e63; color: white; border: none; border-radius: 4px; padding: 0 10px; height: 32px; font-size: 10px; cursor: pointer; font-weight: bold; text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center; text-align: center; }
        #min-mk10 { background: #c2185b; }
        .jump { cursor: pointer; }
    `;
    document.head.appendChild(style);

    function init() {
        if (document.getElementById('twj')) return;

        const isPC = window.matchMedia('(pointer: fine)').matches;
        let myDevice = isPC ? 'PC' : 'TAB';
        let viewTab = myDevice;

        let v = () => document.querySelector('video'),
            f = s => { try { return new Date(s * 1000).toISOString().substr(11, 8); } catch(e) { return "00:00:00"; } };

        const getCurCh = () => {
            try { return (document.querySelector('.channel-info-content h1') || document.querySelector('[data-a-target="user-card-link"]') || {innerText: "Stream"}).innerText.trim(); }
            catch(e) { return "TwitchStream"; }
        };

        const restoreBtn = document.createElement('div');
        restoreBtn.id = 'twj-restore';
        restoreBtn.innerHTML = 'T';
        restoreBtn.style = 'position:fixed;top:5px;left:5px;z-index:2147483647;background:#9147ff;color:white;width:30px;height:30px;border-radius:50%;display:none;justify-content:center;align-items:center;cursor:pointer;font-weight:bold;box-shadow:0 0 5px #000';

        const d = document.createElement('div');
        d.id = 'twj';
        d.style = 'position:fixed;top:100px;left:10px;background:#18181b;padding:12px;border:2px solid #9147ff;border-radius:12px;width:260px;height:auto;color:#fff;font-family:sans-serif;touch-action:none;display:flex;flex-direction:column;gap:10px;resize:both;max-width:95vw;max-height:85vh';
        
        const modeStatus = isSyncEnabled ? '<span style="color:#4caf50">SYNC</span>' : '<span style="color:#adadb8">LOCAL</span>';

        d.innerHTML = `
            <div id="h" style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px;flex-shrink:0;user-select:none">DRAG (${myDevice}) | ${modeStatus}</div>
            <button id="min" style="position:absolute;top:5px;left:8px;background:none;border:none;color:#fff;font-weight:bold;padding:5px;cursor:pointer;font-size:16px;line-height:1">-</button>
            <button id="x" style="position:absolute;top:5px;right:8px;background:none;border:none;color:#f44;font-weight:bold;padding:5px;cursor:pointer">X</button>
            <div id="min-controls" style="display:none;justify-content:center;gap:15px;margin-top:10px">
                <button id="min-mk" class="min-btn-style">MARK</button>
                <button id="min-mk10" class="min-btn-style">MARK -10s</button>
            </div>
            <input id="i" type="tel" inputmode="numeric" style="width:100%;background:#000;color:#ffffff;border:1px solid #333;padding:8px 5px;font-size:1.4em;text-align:center;border-radius:5px;font-family:monospace;letter-spacing:1px">
            <div id="g" style="color:#9147ff;font-weight:bold;text-align:center;cursor:pointer;padding:8px;background:#000;border-radius:4px;margin-top:2px">JUMP</div>
            <div style="display:flex;gap:20px;justify-content:center;font-size:0.85em;font-weight:bold;user-select:none;padding:5px 0">
                <div id="m10" style="cursor:pointer">-10s</div><div id="m5" style="cursor:pointer">-5s</div>
                <div id="p5" style="cursor:pointer">+5s</div><div id="p10" style="cursor:pointer">+10s</div>
            </div>
            <div style="border-top:1px solid #333;padding-top:10px;display:flex;flex-direction:column;gap:12px">
                <div style="display:flex;justify-content:space-between;font-size:0.75em;font-weight:bold;user-select:none;gap:5px">
                    <div id="mk" style="color:#e91e63;cursor:pointer">MARK</div>
                    <div id="ls" style="cursor:pointer">LIST</div>
                    <div id="txt" style="color:#4caf50;cursor:pointer">TXT</div>
                    <div id="mk10" style="color:#c2185b;cursor:pointer">MK-10</div>
                    <div id="cfg_gear" style="color:#9147ff;cursor:pointer">⚙️</div>
                </div>
            </div>
            <div id="tabs" style="display:none;flex-direction:row;background:#000;border-radius:4px;overflow:hidden;border:1px solid #333;margin-top:5px;flex-shrink:0">
                <div id="tab-pc" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px;border-right:1px solid #333">PC</div>
                <div id="tab-tab" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px">TAB</div>
            </div>
            <div id="l" style="display:none;flex-grow:1;overflow-y:auto;background:#000;font-size:0.8em;border:1px solid #333;min-height:50px;max-height:300px"></div>
            <div id="r" style="position:absolute;bottom:0;right:0;width:20px;height:20px;background:linear-gradient(135deg,transparent 50%,#9147ff 50%);cursor:nwse-resize"></div>
        `;

        const I = document.getElementById('i'), L = document.getElementById('l'), T = document.getElementById('tabs');

        // LOGIQUE D'AFFICHAGE LISTE
        window.render = () => {
            if (!L) return;
            L.innerHTML = '';
            document.getElementById('tab-pc').style.background = viewTab === 'PC' ? '#9147ff' : '#222';
            document.getElementById('tab-tab').style.background = viewTab === 'TAB' ? '#9147ff' : '#222';
            const filtered = sV.filter(item => (item.dev === viewTab || (!item.dev && viewTab === 'PC')));
            [...filtered].reverse().forEach((item) => {
                const row = document.createElement('div');
                row.style = 'display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #222;align-items:center';
                const fullUrl = (item.u ? item.u.split('?')[0] : window.location.origin + window.location.pathname) + "?t=" + item.t + "s";
                row.innerHTML = `<a class="jump" href="${fullUrl}" style="color:#9147ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:none;text-decoration:none">${item.n}</a>
                                 <button class="de-btn" style="background:#f44;color:#fff;border:none;border-radius:3px;padding:3px 6px;font-size:9px;cursor:pointer">DEL</button>`;
                
                const jumpLink = row.querySelector('.jump');
                // LOGIQUE CLIC MILIEU / ARRIERE PLAN VV4
                jumpLink.onclick = (e) => {
                    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
                        e.preventDefault();
                        const newWin = window.open(fullUrl, '_blank');
                        if (newWin) newWin.blur();
                        window.focus();
                    }
                };
                row.querySelector('.de-btn').onclick = () => { sV = sV.filter(i => i !== item); save(); };
                L.appendChild(row);
            });
        };

        // FENÊTRE DE CONFIGURATION (Ton interface Firebase)
        document.getElementById('cfg_gear').onclick = () => {
            const modal = document.createElement('div');
            modal.style = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#18181b;padding:20px;border:2px solid #9147ff;border-radius:12px;z-index:1000000001;color:white;font-family:sans-serif;width:280px;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 30px #000;';
            modal.innerHTML = `
                <h4 style="margin:0;color:#9147ff;text-align:center">Configuration Sync</h4>
                <p style="font-size:10px;color:#adadb8;margin:0">Entrez vos identifiants Firebase ou videz pour rester en Local.</p>
                <input id="f_api" placeholder="API Key" value="${firebaseConfig?.apiKey || ''}" style="background:#000;color:white;border:1px solid #333;padding:5px;border-radius:4px">
                <input id="f_url" placeholder="Database URL" value="${firebaseConfig?.databaseURL || ''}" style="background:#000;color:white;border:1px solid #333;padding:5px;border-radius:4px">
                <input id="f_pid" placeholder="Project ID" value="${firebaseConfig?.projectId || ''}" style="background:#000;color:white;border:1px solid #333;padding:5px;border-radius:4px">
                <div style="display:flex;gap:5px;margin-top:10px">
                    <button id="f_save" style="flex:1;background:#9147ff;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;font-weight:bold">Activer Sync</button>
                    <button id="f_local" style="flex:1;background:#444;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer">Passer Local</button>
                </div>
                <button id="f_close" style="background:none;border:none;color:red;cursor:pointer;font-size:10px">Fermer sans changer</button>
            `;
            document.body.appendChild(modal);
            document.getElementById('f_save').onclick = () => {
                const cfg = {
                    apiKey: document.getElementById('f_api').value.trim(),
                    databaseURL: document.getElementById('f_url').value.trim(),
                    projectId: document.getElementById('f_pid').value.trim(),
                    authDomain: document.getElementById('f_pid').value.trim() + ".firebaseapp.com",
                    appId: "1:704668031471:web:default"
                };
                if(cfg.apiKey) { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); location.reload(); }
            };
            document.getElementById('f_local').onclick = () => { localStorage.removeItem(CFG_KEY); location.reload(); };
            document.getElementById('f_close').onclick = () => modal.remove();
        };

        // CHARGEMENT INITIAL
        if (isSyncEnabled && db) {
            db.ref(sT).on('value', (snap) => { sV = Array.isArray(snap.val()) ? snap.val() : []; render(); });
        } else {
            sV = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY)) || [];
            render();
        }

        // DRAG & RESIZE VV4 (LOGIQUE INTÉGRALE)
        let isD = false, isR = false, oX, oY, sW, sH;
        const start = (e, type) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('#l')) return;
            const ev = e.type.includes('touch') ? e.touches[0] : e;
            if (type === 'd') { isD = true; oX = ev.clientX - d.offsetLeft; oY = ev.clientY - d.offsetTop; }
            else { isR = true; sW = d.offsetWidth; sH = d.offsetHeight; oX = ev.clientX; oY = ev.clientY; }
        };
        const move = (e) => {
            if (!isD && !isR) return;
            const ev = e.type.includes('touch') ? e.touches[0] : e;
            if (isD) { d.style.left = (ev.clientX - oX) + 'px'; d.style.top = (ev.clientY - oY) + 'px'; }
            if (isR) { d.style.width = (sW + ev.clientX - oX) + 'px'; d.style.height = (sH + ev.clientY - oY) + 'px'; }
            if (e.cancelable) e.preventDefault();
        };
        window.addEventListener('mousemove', move, { passive: false });
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('mouseup', () => isD = isR = false);
        window.addEventListener('touchend', () => isD = isR = false);
        document.getElementById('h').onmousedown = document.getElementById('h').ontouchstart = (e) => start(e, 'd');
        document.getElementById('r').onmousedown = document.getElementById('r').ontouchstart = (e) => start(e, 'r');

        // BOUTONS ACTIONS
        document.getElementById('mk').onclick = () => { if(v()){ sV.push({ n: f(v().currentTime), t: Math.floor(v().currentTime), u: window.location.href.split('?')[0], dev: myDevice }); save(); } };
        document.getElementById('mk10').onclick = () => { if(v()){ let t = Math.max(0, v().currentTime - 10); sV.push({ n: f(t), t: Math.floor(t), u: window.location.href.split('?')[0], dev: myDevice }); save(); } };
        document.getElementById('ls').onclick = () => { const open = L.style.display !== 'none'; L.style.display = open ? 'none' : 'block'; T.style.display = open ? 'none' : 'flex'; render(); };
        document.getElementById('m10').onclick = () => { if(v()) v().currentTime -= 10; };
        document.getElementById('p10').onclick = () => { if(v()) v().currentTime += 10; };
        document.getElementById('m5').onclick = () => { if(v()) v().currentTime -= 5; };
        document.getElementById('p5').onclick = () => { if(v()) v().currentTime += 5; };
        document.getElementById('tab-pc').onclick = () => { viewTab = 'PC'; render(); };
        document.getElementById('tab-tab').onclick = () => { viewTab = 'TAB'; render(); };
        document.getElementById('min').onclick = () => { d.classList.toggle('minimized'); d.style.height = d.classList.contains('minimized') ? '105px' : 'auto'; };
        document.getElementById('x').onclick = () => { d.style.display = 'none'; restoreBtn.style.display = 'flex'; };
        restoreBtn.onclick = () => { d.style.display = 'flex'; restoreBtn.style.display = 'none'; };
        document.getElementById('g').onclick = () => { if(v()){ const parts = I.value.split(':'); if(parts.length === 3) v().currentTime = (+parts[0])*3600 + (+parts[1])*60 + (+parts[2]); } };

        const inject = () => {
            const container = document.querySelector('.video-player__container') || document.body;
            if (container && !container.contains(d)) { container.appendChild(d); container.appendChild(restoreBtn); }
        };
        inject(); setInterval(inject, 2000);
        setInterval(() => { if (v() && !v().paused && document.activeElement != I) { I.value = f(v().currentTime); } }, 1000);
    }
    setTimeout(init, 3000);
})();
