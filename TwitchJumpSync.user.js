// ==UserScript==
// @name         TwitchJumpSync Hybrid Fixed
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Version vv4 intégrale - Fix affichage mode local
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

    let firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY)) || null;
    let isLocalMode = localStorage.getItem('tw_mode_local') === 'true' || !firebaseConfig;

    let sV = [];
    let db = null;

    // INITIALISATION DATA
    if (!isLocalMode && firebaseConfig && firebaseConfig.apiKey) {
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            db.ref(sT).on('value', (snap) => {
                sV = Array.isArray(snap.val()) ? snap.val() : [];
                if (typeof render === 'function') render();
            });
        } catch(e) { 
            console.error("Firebase fail, switching to local", e);
            isLocalMode = true; 
        }
    } 
    
    if (isLocalMode) {
        sV = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY)) || [];
    }

    const save = () => {
        if (db && !isLocalMode) {
            db.ref(sT).set(sV);
        } else {
            localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(sV));
            render();
        }
    };

    // STYLE VV4
    const style = document.createElement('style');
    style.innerHTML = `
        #i::selection { background: #0078d7 !important; color: #ffffff !important; }
        #i { -webkit-tap-highlight-color: transparent !important; outline: none !important; caret-color: #0078d7 !important; }
        #twj { transition: height 0.2s ease-out, width 0.2s ease-out; box-shadow: 0 0 15px rgba(0,0,0,0.4); overflow: hidden; z-index: 999999999 !important; }
        .minimized { width: 230px !important; height: 105px !important; min-height: 105px !important; }
        .minimized > *:not(#h):not(#min-controls):not(#min):not(#x) { display: none !important; }
        .min-btn-style { background: #e91e63; color: white; border: none; border-radius: 4px; padding: 0 10px; height: 32px; font-size: 10px; cursor: pointer; font-weight: bold; text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center; }
    `;
    document.head.appendChild(style);

    function showConfigModal() {
        const modal = document.createElement('div');
        modal.style = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#18181b;padding:20px;border:2px solid #9147ff;border-radius:12px;z-index:1000000005;color:white;font-family:sans-serif;width:300px;display:flex;flex-direction:column;gap:5px;box-shadow:0 0 50px #000;';
        modal.innerHTML = `
            <h3 style="color:#9147ff;margin:0;text-align:center">Paramètres Sync</h3>
            <input id="f_api" placeholder="API Key" style="background:#000;color:white;border:1px solid #333;padding:5px" value="${firebaseConfig?.apiKey || ''}">
            <input id="f_url" placeholder="Database URL" style="background:#000;color:white;border:1px solid #333;padding:5px" value="${firebaseConfig?.databaseURL || ''}">
            <input id="f_pid" placeholder="Project ID" style="background:#000;color:white;border:1px solid #333;padding:5px" value="${firebaseConfig?.projectId || ''}">
            <input id="f_aid" placeholder="App ID" style="background:#000;color:white;border:1px solid #333;padding:5px" value="${firebaseConfig?.appId || ''}">
            <div style="display:flex;gap:5px;margin-top:10px">
                <button id="f_save" style="flex:1;background:#9147ff;color:white;border:none;padding:10px;cursor:pointer;font-weight:bold">Activer Sync</button>
                <button id="f_local" style="flex:1;background:#444;color:white;border:none;padding:10px;cursor:pointer">Mode Local</button>
            </div>
            <button id="f_close" style="background:none;border:none;color:gray;cursor:pointer;font-size:10px;margin-top:5px">Annuler</button>
        `;
        document.body.appendChild(modal);
        document.getElementById('f_save').onclick = () => {
            const cfg = {
                apiKey: document.getElementById('f_api').value.trim(),
                databaseURL: document.getElementById('f_url').value.trim(),
                projectId: document.getElementById('f_pid').value.trim(),
                appId: document.getElementById('f_aid').value.trim(),
                authDomain: document.getElementById('f_pid').value.trim() + ".firebaseapp.com"
            };
            localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
            localStorage.setItem('tw_mode_local', 'false');
            location.reload();
        };
        document.getElementById('f_local').onclick = () => {
            localStorage.setItem('tw_mode_local', 'true');
            location.reload();
        };
        document.getElementById('f_close').onclick = () => modal.remove();
    }

    function init() {
        if (document.getElementById('twj')) return;
        const isPC = window.matchMedia('(pointer: fine)').matches;
        let myDevice = isPC ? 'PC' : 'TAB';
        let viewTab = myDevice;
        let v = () => document.querySelector('video'),
            f = s => { try { return new Date(s * 1000).toISOString().substr(11, 8); } catch(e) { return "00:00:00"; } };

        const d = document.createElement('div');
        d.id = 'twj';
        d.style = `position:fixed;top:100px;left:10px;background:#18181b;padding:12px;border:2px solid #9147ff;border-radius:12px;width:260px;height:auto;color:#fff;font-family:sans-serif;touch-action:none;display:flex;flex-direction:column;gap:10px;resize:both;max-width:95vw;`;
        
        const restoreBtn = document.createElement('div');
        restoreBtn.style = 'position:fixed;top:5px;left:5px;z-index:2147483647;background:#9147ff;color:white;width:30px;height:30px;border-radius:50%;display:none;justify-content:center;align-items:center;cursor:pointer;font-weight:bold;';
        restoreBtn.innerHTML = 'T';

        d.innerHTML = `
            <div id="h" style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px;user-select:none">DRAG | ${isLocalMode ? 'LOCAL' : 'SYNC'}</div>
            <button id="min" style="position:absolute;top:5px;left:8px;background:none;border:none;color:#fff;cursor:pointer">-</button>
            <button id="x" style="position:absolute;top:5px;right:8px;background:none;border:none;color:#f44;cursor:pointer">X</button>
            <div id="min-controls" style="display:none;justify-content:center;gap:10px"><button id="min-mk" class="min-btn-style">MARK</button></div>
            <input id="i" type="tel" style="width:100%;background:#000;color:#fff;border:1px solid #333;padding:8px 5px;font-size:1.4em;text-align:center;border-radius:5px;font-family:monospace;">
            <div id="g" style="color:#9147ff;font-weight:bold;text-align:center;cursor:pointer;padding:8px;background:#000;border-radius:4px;">JUMP</div>
            <div style="display:flex;gap:15px;justify-content:center;font-size:0.8em">
                <div id="m10" style="cursor:pointer">-10s</div><div id="p10" style="cursor:pointer">+10s</div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.7em;font-weight:bold;padding-top:5px;border-top:1px solid #333">
                <div id="mk" style="color:#e91e63;cursor:pointer">MARK</div>
                <div id="ls" style="cursor:pointer">LIST</div>
                <div id="mk10" style="color:#c2185b;cursor:pointer">MK-10</div>
                <div id="cfg_gear" style="color:#9147ff;cursor:pointer">⚙️</div>
            </div>
            <div id="tabs" style="display:none;background:#000;border:1px solid #333;margin-top:5px">
                <div id="tab-pc" style="flex:1;text-align:center;padding:5px;cursor:pointer">PC</div>
                <div id="tab-tab" style="flex:1;text-align:center;padding:5px;cursor:pointer">TAB</div>
            </div>
            <div id="l" style="display:none;flex-grow:1;overflow-y:auto;background:#000;border:1px solid #333;max-height:250px"></div>
            <div id="r" style="position:absolute;bottom:0;right:0;width:15px;height:15px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 50%,#9147ff 50%)"></div>
        `;

        const L = document.getElementById('l'), T = document.getElementById('tabs'), I = document.getElementById('i');

        window.render = () => {
            if(!L) return; L.innerHTML = '';
            sV.filter(it => it.dev === viewTab || (!it.dev && viewTab === 'PC')).reverse().forEach(it => {
                const row = document.createElement('div');
                row.style = 'display:flex;justify-content:space-between;padding:5px;border-bottom:1px solid #222;font-size:11px';
                row.innerHTML = `<span class="jump-it" style="color:#9147ff;cursor:pointer">${it.n}</span><button class="del" style="background:red;color:white;border:none;font-size:8px">X</button>`;
                row.querySelector('.jump-it').onclick = () => { if(v()) v().currentTime = it.t; };
                row.querySelector('.del').onclick = () => { sV = sV.filter(x => x !== it); save(); };
                L.appendChild(row);
            });
        };

        // DRAG & RESIZE (Code exact de vv4.txt)
        let isD = false, isR = false, oX, oY, sW, sH;
        const start = (e, type) => {
            const ev = e.type.includes('touch') ? e.touches[0] : e;
            if (type === 'd') { isD = true; oX = ev.clientX - d.offsetLeft; oY = ev.clientY - d.offsetTop; }
            else { isR = true; sW = d.offsetWidth; sH = d.offsetHeight; oX = ev.clientX; oY = ev.clientY; }
        };
        const move = (e) => {
            if (!isD && !isR) return;
            const ev = e.type.includes('touch') ? e.touches[0] : e;
            if (isD) { d.style.left = (ev.clientX - oX) + 'px'; d.style.top = (ev.clientY - oY) + 'px'; }
            if (isR) { d.style.width = (sW + ev.clientX - oX) + 'px'; d.style.height = (sH + ev.clientY - oY) + 'px'; }
            e.preventDefault();
        };
        window.addEventListener('mousemove', move, {passive:false}); window.addEventListener('touchmove', move, {passive:false});
        window.addEventListener('mouseup', () => isD = isR = false); window.addEventListener('touchend', () => isD = isR = false);
        document.getElementById('h').onmousedown = document.getElementById('h').ontouchstart = (e) => start(e, 'd');
        document.getElementById('r').onmousedown = document.getElementById('r').ontouchstart = (e) => start(e, 'r');

        // CLICS
        document.getElementById('mk').onclick = () => { if(v()){ sV.push({n:f(v().currentTime), t:Math.floor(v().currentTime), dev:myDevice}); save(); } };
        document.getElementById('ls').onclick = () => { const s = L.style.display==='none'; L.style.display=s?'block':'none'; T.style.display=s?'flex':'none'; render(); };
        document.getElementById('cfg_gear').onclick = () => showConfigModal();
        document.getElementById('x').onclick = () => { d.style.display = 'none'; restoreBtn.style.display = 'flex'; };
        restoreBtn.onclick = () => { d.style.display = 'flex'; restoreBtn.style.display = 'none'; };
        document.getElementById('m10').onclick = () => { if(v()) v().currentTime -= 10; };
        document.getElementById('p10').onclick = () => { if(v()) v().currentTime += 10; };
        document.getElementById('tab-pc').onclick = () => { viewTab='PC'; render(); };
        document.getElementById('tab-tab').onclick = () => { viewTab='TAB'; render(); };

        const inject = () => { 
            const cp = document.querySelector('.video-player__container') || document.body;
            if (cp && !cp.contains(d)) { cp.appendChild(d); cp.appendChild(restoreBtn); }
        };
        inject(); setInterval(inject, 2000);
        setInterval(() => { if(v() && !v().paused && document.activeElement !== I) I.value = f(v().currentTime); }, 1000);
        render();
    }
    setTimeout(init, 2000);
})();
