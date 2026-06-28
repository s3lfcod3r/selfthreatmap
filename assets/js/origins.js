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
