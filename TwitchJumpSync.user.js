// ==UserScript==
// @name         Twitch Sync Multi-Device v4.5
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Twitch mark and sync
// @author       Dr974
// @match        https://www.twitch.tv/*
// @match        https://m.twitch.tv/*
// @grant        none
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js
// ==/UserScript==

(function () {
    'use strict';

    const CFG_KEY='tw_sync_fb_config';
    const MODE_KEY='tw_mode_selected';
    const LOCAL_KEY='tw_sync_local_data';
    const POS_KEY='tw_sync_pos';
    const SIZE_KEY='tw_sync_size';
    const sT = 'tw_sync_data/ma_synchro_privee';

    let firebaseConfig=JSON.parse(localStorage.getItem(CFG_KEY))||null;
    let modeSelected=localStorage.getItem(MODE_KEY);
    let db=null;
    let sV=[];

    function showConfigModal(){
        if(document.getElementById('cfg-modal')) return;
        const modal=document.createElement('div');
        modal.id='cfg-modal';
        modal.style='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#18181b;padding:25px;border:2px solid #9147ff;border-radius:12px;z-index:2147483647;color:#fff;font-family:sans-serif;width:320px;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 60px #000';
        modal.innerHTML=`
            <h3 style="margin:0;text-align:center;color:#9147ff">Twitch Sync Config</h3>
            <input id="f_api" placeholder="API Key" style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.apiKey||''}">
            <input id="f_url" placeholder="Database URL" style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.databaseURL||''}">
            <input id="f_pid" placeholder="Project ID" style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.projectId||''}">
            <input id="f_aid" placeholder="App ID" style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.appId||''}">
            <button id="f_save" style="background:#9147ff;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer">ACTIVER LA SYNCHRO</button>
            <button id="f_local" style="background:#222;color:#fff;border:1px solid #444;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer">MODE LOCAL</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('f_save').onclick=()=>{
            const url = document.getElementById('f_url').value.trim();
            const cfg={
                apiKey:document.getElementById('f_api').value.trim(),
                databaseURL:url,
                projectId:document.getElementById('f_pid').value.trim(),
                appId:document.getElementById('f_aid').value.trim()
            };
            localStorage.setItem(CFG_KEY,JSON.stringify(cfg));
            localStorage.setItem(MODE_KEY,'sync');
            location.reload();
        };
        document.getElementById('f_local').onclick=()=>{
            localStorage.setItem(MODE_KEY,'local');
            location.reload();
        };
    }

    function startFirebase() {
        if (modeSelected === 'sync' && firebaseConfig) {
            try {
                if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
                if (typeof firebase.auth !== "function") {
                    setTimeout(startFirebase, 500);
                    return;
                }
                firebase.auth().signInAnonymously().then(() => {
                    db = firebase.database();
                    db.ref(sT).on('value', snap => {
                        const data = snap.val();
                        sV = Array.isArray(data) ? data : [];
                        if (typeof window.render === 'function') window.render();
                    });
                });
            } catch (e) { console.error("FB Error", e); }
        } else {
            sV = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
        }
    }

    startFirebase();

    function save(){
        if(db && modeSelected==='sync' && firebase.auth().currentUser){
            db.ref(sT).set(sV);
        }
        localStorage.setItem(LOCAL_KEY, JSON.stringify(sV));
        if(typeof window.render === 'function') window.render();
    }

    (function(){
        const style=document.createElement('style');
        style.innerHTML=`
            #i::selection{background:#0078d7!important;color:#fff!important;}
            #i{caret-color:#0078d7!important;outline:none!important;}
            #twj{transition:height .2s,width .2s;box-shadow:0 0 15px rgba(0,0,0,.4);overflow:hidden;z-index:2147483647!important;pointer-events: auto;}
            .minimized{width:230px!important;height:105px!important;}
            .minimized>*:not(#h):not(#min-controls):not(#min):not(#x){display:none!important;}
            .min-btn-style{background:#e91e63;color:#fff;border:none;border-radius:4px;padding:0 10px;height:32px;font-size:10px;font-weight:bold;cursor:pointer;}
            .jump{cursor:pointer;text-decoration:none;}
            #resizer{position:absolute;bottom:0;right:0;width:15px;height:15px;cursor:nwse-resize;background:linear-gradient(135deg, transparent 50%, #9147ff 50%);}
        `;
        document.head.appendChild(style);

        function init(){
            if(document.getElementById('twj')) return;
            const getContainer = () => document.querySelector('.video-player__container') || document.querySelector('.player-core-container') || document.body;
            let container = getContainer();
            const isPC=matchMedia('(pointer:fine)').matches;
            let myDevice=isPC?'PC':'TAB', viewTab=myDevice;
            const v=()=>document.querySelector('video');
            const f=s=>{ try{return new Date(s*1000).toISOString().substr(11,8);}catch(e){return'00:00:00';} };

            const restoreBtn=document.createElement('div');
            restoreBtn.id='twj-restore'; restoreBtn.innerHTML='T';
            restoreBtn.style='position:absolute;top:5px;left:5px;z-index:2147483647;background:#9147ff;color:#fff;width:30px;height:30px;border-radius:50%;display:none;justify-content:center;align-items:center;cursor:pointer;font-weight:bold';

            const d=document.createElement('div');
            d.id='twj';
            d.style='position:absolute;top:10%;left:5%;background:#18181b;padding:12px;border:2px solid #9147ff;border-radius:12px;width:260px;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;gap:10px;resize:both;z-index:2147483647';

            const pos=JSON.parse(localStorage.getItem(POS_KEY)||'null');
            if(pos){d.style.left=pos.left;d.style.top=pos.top;}
            const size=JSON.parse(localStorage.getItem(SIZE_KEY)||'null');
            if(size){d.style.width=size.w;d.style.height=size.h;}

            d.innerHTML=`
                <div id="h" style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px">DRAG (${myDevice})</div>
                <button id="min" style="position:absolute;top:5px;left:8px;background:none;border:none;color:#fff;font-size:16px;cursor:pointer">-</button>
                <button id="x" style="position:absolute;top:5px;right:8px;background:none;border:none;color:#f44;cursor:pointer">X</button>
                <div id="min-controls" style="display:none;justify-content:center;gap:15px;margin-top:10px"><button id="min-mk" class="min-btn-style">MARK</button><button id="min-mk10" class="min-btn-style" style="background:#c2185b">MARK -10s</button></div>
                <input id="i" type="tel" style="width:100%;background:#000;color:#fff;border:1px solid #333;padding:8px 5px;font-size:1.4em;text-align:center;border-radius:5px;font-family:monospace">
                <div id="g" style="color:#9147ff;font-weight:bold;text-align:center;cursor:pointer;padding:8px;background:#000;border-radius:4px">JUMP</div>
                <div style="display:flex;gap:20px;justify-content:center;font-size:.85em;font-weight:bold"><div id="m10" style="cursor:pointer">-10s</div><div id="m5" style="cursor:pointer">-5s</div><div id="p5" style="cursor:pointer">+5s</div><div id="p10" style="cursor:pointer">+10s</div></div>
                <div style="border-top:1px solid #333;padding-top:10px;display:flex;justify-content:space-between;font-size:.75em;font-weight:bold">
                    <div id="mk" style="color:#e91e63;cursor:pointer">MARK</div><div id="ls" style="cursor:pointer">LIST</div><div id="txt" style="color:#4caf50;cursor:pointer">TXT</div><div id="mk10" style="color:#c2185b;cursor:pointer">MARK -10s</div><div id="cfg_gear" style="color:#9147ff;cursor:pointer">⚙️</div>
                </div>
                <div id="tabs" style="display:none;flex-direction:row;background:#000;border-radius:4px;overflow:hidden;border:1px solid #333"><div id="tab-pc" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px;border-right:1px solid #333">PC</div><div id="tab-tab" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px">TAB</div></div>
                <div id="l" style="display:none;overflow-y:auto;background:#000;font-size:.8em;border:1px solid #333;max-height:300px"></div><div id="resizer"></div>
            `;

            container.appendChild(d); container.appendChild(restoreBtn);
            const I=d.querySelector('#i'), L=d.querySelector('#l'), T=d.querySelector('#tabs');

            const handleSelect = (e) => {
                const pos = I.selectionStart;
                if (pos >= 0 && pos <= 2) I.setSelectionRange(0, 2);
                else if (pos >= 3 && pos <= 5) I.setSelectionRange(3, 5);
                else if (pos >= 6 && pos <= 8) I.setSelectionRange(6, 8);
            };
            I.onclick = handleSelect;
            I.ontouchend = (e) => { setTimeout(() => handleSelect(e), 10); };

            window.render=function(){
                L.innerHTML='';
                d.querySelector('#tab-pc').style.background=viewTab==='PC'?'#9147ff':'#222';
                d.querySelector('#tab-tab').style.background=viewTab==='TAB'?'#9147ff':'#222';
                const filtered=sV.filter(x=>(x.dev===viewTab||(!x.dev&&viewTab==='PC')));
                filtered.slice().reverse().forEach(item=>{
                    const row=document.createElement('div');
                    row.style='display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #222;align-items:center';
                    row.innerHTML=`<a class="jump" href="${item.url}?t=${item.t}s" style="color:#9147ff;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">[${item.ch||'?'}] ${item.n}</a>
                    <button class="ed-btn" style="background:#4caf50;color:#fff;border:none;padding:3px 6px;font-size:9px;margin-left:5px">EDIT</button>
                    <button class="de-btn" style="background:#f44;color:#fff;border:none;padding:3px 6px;font-size:9px;margin-left:5px">DEL</button>`;
                    const jump=row.querySelector('.jump');

                    jump.onclick = (e) => {
                        e.preventDefault();
                        if (window.location.pathname === item.path && v()) {
                            v().currentTime = item.t;
                        } else {
                            window.location.href = `${item.url}?t=${item.t}s`;
                        }
                    };

                    row.querySelector('.ed-btn').onclick=()=>{ let n=prompt('Nom:',item.n); if(n){item.n=n;save();} };
                    row.querySelector('.de-btn').onclick=()=>{ sV=sV.filter(i=>i!==item); save(); };
                    L.appendChild(row);
                });
            };

            d.querySelector('#txt').onclick = () => {
                if (sV.length === 0) return alert("Liste vide");
                const content = sV.map(item => {
                    const cleanUrl = item.url.split('?')[0];
                    return `${item.ch || 'Twitch'} - ${item.n} - ${cleanUrl}?t=${item.t}s`;
                }).join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `twitch_sync_${new Date().toLocaleDateString()}.txt`;
                a.click();
            };

            function mk(offset){
                if(!v()) return;
                let t=Math.floor(Math.max(0,v().currentTime-offset));
                const ch = document.querySelector('.channel-info-content h1')?.innerText || document.querySelector('[data-a-target="channel-header-title-info"] h1')?.innerText || "Twitch";
                sV.push({ n: f(t), t: t, dev: myDevice, ch: ch, path: window.location.pathname, url: window.location.origin + window.location.pathname });
                save(); L.style.display='block'; T.style.display='flex'; window.render();
            }

            d.querySelector('#g').onclick=()=>{ let p=I.value.split(':').map(Number); if(v()&&p.length===3) v().currentTime=p[0]*3600+p[1]*60+p[2]; };
            d.querySelector('#m10').onclick=()=>{if(v())v().currentTime-=10;};
            d.querySelector('#m5').onclick=()=>{if(v())v().currentTime-=5;}; // Ajouté
            d.querySelector('#p5').onclick=()=>{if(v())v().currentTime+=5;}; // Ajouté
            d.querySelector('#p10').onclick=()=>{if(v())v().currentTime+=10;};
            d.querySelector('#mk').onclick=()=>mk(0);
            d.querySelector('#mk10').onclick=()=>mk(10);
            d.querySelector('#min-mk').onclick=()=>mk(0);
            d.querySelector('#min-mk10').onclick=()=>mk(10);
            d.querySelector('#ls').onclick=()=>{ L.style.display=L.style.display==='none'?'block':'none'; T.style.display=T.style.display==='none'?'flex':'none'; window.render(); };
            d.querySelector('#tab-pc').onclick=()=>{viewTab='PC';window.render();};
            d.querySelector('#tab-tab').onclick=()=>{viewTab='TAB';window.render();};
            d.querySelector('#cfg_gear').onclick=showConfigModal;
            d.querySelector('#x').onclick=()=>{ d.style.display='none'; restoreBtn.style.display='flex'; };
            restoreBtn.onclick=()=>{ d.style.display='flex'; restoreBtn.style.display='none'; };
            d.querySelector('#min').onclick=()=>{ const m=d.classList.toggle('minimized'); d.querySelector('#min').innerText=m?'+':'-'; d.querySelector('#min-controls').style.display=m?'flex':'none'; };

            let isD=false, isR=false, oX, oY, sW, sH;
            const start=(e, type)=>{
                const ev = e.type.includes('touch') ? e.touches[0] : e;
                if(e.target.id==='i' || e.target.tagName==='BUTTON' || e.target.closest('#l')) return;
                if(type==='d'){ isD=true; oX=ev.clientX-d.offsetLeft; oY=ev.clientY-d.offsetTop; }
                else{ isR=true; sW=d.offsetWidth; sH=d.offsetHeight; oX=ev.clientX; oY=ev.clientY; }
            };
            const move=(e)=>{
                if(!isD && !isR) return;
                const ev=e.type.includes('touch') ? e.touches[0] : e;
                if(isD){ d.style.left=(ev.clientX-oX)+'px'; d.style.top=Math.max(0,ev.clientY-oY)+'px'; }
                if(isR && !d.classList.contains('minimized')){ d.style.width=(sW+ev.clientX-oX)+'px'; d.style.height=(sH+ev.clientY-oY)+'px'; }
                if(e.cancelable) e.preventDefault();
            };
            const stop=()=>{
                if(isD) localStorage.setItem(POS_KEY, JSON.stringify({left:d.style.left, top:d.style.top}));
                if(isR) localStorage.setItem(SIZE_KEY, JSON.stringify({w:d.style.width, h:d.style.height}));
                isD=isR=false;
            };
            d.querySelector('#h').onmousedown = d.querySelector('#h').ontouchstart = (e)=>start(e,'d');
            d.querySelector('#resizer').onmousedown = d.querySelector('#resizer').ontouchstart = (e)=>start(e,'r');
            window.addEventListener('mousemove',move,{passive:false}); window.addEventListener('touchmove',move,{passive:false});
            window.addEventListener('mouseup',stop); window.addEventListener('touchend',stop);

            setInterval(()=>{ if(v() && !v().paused && document.activeElement!==I) I.value=f(Math.floor(v().currentTime)); },1000);
            if(!modeSelected) showConfigModal();
            window.render();
        }
        setTimeout(init,2000);
    })();
})();
