/* Arsnovaa / signal-to-impact motion direction. No external runtime dependencies. */
(()=>{'use strict';
const root=document.querySelector('.av-home');if(!root)return;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse=window.matchMedia('(pointer:coarse)');
const mobile=window.matchMedia('(max-width:760px)');
const hero=document.querySelector('.av-hero');
const portal=document.querySelector('.av-portal');
const holo=[...document.querySelectorAll('.av-holo')];
const canvas=document.querySelector('.av-field');
const ctx=canvas?.getContext('2d',{alpha:true});
let mx=0,my=0,sx=0,sy=0,scroll=0,prev=0,frame=0,heroVisible=true,dirty=true,lastFrame=0;
const R=(a,b)=>a+(b-a)*Math.random();
let particles=[];
function resize(){
 if(!ctx)return;
 const rect=hero.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5);
 canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
 canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const count=mobile.matches?52:110;
 particles=Array.from({length:count},(_,i)=>({x:R(0,rect.width),y:R(0,rect.height),r:R(.5,1.6),vx:R(-.16,.16),vy:R(-.12,.12),phase:R(0,6.3)}));
 dirty=true;
}
function paint(time){
 if(!ctx||!heroVisible)return;
 const w=canvas.clientWidth,h=canvas.clientHeight;
 ctx.clearRect(0,0,w,h);
 for(let i=0;i<particles.length;i++){
  const p=particles[i];
  if(!reduce.matches){p.x+=p.vx;p.y+=p.vy;p.x=(p.x+w)%w;p.y=(p.y+h)%h;}
  const a=.12+.32*(.5+.5*Math.sin(time*.0006+p.phase));
  ctx.fillStyle='rgba(199,255,119,'+a.toFixed(3)+')';
  ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
  if(i%3===0){
   for(let j=i+1;j<Math.min(i+12,particles.length);j++){
    const q=particles[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;
    if(d<14500){ctx.strokeStyle='rgba(163,241,143,'+(.085*(1-d/14500)).toFixed(3)+')';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
   }
  }
 }
}
function tick(t){
 frame=0;
 if(document.hidden)return;
 if(!reduce.matches && t-lastFrame<33){frame=requestAnimationFrame(tick);return;}
 lastFrame=t;
 sx+=(mx-sx)*.035;sy+=(my-sy)*.035;
 if(portal&&!reduce.matches){
  const y=Math.min(scroll*.12,125);
  portal.style.transform='translate3d('+(-sx*23)+'px,'+(y+sy*14)+'px,0) rotateX('+(2+sy*5)+'deg) rotateY('+(-18+sx*14)+'deg) rotateZ('+(-8+sx*3)+'deg)';
  holo.forEach((el,i)=>el.style.translate=(sx*(i+1)*7)+'px '+(sy*(i+1)*7+Math.min(scroll*.04,35))+'px');
 }
 if(ctx&&heroVisible)paint(t);
 if(!reduce.matches&&(heroVisible||Math.abs(mx-sx)>.001))frame=requestAnimationFrame(tick);
}
function wake(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
if(hero){
 if(!coarse.matches)hero.addEventListener('pointermove',e=>{const b=hero.getBoundingClientRect();mx=((e.clientX-b.left)/b.width-.5)*2;my=((e.clientY-b.top)/b.height-.5)*2;wake();},{passive:true});
 if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;if(heroVisible)wake();},{threshold:0}).observe(hero);
}
if(ctx){resize();window.addEventListener('resize',()=>{resize();wake();},{passive:true});}
const reveal=[...document.querySelectorAll('.av-reveal')];
if(reduce.matches||!('IntersectionObserver'in window))reveal.forEach(el=>el.classList.add('av-in'));
else{
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('av-in');observer.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
 reveal.forEach(el=>observer.observe(el));
}
const scenes=[...document.querySelectorAll('.av-story-scene')];
const story=document.querySelector('.av-story-run');
const progress=document.querySelector('.av-story-progress i');
const giant=document.querySelector('.av-giant-type');
const intro=document.querySelector('.av-intro');
let current=0;
function switchScene(n){
 current=Math.max(0,Math.min(scenes.length-1,n));
 scenes.forEach((scene,i)=>{scene.classList.toggle('av-current',i===current);scene.setAttribute('aria-hidden',String(i!==current));scene.querySelectorAll('a').forEach(a=>{a.tabIndex=i===current?0:-1;});});
 document.querySelector('.av-story-index').textContent='0'+(current+1)+' / 0'+scenes.length;
}
function onScroll(){
 scroll=window.scrollY;
 if(giant&&intro&&!reduce.matches){const r=intro.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){const v=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));giant.style.setProperty('--giant-x',Math.round((v-.5)*-170)+'px');}}
 if(story){
  const r=story.getBoundingClientRect(),range=Math.max(1,r.height-innerHeight);
  const v=Math.max(0,Math.min(1,-r.top/range));
  if(progress)progress.style.setProperty('--progress',(v*100)+'%');
  if(r.bottom>0&&r.top<innerHeight)switchScene(Math.min(2,Math.floor(Math.min(v,.999)*3)));
 }
 wake();
}
document.querySelector('.av-prev')?.addEventListener('click',()=>{if(story){const n=Math.max(0,current-1);const y=story.getBoundingClientRect().top+scrollY+(story.offsetHeight-innerHeight)*(n/3+.02);window.scrollTo({top:y,behavior:reduce.matches?'auto':'smooth'});}});
document.querySelector('.av-next')?.addEventListener('click',()=>{if(story){const n=Math.min(2,current+1);const y=story.getBoundingClientRect().top+scrollY+(story.offsetHeight-innerHeight)*(n/3+.02);window.scrollTo({top:y,behavior:reduce.matches?'auto':'smooth'});}});
window.addEventListener('scroll',onScroll,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
const follower=document.querySelector('.av-follower');
if(follower&&!coarse.matches&&!reduce.matches){
 let fx=0,fy=0,tx=0,ty=0,active=false;
 window.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;if(!active){active=true;follower.classList.add('av-on');requestAnimationFrame(move);}}, {passive:true});
 function move(){if(document.hidden){active=false;return;}fx+=(tx-fx)*.22;fy+=(ty-fy)*.22;follower.style.transform='translate('+fx+'px,'+fy+'px) translate(-50%,-50%)';requestAnimationFrame(move);}
 document.querySelectorAll('.av-home a,.av-story-buttons button').forEach(el=>{el.addEventListener('mouseenter',()=>follower.classList.add('av-big'));el.addEventListener('mouseleave',()=>follower.classList.remove('av-big'));});
}
const navLinks=document.querySelectorAll('.av-home a[href^="#"]');
navLinks.forEach(link=>link.addEventListener('click',e=>{const target=document.querySelector(link.getAttribute('href'));if(target){e.preventDefault();target.scrollIntoView({behavior:reduce.matches?'auto':'smooth'});}}));
switchScene(0);
onScroll();
if(reduce.matches&&ctx)paint(0);
})();
