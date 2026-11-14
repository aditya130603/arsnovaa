/* Arsnovaa interactive WebGL sculpture — no dependencies or external requests */
(() => {
  'use strict';
  const canvas = document.querySelector('#ars-3d-canvas');
  const stage = document.querySelector('.ars-stage');
  if (!canvas || !stage) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 720px)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const gl = canvas.getContext('webgl', {alpha:true, antialias:false, depth:false, stencil:false, preserveDrawingBuffer:false, powerPreference:'low-power'});
  if (!gl) { stage.classList.add('ars-fallback'); return; }
  const vert = `attribute vec2 position;
  varying vec2 vUv;
  void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const frag = `precision highp float;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMotion;
  #define PI 3.14159265
  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
  float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
  float sdSphere(vec3 p,float r){return length(p)-r;}
  float map(vec3 p){
    p.xz*=rot(.34+uTime*.07*uMotion+uMouse.x*.2);
    p.xy*=rot(-.33+uMouse.y*.19);
    float central=sdSphere(p, .77);
    vec3 q=p;
    q.yz*=rot(1.13+uTime*.10*uMotion);
    float ring1=sdTorus(q,vec2(1.16,.064));
    q=p; q.xz*=rot(.85+uTime*.075*uMotion);q.yz*=rot(-.6);
    float ring2=sdTorus(q,vec2(1.34,.038));
    q=p;q.yz*=rot(-.88+uTime*.055*uMotion);q.xy*=rot(.7);
    float ring3=sdTorus(q,vec2(1.52,.018));
    return min(min(central,ring1),min(ring2,ring3));
  }
  vec3 normal(vec3 p){
    vec2 h=vec2(.002,0.);
    return normalize(vec3(map(p+h.xyy)-map(p-h.xyy),map(p+h.yxy)-map(p-h.yxy),map(p+h.yyx)-map(p-h.yyx)));
  }
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){
    vec2 uv=(gl_FragCoord.xy-.5*uResolution)/min(uResolution.x,uResolution.y);
    uv*=2.15;
    vec3 ro=vec3(0.,0.,4.8);
    vec3 rd=normalize(vec3(uv,-2.85));
    float t=0.;float hit=0.;vec3 p;
    for(int i=0;i<72;i++){
      p=ro+rd*t;
      float d=map(p);
      if(d<.0025){hit=1.;break;}
      if(t>9.)break;
      t+=max(d*.77,.014);
    }
    vec3 color=vec3(0.015,0.028,0.035);
    float radial=length(uv);
    color+=vec3(.027,.062,.047)*exp(-radial*1.2);
    float aura=exp(-abs(radial-.79)*6.)*.08;
    color+=vec3(.21,.34,.08)*aura;
    if(hit>0.5){
      p=ro+rd*t;
      vec3 n=normal(p);
      vec3 l=normalize(vec3(-.62,.8,1.4));
      float diff=max(dot(n,l),0.);
      float fres=pow(1.-max(dot(n,-rd),0.),2.8);
      float isCore=1.-smoothstep(.77,.85,length(p));
      vec3 base=mix(vec3(.44,.71,.20),vec3(.075,.23,.17),isCore);
      float stripes=sin(p.y*23.+p.x*7.+uTime*.4*uMotion)*.5+.5;
      vec3 metal=base*(.22+diff*.72)+vec3(.46,.75,.29)*fres*.88;
      metal+=pow(max(dot(reflect(-l,n),-rd),0.),32.)*vec3(.73,.97,.51);
      if(isCore>.5){
        metal=mix(metal,vec3(.065,.155,.142)+diff*vec3(.12,.33,.25),.62);
        metal+=fres*vec3(.36,.74,.42);
        metal+=stripes*.025;
      }
      float fog=exp(-t*.075);
      color=mix(color,metal,fog);
    }
    float grain=(hash(gl_FragCoord.xy+uTime)-.5)*.012;
    color+=grain;
    color=pow(max(color,0.),vec3(.89));
    gl_FragColor=vec4(color,1.);
  }`;
  function compile(type,src){
    const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){console.warn('Arsnovaa 3D shader unavailable:',gl.getShaderInfoLog(sh));gl.deleteShader(sh);return null;}
    return sh;
  }
  const vs=compile(gl.VERTEX_SHADER,vert),fs=compile(gl.FRAGMENT_SHADER,frag);
  if(!vs||!fs){stage.classList.add('ars-fallback');return;}
  const prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){stage.classList.add('ars-fallback');return;}
  gl.useProgram(prog);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(prog,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uResolution=gl.getUniformLocation(prog,'uResolution');
  const uTime=gl.getUniformLocation(prog,'uTime');
  const uMouse=gl.getUniformLocation(prog,'uMouse');
  const uMotion=gl.getUniformLocation(prog,'uMotion');
  let raf=0,visible=true,mouseX=0,mouseY=0,smoothX=0,smoothY=0,previous=0,clock=0,frames=0;
  function resize(){
    const rect=stage.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1, mobile.matches?1:1.35);
    const scale=mobile.matches?.7:1;
    const w=Math.max(1,Math.floor(rect.width*dpr*scale));
    const h=Math.max(1,Math.floor(rect.height*dpr*scale));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  }
  function draw(time){
    raf=0;
    if(!visible || document.hidden)return;
    if(!previous)previous=time;
    const elapsed=Math.min((time-previous)/1000,.06);
    previous=time;
    const motion=reduce.matches?0:1;
    if(!reduce.matches)clock+=elapsed;
    smoothX+=(mouseX-smoothX)*.045;
    smoothY+=(mouseY-smoothY)*.045;
    resize();
    gl.uniform2f(uResolution,canvas.width,canvas.height);
    gl.uniform1f(uTime,clock);
    gl.uniform2f(uMouse,smoothX,smoothY);
    gl.uniform1f(uMotion,motion);
    gl.drawArrays(gl.TRIANGLES,0,6);
    frames++;
    if(!reduce.matches)raf=requestAnimationFrame(draw);
  }
  function wake(){if(!raf&&visible&&!document.hidden){previous=0;raf=requestAnimationFrame(draw);}}
  if(!coarse.matches)stage.addEventListener('pointermove',e=>{
    const r=stage.getBoundingClientRect();mouseX=((e.clientX-r.left)/r.width-.5)*2;mouseY=((e.clientY-r.top)/r.height-.5)*-2;
  },{passive:true});
  if('IntersectionObserver' in window){
    new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake();else if(raf){cancelAnimationFrame(raf);raf=0;}},{threshold:0}).observe(stage);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else wake();});
  window.addEventListener('resize',wake,{passive:true});
  reduce.addEventListener?.('change',()=>{if(raf)cancelAnimationFrame(raf);raf=0;wake();});
  wake();
  // Light 3D tilting only on desktop input devices.
  if(!coarse.matches && !reduce.matches){
    document.querySelectorAll('.ars-tilt').forEach(card=>{
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(800px) rotateX(${-y*5}deg) rotateY(${x*6}deg) translateY(-4px)`;
      },{passive:true});
      card.addEventListener('pointerleave',()=>{card.style.transform='';});
    });
  }
  if('IntersectionObserver' in window && !reduce.matches){
    const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('ars-visible');obs.unobserve(entry.target);}}),{threshold:.12});
    document.querySelectorAll('.ars-reveal').forEach(el=>obs.observe(el));
  } else document.querySelectorAll('.ars-reveal').forEach(el=>el.classList.add('ars-visible'));
})();
