/* Premium Worlds 2.6 — lightweight reactive illustration, no WebGL, no network requests. */
(()=>{'use strict';
 const $=s=>document.getElementById(s);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const saved=()=>{try{return localStorage.getItem('moi-dengi-pet-sound-v26')!=='off'}catch{return true}};
 let kind='capybara', motion=!reduced.matches, busy=false, mood='calm',audio=null;
 const soundControl=()=>{const s=$('pet-sound-enabled');if(s){s.checked=saved();s.addEventListener('change',()=>{try{localStorage.setItem('moi-dengi-pet-sound-v26',s.checked?'on':'off')}catch{}})}};
 function petImage(){const image=$('pet-cutout'); if(!image)return;image.src=kind==='capybara'?'./capybara.png':'./dachshund.png';image.alt=kind==='capybara'?'Капибара с чашкой кофе и короной':'Радостная такса в тёмном худи';}
 function setPet(next){kind=next==='dachshund'?'dachshund':'capybara';document.documentElement.dataset.pet=kind;petImage();const stage=$('living-theater');if(stage)stage.dataset.pet=kind;const phrase=$('mascot-say');if(phrase)phrase.textContent=kind==='capybara'?'Нажми на меня — выпьем кофе ☕':'Нажми на меня — поздороваюсь 🐾';}
 function celebrate(){const stage=$('living-theater');if(!stage||reduced.matches)return;const bits=document.createElement('div');bits.className='pet-celebration';bits.setAttribute('aria-hidden','true');for(let i=0;i<12;i++){let z=document.createElement('i');z.style.setProperty('--x',((i*89)%300-150)+'px');z.style.setProperty('--d',(i%4)*.08+'s');bits.append(z)}stage.append(bits);setTimeout(()=>bits.remove(),1550)}
 function playBark(){if(!saved())return;try{if(!audio){audio=new Audio('./bark.wav');audio.preload='auto';audio.volume=.32}audio.currentTime=0;const promise=audio.play();promise?.catch?.(()=>{});}catch{}}
 function react(){if(busy)return;const stage=$('living-theater'),pet=$('pet-tap');if(!stage||!pet)return;busy=true;const action=kind==='capybara'?'sipping':'barking';stage.classList.remove('sipping','barking');void stage.offsetWidth;stage.classList.add(action);const caption=$('mascot-say');if(caption)caption.textContent=kind==='capybara'?'М-м, вот это хороший момент ☕':'Гав! У тебя всё получится 🐾';if(kind==='dachshund')playBark();if(!reduced.matches)celebrate();setTimeout(()=>{stage.classList.remove(action);const caption=$('mascot-say');if(caption)caption.textContent=kind==='capybara'?'Маленькие шаги. Большой результат.':'Сегодня отличный день для твоих целей.';busy=false},1750)}
 function init({pet,motion:enabled}={}){motion=!!enabled&&!reduced.matches;setPet(pet);const tap=$('pet-tap');if(tap&&!tap.dataset.bound){tap.dataset.bound='1';tap.addEventListener('click',react)}soundControl();document.documentElement.classList.toggle('pet-motion-off',!motion)}
 function switchPet(p){const stage=$('living-theater');if(stage)stage.classList.remove('sipping','barking');setPet(p)}
 function setMotion(value){motion=!!value&&!reduced.matches;document.documentElement.classList.toggle('pet-motion-off',!motion)}
 function setMood(value){mood=value;const stage=$('living-theater');if(stage)stage.dataset.mood=value}
 window.MoneyMascot={init,switchPet,setMotion,setMood,react};
})();
