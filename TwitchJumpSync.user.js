// ==UserScript==
// @name         TwitchJumpSync
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Logique vv.2txt avec interface de configuration Firebase dynamique
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

    // Récupération de la config locale (logique TwitchJumpSync)
    let firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY)) || {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    };

    const style = document.createElement('style');
    style.innerHTML = `
        #i::selection { background: #0078d7 !important; color: #ffffff !important; }
        #i { -webkit-tap-highlight-color: transparent !important; outline: none !important; caret-color: #0078d7 !important; }
        #twj {
            transition: height 0.2s ease-out, width 0.2s ease-out;
            box-shadow: 0 0 15px rgba(0,0,0,0.4);
            overflow: hidden;
            will-change: transform, top, left;
            z-index: 999999999 !important;
        }
        .minimized { width: 230px !important; height: 105px !important; min-height: 105px !important; }
        .minimized > *:not(#h):not(#min-controls):not(#min):not(#x) { display: none !important; }
        .min-btn-style {
            background: #e91e63; color: white; border: none; border-radius: 4px;
            padding: 0 10px; height: 32px; font-size: 10px; cursor: pointer;
            font-weight: bold; text-transform: uppercase;
            display: inline-flex; align-items: center; justify-content: center; text-align: center;
        }
        #min-mk10 { background: #c2185b; }
        .jump { cursor: pointer; }
        .cfg-input { width:100%; background:#222; color:#fff; border:1px solid #444; padding:4px; margin-bottom:4px; font-size:11px; }
    `;
    document.head.appendChild(style);

    function init() {
        if (document.getElementById('twj')) return;

        // Si aucune API Key n'est renseignée, on force l'affichage de la config
        if (!firebaseConfig.apiKey) {
            showConfigUI();
            return;
        }

        // Initialisation Firebase
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        let sV = [];
        let ticking = false;
        
        // Logique vv.2txt : Détection PC vs Tablette par le pointeur
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
        
        // Construction du HTML intégral de vv.2txt
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
            <div id="cfg_btn" style="text-align:center;font-size:9px;color:#666;cursor:pointer;margin-top:5px">⚙ Firebase Config</div>
            <div id="r" style="position:absolute;bottom:0;right:0;width:20px;height:20px;background:linear-gradient(135deg,transparent 50%,#9147ff 50%);cursor:nwse-resize"></div>
        `;

        const checkBounds = () => {
            const rect = d.getBoundingClientRect();
            if (rect.right > window.innerWidth) d.style.left = (window.innerWidth - rect.width - 10) + 'px';
            if (rect.bottom > window.innerHeight) d.style.top = (window.innerHeight - rect.height - 10) + 'px';
            if (rect.left < 0) d.style.left = '10px';
            if (rect.top < 0) d.style.top = '10px';
        };

        const inject = () => {
            const container = document.querySelector('.video-player__container') || document.body;
            if (container && !container.contains(d)) {
                container.appendChild(d);
                container.appendChild(restoreBtn);
            }
            if (d.style.display === 'none' && restoreBtn.style.display === 'none') d.style.display = 'flex';
        };
        inject(); setInterval(inject, 2000);

        // Gestion plein écran (vv.2txt)
        document.addEventListener('fullscreenchange', () => {
            setTimeout(() => {
                if (restoreBtn.style.display !== 'flex') d.style.display = 'flex';
                checkBounds();
            }, 500);
        });

        const I = document.getElementById('i'), L = document.getElementById('l'), T = document.getElementById('tabs');
        const B_MIN = document.getElementById('min'), MIN_CTRL = document.getElementById('min-controls');

        // Sélection intelligente de l'input (vv.2txt)
        I.addEventListener('click', function() {
            const p = I.selectionStart;
            if (p >= 0 && p <= 2) I.setSelectionRange(0, 2);
            else if (p >= 3 && p <= 5) I.setSelectionRange(3, 5);
            else if (p >= 6 && p <= 8) I.setSelectionRange(6, 8);
        });

        B_MIN.onclick = () => {
            const isNowMin = d.classList.toggle('minimized');
            B_MIN.innerText = isNowMin ? '+' : '-';
            MIN_CTRL.style.display = isNowMin ? 'flex' : 'none';
            if(!isNowMin) d.style.height = 'auto';
        };

        const save = () => { db.ref(sT).set(sV); };
        db.ref(sT).on('value', (snapshot) => {
            const data = snapshot.val();
            sV = Array.isArray(data) ? data : [];
            render();
        });

        const toggleList = (forceOpen = false, manualClick = false) => {
            if (d.classList.contains('minimized')) return;
            const currentlyOpen = L.style.display !== 'none';
            if (forceOpen || (manualClick && !currentlyOpen)) {
                L.style.display = 'block';
                T.style.display = 'flex'; render();
            } else {
                L.style.display = 'none';
                T.style.display = 'none'; d.style.height = 'auto';
            }
        };

        const render = () => {
            L.innerHTML = '';
            document.getElementById('tab-pc').style.background = viewTab === 'PC' ? '#9147ff' : '#222';
            document.getElementById('tab-tab').style.background = viewTab === 'TAB' ? '#9147ff' : '#222';
            const filtered = sV.filter(item => (item.dev === viewTab || (!item.dev && viewTab === 'PC')));

            [...filtered].reverse().forEach((item) => {
                const row = document.createElement('div');
                row.style = 'display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #222;align-items:center';
                row.innerHTML = `<span class="jump" style="color:#9147ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:none">${item.n}</span>
                                 <button class="ed-btn" style="background:#4caf50;color:#fff;border:none;border-radius:3px;padding:3px 6px;margin:0 4px;font-size:9px;cursor:pointer">EDIT</button>
                                 <button class="de-btn" style="background:#f44;color:#fff;border:none;border-radius:3px;padding:3px 6px;font-size:9px;cursor:pointer">DEL</button>`;
                
                const jumpEl = row.querySelector('.jump');
                const fullUrl = (item.u ? item.u.split('?')[0] : window.location.origin + window.location.pathname) + "?t=" + item.t + "s";

                jumpEl.onclick = () => {
                    if (window.location.href.includes(item.u.split('?')[0])) { 
                        if (v()) v().currentTime = item.t;
                    } else { window.location.href = fullUrl; }
                };

                row.querySelector('.ed-btn').onclick = () => { let n = prompt("Nom:", item.n); if(n){ item.n=n; save(); } };
                row.querySelector('.de-btn').onclick = () => { 
                    sV = sV.filter(i => i !== item); save(); 
                    const remaining = sV.filter(i => (i.dev === viewTab || (!i.dev && viewTab === 'PC')));
                    if(remaining.length === 0) { d.style.width = '260px'; d.style.height = 'auto'; toggleList(false); }
                };
                L.appendChild(row);
            });
        };

        const mk = (o) => {
            if (v()) {
                let t = Math.floor(Math.max(0, v().currentTime - o));
                let u = window.location.origin + window.location.pathname;
                let c = getCurCh();
                sV.push({ n: f(t), t, u, c, dev: myDevice });
                save();
                toggleList(true);
            }
        };

        // Boutons de navigation (vv.2txt)
        document.getElementById('m10').onclick = () => { if(v()) v().currentTime -= 10; };
        document.getElementById('m5').onclick = () => { if(v()) v().currentTime -= 5; };
        document.getElementById('p5').onclick = () => { if(v()) v().currentTime += 5; };
        document.getElementById('p10').onclick = () => { if(v()) v().currentTime += 10; };
        document.getElementById('g').onclick = () => {
            const val = I.value.split(':');
            if(val.length === 3 && v()){ v().currentTime = (+val[0]) * 3600 + (+val[1]) * 60 + (+val[2]); }
        };

        document.getElementById('txt').onclick = () => {
            let content = sV.map(i => `${i.c} | ${i.n} | ${i.u}?t=${i.t}s`).join('\n');
            const blob = new Blob([content], {type:'text/plain'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'twitch_sync.txt';
            a.click();
        };

        document.getElementById('mk').onclick = document.getElementById('min-mk').onclick = () => mk(0);
        document.getElementById('mk10').onclick = document.getElementById('min-mk10').onclick = () => mk(10);
        document.getElementById('ls').onclick = () => toggleList(false, true);
        document.getElementById('tab-pc').onclick = () => { viewTab = 'PC'; render(); };
        document.getElementById('tab-tab').onclick = () => { viewTab = 'TAB'; render(); };
        document.getElementById('x').onclick = () => { d.style.display = 'none'; restoreBtn.style.display = 'flex'; };
        restoreBtn.onclick = () => { d.style.display = 'flex'; restoreBtn.style.display = 'none'; };
        
        // Bouton pour réouvrir la configuration
        document.getElementById('cfg_btn').onclick = () => showConfigUI();

        // Drag & Resize (vv.2txt)
        let isD = false, isR = false, oX, oY, sW, sH;
        const start = (e, type) => {
            const ev = e.type.includes('touch') ? e.touches[0] : e;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('#l')) return;
            if (type === 'd') { isD = true; oX = ev.clientX - d.offsetLeft; oY = ev.clientY - d.offsetTop; }
            else { isR = true; sW = d.offsetWidth; sH = d.offsetHeight; oX = ev.clientX; oY = ev.clientY; }
        };

        const updatePosition = (ev) => {
            if (isD) {
                d.style.left = (ev.clientX - oX) + 'px';
                d.style.top = Math.max(0, ev.clientY - oY) + 'px'; 
            }
            if (isR && !d.classList.contains('minimized')) { 
                d.style.width = (sW + ev.clientX - oX) + 'px';
                d.style.height = (sH + ev.clientY - oY) + 'px'; 
            }
            ticking = false;
        };

        const move = (e) => {
            if (!isD && !isR) return;
            const ev = e.type.includes('touch') ? e.touches[0] : e;
            if (!ticking) {
                window.requestAnimationFrame(() => updatePosition(ev));
                ticking = true;
            }
            if (e.cancelable) e.preventDefault();
        };

        window.addEventListener('mousemove', move, { passive: false });
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('mouseup', () => isD = isR = false);
        window.addEventListener('touchend', () => isD = isR = false);
        
        document.getElementById('h').onmousedown = document.getElementById('h').ontouchstart = (e) => start(e, 'd');
        document.getElementById('r').onmousedown = document.getElementById('r').ontouchstart = (e) => start(e, 'r');

        setInterval(() => { 
            if (v() && !v().paused && document.activeElement != I) { I.value = f(v().currentTime); }
        }, 1000);
    }

    // Fonction d'affichage de l'interface de config (Logique TwitchJumpSync)
    function showConfigUI() {
        const modal = document.createElement('div');
        modal.style = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#18181b;border:2px solid #9147ff;padding:20px;z-index:1000000000;width:300px;border-radius:10px;color:white;font-family:sans-serif";
        modal.innerHTML = `
            <h3 style="margin-top:0;color:#9147ff">Configuration Firebase</h3>
            <p style="font-size:10px;color:#aaa">Saisissez vos identifiants Firebase pour activer la synchronisation.</p>
            <label style="font-size:11px">API Key:</label><input id="cfg_apiKey" class="cfg-input" value="${firebaseConfig.apiKey}">
            <label style="font-size:11px">Auth Domain:</label><input id="cfg_authDomain" class="cfg-input" value="${firebaseConfig.authDomain}">
            <label style="font-size:11px">Database URL:</label><input id="cfg_databaseURL" class="cfg-input" value="${firebaseConfig.databaseURL}">
            <label style="font-size:11px">Project ID:</label><input id="cfg_projectId" class="cfg-input" value="${firebaseConfig.projectId}">
            <label style="font-size:11px">Storage Bucket:</label><input id="cfg_storageBucket" class="cfg-input" value="${firebaseConfig.storageBucket}">
            <label style="font-size:11px">Messaging Sender ID:</label><input id="cfg_messagingSenderId" class="cfg-input" value="${firebaseConfig.messagingSenderId}">
            <label style="font-size:11px">App ID:</label><input id="cfg_appId" class="cfg-input" value="${firebaseConfig.appId}">
            <div style="display:flex;gap:10px;margin-top:10px">
                <button id="cfg_save" style="flex:1;background:#9147ff;border:none;color:white;padding:8px;border-radius:4px;cursor:pointer;font-weight:bold">Save & Reload</button>
                <button id="cfg_cancel" style="flex:1;background:#444;border:none;color:white;padding:8px;border-radius:4px;cursor:pointer">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('cfg_save').onclick = () => {
            const newCfg = {
                apiKey: document.getElementById('cfg_apiKey').value.trim(),
                authDomain: document.getElementById('cfg_authDomain').value.trim(),
                databaseURL: document.getElementById('cfg_databaseURL').value.trim(),
                projectId: document.getElementById('cfg_projectId').value.trim(),
                storageBucket: document.getElementById('cfg_storageBucket').value.trim(),
                messagingSenderId: document.getElementById('cfg_messagingSenderId').value.trim(),
                appId: document.getElementById('cfg_appId').value.trim()
            };
            localStorage.setItem(CFG_KEY, JSON.stringify(newCfg));
            location.reload();
        };
        document.getElementById('cfg_cancel').onclick = () => modal.remove();
    }

    setTimeout(init, 3000);
})();
