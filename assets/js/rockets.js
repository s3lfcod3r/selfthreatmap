function syncRocketStyleUI(){
  const rs=document.getElementById('set-rocket-style');
  if(rs)rs.value=rocketStyle;
}

function toggleRocketStyle(){
  const order=(typeof ROCKET_STYLE_IDS!=='undefined'&&ROCKET_STYLE_IDS.length)?ROCKET_STYLE_IDS:['classic','arc','legacy'];
  const i=order.indexOf(rocketStyle);
  rocketStyle=order[(i<0?0:i+1)%order.length];
  persistRocketStylePrefs();
  syncRocketStyleUI();
  if(animOn&&linesOn){
    drawCrowdSecRockets(performance.now());
    updateFlightLabels(activeRockets);
  }
}
