/* ============================================================
   SelfThreatMap — Profile (Voreinstellungen)
   Ein Profil bündelt mehrere Einstellungen (Bahn-Stil, Animation,
   Angriffe an/aus, Auto-Zoom, Spawn-Modus, Dichte, Theme) und wird
   per Dropdown oben gewählt — wie Theme & Sprache.

   Aufbau eines Profils:
     { id, g:'Gruppe', n:'Name', d:'kurze Beschreibung',
       s:{ style, theme, anim, lines, autozoom, spawn, map:{...} } }
   Nicht gesetzte Schalter fallen auf eine neutrale Basis zurück
   (anim:true, lines:true, autozoom:false, spawn:'per_attack', mittlere Dichte).
   Theme wird nur geändert, wenn das Profil eines vorgibt.
   ============================================================ */

const STM_DENS = {
  ruhig:  { maxActiveRockets:12,  maxSpawnBatch:6,  maxPendingRockets:36 },
  mittel: { maxActiveRockets:28,  maxSpawnBatch:14, maxPendingRockets:64 },
  viel:   { maxActiveRockets:70,  maxSpawnBatch:26, maxPendingRockets:180 },
  sturm:  { maxActiveRockets:120, maxSpawnBatch:40, maxPendingRockets:300 },
  ultra:  { maxActiveRockets:220, maxSpawnBatch:60, maxPendingRockets:520 },
};

const PROFILES = [
  // ── Grund-Modi ────────────────────────────────────────────
  {id:'standard', g:'Grund-Modi', n:'Standard', d:'Ausgewogen — Raketen, Animation an, jeder Angriff.',
    s:{style:'rakete', anim:true, lines:true, spawn:'per_attack', map:{...STM_DENS.mittel, rocketDurationMs:4500}}},
  {id:'console-alle', g:'Grund-Modi', n:'Alle Angriffe (Console)', d:'Gestrichelte Bögen für jeden Angriff — der klassische CrowdSec-Look.',
    s:{style:'arc', anim:true, lines:true, map:{maxConsoleArcs:300}}},
  {id:'punkte-statisch', g:'Grund-Modi', n:'Alle Angriffspunkte', d:'Keine Animation — zeigt alle Angriffe als statische Heatmap/Punkte.',
    s:{anim:false, lines:false}},
  {id:'ruhige-karte', g:'Grund-Modi', n:'Ruhige Karte', d:'Karte ohne Angriffe — nur Länder & Punkte, nichts fliegt.',
    s:{lines:false, anim:false}},
  {id:'max-action', g:'Grund-Modi', n:'Maximale Action', d:'So viele Raketen wie möglich, schnell und dicht.',
    s:{style:'rakete', anim:true, lines:true, spawn:'per_attack', map:{...STM_DENS.sturm, rocketDurationMs:3200}}},
  {id:'performance', g:'Grund-Modi', n:'Performance-schonend', d:'Wenig Last für schwache Geräte — kurzer Strich, wenige Raketen.',
    s:{style:'legacy', anim:true, lines:true, map:{...STM_DENS.ruhig, refreshMs:45000, rocketDurationMs:5000}}},
  {id:'verfolger', g:'Grund-Modi', n:'Auto-Verfolger', d:'Zoomt automatisch in die Region des nächsten Angriffs.',
    s:{style:'rakete', anim:true, lines:true, autozoom:true, map:STM_DENS.mittel}},
  {id:'stadtnamen', g:'Grund-Modi', n:'Stadtnamen immer', d:'Städtenamen ab Zoom 1,5 bis ganz nah (25×) sichtbar.',
    s:{style:'rakete', map:{...STM_DENS.mittel, cityZoomMin:1.5, cityZoomMax:25}}},
  {id:'kino', g:'Grund-Modi', n:'Kino-Modus', d:'Entspannt zuschauen — Auto-Zoom, ruhige Kometen, langsam.',
    s:{style:'komet', anim:true, lines:true, autozoom:true, map:{...STM_DENS.mittel, rocketDurationMs:7000}}},
  {id:'präsentation', g:'Grund-Modi', n:'Präsentation', d:'Große, gut sichtbare Raketen mit Flight-Labels — zum Zeigen.',
    s:{style:'rakete', theme:'cyan', anim:true, lines:true, map:{...STM_DENS.viel, showFlightLabels:true, maxFlightLabels:20, rocketLaneSpread:18}}},

  // ── Raketen & Kometen ─────────────────────────────────────
  {id:'rakete-pur', g:'Raketen & Kometen', n:'Raketen pur', d:'Klassische Raketen mit Nase & Flamme.',
    s:{style:'rakete', map:STM_DENS.viel}},
  {id:'doppelrakete', g:'Raketen & Kometen', n:'Doppel-Raketen', d:'Zwei Raketen pro Angriff im Formationsflug.',
    s:{style:'doppelrakete', map:STM_DENS.viel}},
  {id:'komet-regen', g:'Raketen & Kometen', n:'Kometen-Regen', d:'Dichter Strom glühender Kometen.',
    s:{style:'komet', map:STM_DENS.sturm}},
  {id:'komet-funken', g:'Raketen & Kometen', n:'Kometen + Funken', d:'Kometen mit sprühenden Funken am Kopf.',
    s:{style:'kometfunken', map:STM_DENS.viel}},
  {id:'meteor-schauer', g:'Raketen & Kometen', n:'Meteor-Schauer', d:'Lange leuchtende Meteor-Schweife.',
    s:{style:'meteor', map:STM_DENS.sturm}},
  {id:'schweif-fade', g:'Raketen & Kometen', n:'Verblassende Schweife', d:'Weich auslaufende Schweife.',
    s:{style:'schweiffade', map:STM_DENS.viel}},
  {id:'verlauf-trail', g:'Raketen & Kometen', n:'Verlauf-Schweife', d:'Schweife mit weichem Farbverlauf.',
    s:{style:'verlauf', map:STM_DENS.viel}},
  {id:'nebel', g:'Raketen & Kometen', n:'Nebel-Schweife', d:'Diffuse, neblige Schleppen.',
    s:{style:'nebel', map:STM_DENS.mittel}},
  {id:'funken', g:'Raketen & Kometen', n:'Funkenflug', d:'Sprühende Funken entlang der Bahn.',
    s:{style:'funken', map:STM_DENS.viel}},

  // ── Laser & Energie ───────────────────────────────────────
  {id:'laser-show', g:'Laser & Energie', n:'Laser-Show', d:'Heller Laser-Puls rast die Bahn entlang (Cyan).',
    s:{style:'laserpuls', theme:'cyan', map:STM_DENS.viel}},
  {id:'dauerlaser', g:'Laser & Energie', n:'Dauer-Laser', d:'Durchgehende, pulsierende Laserstrahlen.',
    s:{style:'laserkonstant', map:STM_DENS.viel}},
  {id:'neon', g:'Laser & Energie', n:'Neon-Röhren', d:'Dicke, glühende Neon-Linien (Synthwave).',
    s:{style:'neon', theme:'synth', map:STM_DENS.viel}},
  {id:'blitz', g:'Laser & Energie', n:'Blitzgewitter', d:'Gezackte Blitze, Alarm-Rot.',
    s:{style:'blitz', theme:'red', map:STM_DENS.sturm}},
  {id:'plasma', g:'Laser & Energie', n:'Plasma-Sturm', d:'Pulsierende Plasma-Kugeln.',
    s:{style:'plasma', map:STM_DENS.viel}},

  // ── Partikel & Punkte ─────────────────────────────────────
  {id:'strom', g:'Partikel & Punkte', n:'Partikel-Strom', d:'Fließende Teilchen entlang der Flugbahn (Ocean).',
    s:{style:'strom', theme:'ocean', map:STM_DENS.viel}},
  {id:'tracer', g:'Partikel & Punkte', n:'Tracer-Feuer', d:'Leuchtspur-Geschosse wie MG-Feuer (Alarm).',
    s:{style:'tracer', theme:'red', map:STM_DENS.sturm}},
  {id:'punktkette', g:'Partikel & Punkte', n:'Punkt-Ketten', d:'Perlenkette aus Punkten.',
    s:{style:'punktkette', map:STM_DENS.viel}},
  {id:'gluehwurm', g:'Partikel & Punkte', n:'Glühwürmchen', d:'Verstreute, flackernde Lichtpunkte.',
    s:{style:'gluehwurm', map:STM_DENS.viel}},
  {id:'sog', g:'Partikel & Punkte', n:'Sog / Implosion', d:'Partikel werden zum Ziel gesogen.',
    s:{style:'sog', map:STM_DENS.viel}},
  {id:'echo', g:'Partikel & Punkte', n:'Echo-Geister', d:'Geister-Köpfe ziehen hinterher.',
    s:{style:'echo', map:STM_DENS.viel}},
  {id:'helix', g:'Partikel & Punkte', n:'Doppelhelix', d:'Zwei umeinander tanzende Punkte.',
    s:{style:'helix', map:STM_DENS.mittel}},

  // ── Linien & Spezial ──────────────────────────────────────
  {id:'bogen', g:'Linien & Spezial', n:'Reine Bögen', d:'Nur elegante Linien, kein Geschoss.',
    s:{style:'bogen', map:STM_DENS.viel}},
  {id:'doppellinie', g:'Linien & Spezial', n:'Doppellinien', d:'Zwei parallele Schienen pro Angriff.',
    s:{style:'doppellinie', map:STM_DENS.viel}},
  {id:'morse', g:'Linien & Spezial', n:'Morse-Code', d:'Strich-Punkt-Muster entlang der Bahn.',
    s:{style:'morse', map:STM_DENS.viel}},
  {id:'sinus', g:'Linien & Spezial', n:'Sinus-Wellen', d:'Wellenförmige Flugbahnen.',
    s:{style:'sinus', map:STM_DENS.viel}},
  {id:'impuls', g:'Linien & Spezial', n:'Impuls-Wellen', d:'Expandierende Ringe wandern mit.',
    s:{style:'impuls', map:STM_DENS.viel}},
  {id:'einschlag', g:'Linien & Spezial', n:'Einschlag-Ringe', d:'Sichtbarer Einschlag-Ring am Ziel.',
    s:{style:'einschlag', map:STM_DENS.viel}},
  {id:'hologramm', g:'Linien & Spezial', n:'Hologramm-Modus', d:'Flackernde Holo-Linien (Cyberpunk).',
    s:{style:'hologramm', theme:'cyber', map:STM_DENS.viel}},
  {id:'pfeil', g:'Linien & Spezial', n:'Pfeil-Hagel', d:'Pfeilspitzen rasen zum Ziel.',
    s:{style:'pfeil', map:STM_DENS.viel}},
  {id:'paket', g:'Linien & Spezial', n:'Datenpakete', d:'Kleine Datenpaket-Quadrate gleiten entlang.',
    s:{style:'paket', map:STM_DENS.viel}},

  // ── Stimmungen (Theme + Stil) ─────────────────────────────
  {id:'matrix', g:'Stimmungen', n:'Matrix-Modus', d:'Grünes Phosphor-Theme, fließende Kometen.',
    s:{theme:'matrix', style:'komet', map:STM_DENS.viel}},
  {id:'alarm', g:'Stimmungen', n:'Alarm-Rot', d:'Rotes Theme, dichte Tracer — höchste Alarmstufe.',
    s:{theme:'red', style:'tracer', map:STM_DENS.sturm}},
  {id:'cyberpunk', g:'Stimmungen', n:'Cyberpunk', d:'Violettes Theme, Hologramm-Linien.',
    s:{theme:'cyber', style:'hologramm', map:STM_DENS.viel}},
  {id:'synthwave', g:'Stimmungen', n:'Synthwave', d:'Pink/Purple-Theme, Neon-Röhren.',
    s:{theme:'synth', style:'neon', map:STM_DENS.viel}},
  {id:'inferno', g:'Stimmungen', n:'Inferno', d:'Heißes Orange-Theme, Meteor-Schauer.',
    s:{theme:'inferno', style:'meteor', map:STM_DENS.sturm}},
  {id:'arctic', g:'Stimmungen', n:'Arctic', d:'Kühles Eisblau-Theme, Laser-Pulse.',
    s:{theme:'arctic', style:'laserpuls', map:STM_DENS.viel}},
  {id:'ocean', g:'Stimmungen', n:'Deep Ocean', d:'Teal/Navy-Theme, Partikel-Strom.',
    s:{theme:'ocean', style:'strom', map:STM_DENS.viel}},
  {id:'mono', g:'Stimmungen', n:'Mono-Taktisch', d:'Graustufen-Theme, reduzierte reine Bögen.',
    s:{theme:'mono', style:'bogen', map:STM_DENS.mittel}},
  {id:'bernstein', g:'Stimmungen', n:'Bernstein', d:'Amber-Theme, glühende Kometen.',
    s:{theme:'amber', style:'komet', map:STM_DENS.viel}},

  // ── Spezial-Modi ──────────────────────────────────────────
  {id:'brute-jagd', g:'Spezial-Modi', n:'Brute-Force-Jagd', d:'Eine Rakete pro IP — viele Angriffe derselben IP = ein Flug.',
    s:{style:'rakete', spawn:'per_ip', map:STM_DENS.viel}},
  {id:'szenario', g:'Spezial-Modi', n:'Szenario-Sicht', d:'Gleiche IP zur gleichen Zeit zusammengefasst.',
    s:{style:'komet', spawn:'per_ip_time', map:STM_DENS.viel}},
  {id:'heatmap', g:'Spezial-Modi', n:'Heatmap pur', d:'Nur Länder-Heatmap, keine Animation, keine Linien.',
    s:{anim:false, lines:false}},
  {id:'stresstest', g:'Spezial-Modi', n:'Stress-Test', d:'Alles auf Anschlag — maximale Dichte & Tempo.',
    s:{style:'rakete', map:{...STM_DENS.ultra, rocketDurationMs:2600, refreshMs:10000}}},
  {id:'klassik', g:'Spezial-Modi', n:'Klassik (Original)', d:'Minimaler kurzer Strich wie in der allerersten Version.',
    s:{style:'legacy', map:STM_DENS.mittel}},
];

let currentProfile = null;

function applyProfile(id){
  const p = PROFILES.find(x=>x.id===id);
  if(!p) return;
  const s = p.s || {};
  const BASE = { maxActiveRockets:28, maxSpawnBatch:14, maxPendingRockets:64,
    rocketDurationMs:4500, rocketStaggerMs:420, maxConsoleArcs:150,
    rocketTailClassic:0.13, rocketLaneSpread:12, refreshMs:30000 };
  if(typeof mapSettings!=='undefined'){
    Object.assign(mapSettings, BASE, s.map||{});
    mapSettings.rocketSpawnMode = s.spawn || 'per_attack';
    if(s.style){ mapSettings.rocketStyle = s.style; }
  }
  if(s.style && typeof rocketStyle!=='undefined'){ rocketStyle = s.style; }
  if(typeof persistMapSettings==='function') persistMapSettings();
  if(typeof persistRocketStylePrefs==='function') persistRocketStylePrefs();
  if(typeof syncSettingsToGlobals==='function') syncSettingsToGlobals();
  if(typeof syncRocketStyleUI==='function') syncRocketStyleUI();
  if(s.theme && typeof setTheme==='function') setTheme(s.theme);
  // Schalter exakt setzen (Toggle-Funktionen wiederverwenden)
  const wantAnim = s.anim!==undefined ? s.anim : true;
  const wantLines = s.lines!==undefined ? s.lines : true;
  const wantAuto = s.autozoom!==undefined ? s.autozoom : false;
  if(typeof animOn!=='undefined' && animOn!==wantAnim && typeof toggleAnim==='function') toggleAnim();
  if(typeof linesOn!=='undefined' && linesOn!==wantLines && typeof toggleLines==='function') toggleLines();
  if(typeof autoZoomOn!=='undefined' && autoZoomOn!==wantAuto && typeof toggleAutoZoom==='function') toggleAutoZoom();
  if(typeof fillSettingsForm==='function') fillSettingsForm();
  if(typeof syncMapToggleStates==='function') syncMapToggleStates();
  if(typeof restartFetchLoop==='function') restartFetchLoop();
  if(typeof dotG!=='undefined' && dotG){
    if(typeof drawServerDots==='function') drawServerDots();
    if(typeof renderDots==='function') renderDots();
    if(typeof drawCountryLabels==='function') drawCountryLabels();
    if(typeof updateCityLabelScale==='function') updateCityLabelScale();
  }
  if(typeof animOn!=='undefined' && animOn && linesOn && typeof drawCrowdSecRockets==='function') drawCrowdSecRockets(performance.now());
  currentProfile = id;
  try{ localStorage.setItem('stmProfile', id); }catch(e){}
  syncProfileDropdown();
  closeProfileDropdown();
}

function buildProfileDropdown(){
  const panel = document.getElementById('profile-dd-panel');
  if(!panel) return;
  let html='', lastG='';
  PROFILES.forEach(p=>{
    if(p.g!==lastG){ html += `<div class="profile-group">${p.g}</div>`; lastG=p.g; }
    html += `<div class="profile-item" data-id="${p.id}" onclick="applyProfile('${p.id}')"><div class="profile-name">${p.n}</div><div class="profile-desc">${p.d}</div></div>`;
  });
  panel.innerHTML = html;
}
function syncProfileDropdown(){
  const lbl = document.getElementById('profile-dd-name');
  const p = PROFILES.find(x=>x.id===currentProfile);
  if(lbl) lbl.textContent = p ? p.n : 'Profil wählen…';
  document.querySelectorAll('.profile-item').forEach(el=>el.classList.toggle('active', el.dataset.id===currentProfile));
}
function toggleProfileDropdown(e){
  if(e)e.stopPropagation();
  const p=document.getElementById('profile-dd-panel');
  if(p && !p.children.length) buildProfileDropdown();   // Lazy-Build: falls leer, jetzt bauen
  if(p)p.classList.toggle('open');
}
function closeProfileDropdown(){ const p=document.getElementById('profile-dd-panel'); if(p)p.classList.remove('open'); }
document.addEventListener('click', function(e){ const dd=document.getElementById('profile-dd'); if(dd && !dd.contains(e.target)) closeProfileDropdown(); });

/* Gespeicherte Profil-Auswahl beim Start wiederherstellen */
function restoreProfileSelection(){
  let saved=''; try{ saved=localStorage.getItem('stmProfile')||''; }catch(e){}
  if(saved && PROFILES.some(p=>p.id===saved)) currentProfile = saved;
}

/* Selbst-Init (unabhängig von app.js) — wie beim Raketen-Stil-Select */
function initProfiles(){ restoreProfileSelection(); buildProfileDropdown(); syncProfileDropdown(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initProfiles);
else { initProfiles(); }
