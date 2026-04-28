
// ==UserScript==
// @name         Twitch Sync Multi-Device v1
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  vv4 complet + config Firebase + mode local + clic molette + auto sélection HH/MM/SS + Fix Android Drag
// @author       User
// @match        https://www.twitch.tv/*
// @match        https://m.twitch.tv/*
// @grant        none
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js
// @require      https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js
// ==/UserScript==

(function () {
    'use strict';

    const CFG_KEY='tw_sync_fb_config';
    const MODE_KEY='tw_mode_selected';
    const LOCAL_KEY='tw_sync_local_data';
    const POS_KEY='tw_sync_pos';
    const sT='tw_sync_data';

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
            <h3 style="margin:0;text-align:center;color:#9147ff">Twitch Sync</h3>
            <input id="f_api" placeholder="Firebase API Key" style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.apiKey||''}">
            <input id="f_url" placeholder="Database URL" style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.databaseURL||''}">
            <input id="f_pid" placeholder="Project ID" style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.projectId||''}">
            <input id="f_aid" placeholder="App ID" style="background:#000;color:#fff;border:1px solid #333;padding:10px;border-radius:4px" value="${firebaseConfig?.appId||''}">
            <button id="f_save" style="background:#9147ff;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer">CONNEXION FIREBASE</button>
            <button id="f_local" style="background:#222;color:#fff;border:1px solid #444;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer">MODE HORS LIGNE</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('f_save').onclick=()=>{
            const cfg={
                apiKey:document.getElementById('f_api').value.trim(),
                databaseURL:document.getElementById('f_url').value.trim(),
                projectId:document.getElementById('f_pid').value.trim(),
                appId:document.getElementById('f_aid').value.trim()
            };
            if(!cfg.apiKey) return alert('API Key requise');
            localStorage.setItem(CFG_KEY,JSON.stringify(cfg));
            localStorage.setItem(MODE_KEY,'sync');
            location.reload();
        };

        document.getElementById('f_local').onclick=()=>{
            localStorage.setItem(MODE_KEY,'local');
            location.reload();
        };
    }

    if(!modeSelected){
        window.addEventListener('load',()=>setTimeout(showConfigModal,1500));
        return;
    }

    if(modeSelected==='sync' && firebaseConfig){
        try{
            if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            db=firebase.database();
            db.ref(sT).on('value',snap=>{
                sV=Array.isArray(snap.val())?snap.val():[];
                if(typeof window.render==='function') window.render();
            });
        }catch(e){
            sV=JSON.parse(localStorage.getItem(LOCAL_KEY))||[];
        }
    }else{
        sV=JSON.parse(localStorage.getItem(LOCAL_KEY))||[];
    }

    function save(){
        if(db && modeSelected==='sync'){
            db.ref(sT).set(sV);
        }else{
            localStorage.setItem(LOCAL_KEY,JSON.stringify(sV));
            window.render();
        }
    }

    (function(){
        const style=document.createElement('style');
        style.innerHTML=`
            #i::selection{background:#0078d7!important;color:#fff!important;}
            #i{caret-color:#0078d7!important;outline:none!important;}
            #twj{transition:height .2s,width .2s;box-shadow:0 0 15px rgba(0,0,0,.4);overflow:hidden;z-index:999999999!important;}
            .minimized{width:230px!important;height:105px!important;}
            .minimized>*:not(#h):not(#min-controls):not(#min):not(#x){display:none!important;}
            .min-btn-style{background:#e91e63;color:#fff;border:none;border-radius:4px;padding:0 10px;height:32px;font-size:10px;font-weight:bold;cursor:pointer;}
            #min-mk10{background:#c2185b;}
            .jump{cursor:pointer;text-decoration:none;}
        `;
        document.head.appendChild(style);

        function init(){
            if(document.getElementById('twj')) return;

            const isPC=matchMedia('(pointer:fine)').matches;
            let myDevice=isPC?'PC':'TAB';
            let viewTab=myDevice;

            const v=()=>document.querySelector('video');

            const f=s=>{
                try{return new Date(s*1000).toISOString().substr(11,8);}
                catch(e){return'00:00:00';}
            };

            const restoreBtn=document.createElement('div');
            restoreBtn.id='twj-restore';
            restoreBtn.innerHTML='T';
            restoreBtn.style='position:fixed;top:5px;left:5px;z-index:2147483647;background:#9147ff;color:#fff;width:30px;height:30px;border-radius:50%;display:none;justify-content:center;align-items:center;cursor:pointer;font-weight:bold';

            const d=document.createElement('div');
            d.id='twj';
            d.style='position:fixed;top:100px;left:10px;background:#18181b;padding:12px;border:2px solid #9147ff;border-radius:12px;width:260px;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;gap:10px;resize:both;max-width:95vw;max-height:85vh';

            const pos=JSON.parse(localStorage.getItem(POS_KEY)||'null');
            if(pos){d.style.left=pos.left;d.style.top=pos.top;}

            d.innerHTML=`
                <div id="h" style="width:100%;height:25px;background:#333;border-radius:4px;cursor:move;display:flex;justify-content:center;align-items:center;font-size:10px">DRAG (${myDevice})</div>
                <button id="min" style="position:absolute;top:5px;left:8px;background:none;border:none;color:#fff;font-size:16px;cursor:pointer">-</button>
                <button id="x" style="position:absolute;top:5px;right:8px;background:none;border:none;color:#f44;cursor:pointer">X</button>
                <div id="min-controls" style="display:none;justify-content:center;gap:15px;margin-top:10px">
                    <button id="min-mk" class="min-btn-style">MARK</button>
                    <button id="min-mk10" class="min-btn-style">MARK -10s</button>
                </div>
                <input id="i" type="tel" style="width:100%;background:#000;color:#fff;border:1px solid #333;padding:8px 5px;font-size:1.4em;text-align:center;border-radius:5px;font-family:monospace">
                <div id="g" style="color:#9147ff;font-weight:bold;text-align:center;cursor:pointer;padding:8px;background:#000;border-radius:4px">JUMP</div>
                <div style="display:flex;gap:20px;justify-content:center;font-size:.85em;font-weight:bold">
                    <div id="m10" style="cursor:pointer">-10s</div>
                    <div id="m5" style="cursor:pointer">-5s</div>
                    <div id="p5" style="cursor:pointer">+5s</div>
                    <div id="p10" style="cursor:pointer">+10s</div>
                </div>
                <div style="border-top:1px solid #333;padding-top:10px;display:flex;justify-content:space-between;font-size:.75em;font-weight:bold">
                    <div id="mk" style="color:#e91e63;cursor:pointer">MARK</div>
                    <div id="ls" style="cursor:pointer">LIST</div>
                    <div id="txt" style="color:#4caf50;cursor:pointer">TXT</div>
                    <div id="mk10" style="color:#c2185b;cursor:pointer">MARK -10s</div>
                    <div id="cfg_gear" style="color:#9147ff;cursor:pointer">⚙️</div>
                </div>
                <div id="tabs" style="display:none;flex-direction:row;background:#000;border-radius:4px;overflow:hidden;border:1px solid #333">
                    <div id="tab-pc" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px;border-right:1px solid #333">PC</div>
                    <div id="tab-tab" style="flex:1;text-align:center;padding:6px;cursor:pointer;font-size:10px">TAB</div>
                </div>
                <div id="l" style="display:none;overflow-y:auto;background:#000;font-size:.8em;border:1px solid #333;max-height:300px"></div>
            `;
            document.body.appendChild(d);
            document.body.appendChild(restoreBtn);

            const I=d.querySelector('#i');
            const L=d.querySelector('#l');
            const T=d.querySelector('#tabs');

            I.addEventListener('click',()=>{
                const p=I.selectionStart||0;
                if(p<=2) I.setSelectionRange(0,2);
                else if(p>=3 && p<=5) I.setSelectionRange(3,5);
                else I.setSelectionRange(6,8);
            });

            window.render=function(){
                L.innerHTML='';
                d.querySelector('#tab-pc').style.background=viewTab==='PC'?'#9147ff':'#222';
                d.querySelector('#tab-tab').style.background=viewTab==='TAB'?'#9147ff':'#222';
                const filtered=sV.filter(x=>(x.dev===viewTab||(!x.dev&&viewTab==='PC')));

                filtered.slice().reverse().forEach(item=>{
                    const fullUrl=window.location.origin+window.location.pathname+'?t='+item.t+'s';
                    const row=document.createElement('div');
                    row.style='display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #222;align-items:center';
                    row.innerHTML=`
                        <a class="jump" href="${fullUrl}" target="_blank" style="color:#9147ff;flex:1">${item.n}</a>
                        <button class="ed-btn" style="background:#4caf50;color:#fff;border:none;padding:3px 6px;font-size:9px">EDIT</button>
                        <button class="de-btn" style="background:#f44;color:#fff;border:none;padding:3px 6px;font-size:9px">DEL</button>
                    `;
                    const jump=row.querySelector('.jump');
                    jump.onclick=(e)=>{
                        if(e.button!==0) return;
                        e.preventDefault();
                        if(v()) v().currentTime=item.t;
                    };
                    jump.onauxclick=(e)=>{
                        if(e.button===1){
                            e.preventDefault();
                            window.open(fullUrl,'_blank','noopener,noreferrer');
                        }
                    };
                    row.querySelector('.ed-btn').onclick=()=>{
                        let n=prompt('Nom:',item.n);
                        if(n){item.n=n;save();}
                    };
                    row.querySelector('.de-btn').onclick=()=>{
                        sV=sV.filter(i=>i!==item);
                        save();
                    };
                    L.appendChild(row);
                });
            };

            function mk(offset){
                if(!v()) return;
                let t=Math.floor(Math.max(0,v().currentTime-offset));
                sV.push({ n:f(t), t:t, dev:myDevice });
                save();
                T.style.display='flex';
                L.style.display='block';
                window.render();
            }

            d.querySelector('#g').onclick=()=>{
                let p=I.value.split(':').map(Number);
                if(!v()) return;
                if(p.length===3) v().currentTime=p[0]*3600+p[1]*60+p[2];
            };

            d.querySelector('#m10').onclick=()=>{if(v())v().currentTime-=10;};
            d.querySelector('#m5').onclick=()=>{if(v())v().currentTime-=5;};
            d.querySelector('#p5').onclick=()=>{if(v())v().currentTime+=5;};
            d.querySelector('#p10').onclick=()=>{if(v())v().currentTime+=10;};
            d.querySelector('#mk').onclick=()=>mk(0);
            d.querySelector('#mk10').onclick=()=>mk(10);
            d.querySelector('#min-mk').onclick=()=>mk(0);
            d.querySelector('#min-mk10').onclick=()=>mk(10);

            d.querySelector('#ls').onclick=()=>{
                L.style.display=L.style.display==='none'?'block':'none';
                T.style.display=T.style.display==='none'?'flex':'none';
                window.render();
            };

            d.querySelector('#tab-pc').onclick=()=>{viewTab='PC';window.render();};
            d.querySelector('#tab-tab').onclick=()=>{viewTab='TAB';window.render();};
            d.querySelector('#txt').onclick=()=>{
                let content=sV.map(i=>`${i.n} | ${i.t}s`).join('\n');
                const blob=new Blob([content],{type:'text/plain'});
                const a=document.createElement('a');
                a.href=URL.createObjectURL(blob);
                a.download='twitch_sync.txt';
                a.click();
            };

            d.querySelector('#cfg_gear').onclick=()=>{
                if(confirm('Réinitialiser les paramètres ?')){
                    localStorage.removeItem(MODE_KEY);
                    location.reload();
                }
            };

            d.querySelector('#x').onclick=()=>{
                d.style.display='none';
                restoreBtn.style.display='flex';
            };

            restoreBtn.onclick=()=>{
                d.style.display='flex';
                restoreBtn.style.display='none';
            };

            d.querySelector('#min').onclick=()=>{
                const m=d.classList.toggle('minimized');
                d.querySelector('#min').innerText=m?'+':'-';
                d.querySelector('#min-controls').style.display=m?'flex':'none';
            };

            // LOGIQUE DE DRAG UNIFIÉE (SOURIS + TACTILE)
            let drag=false,ox=0,oy=0;

            const startDrag = (e) => {
                drag=true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                ox = clientX - d.offsetLeft;
                oy = clientY - d.offsetTop;
            };

            const moveDrag = (e) => {
                if(!drag) return;
                if(e.touches) e.preventDefault(); // Empêche le scroll sur Android
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                d.style.left = (clientX - ox) + 'px';
                d.style.top = (clientY - oy) + 'px';
            };

            const stopDrag = () => {
                if(drag){
                    localStorage.setItem(POS_KEY,JSON.stringify({
                        left:d.style.left,
                        top:d.style.top
                    }));
                }
                drag=false;
            };

            const header = d.querySelector('#h');
            header.onmousedown = startDrag;
            header.addEventListener('touchstart', startDrag, {passive: false});

            window.addEventListener('mousemove', moveDrag);
            window.addEventListener('touchmove', moveDrag, {passive: false});

            window.addEventListener('mouseup', stopDrag);
            window.addEventListener('touchend', stopDrag);

            setInterval(()=>{
                if(v() && !v().paused && document.activeElement!==I){
                    I.value=f(Math.floor(v().currentTime));
                }
            },1000);

            window.render();
        }

        setTimeout(init,3000);
        setInterval(()=>{if(!document.getElementById('twj')) init();},3000);
    })();
})();
