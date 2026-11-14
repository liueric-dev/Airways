(function(){
const D=window.HP_DATA, INTS=D.interventions, CR=D.crowding, HL=D.health, CB=D.cob;
const COL={benefit:'#57ef8a',mixed:'#ff9c36',harm:'#ff43bd',unknown:'#bcbcbc',health:'#36c9ff'};
const DASH={benefit:'',mixed:'9 4',harm:'2 5',unknown:'7 6',health:''};
const st={sel:0,layout:'rows',region:'all',edge:null};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const grade=n=>n>=20?'W3':n>=5?'W2':n>=1?'W1':'?';
const lw=n=>n?Math.min(14,1+n/8):1;
const uk=()=>st.region==='uk';
const H=(it,k)=>{const h=it.health[k];return uk()?{harm:h.harm_uk,direct:h.direct_uk,findings:h.findings.filter(f=>f.r==='UK')}:h;};
const tot=it=>uk()?Object.values(it.health).reduce((a,h)=>a+h.harm_uk,0):it.harm_total;
const dir=it=>uk()?it.direct_uk:it.direct;
function wrap(t,max){const w=String(t).split(' ');const L=[''];for(const x of w){const i=L.length-1;if((L[i]+' '+x).trim().length>max&&L[i])L.push(x);else L[i]=(L[i]+' '+x).trim();}return L.slice(0,3);}
function textBlock(x,y,lines,size,weight,fill){return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill||'#111'}">${lines.map((l,i)=>`<tspan x="${x}" dy="${i?size+3:0}">${esc(l)}</tspan>`).join('')}</text>`;}
function bar(x,y,w,frac,col,label){return `<rect x="${x}" y="${y}" width="${w}" height="7" fill="#eee" stroke="#111" stroke-width="1"/><rect x="${x}" y="${y}" width="${Math.max(0,Math.min(1,frac))*w}" height="7" fill="${col}"/><text x="${x+w+5}" y="${y+7}" font-size="10" fill="#444">${esc(label)}</text>`;}
function node(o){ // {x,y,w,h,title,sub,bars,bg,bd,bw,dash,idx,kind,max}
  let s=`<g class="nodeg" ${o.kind?`data-kind="${o.kind}" data-i="${o.idx}" tabindex="0" role="button" aria-label="${esc(o.title)}"`:''}><rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${o.bg||'#fff'}" stroke="${o.bd||'#d0d0d0'}" stroke-width="${o.bw||1}" ${o.dash?'stroke-dasharray="5 4"':''}/>`;
  if(o.top) s+=`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="6" fill="#000"/>`;
  const tl=wrap(o.title,o.max||22); s+=textBlock(o.x+9,o.y+18+(o.top?4:0),tl,12,800);
  let yy=o.y+18+(o.top?4:0)+tl.length*15;
  if(o.sub){const sl=wrap(o.sub,(o.max||22)+4);s+=textBlock(o.x+9,yy,sl,10,500,'#555');yy+=sl.length*13;}
  (o.bars||[]).forEach(b=>{s+=bar(o.x+9,yy,o.w*0.5,b[0],b[1],b[2]);yy+=13;});
  return s+'</g>';
}
function curve(x1,y1,x2,y2,col,op,w,dash,vert,id){const d=vert?`M${x1} ${y1} C${x1} ${(y1+y2)/2} ${x2} ${(y1+y2)/2} ${x2} ${y2}`:`M${x1} ${y1} C${(x1+x2)/2} ${y1} ${(x1+x2)/2} ${y2} ${x2} ${y2}`;
  return `<path d="${d}" fill="none" stroke="#111" stroke-opacity="${op}" stroke-width="${w+2}" ${dash?`stroke-dasharray="${dash}"`:''}/><path d="${d}" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:''}/>`+(id?`<path class="hit" d="${d}" data-edge="${id}" tabindex="0" role="button" aria-label="Inspect link ${esc(id)}"/>`:'');}
function badge(x,y,t,col){const w=12+String(t).length*7;return `<rect x="${x-w/2}" y="${y-10}" width="${w}" height="20" fill="${col}" stroke="#111"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" font-weight="800">${esc(t)}</text>`;}
function draw(){
  const rows=st.layout==='rows', all=INTS.concat([CR]), sel=INTS[st.sel];
  const maxH=Math.max(...all.map(tot),1), maxD=Math.max(...INTS.map(dir),1), maxHL=Math.max(...HL.map(h=>uk()?h.total_uk:h.total),1);
  let W,Hh,P={};
  if(rows){W=1300;Hh=800;const cw=200,iw=134,hw=172;const xs=(n,w)=>Array.from({length:n},(_,i)=>i*(w+(W-n*w)/(n-1)));
    P.cob=xs(6,cw).map(x=>({x,y:30,w:cw,h:84}));P.int=xs(9,iw).map(x=>({x,y:320,w:iw,h:150}));P.hl=xs(7,hw).map(x=>({x,y:680,w:hw,h:84}));}
  else{W=1252;Hh=900;const ys=(n,h,top,bot)=>Array.from({length:n},(_,i)=>top+i*((bot-top-h)/(n-1)));const bot=860;
    P.cob=ys(6,84,40,bot).map(y=>({x:16,y,w:230,h:84}));P.int=ys(9,84,40,bot).map(y=>({x:476,y,w:300,h:84}));P.hl=ys(7,84,40,bot).map(y=>({x:1006,y,w:230,h:84}));}
  const cP=(p,side)=>rows?(side==='top'?[p.x+p.w/2,p.y]:[p.x+p.w/2,p.y+p.h]):(side==='top'?[p.x,p.y+p.h/2]:[p.x+p.w,p.y+p.h/2]);
  let E='',B='',N='';
  // co-benefit links of the selected action (+ not assessed)
  const have=new Set(sel.cob.map(c=>c.g));
  CB.forEach((g,j)=>{if(!have.has(j)){const a=cP(P.int[st.sel],'top'),b=rows?[P.cob[j].x+P.cob[j].w/2,P.cob[j].y+P.cob[j].h]:[P.cob[j].x+P.cob[j].w,P.cob[j].y+P.cob[j].h/2];E+=curve(a[0],a[1],b[0],b[1],COL.unknown,.9,2,DASH.unknown,rows,`cob:${st.sel}:${j}:na`);}});
  INTS.forEach((it,i)=>it.cob.forEach((c,ci)=>{const s=i===st.sel;const a=cP(P.int[i],'top'),b=rows?[P.cob[c.g].x+P.cob[c.g].w/2,P.cob[c.g].y+P.cob[c.g].h]:[P.cob[c.g].x+P.cob[c.g].w,P.cob[c.g].y+P.cob[c.g].h/2];
    E+=curve(a[0],a[1],b[0],b[1],COL[c.type],s?1:.12,c.w==='W2'?4.5:2.5,DASH[c.type],rows,s?`cob:${i}:${c.g}:${ci}`:null);}));
  // health links
  all.forEach((it,i)=>HL.forEach((h,k)=>{const v=H(it,h.key).harm;if(!v)return;const s=i===st.sel;const a=cP(P.int[i],'bottom'),p=P.hl[k],b=rows?[p.x+p.w/2,p.y]:[p.x,p.y+p.h/2];
    E+=curve(a[0],a[1],b[0],b[1],i===8?COL.harm:COL.health,s?1:.1,lw(v),'',rows,s?`hl:${i}:${k}`:null);
    if(s)B+=badge(a[0]+(b[0]-a[0])*.58,a[1]+(b[1]-a[1])*.58,v,COL.health);}));
  // crowding worsens
  CR.worsens.forEach(key=>{const t=INTS.findIndex(x=>x.key===key);const a=P.int[8],b=P.int[t];
    E+=rows?`<path d="M${a.x+a.w/2} ${a.y} C${a.x+a.w/2} ${a.y-70} ${b.x+b.w/2} ${b.y-70} ${b.x+b.w/2} ${b.y}" fill="none" stroke="#ff43bd" stroke-width="2.5" stroke-dasharray="2 5"/>`:`<path d="M${a.x} ${a.y+a.h/2} C${a.x-46} ${a.y+a.h/2} ${b.x-46} ${b.y+b.h/2+16} ${b.x} ${b.y+b.h/2+16}" fill="none" stroke="#ff43bd" stroke-width="2.5" stroke-dasharray="2 5"/>`;});
  // nodes
  CB.forEach((g,j)=>{const p=P.cob[j];N+=node({...p,title:g.name,sub:g.n?'':'No evidence for any action',bars:[[g.n/8,j===4?'#bcbcbc':'#57ef8a',`${g.n} of 8 actions`]],bg:'#dcfce7',bd:have.has(j)?'#111':'#d0d0d0',bw:have.has(j)?2:1,max:rows?24:30,kind:'cob',idx:j});});
  all.forEach((it,i)=>{const p=P.int[i],s=i===st.sel,cr=i===8;N+=node({...p,title:it.name,sub:cr?'exposure only · makes damp & stale air worse':`reduces ${it.exposure}`,
    bars:cr?[[tot(it)/maxH,'#ff43bd',`${tot(it)} studies`]]:[[tot(it)/maxH,'#36c9ff',`${tot(it)} via exp.`],[dir(it)/maxD,'#111',`${dir(it)} direct`]],
    bg:cr?'#ffe0f4':(s?'#fbff54':'#fff'),bd:cr?'#ff43bd':(s?'#111':'#d0d0d0'),bw:s?3:(cr?2:1),dash:cr,top:!cr,max:rows?16:34,kind:cr?null:'int',idx:i});});
  HL.forEach((h,k)=>{const p=P.hl[k],v=H(sel,h.key).harm,t=uk()?h.total_uk:h.total;N+=node({...p,title:h.name,bars:[[v/maxHL,'#36c9ff',`${v} this action · ${t} all`]],bg:'#d9f4ff',bd:v?'#111':'#d0d0d0',bw:v?2:1,max:rows?20:30});});
  const hd=rows?[[0,18,'WIDER OUTCOMES'],[0,306,'ACTIONS · and the exposure each reduces'],[0,666,'HEALTH']]:[[16,26,'WIDER OUTCOMES'],[476,26,'ACTIONS'],[1006,26,'HEALTH']];
  const svg=document.getElementById('gsvg');svg.setAttribute('viewBox',`-4 -4 ${W+8} ${Hh+8}`);
  svg.innerHTML=E+B+N+hd.map(h=>`<text x="${h[0]}" y="${h[1]}" font-size="11" font-weight="800" letter-spacing="1" fill="#111">${h[2]}</text>`).join('');
  document.querySelectorAll('#gpick button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===st.sel)));
  inspect(st.edge||`hl:${st.sel}:${bestHealth(sel)}`);
  const it=sel, unk=(it.regions['Unknown']||0);
  document.getElementById('gfoot').textContent=`${D.meta.studies} curated studies · ${D.meta.uk_pct}% UK · ${D.meta.unknown_country_pct}% country not recorded (counted in “All regions”, excluded from “UK only”) · ${it.name}: ${unk} of ${it.exp_studies} exposure studies have no country. ${D.meta.source}`;
}
function bestHealth(it){let b=0,m=-1;HL.forEach((h,k)=>{const v=H(it,h.key).harm;if(v>m){m=v;b=k;}});return b;}
function inspect(id){
  const el=document.getElementById('ginspect'),p=id.split(':');let html='';
  if(p[0]==='hl'){const it=p[1]==='8'?CR:INTS[+p[1]],h=HL[+p[2]],v=H(it,h.key);
    html=`<h4>${esc(it.name)} → ${esc(h.name)}</h4>
    <div class="metric"><b>Evidence volume</b>${v.harm} studies link ${esc(it.exposure)} to ${esc(h.name.toLowerCase())} · ${grade(v.harm)}${uk()?' · UK only':''}</div>
    ${p[1]==='8'?'':`<div class="metric"><b>Tests of the action itself</b>${v.direct} studies${v.direct?'':' — <span style="color:#b3006b;font-weight:700">gap: never tested directly</span>'}</div>`}
    <div class="metric"><b>What this means</b>An expected benefit via the exposure, not a measured effect of the action. Findings are associations, not causal estimates.</div>
    <div class="metric"><b>Findings in the graph</b>${v.findings.length?'':'None in this view.'}</div><ul>${v.findings.slice(0,12).map(f=>`<li><span class="tagk ${f.k==='exposure'?'e':''}">${f.k==='exposure'?'EXPOSURE':'ACTION TEST'}</span>${esc(f.a)} → ${esc(f.b)}<div><span class="st">${esc(f.st||'')} ${f.v!=null?esc(f.v):''}${f.lo!=null?` (${esc(f.lo)}–${esc(f.hi)})`:''}</span></div><div class="meta">${esc(f.c)}${f.r==='UK'?' · UK':''}${f.doi?` · <a href="https://doi.org/${esc(f.doi)}" target="_blank" rel="noopener">doi</a>`:''}</div></li>`).join('')}</ul>`;}
  else if(p[0]==='cob'){const it=INTS[+p[1]],g=CB[+p[2]];
    if(p[3]==='na') html=`<h4>${esc(it.name)} → ${esc(g.name)}</h4><div class="metric"><b>Status</b>? Not assessed — no evidence found for this action. A data gap worth funding.</div>`;
    else{const c=it.cob[+p[3]];html=`<h4>${esc(it.name)} → ${esc(g.name)}</h4><div class="metric"><b>Direction</b>${{benefit:'Possible benefit',mixed:'Mixed / conditional',harm:'Potential harm / trade-off'}[c.type]} · ${c.w}</div><div class="metric"><b>Evidence</b>${esc(c.text)}</div><div class="metric"><b>Source</b>${esc(c.src||'not quantified')} · cited report, outside the System graph</div>`;}}
  if(INTS[st.sel].notes&&INTS[st.sel].notes.length&&p[0]==='hl'&&p[1]!=='8') html+=`<div class="metric"><b>Reviews &amp; trials outside the graph</b>${INTS[st.sel].notes.map(esc).join('<br>')}</div>`;
  el.innerHTML=html;
}
function pick(i){st.sel=i;st.edge=null;draw();}
window.HP_selectAction=function(i){pick(i);document.getElementById('graph').scrollIntoView({behavior:'smooth',block:'start'});};
document.getElementById('gpick').innerHTML=INTS.map((it,i)=>`<button type="button" data-pick="${i}" aria-pressed="false">${esc(it.name)}</button>`).join('');
document.getElementById('gpick').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(b)pick(+b.dataset.pick);});
document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>{st.layout=b.dataset.layout;document.querySelectorAll('[data-layout]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();}));
document.querySelectorAll('[data-region]').forEach(b=>b.addEventListener('click',()=>{st.region=b.dataset.region;document.querySelectorAll('[data-region]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();}));
const svg=document.getElementById('gsvg');
const act=t=>{const e=t.closest('[data-edge]');if(e){st.edge=e.dataset.edge;inspect(st.edge);return;}const n=t.closest('[data-kind="int"]');if(n)pick(+n.dataset.i);};
svg.addEventListener('click',e=>act(e.target));svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act(e.target);}});
draw();
})();
