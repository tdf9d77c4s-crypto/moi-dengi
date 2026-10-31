/* Living 3D mascot — genuine, rotatable WebGL models; all geometry is generated locally.
   No image layers, WebGL libraries, trackers or external data requests. */
(()=>{'use strict';
const API={};window.MoneyMascot=API;
let canvas,viewer,gl,program,vbuf,nbuf,ibuf,loc={},draws=[],pet='capybara',mood='calm',motion=true;
let yaw=.20,pitch=.02,goalYaw=.20,goalPitch=.02,lastInteraction=0,drag=null,lastFrame=0,hasContext=false,frameId=0;
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const matI=()=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
function mul(a,b){const o=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)o[col*4+row]=a[0*4+row]*b[col*4+0]+a[1*4+row]*b[col*4+1]+a[2*4+row]*b[col*4+2]+a[3*4+row]*b[col*4+3];return o}
function tr(x,y,z){const m=matI();m[12]=x;m[13]=y;m[14]=z;return m}
function sc(x,y,z){const m=matI();m[0]=x;m[5]=y;m[10]=z;return m}
function rx(a){let m=matI(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m}
function ry(a){let m=matI(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m}
function rz(a){let m=matI(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m}
function proj(fov,asp,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far),m=new Float32Array(16);m[0]=f/asp;m[5]=f;m[10]=(far+near)*nf;m[11]=-1;m[14]=2*far*near*nf;return m}
function look(eye,target){let z=[eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]];const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n)};z=norm(z);let x=norm([z[2],0,-z[0]]),y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];const m=matI();m[0]=x[0];m[1]=y[0];m[2]=z[0];m[4]=x[1];m[5]=y[1];m[6]=z[1];m[8]=x[2];m[9]=y[2];m[10]=z[2];m[12]=-x.reduce((a,v,i)=>a+v*eye[i],0);m[13]=-y.reduce((a,v,i)=>a+v*eye[i],0);m[14]=-z.reduce((a,v,i)=>a+v*eye[i],0);return m}
const vs=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uM;uniform mat4 uVP;varying vec3 vN;varying vec3 vWorld;varying vec3 vLocal;void main(){vec4 world=uM*vec4(aPosition,1.);vWorld=world.xyz;vLocal=aPosition;vN=normalize(mat3(uM)*aNormal);gl_Position=uVP*world;}`;
const fs=`precision highp float;varying vec3 vN;varying vec3 vWorld;varying vec3 vLocal;uniform vec3 uColor;uniform float uFur;uniform float uMetal;uniform float uTime;
float rnd(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}void main(){vec3 n=normalize(vN);vec3 light=normalize(vec3(-0.52,0.84,0.78));vec3 fill=normalize(vec3(.81,.15,-.45));float diff=max(0.,dot(n,light));float ambient=.46+max(0.,dot(n,fill))*.22;float shade=ambient+diff*.61;float grain=(rnd(floor(vLocal*180.))*2.-1.)*.07*uFur;float hair=sin((vLocal.x*73.+vLocal.y*31.+vLocal.z*53.))*sin(vLocal.y*107.+vLocal.z*39.)*.028*uFur;vec3 col=uColor*(shade+grain+hair);vec3 V=normalize(vec3(0.0,.24,4.7)-vWorld);vec3 H=normalize(light+V);float spec=pow(max(0.,dot(n,H)),mix(18.,83.,uMetal))*(.1+uMetal*.38);float rim=pow(1.-max(0.,dot(n,V)),3.2)*.17;col+=vec3(1.,.82,.64)*(spec+rim);col=mix(col,vec3(1.,.88,.66),uMetal*spec*.24);col=col/(col+vec3(.15));col=pow(col,vec3(.93));gl_FragColor=vec4(col,1.);}`;
function compile(type,source){let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function geometry(){const v=[],n=[],idx=[],rings=30,segments=42;for(let y=0;y<=rings;y++){const a=y*Math.PI/rings;for(let x=0;x<=segments;x++){const b=2*Math.PI*x/segments,px=Math.sin(a)*Math.cos(b),py=Math.cos(a),pz=Math.sin(a)*Math.sin(b);v.push(px,py,pz);n.push(px,py,pz)}}for(let y=0;y<rings;y++)for(let x=0;x<segments;x++){let i=y*(segments+1)+x;idx.push(i,i+1,i+segments+1,i+1,i+segments+2,i+segments+1)}return {v:new Float32Array(v),n:new Float32Array(n),idx:new Uint16Array(idx)}}
function setup(){gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,depth:true,preserveDrawingBuffer:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL недоступен');program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);let g=geometry();vbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbuf);gl.bufferData(gl.ARRAY_BUFFER,g.v,gl.STATIC_DRAW);nbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nbuf);gl.bufferData(gl.ARRAY_BUFFER,g.n,gl.STATIC_DRAW);ibuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,g.idx,gl.STATIC_DRAW);loc={pos:gl.getAttribLocation(program,'aPosition'),nor:gl.getAttribLocation(program,'aNormal'),M:gl.getUniformLocation(program,'uM'),VP:gl.getUniformLocation(program,'uVP'),col:gl.getUniformLocation(program,'uColor'),fur:gl.getUniformLocation(program,'uFur'),metal:gl.getUniformLocation(program,'uMetal'),time:gl.getUniformLocation(program,'uTime'),count:g.idx.length};gl.bindBuffer(gl.ARRAY_BUFFER,vbuf);gl.enableVertexAttribArray(loc.pos);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,nbuf);gl.enableVertexAttribArray(loc.nor);gl.vertexAttribPointer(loc.nor,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibuf);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(0,0,0,0);hasContext=true}
const rgb=h=>{let v=parseInt(h.slice(1),16);return [(v>>16&255)/255,(v>>8&255)/255,(v&255)/255]};
function part(name,xyz,scl,color,opt={}){draws.push({name,xyz,scl,col:rgb(color),fur:opt.fur||0,metal:opt.metal||0,rot:opt.rot||[0,0,0],group:opt.group||'body'})}
function buildCapy(){draws=[];
 const coat='#272f3c',coat2='#303d4c',tan='#ab7752',fur='#b88661',head='#bc8a65',muzzle='#d6ad8c',dark='#392724',gold='#dfae64';
 part('back-legL',[-.59,-.77,-.24],[.30,.35,.28],tan,{fur:1});part('back-legR',[.59,-.77,-.24],[.30,.35,.28],tan,{fur:1});
 part('torso',[0,-.12,-.12],[.93,.75,.59],fur,{fur:1});part('hoodie',[0,-.28,.11],[.86,.68,.55],coat,{fur:.1});
 part('belly',[0,-.33,.57],[.44,.40,.07],coat2);
 part('hood-neck',[0,.19,.35],[.61,.15,.32],coat2);
 part('hood-stringL',[-.16,-.05,.67],[.025,.26,.025],'#dfc39c',{rot:[.1,0,-.1]});part('hood-stringR',[.16,-.05,.67],[.025,.26,.025],'#dfc39c',{rot:[.1,0,.1]});
 part('hood-badge',[0,-.38,.656],[.12,.13,.029],gold,{metal:.7});part('hood-dot',[0,-.38,.684],[.048,.052,.018],'#624321');
 part('neck',[0,.35,.21],[.52,.38,.47],fur,{fur:1});
 part('head',[0,.68,.41],[.67,.52,.56],head,{fur:1,group:'head'});
 part('cheekL',[-.36,.48,.78],[.27,.23,.23],tan,{fur:1,group:'head'});part('cheekR',[.36,.48,.78],[.27,.23,.23],tan,{fur:1,group:'head'});
 part('muzzle',[0,.48,.92],[.43,.26,.3],muzzle,{fur:1,group:'head'});
 for(const side of [-1,1])for(let k=0;k<3;k++)part('whiskerDot'+side+k,[side*(.21+.068*k),.475-.036*k,1.134-.023*k],[.014,.012,.012],'#775349',{group:'head'});
 part('nose',[0,.57,1.205],[.21,.112,.09],dark,{group:'head'});
 part('nose-shine',[-.06,.62,1.276],[.055,.015,.015],'#83604c',{group:'head',metal:.15});
 for(const side of [-1,1]){
  let n=side<0?'L':'R';
  part('ear'+n,[side*.48,1.123,.36],[.16,.23,.13],tan,{rot:[0,0,-side*.19],fur:1,group:n==='L'?'earL':'earR'});
  part('earInside'+n,[side*.49,1.13,.469],[.098,.15,.034],'#795044',{rot:[0,0,-side*.19],group:n==='L'?'earL':'earR'});
  part('eye'+n,[side*.33,.77,.902],[.09,.093,.052],dark,{group:'head'});
  part('eyeglint'+n,[side*.308,.80,.947],[.023,.028,.014],'#f5f1de',{metal:.3,group:'head'});
  part('brow'+n,[side*.33,.905,.875],[.137,.04,.05],'#926044',{rot:[0,0,side*.12],fur:1,group:'head'});
  part('blush'+n,[side*.485,.488,.858],[.11,.06,.035],'#b97866',{group:'head'});
  part('pawUpper'+n,[side*.68,-.24,.53],[.265,.36,.26],coat,{rot:[0,0,-side*.34],group:n==='L'?'armL':'armR'});
  part('paw'+n,[side*.77,-.41,.66],[.20,.19,.19],tan,{fur:1,group:n==='L'?'armL':'armR'});
  for(let f=-1;f<=1;f++)part('toe'+n+f,[side*.77+f*.079,-.545,.765],[.055,.045,.047],'#7a5845',{group:n==='L'?'armL':'armR'});
  part('foot'+n,[side*.51,-.87,.29],[.26,.11,.35],tan,{fur:1});
 }
 part('mouth',[0,.295,1.152],[.16,.018,.021],dark,{group:'head'});
 part('scarf',[0,.19,.59],[.51,.09,.13],'#a37b59',{fur:.5});
}
function buildDachshund(){draws=[];
 const body='#402b28',head='#784632',tan='#b97c4b',ear='#4b2c26',hoodie='#27344b',gold='#edc27a',dark='#211c1e';
 for(let side of [-1,1]){
 part('hindLeg'+side,[side*.66,-.77,-.29],[.25,.32,.27],head,{fur:1});
 part('foot'+side,[side*.65,-.87,.30],[.24,.13,.30],head,{fur:1});}
 part('tail-base',[0,-.23,-.68],[.19,.20,.40],body,{fur:1,group:'tail'});
 part('tail-tip',[0,-.14,-1.01],[.12,.12,.28],head,{fur:1,group:'tail'});
 part('torso',[0,-.12,-.17],[1.03,.62,.52],body,{fur:1});part('hoodie',[0,-.23,.06],[.95,.60,.52],hoodie,{fur:.18});part('belly',[0,-.32,.56],[.43,.38,.06],'#334961');
 part('hood-neck',[0,.22,.23],[.55,.16,.39],'#394c65');
 part('badge',[0,-.35,.594],[.13,.13,.031],gold,{metal:.64});part('badge-dot',[0,-.35,.628],[.046,.05,.018],'#5e442e');
 part('neck',[0,.36,.29],[.49,.36,.40],head,{fur:1});part('head',[0,.73,.48],[.58,.50,.49],head,{fur:1,group:'head'});
 part('muzzle',[0,.52,.92],[.37,.27,.34],tan,{fur:1,group:'head'});part('nose',[0,.64,1.235],[.18,.14,.108],dark,{group:'head'});
 part('mouth',[0,.348,1.14],[.17,.023,.026],dark,{group:'head'});
 for(let side of [-1,1]){let n=side===-1?'L':'R';let g=n==='L'?'earL':'earR';
   part('ear'+n,[side*.52,.65,.39],[.27,.47,.20],ear,{rot:[.11,0,side*.20],fur:1,group:g});
   part('earFold'+n,[side*.58,.37,.49],[.19,.30,.14],'#6b3d31',{rot:[0,0,-side*.15],fur:1,group:g});
   part('eye'+n,[side*.275,.81,.879],[.078,.093,.046],dark,{group:'head'});
   part('highlight'+n,[side*.25,.837,.912],[.027,.032,.018],'#f4f1d9',{group:'head',metal:.18});
   part('brow'+n,[side*.29,.96,.80],[.125,.045,.052],'#5c372e',{group:'head'});
   part('tanMark'+n,[side*.40,.49,.827],[.14,.16,.055],tan,{fur:.7,group:'head'});
   part('arm'+n,[side*.74,-.25,.50],[.22,.36,.24],hoodie,{rot:[0,0,-side*.28],group:n==='L'?'armL':'armR'});
   part('paw'+n,[side*.78,-.46,.69],[.18,.15,.20],head,{fur:1,group:n==='L'?'armL':'armR'});
 }
 part('collar',[0,.28,.66],[.49,.075,.12],gold,{metal:.4});
}
function resize(){if(!canvas||!gl)return;let r=canvas.getBoundingClientRect(),d=Math.min(1.8,window.devicePixelRatio||1),w=Math.max(2,Math.round(r.width*d)),h=Math.max(2,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
function drawObject(p,root,t){let base=root;
 if(p.group==='head'||p.group==='earL'||p.group==='earR')base=mul(base,mul(tr(0,.52,.3),mul(ry(.05*Math.sin(t*.65)),mul(rx(.035*Math.sin(t*.84)+(mood==='sad'?.08:mood==='happy'?-.045:0)),tr(0,-.52,-.3)))));
 if(p.group==='earL'||p.group==='earR')base=mul(base,mul(tr(p.xyz[0],p.xyz[1],p.xyz[2]),mul(rz((p.group==='earL'?1:-1)*.09*Math.sin(t*1.4)),tr(-p.xyz[0],-p.xyz[1],-p.xyz[2]))));
 if(p.group==='tail')base=mul(base,mul(tr(0,-.17,-.69),mul(ry(.16*Math.sin(t*(mood==='happy'?2.7:1.3))),tr(0,.17,.69))));
 if(p.group==='armR')base=mul(base,mul(tr(.68,-.11,.5),mul(rz(-.18*Math.sin(t*.9)),tr(-.68,.11,-.5))));
 if(p.group==='armL')base=mul(base,mul(tr(-.68,-.11,.5),mul(rz(.13*Math.sin(t*.83)),tr(.68,.11,-.5))));
 let m=mul(base,mul(tr(...p.xyz),mul(rx(p.rot[0]),mul(ry(p.rot[1]),mul(rz(p.rot[2]),sc(...p.scl))))));
 gl.uniformMatrix4fv(loc.M,false,m);gl.uniform3fv(loc.col,p.col);gl.uniform1f(loc.fur,p.fur);gl.uniform1f(loc.metal,p.metal);gl.drawElements(gl.TRIANGLES,loc.count,gl.UNSIGNED_SHORT,0);
}
function render(ms){frameId=requestAnimationFrame(render);if(!gl||document.hidden||!viewer||!viewer.getBoundingClientRect().width)return;if(ms-lastFrame<32)return;lastFrame=ms;resize();const active=motion&&!reduced;let t=ms/1000;if(!active)t=0;let idleYaw=active&&ms-lastInteraction>2200?Math.sin(t*.24)*.30:0; yaw+=(goalYaw+idleYaw-yaw)*.048;pitch+=(goalPitch-pitch)*.055;
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const aspect=canvas.width/canvas.height;let dist=aspect<1.1?4.65:4.80;let fov=aspect<1?46:40;const P=proj(fov*Math.PI/180,aspect,.1,40),V=look([0,.38,dist],[0,.16,0]);gl.uniformMatrix4fv(loc.VP,false,mul(P,V));gl.uniform1f(loc.time,t);
 let root=mul(tr(0,-.16+((active)?Math.sin(t*1.8)*.025:0),0),mul(rx(pitch),ry(yaw)));
 for(const p of draws)drawObject(p,root,t);
}
function attachPointer(){viewer.style.touchAction='pan-y';viewer.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;drag={x:e.clientX,y:e.clientY,yaw:goalYaw,pitch:goalPitch};lastInteraction=performance.now();viewer.setPointerCapture?.(e.pointerId);viewer.classList.add('dragging')});viewer.addEventListener('pointermove',e=>{if(!drag)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;goalYaw=drag.yaw+dx*.009;goalPitch=clamp(drag.pitch+dy*.004,-.3,.3);lastInteraction=performance.now()});const done=()=>{drag=null;viewer.classList.remove('dragging')};viewer.addEventListener('pointerup',done);viewer.addEventListener('pointercancel',done);viewer.addEventListener('dblclick',()=>{goalYaw=.16;goalPitch=0;lastInteraction=performance.now()})}
API.init=({canvas:c,viewer:v,pet:p,motion:m})=>{if(canvas)return;canvas=c;viewer=v;pet=p==='dachshund'?'dachshund':'capybara';motion=!!m&&!reduced;try{setup();attachPointer();pet==='capybara'?buildCapy():buildDachshund();frameId=requestAnimationFrame(render);window.addEventListener('resize',resize,{passive:true});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();hasContext=false;gl=null;viewer.classList.add('webgl-lost')});canvas.addEventListener('webglcontextrestored',()=>{setup();pet==='capybara'?buildCapy():buildDachshund();viewer.classList.remove('webgl-lost')})}catch(e){console.warn('3D mascot unavailable',e);viewer.classList.add('webgl-lost');document.getElementById('mascot-fallback')?.classList.remove('hidden')}};
API.switchPet=p=>{pet=p==='dachshund'?'dachshund':'capybara';pet==='capybara'?buildCapy():buildDachshund();goalYaw=.16;goalPitch=0;lastInteraction=performance.now()};
API.setMood=m=>{mood=m};API.setMotion=v=>{motion=!!v&&!reduced};
})();
