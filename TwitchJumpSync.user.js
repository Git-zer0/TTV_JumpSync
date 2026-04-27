// ==UserScript==
// @name         TwitchJumpSync Force Invite
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Version corrigée complète Twitch stable
// @author       User
// @match        https://www.twitch.tv/*
// @match        https://m.twitch.tv/*
// @grant        none
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js
// ==/UserScript==

(function () {
'use strict';

const CFG_KEY = 'tw_sync_fb_config';
const MODE_KEY = 'tw_mode_selected';
const LOCAL_DATA_KEY = 'tw_sync_local_data';
const POS_KEY = 'tw_sync_box_pos';
const sT = 'tw_sync_data';

let firebaseConfig = JSON.parse(localStorage.getItem(CFG_KEY)) || null;
let modeSelected = localStorage.getItem(MODE_KEY);

let sV = [];
let db = null;
let render = () => {};

function video() {
    return document.querySelector('video');
}

function formatTime(sec) {
    try {
        return new Date(sec * 1000).toISOString().substr(11, 8);
    } catch (e) {
        return '00:00:00';
    }
}

function parseTime(txt) {
    const p = txt.trim().split(':').map(Number);
    let sec = 0;

    if (p.length === 3) sec = p[0] * 3600 + p[1] * 60 + p[2];
    else if (p.length === 2) sec = p[0] * 60 + p[1];
    else if (p.length === 1) sec = p[0];

    return isNaN(sec) ? 0 : sec;
}

function save() {
    if (db && modeSelected === 'sync') {
        db.ref(sT).set(sV);
    } else {
        localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(sV));
        render();
    }
}

function showConfigModal() {
    if (document.getElementById('cfg-modal')) return;
    if (!document.body) return;

    const modal = document.createElement('div');
    modal.id = 'cfg-modal';

    modal.style = `
        position:fixed;
        top:50%;
        left:50%;
        transform:translate(-50%,-50%);
        background:#18181b;
        padding:25px;
        border:2px solid #9147ff;
        border-radius:12px;
        z-index:1000000010;
        color:white;
        font-family:sans-serif;
        width:320px;
        display:flex;
        flex-direction:column;
        gap:10px;
        box-shadow:0 0 60px #000;
    `;

    modal.innerHTML = `
        <h3 style="color:#9147ff;margin:0;text-align:center">TwitchJumpSync</h3>
        <p style="font-size:12px;text-align:center;color:#adadb8">
        Choisissez votre mode d'utilisation :
        </p>

        <input id="f_api" placeholder="Firebase API Key"
        style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px"
        value="${firebaseConfig?.apiKey || ''}">

        <input id="f_url" placeholder="Database URL"
        style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px"
        value="${firebaseConfig?.databaseURL || ''}">

        <input id="f_pid" placeholder="Project ID"
        style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px"
        value="${firebaseConfig?.projectId || ''}">

        <input id="f_aid" placeholder="App ID"
        style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px"
        value="${firebaseConfig?.appId || ''}">

        <button id="f_save"
        style="background:#9147ff;color:#fff;border:none;padding:14px;cursor:pointer;font-weight:bold;border-radius:6px;margin-top:10px">
        CONNEXION FIREBASE (SYNC)
        </button>

        <button id="f_local"
        style="background:#222;color:#fff;border:1px solid #444;padding:12px;cursor:pointer;font-weight:bold;border-radius:6px">
        MODE HORS LIGNE (LOCAL)
        </button>
    `;

    document.body.appendChild(modal);

    document.getElementById('f_save').onclick = () => {
        const cfg = {
            apiKey: document.getElementById('f_api').value.trim(),
            databaseURL: document.getElementById('f_url').value.trim(),
            projectId: document.getElementById('f_pid').value.trim(),
            appId: document.getElementById('f_aid').value.trim()
        };

        if (!cfg.apiKey) {
            alert('API Key requise');
            return;
        }

        localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
        localStorage.setItem(MODE_KEY, 'sync');
        location.reload();
    };

    document.getElementById('f_local').onclick = () => {
        localStorage.setItem(MODE_KEY, 'local');
        location.reload();
    };
}

function loadData() {
    const isLocal = modeSelected === 'local';

    if (!isLocal && firebaseConfig) {
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

            db = firebase.database();

            db.ref(sT).on('value', snap => {
                sV = Array.isArray(snap.val()) ? snap.val() : [];
                render();
            });

        } catch (e) {
            console.error('Firebase error', e);
            sV = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY)) || [];
        }
    } else {
        sV = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY)) || [];
    }
}

function init() {
    if (!document.body) return;
    if (document.getElementById('twj')) return;

    const d = document.createElement('div');
    d.id = 'twj';

    d.style = `
        position:fixed;
        top:100px;
        left:10px;
        background:#18181b;
        padding:12px;
        border:2px solid #9147ff;
        border-radius:12px;
        width:260px;
        color:#fff;
        font-family:sans-serif;
        z-index:999999999;
        display:flex;
        flex-direction:column;
        gap:10px;
    `;

    const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || 'null');

    if (savedPos) {
        d.style.left = savedPos.left;
        d.style.top = savedPos.top;
    }

    d.innerHTML = `
        <div id="h"
        style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px;user-select:none">
        DRAG | ${modeSelected.toUpperCase()}
        </div>

        <input id="i" type="tel"
        style="width:100%;background:#000;color:#fff;border:1px solid #333;padding:8px 5px;font-size:1.4em;text-align:center;border-radius:5px;font-family:monospace;">

        <div id="g"
        style="color:#9147ff;font-weight:bold;text-align:center;cursor:pointer;padding:8px;background:#000;border-radius:4px">
        JUMP
        </div>

        <div style="display:flex;justify-content:space-between;font-size:0.7em;font-weight:bold;padding-top:5px;border-top:1px solid #333">
            <div id="mk" style="color:#e91e63;cursor:pointer">MARK</div>
            <div id="ls" style="cursor:pointer">LISTE</div>
            <div id="cfg_gear" style="color:#9147ff;cursor:pointer">⚙️</div>
        </div>

        <div id="l"
        style="display:none;background:#000;border:1px solid #333;max-height:200px;overflow-y:auto"></div>
    `;

    document.body.appendChild(d);

    const H = d.querySelector('#h');
    const I = d.querySelector('#i');
    const G = d.querySelector('#g');
    const MK = d.querySelector('#mk');
    const LS = d.querySelector('#ls');
    const CFG = d.querySelector('#cfg_gear');
    const L = d.querySelector('#l');

    render = () => {
        L.innerHTML = '';

        sV.slice().reverse().forEach(it => {
            const row = document.createElement('div');

            row.style = `
                display:flex;
                justify-content:space-between;
                padding:5px;
                border-bottom:1px solid #222;
                font-size:11px;
            `;

            row.innerHTML = `
                <span class="jump-it"
                style="color:#9147ff;cursor:pointer">${it.n}</span>

                <button class="del"
                style="background:red;color:white;border:none;font-size:8px">X</button>
            `;

            row.querySelector('.jump-it').onclick = () => {
                if (video()) video().currentTime = it.t;
            };

            row.querySelector('.del').onclick = () => {
                sV = sV.filter(x => x !== it);
                save();
            };

            L.appendChild(row);
        });
    };

    G.onclick = () => {
        if (!video()) return;
        video().currentTime = parseTime(I.value);
    };

    MK.onclick = () => {
        if (!video()) return;

        const t = Math.floor(video().currentTime);

        sV.push({
            n: formatTime(t),
            t: t
        });

        save();
    };

    LS.onclick = () => {
        L.style.display = L.style.display === 'none' ? 'block' : 'none';
        render();
    };

    CFG.onclick = () => {
        if (confirm("Réinitialiser les paramètres pour revoir l'invitation ?")) {
            localStorage.removeItem(MODE_KEY);
            location.reload();
        }
    };

    let drag = false;
    let ox = 0;
    let oy = 0;

    function savePos() {
        localStorage.setItem(POS_KEY, JSON.stringify({
            left: d.style.left,
            top: d.style.top
        }));
    }

    H.onmousedown = e => {
        drag = true;
        ox = e.clientX - d.offsetLeft;
        oy = e.clientY - d.offsetTop;
    };

    window.addEventListener('mousemove', e => {
        if (!drag) return;

        d.style.left = (e.clientX - ox) + 'px';
        d.style.top = (e.clientY - oy) + 'px';
    });

    window.addEventListener('mouseup', () => {
        if (drag) savePos();
        drag = false;
    });

    H.addEventListener('touchstart', e => {
        const t = e.touches[0];
        drag = true;
        ox = t.clientX - d.offsetLeft;
        oy = t.clientY - d.offsetTop;
    }, { passive: true });

    window.addEventListener('touchmove', e => {
        if (!drag) return;

        const t = e.touches[0];

        d.style.left = (t.clientX - ox) + 'px';
        d.style.top = (t.clientY - oy) + 'px';
    }, { passive: true });

    window.addEventListener('touchend', () => {
        if (drag) savePos();
        drag = false;
    });

    setInterval(() => {
        const v = video();

        if (v && !v.paused && document.activeElement !== I) {
            I.value = formatTime(Math.floor(v.currentTime));
        }
    }, 1000);

    render();
}

function ensureApp() {
    if (!modeSelected) return;

    if (!document.getElementById('twj')) {
        init();
    }
}

function start() {
    if (!modeSelected) {
        setTimeout(showConfigModal, 1500);
        return;
    }

    loadData();

    setTimeout(init, 3500);

    setInterval(ensureApp, 3000);
}

window.addEventListener('load', start);

})();
