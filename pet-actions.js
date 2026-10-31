/* Premium Essential 2.9 — tactile reactions; no sounds without direct interaction. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let kind='capybara',motion=!reduce.matches,busy=false,mood='calm';
 function play(){/* Premium Essential: characters are intentionally silent. */}
 function say(text){const el=$('mascot-say');if(el)el.textContent=text}
 function setPet(p){kind=p==='dachshund'?'dachshund':'capybara';document.documentElement.dataset.pet=kind;
  const stage=$('living-theater');if(stage){stage.dataset.pet=kind;stage.classList.remove('pet-sip','pet-greet','pet-happy','pet-idle-react')}
  const image=$('pet-cutout');if(image){image.src=kind==='capybara'?'./capybara.png':'./dachshund-body.png';const tail=$('pet-tail');if(tail)tail.classList.toggle('hidden',kind!=='dachshund');image.alt=kind==='capybara'?'Капибара в короне с чашкой кофе':'Такса в чёрном худи'}
  say(kind==='capybara'?'Коснись чашки — сделаем паузу ☕':'Погладь таксу — она поздоровается 🐾');
 }
 function clean(){const stage=$('living-theater');stage?.classList.remove('pet-sip','pet-greet','pet-happy','pet-idle-react')}
 function fire(type,duration=2100){const stage=$('living-theater');if(!stage||busy)return false;busy=true;clean();void stage.offsetHeight;stage.classList.add(type);
  setTimeout(()=>{stage.classList.remove(type);busy=false},duration);return true}
 function react(){if(kind==='capybara'){if(!fire('pet-sip',2200))return;say('Тёплый кофе и немного спокойствия. ☕')}
  else{if(!fire('pet-greet',1850))return;say('Как здорово тебя видеть! 🐾')}
  setTimeout(()=>{if(!busy)say(kind==='capybara'?'Маленькие шаги. Большой результат.':'Пойдём к твоим целям вместе.')},2400)
 }
 function celebrateIncome(){if(fire('pet-happy',1600))say(kind==='capybara'?'Хорошие новости! ☕':'Ура, пополнение! 🐾')}
 function celebrateGoal(){if(fire('pet-happy',2100))say('Поздравляю с достигнутой целью! ✨')}
 let petPressTimer=null,ignoreClickOnce=false,lastShortClick=0;
 function secretReact(){
  const stage=$('living-theater');if(!stage)return;
  const extra=$('pet-extra');if(extra)extra.textContent=kind==='capybara'?'✦':'♡';
  if(kind==='capybara'){stage.classList.remove('pet-secret');void stage.offsetHeight;stage.classList.add('pet-secret');say('Немного волшебства — и возвращаемся к планам. ✨')}
  else{stage.classList.remove('pet-secret');void stage.offsetHeight;stage.classList.add('pet-secret');say('Такса нашла повод повилять хвостом! ♡')}
  setTimeout(()=>stage.classList.remove('pet-secret'),2200);
 }
 function calmReact(){
  const stage=$('living-theater');if(!stage)return;stage.classList.add('pet-calm');
  say(kind==='capybara'?'Тихий момент. Всё хорошо. ☕':'Такса довольна: её погладили! 🐾');
  setTimeout(()=>stage.classList.remove('pet-calm'),2100);
 }
 function init({pet='capybara',motion:active=true}={}){motion=!!active&&!reduce.matches;setPet(pet);document.documentElement.classList.toggle('pet-motion-off',!motion);
  const button=$('pet-tap');if(button&&!button.dataset.mascotListener){
   button.addEventListener('click',()=>{
    if(ignoreClickOnce){ignoreClickOnce=false;return}
    const now=Date.now();if(now-lastShortClick<360){lastShortClick=0;secretReact();return}
    lastShortClick=now;react();
   });
   button.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;clearTimeout(petPressTimer);petPressTimer=setTimeout(()=>{ignoreClickOnce=true;calmReact()},650)});
   for(const ev of ['pointerup','pointercancel','pointerleave'])button.addEventListener(ev,()=>clearTimeout(petPressTimer));
   button.dataset.mascotListener='yes'
  }
 }
 function setMotion(active){motion=!!active&&!reduce.matches;document.documentElement.classList.toggle('pet-motion-off',!motion)}
 function setMood(m){mood=m;const el=$('living-theater');if(el)el.dataset.mood=m}
 // Gentle expressive idle every 25–38 seconds when foregrounded; no autoplay sound.
 function idle(){if(document.hidden||busy||reduce.matches||!motion)return;fire('pet-idle-react',900)}
 setInterval(idle,32000);
 window.MoneyMascot={init,switchPet:setPet,setMotion,setMood,react,celebrateIncome,celebrateGoal};
})();
