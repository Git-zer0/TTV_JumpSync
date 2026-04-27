// ==UserScript==
// @name         TwitchJumpSync RESET & FIX
// @namespace    http://tampermonkey.net/
// @version      8.0
// @description  Force l'affichage de l'invitation au démarrage
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
    const MODE_KEY = 'tw_mode_local';
    const LOCAL_DATA_KEY = 'tw_sync_local_data';
    const sT = 'tw_sync_data';

    // --- FORCE RESET (Optionnel : à supprimer après la première apparition) ---
    // Si tu veux forcer l'apparition de l'invitation une fois pour toutes :
    // localStorage.removeItem(CFG_KEY); localStorage.removeItem(MODE_KEY);

    let firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY)) || null;
    let isLocalMode = localStorage.getItem(MODE_KEY) === 'true';

    let sV = [];
    let db = null;

    // --- 1. FONCTION D'INVITATION (REFAITE) ---
    function showConfigModal() {
        if (document.getElementById('cfg-modal')) return;
        const modal = document.createElement('div');
        modal.id = "cfg-modal";
        modal.style = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#18181b;padding:25px;border:2px solid #9147ff;border-radius:12px;z-index:1000000005;color:white;font-family:sans-serif;width:320px;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 60px #000;';
        modal.innerHTML = `
            <h3 style="color:#9147ff;margin:0;text-align:center;font-size:1.5em">TwitchJumpSync</h3>
            <p style="font-size:12px;text-align:center;color:#adadb8;margin-bottom:10px">Configuration requise</p>
            
            <input id="f_api" placeholder="Firebase API Key" style="background:#000;color:white;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.apiKey || ''}">
            <input id="f_url" placeholder="Database URL" style="background:#000;color:white;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.databaseURL || ''}">
            <input id="f_pid" placeholder="Project ID" style="background:#000;color:white;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.projectId || ''}">
            <input id="f_aid" placeholder="App ID" style="background:#000;color:white;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.appId || ''}">
            
            <button id="f_save" style="background:#9147ff;color:white;border:none;padding:14px;cursor:pointer;font-weight:bold;border-radius:6px;margin-top:10px">CONNEXION FIREBASE (SYNC)</button>
            <button id="f_local" style="background:#222;color:white;border:1px solid #444;padding:12px;cursor:pointer;font-weight:bold;border-radius:6px">UTILISER HORS LIGNE (LOCAL)</button>
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
            if(cfg.apiKey && cfg.databaseURL) {
                localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
                localStorage.setItem(MODE_KEY, 'false');
                location.reload();
            } else { alert("Erreur : L'API Key et l'URL sont obligatoires pour la Sync."); }
        };

        document.getElementById('f_local').onclick = () => {
            localStorage.setItem(MODE_KEY, 'true');
            location.reload();
        };
    }

    // --- 2. VÉRIFICATION POUR FORCER L'INVITATION ---
    // Si on n'a ni config, ni le flag "local", on affiche la fenêtre immédiatement
    if (!firebaseConfig && !isLocalMode) {
        // On attend un peu que la page charge pour afficher la modal
        setTimeout(showConfigModal, 1000);
        return; 
    }

    // --- 3. CHARGEMENT DES DONNÉES ---
    if (!isLocalMode && firebaseConfig) {
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            db.ref(sT).on('value', (snap) => {
                sV = Array.isArray(snap.val()) ? snap.val() : [];
                if (typeof render === 'function') render();
            });
        } catch(e) { isLocalMode = true; }
    } 
    
    if (isLocalMode) {
        sV = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY)) || [];
    }

    const save = () => {
        if (db && !isLocalMode) { db.ref(sT).set(sV); }
        else { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(sV)); render(); }
    };

    // --- 4. INTERFACE PRINCIPALE ---
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
            <div id="h" style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px;user-select:none">DRAG | ${isLocalMode ? 'HORS LIGNE' : 'SYNC ACTIVE'}</div>
            <input id="i" type="tel" style="width:100%;background:#000;color:#fff;border:1px solid #333;padding:8px 5px;font-size:1.4em;text-align:center;border-radius:5px;font-family:monospace;">
            <div id="g" style="color:#9147ff;font-weight:bold;text-align:center;cursor:pointer;padding:8px;background:#000;border-radius:4px;">JUMP</div>
            <div style="display:flex;justify-content:space-between;font-size:0.7em;font-weight:bold;padding-top:5px;border-top:1px solid #333">
                <div id="mk" style="color:#e91e63;cursor:pointer">MARK</div>
                <div id="ls" style="cursor:pointer">LISTE</div>
                <div id="cfg_gear" style="color:#9147ff;cursor:pointer">⚙️</div>
            </div>
            <div id="l" style="display:none;background:#000;border:1px solid #333;max-height:200px;overflow-y:auto"></div>
        `;

        const L = document.getElementById('l'), I = document.getElementById('i');

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

        // Bouton d'engrenage pour changer de mode
        document.getElementById('cfg_gear').onclick = () => {
            if(confirm("Changer les réglages ou changer de mode ?")) {
                localStorage.removeItem(CFG_KEY);
                localStorage.removeItem(MODE_KEY);
                location.reload();
            }
        };

        // Drag & Actions
        let isD = false, oX, oY;
        document.getElementById('h').onmousedown = (e) => { isD = true; oX = e.clientX - d.offsetLeft; oY = e.clientY - d.offsetTop; };
        window.addEventListener('mousemove', (e) => { if(isD) { d.style.left = (e.clientX - oX) + 'px'; d.style.top = (e.clientY - oY) + 'px'; }});
        window.addEventListener('mouseup', () => isD = false);

        document.getElementById('mk').onclick = () => { if(v()){ sV.push({n:f(v().currentTime), t:Math.floor(v().currentTime), dev:myDevice}); save(); } };
        document.getElementById('ls').onclick = () => { L.style.display = L.style.display==='none' ? 'block' : 'none'; render(); };

        document.body.appendChild(d);
        setInterval(() => { if(v() && !v().paused && document.activeElement !== I) I.value = f(v().currentTime); }, 1000);
        render();
    }

    setTimeout(init, 2000);
})();
