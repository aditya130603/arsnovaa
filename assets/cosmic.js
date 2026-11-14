/* Arsnovaa cosmic interaction layer · intentionally dependency free */
(()=>{
'use strict';
const root=document.querySelector('.av-home');
if(!root)return;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
const hero=document.querySelector('.av-hero');
const spotlight=document.querySelector('.cosmic-spot');
let px=0,py=0,x=0,y=0,raf=0,active=false;
const lerp=(a,b,f)=>a+(b-a)*f;
function updateSpot(){
 raf=0;
 if(!hero||!spotlight||!active)return;
 x=lerp(x,px,.17);y=lerp(y,py,.17);
 spotlight.style.setProperty('--cos-x',x+'px');
 spotlight.style.setProperty('--cos-y',y+'px');
 if(Math.abs(x-px)+Math.abs(y-py)>.6)raf=requestAnimationFrame(updateSpot);
}
function schedule(){if(!raf)raf=requestAnimationFrame(updateSpot);}
function canMove(){return fine.matches&&!reduced.matches;}
if(hero&&spotlight){
 hero.addEventListener('pointerenter',e=>{
  if(!canMove())return;
  const r=hero.getBoundingClientRect();x=px=e.clientX-r.left;y=py=e.clientY-r.top;active=true;spotlight.style.setProperty('--cos-opacity','.9');schedule();
 },{passive:true});
 hero.addEventListener('pointermove',e=>{
  if(!canMove())return;
  const r=hero.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;active=true;schedule();
 },{passive:true});
 hero.addEventListener('pointerleave',()=>{active=false;spotlight.style.setProperty('--cos-opacity','0');if(raf){cancelAnimationFrame(raf);raf=0;}},{passive:true});
}
const interactive=[...document.querySelectorAll('.av-btn,.av-service-row,.av-story-buttons button,.av-ghost')];
interactive.forEach(el=>{
 el.classList.add('av-interactive');
 let reset=0;
 el.addEventListener('pointermove',e=>{
  if(!canMove())return;
  const r=el.getBoundingClientRect();
  const dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
  el.style.setProperty('--spot-x',(dx+r.width/2)+'px');
  el.style.setProperty('--spot-y',(dy+r.height/2)+'px');
  if(el.classList.contains('av-btn')||el.classList.contains('av-ghost')||el.matches('.av-story-buttons button')){
    el.style.translate=(dx*.08).toFixed(2)+'px '+(dy*.12).toFixed(2)+'px';
  }
 },{passive:true});
 const end=()=>{
  el.style.translate='0 0';
  el.style.setProperty('--spot-x','50%');
  el.style.setProperty('--spot-y','50%');
 };
 el.addEventListener('pointerleave',end,{passive:true});
 el.addEventListener('blur',end);
});
const previews=['✳','◈','⌘','↗','◎','✺'];
document.querySelectorAll('.av-service-row').forEach((row,i)=>{
 const image=document.createElement('span');
 image.className='av-hover-image';image.setAttribute('aria-hidden','true');image.textContent=previews[i]||'✦';
 row.appendChild(image);
 row.addEventListener('pointermove',e=>{
  if(!canMove())return;
  const r=row.getBoundingClientRect();
  const d=(e.clientX-r.left)/r.width-.5;
  image.style.rotate=(d*14).toFixed(1)+'deg';
 },{passive:true});
 row.addEventListener('pointerleave',()=>{image.style.rotate='0deg';},{passive:true});
});
if(hero){
 const bg=hero.querySelector('.av-cosmic-bg');
 if(bg){
  const stars=[[10,16],[25,63],[41,25],[54,78],[70,34],[86,60],[93,13],[31,84]];
  stars.forEach(([left,top],i)=>{
   const m=document.createElement('i');m.className='av-cosmic-mote';m.style.left=left+'%';m.style.top=top+'%';m.style.animationDelay=(-i*.44)+'s';m.style.scale=String(.7+i%3*.3);bg.appendChild(m);
  });
 }
}
let activeEl=null;
root.addEventListener('focusin',e=>{
 const link=e.target.closest('.av-service-row,.av-btn,.av-ghost');
 if(activeEl)activeEl.classList.remove('av-keyboard-focus');
 if(link){link.classList.add('av-keyboard-focus');activeEl=link;}
});
root.addEventListener('focusout',e=>{
 const link=e.target.closest('.av-service-row,.av-btn,.av-ghost');
 if(link)link.classList.remove('av-keyboard-focus');
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}
 else if(!document.hidden&&active)schedule();
});
})();
