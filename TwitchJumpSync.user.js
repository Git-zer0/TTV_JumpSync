// ==UserScript==
// @name         TwitchJumpSync Hybrid Toggle
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Bascule dynamique Sync/Local avec boutons dédiés
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
    const MODE_KEY = 'tw_sync_mode_local';
    const LOCAL_DATA_KEY = 'tw_sync_local_storage';
    const sT = 'tw_sync_data';

    let firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY)) || null;
    let isLocalMode = localStorage.getItem(MODE_KEY) === 'true' || !firebaseConfig;

    let sV = [];
    let db = null;

    // --- LOGIQUE DE CONNEXION ---
    function connectFirebase() {
        if (firebaseConfig && !isLocalMode) {
            try {
                if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
                db = firebase.database();
                db.ref(sT).on('value', (snap) => {
                    sV = Array.isArray(snap.val()) ? snap.val() : [];
                    if (typeof render === 'function') render();
                });
            } catch(e) { isLocalMode = true; }
        } else {
            sV = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY)) || [];
        }
    }
    connectFirebase();

    const save = () => {
        if (db && !isLocalMode) { db.ref(sT).set(sV); }
        else { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(sV)); render(); }
    };

    // --- INTERFACE CONFIG ---
    function showConfigModal() {
        const modal = document.createElement('div');
        modal.id = "twj-cfg-screen";
        modal.style = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#18181b;padding:20px;border:2px solid #9147ff;border-radius:12px;z-index:1000000001;color:white;font-family:sans-serif;width:300px;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 30px #000;';
        modal.innerHTML = `
            <h3 style="margin:0;color:#9147ff;text-align:center">Connexion Firebase</h3>
            <input id="c_api" placeholder="API KEY" style="background:#000;border:1px solid #333;color:white;padding:8px;" value="${firebaseConfig?.apiKey || ''}">
            <input id="c_url" placeholder="DATABASE URL" style="background:#000;border:1px solid #333;color:white;padding:8px;" value="${firebaseConfig?.databaseURL || ''}">
            <input id="c_pid" placeholder="PROJECT ID" style="background:#000;border:1px solid #333;color:white;padding:8px;" value="${firebaseConfig?.projectId || ''}">
            <input id="c_aid" placeholder="APP ID" style="background:#000;border:1px solid #333;color:white;padding:8px;" value="${firebaseConfig?.appId || ''}">
            <button id="c_save" style="background:#9147ff;color:white;padding:10px;border:none;border-radius:4px;cursor:pointer;font-weight:bold">Se Connecter (Sync)</button>
            <button id="c_close" style="background:none;color:gray;border:none;cursor:pointer;font-size:11px">Rester en mode Local</button>
        `;
        document.body.appendChild(modal);
        document.getElementById('c_save').onclick = () => {
            const cfg = {
                apiKey: document.getElementById('c_api').value.trim(),
                databaseURL: document.getElementById('c_url').value.trim(),
                projectId: document.getElementById('c_pid').value.trim(),
                appId: document.getElementById('c_aid').value.trim(),
                authDomain: document.getElementById('c_pid').value.trim() + ".firebaseapp.com"
            };
            localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
            localStorage.setItem(MODE_KEY, 'false');
            location.reload();
        };
        document.getElementById('c_close').onclick = () => modal.remove();
    }

    // --- INTERFACE PRINCIPALE ---
    function init() {
        if (document.getElementById('twj')) return;
        const isPC = window.matchMedia('(pointer: fine)').matches;
        let myDevice = isPC ? 'PC' : 'TAB';
        let viewTab = myDevice;
        let v = () => document.querySelector('video'),
            f = s => { try { return new Date(s * 1000).toISOString().substr(11, 8); } catch(e) { return "00:00:00"; } };

        const d = document.createElement('div');
        d.id = 'twj';
        d.style = `position:fixed;top:100px;left:10px;background:#18181b;padding:12px;border:2px solid #9147ff;border-radius:12px;width:260px;color:#fff;font-family:sans-serif;touch-action:none;display:flex;flex-direction:column;gap:10px;z-index:999999999;`;
        
        d.innerHTML = `
            <div id="h" style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px;user-select:none">
                DRAG | <span id="status-mode">${isLocalMode ? 'LOCAL' : 'SYNC'}</span>
            </div>
            <input id="i" type="tel" style="width:100%;background:#000;color:#fff;border:1px solid #333;padding:8px 5px;font-size:1.4em;text-align:center;border-radius:5px;font-family:monospace;">
            <div id="g" style="color:#9147ff;font-weight:bold;text-align:center;cursor:pointer;padding:8px;background:#000;border-radius:4px;">JUMP</div>
            <div style="display:flex;justify-content:space-between;font-size:0.7em;font-weight:bold;padding-top:5px;border-top:1px solid #333">
                <div id="mk" style="color:#e91e63;cursor:pointer">MARK</div>
                <div id="ls" style="color:#fff;cursor:pointer">LIST</div>
                <div id="toggle-sync" title="Bascule Sync/Local" style="color:#9147ff;cursor:pointer;font-size:1.2em">${isLocalMode ? '⚙️' : '🔌'}</div>
            </div>
            <div id="l" style="display:none;background:#000;border:1px solid #333;max-height:200px;overflow-y:auto"></div>
        `;

        const L = document.getElementById('l'), I = document.getElementById('i'), ST = document.getElementById('status-mode'), BTN = document.getElementById('toggle-sync');

        window.render = () => {
            if(!L) return; L.innerHTML = '';
            sV.filter(it => it.dev === viewTab || !it.dev).reverse().forEach(it => {
                const row = document.createElement('div');
                row.style = 'display:flex;justify-content:space-between;padding:5px;border-bottom:1px solid #222;font-size:11px';
                row.innerHTML = `<span class="jump-it" style="color:#9147ff;cursor:pointer">${it.n}</span><button class="del" style="background:red;color:white;border:none;font-size:8px">X</button>`;
                row.querySelector('.jump-it').onclick = () => { if(v()) v().currentTime = it.t; };
                row.querySelector('.del').onclick = () => { sV = sV.filter(x => x !== it); save(); };
                L.appendChild(row);
            });
        };

        // --- LOGIQUE DU BOUTON DE BASCULE ---
        BTN.onclick = () => {
            if (!isLocalMode) {
                // DECONNEXION : On passe en local
                if(confirm("Passer en mode LOCAL (Déconnexion Firebase) ?")) {
                    isLocalMode = true;
                    localStorage.setItem(MODE_KEY, 'true');
                    db = null;
                    sV = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY)) || [];
                    ST.innerText = "LOCAL";
                    BTN.innerText = "⚙️";
                    render();
                }
            } else {
                // CONNEXION : On ouvre la config
                showConfigModal();
            }
        };

        document.getElementById('mk').onclick = () => { if(v()){ sV.push({n:f(v().currentTime), t:Math.floor(v().currentTime), dev:myDevice}); save(); } };
        document.getElementById('ls').onclick = () => { L.style.display = L.style.display==='none' ? 'block' : 'none'; render(); };
        
        // Drag
        let isD = false, oX, oY;
        document.getElementById('h').onmousedown = (e) => { isD = true; oX = e.clientX - d.offsetLeft; oY = e.clientY - d.offsetTop; };
        window.addEventListener('mousemove', (e) => { if(isD) { d.style.left = (e.clientX - oX) + 'px'; d.style.top = (e.clientY - oY) + 'px'; }});
        window.addEventListener('mouseup', () => isD = false);

        document.body.appendChild(d);
        setInterval(() => { if(v() && !v().paused && document.activeElement !== I) I.value = f(v().currentTime); }, 1000);
        render();
    }

    setTimeout(init, 2000);
})();
