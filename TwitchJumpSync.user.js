// ==UserScript==
// @name         TwitchJump Hybrid
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Mode LocalStorage par défaut + Option Sync Firebase (vv4 stable)
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
    let sV = [];
    let isSyncEnabled = false;
    let db = null;

    // 1. CHARGEMENT DE LA CONFIGURATION
    const firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY));

    if (firebaseConfig && firebaseConfig.apiKey) {
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            isSyncEnabled = true;
        } catch(e) {
            console.error("Firebase init failed, switching to local", e);
            isSyncEnabled = false;
        }
    }

    // 2. LOGIQUE DE SAUVEGARDE HYBRIDE
    const save = () => {
        if (isSyncEnabled && db) {
            db.ref('tw_sync_data').set(sV);
        } else {
            localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(sV));
            render(); // On force le rendu en local
        }
    };

    const loadInitialData = () => {
        if (isSyncEnabled && db) {
            db.ref('tw_sync_data').on('value', (snap) => {
                sV = Array.isArray(snap.val()) ? snap.val() : [];
                render();
            });
        } else {
            const local = localStorage.getItem(LOCAL_DATA_KEY);
            sV = local ? JSON.parse(local) : [];
            render();
        }
    };

    // 3. INTERFACE VV4 ADAPTÉE
    function init() {
        if (document.getElementById('twj')) return;

        const isPC = window.matchMedia('(pointer: fine)').matches;
        let myDevice = isPC ? 'PC' : 'TAB';
        let viewTab = myDevice;

        let v = () => document.querySelector('video'),
            f = s => { try { return new Date(s * 1000).toISOString().substr(11, 8); } catch(e) { return "00:00:00"; } };

        const d = document.createElement('div');
        d.id = 'twj';
        d.style = 'position:fixed;top:100px;left:10px;background:#18181b;padding:12px;border:2px solid #9147ff;border-radius:12px;width:260px;height:auto;color:#fff;font-family:sans-serif;z-index:999999999;display:flex;flex-direction:column;gap:10px;resize:both;overflow:hidden;';
        
        // Ajout d'un indicateur de mode (Cloud ou Local)
        const modeColor = isSyncEnabled ? '#4caf50' : '#adadb8';
        const modeText = isSyncEnabled ? 'SYNC: ON' : 'SYNC: OFF';

        d.innerHTML = `
            <div id="h" style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px;user-select:none">
                DRAG | <span id="sync-status" style="color:${modeColor};margin-left:5px;cursor:pointer">${modeText}</span>
            </div>
            <button id="min" style="position:absolute;top:5px;left:8px;background:none;border:none;color:#fff;font-weight:bold;cursor:pointer">-</button>
            <input id="i" type="tel" inputmode="numeric" style="width:100%;background:#000;color:#fff;border:1px solid #333;padding:8px 5px;font-size:1.4em;text-align:center;border-radius:5px;font-family:monospace;">
            <div id="g" style="color:#9147ff;font-weight:bold;text-align:center;cursor:pointer;padding:8px;background:#000;border-radius:4px;">JUMP</div>
            <div style="display:flex;justify-content:space-between;font-size:0.75em;font-weight:bold;padding:5px 0">
                <div id="mk" style="color:#e91e63;cursor:pointer">MARK</div>
                <div id="ls" style="cursor:pointer">LIST</div>
                <div id="cfg-btn" style="color:#9147ff;cursor:pointer">⚙️</div>
            </div>
            <div id="tabs" style="display:none;flex-direction:row;background:#000;border-radius:4px;overflow:hidden;border:1px solid #333;">
                <div id="tab-pc" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px;border-right:1px solid #333">PC</div>
                <div id="tab-tab" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px">TAB</div>
            </div>
            <div id="l" style="display:none;flex-grow:1;overflow-y:auto;background:#000;font-size:0.8em;border:1px solid #333;max-height:300px"></div>
        `;

        document.body.appendChild(d);

        // CONFIGURATION MODAL (S'ouvre seulement si on clique sur l'engrenage)
        const showConfig = () => {
            const apiKey = firebaseConfig ? firebaseConfig.apiKey : '';
            const res = prompt("Entrez votre API KEY Firebase pour activer la synchro (laisser vide pour mode Local) :", apiKey);
            if (res !== null) {
                if (res === "") {
                    localStorage.removeItem(CFG_KEY);
                } else {
                    const dbUrl = prompt("Entrez votre Database URL :");
                    const prjId = prompt("Entrez votre Project ID :");
                    localStorage.setItem(CFG_KEY, JSON.stringify({apiKey: res, databaseURL: dbUrl, projectId: prjId}));
                }
                location.reload();
            }
        };
        document.getElementById('cfg-btn').onclick = showConfig;
        document.getElementById('sync-status').onclick = showConfig;

        // --- Fonctions de rendu identiques à vv4 ---
        window.render = () => {
            const L = document.getElementById('l');
            if(!L) return;
            L.innerHTML = '';
            const filtered = sV.filter(item => (item.dev === viewTab || (!item.dev && viewTab === 'PC')));
            [...filtered].reverse().forEach((item) => {
                const row = document.createElement('div');
                row.style = 'display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #222;align-items:center';
                const fullUrl = (item.u ? item.u.split('?')[0] : window.location.origin + window.location.pathname) + "?t=" + item.t + "s";
                row.innerHTML = `<a href="${fullUrl}" class="jump-link" style="color:#9147ff;text-decoration:none;flex:1">${item.n}</a>
                                 <button class="de-btn" style="background:#f44;color:#fff;border:none;font-size:9px;cursor:pointer">DEL</button>`;
                
                const link = row.querySelector('.jump-link');
                link.onclick = (e) => {
                    if (e.button === 1 || e.ctrlKey) { 
                        const nw = window.open(fullUrl, '_blank'); 
                        if(nw) nw.blur(); window.focus(); e.preventDefault(); 
                    }
                };
                row.querySelector('.de-btn').onclick = () => { sV = sV.filter(i => i !== item); save(); };
                L.appendChild(row);
            });
        };

        // Actions de base
        document.getElementById('mk').onclick = () => {
            if (v()) {
                let t = Math.floor(v().currentTime);
                sV.push({ n: f(t), t, u: window.location.href.split('?')[0], dev: myDevice });
                save();
            }
        };

        document.getElementById('ls').onclick = () => {
            const L = document.getElementById('l');
            const T = document.getElementById('tabs');
            const isOpen = L.style.display === 'block';
            L.style.display = isOpen ? 'none' : 'block';
            T.style.display = isOpen ? 'none' : 'flex';
            render();
        };

        loadInitialData();
    }

    setTimeout(init, 2000);
})();
