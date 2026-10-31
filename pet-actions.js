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
 function init({pet='capybara',motion:active=true}={}){motion=!!active&&!reduce.matches;setPet(pet);document.documentElement.classList.toggle('pet-motion-off',!motion);
  const button=$('pet-tap');if(button&&!button.dataset.mascotListener){button.addEventListener('click',react);button.dataset.mascotListener='yes'}
 }
 function setMotion(active){motion=!!active&&!reduce.matches;document.documentElement.classList.toggle('pet-motion-off',!motion)}
 function setMood(m){mood=m;const el=$('living-theater');if(el)el.dataset.mood=m}
 // Gentle expressive idle every 25–38 seconds when foregrounded; no autoplay sound.
 function idle(){if(document.hidden||busy||reduce.matches||!motion)return;fire('pet-idle-react',900)}
 setInterval(idle,32000);
 window.MoneyMascot={init,switchPet:setPet,setMotion,setMood,react,celebrateIncome,celebrateGoal};
})();
