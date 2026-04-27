// ==UserScript==
// @name         TwitchJump
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Logique vv4 stable avec configuration Firebase dynamique
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
    const sT = 'tw_sync_data';

    // 1. GESTION DE LA CONFIGURATION UTILISATEUR
    let firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY)) || null;

    if (!firebaseConfig) {
        showConfigModal();
        return;
    }

    function showConfigModal() {
        const modal = document.createElement('div');
        modal.style = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#18181b;padding:20px;border:2px solid #9147ff;border-radius:12px;z-index:1000000000;color:white;font-family:sans-serif;width:300px;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 20px rgba(0,0,0,0.8);';
        modal.innerHTML = `
            <h3 style="margin:0;color:#9147ff;text-align:center">Configuration Firebase</h3>
            <p style="font-size:10px;color:#adadb8;margin:0">Entre tes propres identifiants pour activer la synchronisation.</p>
            <input id="cfg_apiKey" placeholder="API Key" style="background:#000;border:1px solid #333;color:white;padding:5px;border-radius:4px;font-size:11px">
            <input id="cfg_databaseURL" placeholder="Database URL" style="background:#000;border:1px solid #333;color:white;padding:5px;border-radius:4px;font-size:11px">
            <input id="cfg_projectId" placeholder="Project ID" style="background:#000;border:1px solid #333;color:white;padding:5px;border-radius:4px;font-size:11px">
            <input id="cfg_appId" placeholder="App ID" style="background:#000;border:1px solid #333;color:white;padding:5px;border-radius:4px;font-size:11px">
            <button id="cfg_save" style="background:#9147ff;border:none;color:white;padding:10px;border-radius:4px;cursor:pointer;font-weight:bold;margin-top:5px">Enregistrer & Recharger</button>
        `;
        document.body.appendChild(modal);
        document.getElementById('cfg_save').onclick = () => {
            const newCfg = {
                apiKey: document.getElementById('cfg_apiKey').value.trim(),
                databaseURL: document.getElementById('cfg_databaseURL').value.trim(),
                projectId: document.getElementById('cfg_projectId').value.trim(),
                appId: document.getElementById('cfg_appId').value.trim(),
                authDomain: document.getElementById('cfg_projectId').value.trim() + ".firebaseapp.com",
                storageBucket: document.getElementById('cfg_projectId').value.trim() + ".appspot.com"
            };
            if(newCfg.apiKey && newCfg.databaseURL) {
                localStorage.setItem(CFG_KEY, JSON.stringify(newCfg));
                location.reload();
            } else { alert("L'API Key et l'URL sont obligatoires."); }
        };
    }

    // 2. INITIALISATION FIREBASE AVEC LES CLÉS DE L'UTILISATEUR
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // 3. LOGIQUE VV4 STABLE
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

        let sV = [];
        const isPC = window.matchMedia('(pointer: fine)').matches;
        let myDevice = isPC ? 'PC' : 'TAB';
        let viewTab = myDevice;

        let v = () => document.querySelector('video'),
            f = s => {
                try { return new Date(s * 1000).toISOString().substr(11, 8); }
                catch(e) { return "00:00:00"; }
            };

        const getCurCh = () => {
            try {
                const el = document.querySelector('.channel-info-content h1') || document.querySelector('[data-a-target="user-card-link"]');
                return el ? el.innerText.trim() : document.title.split(' - ')[0].trim();
            } catch(e) { return "TwitchStream"; }
        };

        const restoreBtn = document.createElement('div');
        restoreBtn.id = 'twj-restore';
        restoreBtn.innerHTML = 'T';
        restoreBtn.style = 'position:fixed;top:5px;left:5px;z-index:2147483647;background:#9147ff;color:white;width:30px;height:30px;border-radius:50%;display:none;justify-content:center;align-items:center;cursor:pointer;font-weight:bold;box-shadow:0 0 5px #000';

        const d = document.createElement('div');
        d.id = 'twj';
        d.style = 'position:fixed;top:100px;left:10px;background:#18181b;padding:12px;border:2px solid #9147ff;border-radius:12px;width:260px;height:auto;color:#fff;font-family:sans-serif;touch-action:none;display:flex;flex-direction:column;gap:10px;resize:both;max-width:95vw;max-height:85vh';
        d.innerHTML = `
            <div id="h" style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px;flex-shrink:0;user-select:none">DRAG (${myDevice})</div>
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
                    <div id="mk10" style="color:#c2185b;cursor:pointer;margin-left:8px">MARK -10s</div>
                </div>
            </div>
            <div id="tabs" style="display:none;flex-direction:row;background:#000;border-radius:4px;overflow:hidden;border:1px solid #333;margin-top:5px;flex-shrink:0">
                <div id="tab-pc" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px;border-right:1px solid #333">PC</div>
                <div id="tab-tab" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px">TAB</div>
            </div>
            <div id="l" style="display:none;flex-grow:1;overflow-y:auto;background:#000;font-size:0.8em;border:1px solid #333;min-height:50px;max-height:300px"></div>
            <div id="r" style="position:absolute;bottom:0;right:0;width:20px;height:20px;background:linear-gradient(135deg,transparent 50%,#9147ff 50%);cursor:nwse-resize"></div>
        `;

        const save = () => { db.ref(sT).set(sV); };
        db.ref(sT).on('value', (snap) => { sV = Array.isArray(snap.val()) ? snap.val() : []; render(); });

        const render = () => {
            L.innerHTML = '';
            document.getElementById('tab-pc').style.background = viewTab === 'PC' ? '#9147ff' : '#222';
            document.getElementById('tab-tab').style.background = viewTab === 'TAB' ? '#9147ff' : '#222';
            const filtered = sV.filter(item => (item.dev === viewTab || (!item.dev && viewTab === 'PC')));
            [...filtered].reverse().forEach((item) => {
                const row = document.createElement('div');
                row.style = 'display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #222;align-items:center';
                const fullUrl = (item.u ? item.u.split('?')[0] : window.location.origin + window.location.pathname) + "?t=" + item.t + "s";
                
                row.innerHTML = `<a class="jump" href="${fullUrl}" style="color:#9147ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:none;text-decoration:none">${item.n}</a>
                                 <button class="ed-btn" style="background:#4caf50;color:#fff;border:none;border-radius:3px;padding:3px 6px;margin:0 4px;font-size:9px;cursor:pointer">EDIT</button>
                                 <button class="de-btn" style="background:#f44;color:#fff;border:none;border-radius:3px;padding:3px 6px;font-size:9px;cursor:pointer">DEL</button>`;

                const jumpEl = row.querySelector('.jump');
                jumpEl.onclick = (e) => {
                    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
                        e.preventDefault();
                        const newWin = window.open(fullUrl, '_blank');
                        if (newWin) newWin.blur();
                        window.focus();
                        return;
                    }
                    if (e.button === 0) {
                        const baseUrl = item.u ? item.u.split('?')[0] : "";
                        if (window.location.href.includes(baseUrl) && baseUrl !== "") {
                            e.preventDefault();
                            if (v()) v().currentTime = item.t;
                        }
                    }
                };
                row.querySelector('.ed-btn').onclick = () => { let n = prompt("Nom:", item.n); if(n){ item.n=n; save(); } };
                row.querySelector('.de-btn').onclick = () => { sV = sV.filter(i => i !== item); save(); };
                L.appendChild(row);
            });
        };

        const toggleList = (forceOpen = false, manualClick = false) => {
            if (d.classList.contains('minimized')) return;
            const currentlyOpen = L.style.display !== 'none';
            if (forceOpen || (manualClick && !currentlyOpen)) { L.style.display = 'block'; T.style.display = 'flex'; render(); } 
            else { L.style.display = 'none'; T.style.display = 'none'; d.style.height = 'auto'; }
        };

        // ... (Reste des fonctions d'origine mk, m10, p10, g, drag & drop de vv4.txt) ...
        document.getElementById('mk').onclick = () => {
             if (v()) {
                let t = Math.floor(v().currentTime);
                sV.push({ n: f(t), t, u: window.location.href.split('?')[0], c: getCurCh(), dev: myDevice });
                save(); toggleList(true);
            }
        };
        document.getElementById('ls').onclick = () => toggleList(false, true);
        document.getElementById('tab-pc').onclick = () => { viewTab = 'PC'; render(); };
        document.getElementById('tab-tab').onclick = () => { viewTab = 'TAB'; render(); };
        document.getElementById('x').onclick = () => { d.style.display = 'none'; restoreBtn.style.display = 'flex'; };
        restoreBtn.onclick = () => { d.style.display = 'flex'; restoreBtn.style.display = 'none'; };
        
        // Système de Drag & Drop vv4
        let isD = false, isR = false, oX, oY, sW, sH;
        document.getElementById('h').onmousedown = (e) => { isD = true; oX = e.clientX - d.offsetLeft; oY = e.clientY - d.offsetTop; };
        document.getElementById('r').onmousedown = (e) => { isR = true; sW = d.offsetWidth; sH = d.offsetHeight; oX = e.clientX; oY = e.clientY; };
        window.addEventListener('mousemove', (e) => {
            if (isD) { d.style.left = (e.clientX - oX) + 'px'; d.style.top = (e.clientY - oY) + 'px'; }
            if (isR) { d.style.width = (sW + e.clientX - oX) + 'px'; d.style.height = (sH + e.clientY - oY) + 'px'; }
        });
        window.addEventListener('mouseup', () => { isD = isR = false; });

        const inject = () => {
            const container = document.querySelector('.video-player__container') || document.body;
            if (container && !container.contains(d)) { container.appendChild(d); container.appendChild(restoreBtn); }
        };
        inject(); setInterval(inject, 2000);
        setInterval(() => { if (v() && !v().paused) { I.value = f(v().currentTime); } }, 1000);
    }

    const I = document.getElementById('i'), L = document.getElementById('l'), T = document.getElementById('tabs');
    setTimeout(init, 3000);
})();
