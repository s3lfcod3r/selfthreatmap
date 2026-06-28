/* ============================================================
   SelfThreatMap — Angriffs-Herkünfte (Gesamt-Übersicht)
   Zeigt aus ALLEN geladenen Angriffen (allEvents), aus welchen
   Ländern (und Städten) du insgesamt schon angegriffen wurdest —
   vollständige, sortierte Liste mit Flaggen, Anzahl & Balken.
   Geöffnet per Klick auf das „LÄNDER"-Stat im Kopf.
   ============================================================ */
function _ovT(de, en){ return (typeof currentLang!=='undefined' && currentLang==='de') ? de : en; }

function openOriginsOverview(){
  const modal = document.getElementById('origins-modal');
  if(!modal) return;
  const events = (typeof allEvents!=='undefined' && allEvents.length) ? allEvents
               : (typeof feedData!=='undefined' ? feedData : []);
  const byCountry = {}, byCity = {}; let total = 0;
  events.forEach(e=>{
    const cc = String(e.country||'??').toUpperCase().slice(0,2);
    byCountry[cc] = (byCountry[cc]||0) + 1; total++;
    if(e.city){ const k = cc+'|'+e.city; (byCity[k] = byCity[k] || {cc, city:e.city, n:0}).n++; }
  });
  const countries = Object.entries(byCountry).map(([cc,n])=>({cc,n})).sort((a,b)=>b.n-a.n);
  const cities = Object.values(byCity).sort((a,b)=>b.n-a.n).slice(0,40);
  const loc = (typeof currentLang!=='undefined' && currentLang==='de') ? 'de-DE' : 'en-US';
  const fmt = n => { try { return n.toLocaleString(loc); } catch(e){ return String(n); } };
  const flag = cc => (typeof FLAG!=='undefined' && FLAG[cc]) || '🏴';
  const cname = cc => (typeof COUNTRY_NAME!=='undefined' && COUNTRY_NAME[cc]) || cc;
  const cmax = countries.length ? countries[0].n : 1;

  let html = `<div class="ov-summary"><b>${countries.length}</b> ${_ovT('Länder','countries')} · <b>${fmt(total)}</b> ${_ovT('Angriffe gesamt','attacks total')}</div>`;
  html += '<div class="ov-list">' + countries.map((c,i)=>
    `<div class="ov-row"><span class="ov-rank">${i+1}</span><span class="ov-flag">${flag(c.cc)}</span><span class="ov-name">${cname(c.cc)}</span><span class="ov-bar"><span style="width:${Math.max(3,Math.round(c.n/cmax*100))}%"></span></span><span class="ov-count">${fmt(c.n)}</span></div>`
  ).join('') + '</div>';

  if(cities.length){
    const ctmax = cities[0].n;
    html += `<div class="ov-sub">${_ovT('Top-Städte','Top cities')}</div><div class="ov-list">` + cities.map((c,i)=>
      `<div class="ov-row"><span class="ov-rank">${i+1}</span><span class="ov-flag">${flag(c.cc)}</span><span class="ov-name">${typeof translateCity==='function'?translateCity(c.city):c.city}</span><span class="ov-bar"><span style="width:${Math.max(3,Math.round(c.n/ctmax*100))}%"></span></span><span class="ov-count">${fmt(c.n)}</span></div>`
    ).join('') + '</div>';
  }

  const body = document.getElementById('origins-body'); if(body) body.innerHTML = html;
  const title = document.getElementById('origins-title');
  if(title) title.textContent = '🌍 ' + _ovT('ANGRIFFS-HERKÜNFTE','ATTACK ORIGINS') + ' (' + countries.length + ')';
  modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
}

function closeOriginsOverview(){
  const m = document.getElementById('origins-modal');
  if(m){ m.classList.add('hidden'); m.setAttribute('aria-hidden','true'); }
}

document.addEventListener('keydown', function(e){
  if(e.key==='Escape'){
    const m = document.getElementById('origins-modal');
    if(m && !m.classList.contains('hidden')) closeOriginsOverview();
  }
});

/* ============================================================
   Karten-Overlay: ALLE Angriffs-Länder als Punkte (mit Namen)
   Ein Punkt pro Land (Größe = Angriffszahl) am häufigsten getroffenen
   Ort des Landes, dauerhaft beschriftet. Aktualisiert sich live, weil
   renderDots() am Ende renderOriginsOverlay() aufruft.
   ============================================================ */
let originsOverlayOn = false;

function toggleOriginsOverlay(){
  originsOverlayOn = !originsOverlayOn;
  try{ localStorage.setItem('stmOriginsOverlay', originsOverlayOn ? '1' : '0'); }catch(e){}
  if(typeof setToggleBtn==='function') setToggleBtn('origins-toggle', originsOverlayOn, 'origins-dot');
  renderOriginsOverlay();
}

let _originsRaf = null;
// Throttled (1×/Frame) — für flüssiges Zoomen
function requestOriginsRender(){
  if(!originsOverlayOn) return;
  if(_originsRaf) return;
  _originsRaf = requestAnimationFrame(function(){ _originsRaf = null; renderOriginsOverlay(); });
}

function renderOriginsOverlay(){
  if(typeof dotG==='undefined' || !dotG) return;
  dotG.selectAll('.origin-dot,.origin-label').remove();
  if(!originsOverlayOn) return;
  const events = (typeof allEvents!=='undefined' && allEvents.length) ? allEvents
               : (typeof feedData!=='undefined' ? feedData : []);
  // Pro Ort (Stadt-Ebene) aggregieren
  const byLoc = {};
  events.forEach(e=>{
    if(e.lat==null || e.lon==null) return;
    const key = e.lat.toFixed(2)+','+e.lon.toFixed(2);
    let L = byLoc[key];
    if(!L){ L = byLoc[key] = {lon:e.lon, lat:e.lat, country:String(e.country||'??').toUpperCase().slice(0,2), city:e.city||'', n:0}; }
    L.n++;
    if(e.city && !L.city) L.city = e.city;
  });
  const locs = Object.values(byLoc);
  if(!locs.length) return;
  const k  = Math.max((typeof currentScale!=='undefined' ? currentScale : 1), 0.15);
  const ik = 1/k;
  const tx = (typeof currentTx!=='undefined') ? currentTx : 0;
  const ty = (typeof currentTy!=='undefined') ? currentTy : 0;
  const cname = cc => (typeof COUNTRY_NAME!=='undefined' && COUNTRY_NAME[cc]) || cc;
  const maxN = Math.max.apply(null, locs.map(l=>l.n).concat([1]));

  // 1) PUNKTE: jeder getroffene Ort, kleine konstante Bildschirmgröße
  locs.forEach(l=>{
    const p = proj([l.lon, l.lat]); if(!p) return;
    const r = 2 + Math.round((l.n/maxN) * 3);   // 2..5 px
    dotG.append('circle').attr('class','origin-dot')
      .attr('cx',p[0]).attr('cy',p[1]).attr('r',r*ik).attr('data-sr',r)
      .attr('fill','var(--accent)').attr('fill-opacity',0.85)
      .attr('stroke','#fff').attr('stroke-opacity',0.35).attr('stroke-width',0.8*ik)
      .append('title').text(cname(l.country)+(l.city?' · '+l.city:'')+': '+l.n);
  });

  // 2) LABELS mit Überlappungsschutz; Land bei kleinem Zoom, Stadt ab CITY_ZOOM
  const CITY_ZOOM = 4;
  let cand;
  if(k < CITY_ZOOM){
    const byC = {};
    locs.forEach(l=>{ let c=byC[l.country]; if(!c){c=byC[l.country]={cc:l.country,n:0,best:l,bestN:-1};} c.n+=l.n; if(l.n>c.bestN){c.bestN=l.n;c.best=l;} });
    cand = Object.values(byC).map(c=>({lon:c.best.lon, lat:c.best.lat, text:cname(c.cc)+' ('+c.n+')', n:c.n}));
  } else {
    cand = locs.map(l=>({lon:l.lon, lat:l.lat, text:(l.city ? (typeof translateCity==='function'?translateCity(l.city):l.city) : cname(l.country))+' ('+l.n+')', n:l.n}));
  }
  cand.sort((a,b)=>b.n-a.n);                    // wichtigste zuerst platzieren
  if(cand.length > 220) cand = cand.slice(0,220);
  const placed = [];
  const fontPx = 11, charW = fontPx*0.62, pad = 4, h = fontPx + 4;
  const font = (typeof labelPxToSvg==='function') ? labelPxToSvg(fontPx) : (fontPx*ik)+'px';
  cand.forEach(c=>{
    const p = proj([c.lon, c.lat]); if(!p) return;
    const sx = tx + p[0]*k, sy = ty + p[1]*k;   // Bildschirmposition des Punkts
    const w = c.text.length*charW + 6;
    const lx = sx + 6, lyTop = sy - h/2;
    for(const r of placed){ if(lx < r.x+r.w+pad && lx+w+pad > r.x && lyTop < r.y+r.h+pad && lyTop+h+pad > r.y) return; }
    placed.push({x:lx, y:lyTop, w, h});
    dotG.append('text').attr('class','origin-label')
      .attr('x',p[0]+6*ik).attr('y',p[1]+3*ik)
      .attr('font-size',font)
      .attr('fill','var(--text)').attr('font-family','Share Tech Mono,monospace')
      .attr('pointer-events','none').attr('paint-order','stroke')
      .attr('stroke','rgba(0,6,12,0.85)').attr('stroke-width',0.6*ik)
      .text(c.text);
  });
}

function _restoreOriginsOverlay(){
  try{ originsOverlayOn = localStorage.getItem('stmOriginsOverlay')==='1'; }catch(e){}
  if(typeof setToggleBtn==='function') setToggleBtn('origins-toggle', originsOverlayOn, 'origins-dot');
  if(originsOverlayOn && typeof renderOriginsOverlay==='function') renderOriginsOverlay();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', _restoreOriginsOverlay);
else _restoreOriginsOverlay();
