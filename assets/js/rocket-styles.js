/* ============================================================
   SelfThreatMap — Bahn-Stile ("Raketen")
   30 umschaltbare Flugbahn-Stile für Angriffe (Quelle → Home).
   Jeder Drawer zeichnet auf das bereits transformierte 2D-Canvas
   (Aufrufer hat translate+scale gesetzt). ik = 1/scale (Screen-px).
   Pfad pro Rakete: quadratische Bézier über quadPoint(r,u).
   ============================================================ */

/* ---- Pfad-/Zeichen-Helfer ---------------------------------- */
function rsQp(r,u){return quadPoint(r,u<0?0:u>1?1:u);}
function rsAng(r,u){
  u=u<0?0:u>1?1:u;
  const dx=2*(1-u)*(r.cpx-r.sx)+2*u*(r.ex-r.cpx);
  const dy=2*(1-u)*(r.cpy-r.sy)+2*u*(r.ey-r.cpy);
  return Math.atan2(dy,dx);
}
function rsSeg(ctx,r,a,b,steps,col,w,alpha,dash){
  ctx.beginPath();
  ctx.strokeStyle=col;ctx.lineWidth=w;ctx.globalAlpha=alpha;
  ctx.lineCap='round';ctx.lineJoin='round';
  if(dash)ctx.setLineDash(dash);else ctx.setLineDash([]);
  for(let k=0;k<=steps;k++){const p=rsQp(r,a+(b-a)*k/steps);if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}
  ctx.stroke();ctx.setLineDash([]);
}
function rsDot(ctx,x,y,rad,col,alpha){ctx.beginPath();ctx.fillStyle=col;ctx.globalAlpha=alpha;ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();}
function rsRing(ctx,x,y,rad,col,w,alpha){ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.globalAlpha=alpha;ctx.arc(x,y,rad,0,Math.PI*2);ctx.stroke();}
function rsHead(ctx,p,col,ik,lite,rad){ctx.beginPath();ctx.fillStyle='#fffefb';ctx.globalAlpha=1;if(!lite){ctx.shadowColor=hexToRgba(col,0.9);ctx.shadowBlur=5*ik;}ctx.arc(p.x,p.y,(rad||2.3)*ik,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}

/* ---- Die 30 Drawer ----------------------------------------- */
const ROCKET_DRAWERS = {
  // 1 — Rakete (Standard): Düse + Spitze + kurzer Schweif
  rakete(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.12,t,5,col,2.4*ik,0.85);
    const p=rsQp(r,t),a=rsAng(r,t);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.globalAlpha=1;
    ctx.beginPath();ctx.fillStyle=hexToRgba(col,0.9);
    ctx.moveTo(-3*ik,-3.2*ik);ctx.lineTo(-9*ik,0);ctx.lineTo(-3*ik,3.2*ik);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.fillStyle='#fffefb';
    ctx.moveTo(8*ik,0);ctx.lineTo(-3*ik,-3.2*ik);ctx.lineTo(-1*ik,0);ctx.lineTo(-3*ik,3.2*ik);ctx.closePath();ctx.fill();
    ctx.restore();
  },
  // 2 — Komet: Verlauf-Schweif + Glüh-Kopf
  komet(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.22,t,8,col,2.3*ik,0.92);
    const p=rsQp(r,t);
    rsDot(ctx,p.x,p.y,6*ik,col,0.28);rsHead(ctx,p,col,ik,lite,2.3);
  },
  // 3 — Laser-Puls
  laserpuls(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,0,1,18,col,1*ik,0.14);
    rsSeg(ctx,r,t-0.18,t,6,col,2.8*ik,0.95);
    rsHead(ctx,rsQp(r,t),col,ik,lite,2.4);
  },
  // 4 — Partikel-Strom
  strom(ctx,r,t,col,ik,lite){
    const off=-(performance.now()/40)%200;
    ctx.lineDashOffset=off;
    rsSeg(ctx,r,0,1,22,col,2*ik,0.85,[1.6*ik,8*ik]);
    ctx.lineDashOffset=0;
  },
  // 5 — Reiner Bogen
  bogen(ctx,r,t,col,ik,lite){ rsSeg(ctx,r,0,t,16,col,2*ik,0.9); },
  // 6 — Meteor
  meteor(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.45,t,10,col,1.2*ik,0.4);
    rsSeg(ctx,r,t-0.18,t,6,col,3*ik,0.9);
    rsHead(ctx,rsQp(r,t),col,ik,lite,2.4);
  },
  // 7 — Doppel-Rakete
  doppelrakete(ctx,r,t,col,ik,lite){
    [t,t-0.14].forEach(tt=>{if(tt<0)return;const p=rsQp(r,tt),a=rsAng(r,tt);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.globalAlpha=1;
      ctx.beginPath();ctx.fillStyle=hexToRgba(col,0.9);ctx.moveTo(-2*ik,-2.6*ik);ctx.lineTo(-6*ik,0);ctx.lineTo(-2*ik,2.6*ik);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.fillStyle='#fffefb';ctx.moveTo(6*ik,0);ctx.lineTo(-2*ik,-2.6*ik);ctx.lineTo(-2*ik,2.6*ik);ctx.closePath();ctx.fill();
      ctx.restore();});
  },
  // 8 — Plasma-Kugel
  plasma(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.15,t,5,col,1.5*ik,0.4);
    const p=rsQp(r,t),rad=(4+Math.sin(performance.now()/160)*1.4)*ik;
    rsDot(ctx,p.x,p.y,rad+4*ik,col,0.22);rsDot(ctx,p.x,p.y,rad,col,1);rsDot(ctx,p.x,p.y,1.6*ik,'#fff',1);
  },
  // 9 — Tracer-MG
  tracer(ctx,r,t,col,ik,lite){
    for(let i=0;i<4;i++){const tt=t-i*0.07;if(tt<0)continue;const p=rsQp(r,tt);rsDot(ctx,p.x,p.y,(2.2-i*0.4)*ik,col,1-i*0.22);}
  },
  // 10 — Neon-Tube
  neon(ctx,r,t,col,ik,lite){ rsSeg(ctx,r,0,t,16,col,5*ik,0.18); rsSeg(ctx,r,0,t,16,col,2*ik,0.9); },
  // 11 — Funken-Schweif
  funken(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.18,t,5,col,2*ik,0.85);
    const p=rsQp(r,t);
    for(let i=0;i<5;i++)rsDot(ctx,p.x+(Math.random()-0.5)*9*ik,p.y+(Math.random()-0.5)*9*ik,0.9*ik,'#fff',0.3+Math.random()*0.5);
    rsHead(ctx,p,col,ik,lite,2.1);
  },
  // 12 — Impuls-Welle
  impuls(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,0,t,16,col,1*ik,0.25);
    const p=rsQp(r,t),ph=(performance.now()/120)%8;
    rsRing(ctx,p.x,p.y,(2+ph)*ik,col,1.5*ik,1-ph/8);rsDot(ctx,p.x,p.y,2*ik,col,1);
  },
  // 13 — Doppelhelix
  helix(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.15,t,5,col,1.2*ik,0.4);
    const p=rsQp(r,t),a=rsAng(r,t)+Math.PI/2;
    for(let k=0;k<2;k++){const off=Math.sin(performance.now()/120+k*Math.PI)*4*ik;rsDot(ctx,p.x+Math.cos(a)*off,p.y+Math.sin(a)*off,2*ik,k?'#fff':col,1);}
  },
  // 14 — Blitz
  blitz(ctx,r,t,col,ik,lite){
    ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=1.6*ik;ctx.globalAlpha=0.9;ctx.lineJoin='round';
    const steps=14;for(let k=0;k<=steps;k++){const p=rsQp(r,t*(k/steps));const j=(Math.random()-0.5)*5*ik;if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x+j,p.y+j*0.6);}
    ctx.stroke();
  },
  // 15 — Pfeil
  pfeil(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.25,t,6,col,1.6*ik,0.7);
    const p=rsQp(r,t),a=rsAng(r,t);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.globalAlpha=1;ctx.fillStyle=col;
    ctx.beginPath();ctx.moveTo(7*ik,0);ctx.lineTo(-4*ik,-4*ik);ctx.lineTo(-1*ik,0);ctx.lineTo(-4*ik,4*ik);ctx.closePath();ctx.fill();ctx.restore();
  },
  // 16 — Datenpaket
  paket(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,0,t,14,col,1*ik,0.4,[2*ik,3*ik]);
    const p=rsQp(r,t),a=rsAng(r,t);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.globalAlpha=1;
    ctx.fillStyle=col;ctx.strokeStyle='#fff';ctx.lineWidth=0.7*ik;
    ctx.beginPath();ctx.rect(-3.5*ik,-3.5*ik,7*ik,7*ik);ctx.fill();ctx.stroke();ctx.restore();
  },
  // 17 — Glühwürmchen
  gluehwurm(ctx,r,t,col,ik,lite){
    const p=rsQp(r,t);
    for(let i=0;i<3;i++)rsDot(ctx,p.x+(Math.random()-0.5)*10*ik,p.y+(Math.random()-0.5)*10*ik,1.6*ik,col,0.4+Math.random()*0.6);
  },
  // 18 — Morse-Strich
  morse(ctx,r,t,col,ik,lite){ rsSeg(ctx,r,0,t,16,col,2.2*ik,0.9,[6*ik,3*ik,1.5*ik,3*ik]); },
  // 19 — Verlauf-Trail
  verlauf(ctx,r,t,col,ik,lite){
    for(let i=0;i<6;i++){const a=t-i*0.04,b=t-(i-1)*0.04;if(a<0)continue;rsSeg(ctx,r,a,b,2,col,(3-i*0.4)*ik,0.95-i*0.15);}
  },
  // 20 — Schweif-Fade
  schweiffade(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.35,t,10,col,2.4*ik,0.2);
    rsSeg(ctx,r,t-0.12,t,4,col,2.4*ik,0.95);
    rsHead(ctx,rsQp(r,t),col,ik,lite,2);
  },
  // 21 — Doppellinie
  doppellinie(ctx,r,t,col,ik,lite){
    const a=rsAng(r,t)+Math.PI/2,ox=Math.cos(a)*2*ik,oy=Math.sin(a)*2*ik;
    ctx.save();ctx.translate(ox,oy);rsSeg(ctx,r,0,t,16,col,1.4*ik,0.85);ctx.restore();
    ctx.save();ctx.translate(-ox,-oy);rsSeg(ctx,r,0,t,16,col,1.4*ik,0.85);ctx.restore();
  },
  // 22 — Punkt-Kette
  punktkette(ctx,r,t,col,ik,lite){
    for(let k=0;k<=14;k++){const u=t*(k/14);const p=rsQp(r,u);rsDot(ctx,p.x,p.y,1.5*ik,col,0.4+0.6*k/14);}
  },
  // 23 — Komet + Funken
  kometfunken(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.2,t,7,col,2.2*ik,0.9);
    const p=rsQp(r,t);rsDot(ctx,p.x,p.y,5*ik,col,0.25);rsHead(ctx,p,col,ik,lite,2.2);
    for(let i=0;i<3;i++)rsDot(ctx,p.x-(6+Math.random()*6)*ik,p.y+(Math.random()-0.5)*8*ik,0.9*ik,col,0.7);
  },
  // 24 — Sog / Implosion
  sog(ctx,r,t,col,ik,lite){
    for(let i=0;i<5;i++){let tt=t+i*0.05;if(tt>1)tt-=1;const p=rsQp(r,tt);rsDot(ctx,p.x,p.y,(1+(1-tt)*2)*ik,col,0.3+tt*0.6);}
  },
  // 25 — Laser konstant
  laserkonstant(ctx,r,t,col,ik,lite){
    const o=0.55+0.4*Math.abs(Math.sin(performance.now()/300));
    rsSeg(ctx,r,0,1,18,col,2.2*ik,o);rsSeg(ctx,r,0,1,18,'#fff',0.7*ik,o*0.5);
  },
  // 26 — Einschlag-Ring
  einschlag(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.18,t,5,col,2.4*ik,0.9);
    rsHead(ctx,rsQp(r,t),col,ik,lite,2.2);
    if(t>0.82){const rr=(t-0.82)/0.18;rsRing(ctx,r.ex,r.ey,(2+rr*12)*ik,col,1.5*ik,1-rr);}
  },
  // 27 — Nebel-Trail
  nebel(ctx,r,t,col,ik,lite){
    rsSeg(ctx,r,t-0.4,t,10,col,7*ik,0.12);
    rsSeg(ctx,r,t-0.4,t,10,col,3*ik,0.3);
    rsSeg(ctx,r,t-0.1,t,4,'#fff',1.4*ik,0.9);
  },
  // 28 — Sinus-Welle
  sinus(ctx,r,t,col,ik,lite){
    ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=1.8*ik;ctx.globalAlpha=0.9;ctx.lineCap='round';
    const steps=18,now=performance.now()/120;
    for(let k=0;k<=steps;k++){const u=t*(k/steps);const p=rsQp(r,u),a=rsAng(r,u)+Math.PI/2;const w=Math.sin(k*0.9-now)*3*ik;const x=p.x+Math.cos(a)*w,y=p.y+Math.sin(a)*w;if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
    ctx.stroke();
  },
  // 29 — Echo-Geister
  echo(ctx,r,t,col,ik,lite){
    [[t-0.3,0.2],[t-0.15,0.45],[t,0.95]].forEach(([tt,al])=>{if(tt<0)return;const p=rsQp(r,tt);rsDot(ctx,p.x,p.y,2.4*ik,col,al);});
    const p=rsQp(r,t);rsDot(ctx,p.x,p.y,1.2*ik,'#fff',1);
  },
  // 30 — Hologramm
  hologramm(ctx,r,t,col,ik,lite){
    const fl=(Math.floor(performance.now()/90)%6<4)?0.9:0.35;
    rsSeg(ctx,r,0,t,16,col,1.8*ik,fl,[3*ik,2*ik]);
    rsDot(ctx,rsQp(r,t).x,rsQp(r,t).y,2.2*ik,col,fl);
  },
};

/* ---- Katalog (für Dropdown + Validierung) ------------------ */
const ROCKET_STYLE_CATALOG = [
  {group:{de:'Raketen',en:'Rockets'}, items:[
    ['rakete',{de:'Rakete (Standard)',en:'Rocket (default)'}],
    ['doppelrakete',{de:'Doppel-Rakete',en:'Twin rocket'}],
    ['pfeil',{de:'Pfeil',en:'Arrow'}],
    ['paket',{de:'Datenpaket',en:'Data packet'}],
  ]},
  {group:{de:'Kometen & Schweife',en:'Comets & trails'}, items:[
    ['komet',{de:'Komet',en:'Comet'}],
    ['kometfunken',{de:'Komet + Funken',en:'Comet + sparks'}],
    ['meteor',{de:'Meteor',en:'Meteor'}],
    ['schweiffade',{de:'Schweif-Fade',en:'Fading trail'}],
    ['verlauf',{de:'Verlauf-Trail',en:'Gradient trail'}],
    ['nebel',{de:'Nebel-Trail',en:'Mist trail'}],
    ['funken',{de:'Funken-Schweif',en:'Spark trail'}],
  ]},
  {group:{de:'Strahlen & Laser',en:'Beams & lasers'}, items:[
    ['laserpuls',{de:'Laser-Puls',en:'Laser pulse'}],
    ['laserkonstant',{de:'Laser konstant',en:'Constant beam'}],
    ['neon',{de:'Neon-Tube',en:'Neon tube'}],
    ['blitz',{de:'Blitz',en:'Lightning'}],
    ['plasma',{de:'Plasma-Kugel',en:'Plasma orb'}],
  ]},
  {group:{de:'Partikel & Punkte',en:'Particles & dots'}, items:[
    ['strom',{de:'Partikel-Strom',en:'Particle stream'}],
    ['tracer',{de:'Tracer (MG)',en:'Tracer (MG)'}],
    ['punktkette',{de:'Punkt-Kette',en:'Bead chain'}],
    ['gluehwurm',{de:'Glühwürmchen',en:'Fireflies'}],
    ['sog',{de:'Sog / Implosion',en:'Inward pull'}],
    ['echo',{de:'Echo-Geister',en:'Echo ghosts'}],
    ['helix',{de:'Doppelhelix',en:'Double helix'}],
  ]},
  {group:{de:'Linien & Spezial',en:'Lines & special'}, items:[
    ['bogen',{de:'Reiner Bogen',en:'Clean arc'}],
    ['doppellinie',{de:'Doppellinie',en:'Twin line'}],
    ['morse',{de:'Morse-Strich',en:'Morse dash'}],
    ['sinus',{de:'Sinus-Welle',en:'Sine wave'}],
    ['impuls',{de:'Impuls-Welle',en:'Pulse ring'}],
    ['einschlag',{de:'Einschlag-Ring',en:'Impact ring'}],
    ['hologramm',{de:'Hologramm',en:'Hologram'}],
  ]},
  {group:{de:'Klassisch (alt)',en:'Classic (legacy)'}, items:[
    ['classic',{de:'Klassisch (Schweif+Verlauf)',en:'Classic (tail+gradient)'}],
    ['arc',{de:'Console (gestrichelte Bögen)',en:'Console (dashed arcs)'}],
    ['legacy',{de:'Minimal (kurzer Strich)',en:'Minimal (short stroke)'}],
  ]},
];

// Flache Liste aller gültigen IDs (für Persistenz-Validierung)
const ROCKET_STYLE_IDS = ROCKET_STYLE_CATALOG.reduce((a,g)=>a.concat(g.items.map(i=>i[0])),[]);

function populateRocketStyleSelect(){
  const sel=document.getElementById('set-rocket-style');
  if(!sel)return;
  const lang=(typeof currentLang!=='undefined'&&currentLang==='en')?'en':'de';
  const cur=sel.value||(typeof rocketStyle!=='undefined'?rocketStyle:'rakete');
  sel.innerHTML='';
  ROCKET_STYLE_CATALOG.forEach(g=>{
    const og=document.createElement('optgroup');
    og.label=g.group[lang];
    g.items.forEach(([id,nm])=>{
      const o=document.createElement('option');o.value=id;o.textContent=nm[lang];
      if(id===cur)o.selected=true;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',populateRocketStyleSelect);
else populateRocketStyleSelect();
