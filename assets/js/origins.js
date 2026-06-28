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

function renderOriginsOverlay(){
  if(typeof dotG==='undefined' || !dotG) return;
  dotG.selectAll('.origin-dot,.origin-label').remove();
  if(!originsOverlayOn) return;
  const events = (typeof allEvents!=='undefined' && allEvents.length) ? allEvents
               : (typeof feedData!=='undefined' ? feedData : []);
  const byC = {};
  events.forEach(e=>{
    if(e.lat==null || e.lon==null) return;
    const cc = String(e.country||'??').toUpperCase().slice(0,2);
    let c = byC[cc]; if(!c){ c = byC[cc] = {cc, n:0, locN:{}, best:null, bestN:-1}; }
    c.n++;
    const lk = e.lat.toFixed(2)+','+e.lon.toFixed(2);
    const v = (c.locN[lk] = (c.locN[lk]||0) + 1);
    if(v > c.bestN){ c.bestN = v; c.best = [e.lon, e.lat]; }
  });
  const list = Object.values(byC).filter(c=>c.best);
  if(!list.length) return;
  const maxN = Math.max.apply(null, list.map(c=>c.n).concat([1]));
  const ik = 1 / Math.max((typeof currentScale!=='undefined' ? currentScale : 1), 0.15);
  const font = (typeof labelPxToSvg==='function') ? labelPxToSvg(11) : (11*ik)+'px';
  const cname = cc => (typeof COUNTRY_NAME!=='undefined' && COUNTRY_NAME[cc]) || cc;
  list.sort((a,b)=>a.n-b.n);   // kleine zuerst zeichnen, große oben drauf
  list.forEach(c=>{
    const p = proj(c.best); if(!p) return;
    const r = 3 + Math.round((c.n/maxN) * 6);
    dotG.append('circle').attr('class','origin-dot')
      .attr('cx',p[0]).attr('cy',p[1]).attr('r',r*ik).attr('data-sr',r)
      .attr('fill','var(--accent)').attr('fill-opacity',0.9)
      .attr('stroke','#fff').attr('stroke-opacity',0.55).attr('stroke-width',ik)
      .append('title').text(cname(c.cc)+': '+c.n);
    dotG.append('text').attr('class','origin-label')
      .attr('x',p[0]+(r+2)*ik).attr('y',p[1]+3*ik)
      .attr('font-size',font)
      .attr('fill','var(--text)').attr('font-family','Share Tech Mono,monospace')
      .attr('pointer-events','none').attr('paint-order','stroke')
      .attr('stroke','rgba(0,6,12,0.78)').attr('stroke-width',0.5*ik)
      .text(cname(c.cc)+' ('+c.n+')');
  });
}

function _restoreOriginsOverlay(){
  try{ originsOverlayOn = localStorage.getItem('stmOriginsOverlay')==='1'; }catch(e){}
  if(typeof setToggleBtn==='function') setToggleBtn('origins-toggle', originsOverlayOn, 'origins-dot');
  if(originsOverlayOn && typeof renderOriginsOverlay==='function') renderOriginsOverlay();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', _restoreOriginsOverlay);
else _restoreOriginsOverlay();
