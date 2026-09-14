// ---------- black hole intro loader ----------
(function(){
  const loader = document.getElementById('bh-loader');
  if(!loader) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(prefersReducedMotion){
    loader.remove();
    return;
  }

  document.documentElement.style.overflow = 'hidden';

  const canvas = document.getElementById('bhCanvas');
  const ctx = canvas.getContext('2d');
  let w, h, cx, cy, stars, rafId;

  function size(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cx = w/2; cy = h/2;
  }
  size();

  function makeStars(count){
    return Array.from({length:count}, () => {
      const angle = Math.random()*Math.PI*2;
      const radius = 60 + Math.random()*Math.min(w,h)*0.55;
      return {
        angle,
        radius,
        baseRadius: radius,
        speed: 0.004 + (1/radius)*2.2,   // faster near the center (Keplerian-ish)
        size: Math.random()*1.6+0.4,
        fall: 0.15 + Math.random()*0.35   // how fast it spirals inward
      };
    });
  }
  stars = makeStars(Math.min(260, Math.floor((w*h)/6000)));

  let t = 0;
  function draw(){
    t += 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; // trailing effect
    ctx.fillRect(0,0,w,h);

    // event horizon glow
    const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,90);
    grad.addColorStop(0, 'rgba(23,232,163,.9)');
    grad.addColorStop(0.35, 'rgba(23,232,163,.25)');
    grad.addColorStop(1, 'rgba(23,232,163,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx,cy,90,0,Math.PI*2); ctx.fill();

    // pure black core
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx,cy,34,0,Math.PI*2); ctx.fill();

    for(const s of stars){
      s.angle += s.speed;
      s.radius -= s.fall;
      if(s.radius < 36){
        s.radius = s.baseRadius;
        s.angle = Math.random()*Math.PI*2;
      }
      const x = cx + Math.cos(s.angle)*s.radius;
      const y = cy + Math.sin(s.angle)*s.radius*0.55; // squash for disk perspective
      const proximity = 1 - Math.min(s.radius/ (Math.min(w,h)*0.55), 1);
      ctx.beginPath();
      ctx.arc(x,y,s.size + proximity*1.4,0,Math.PI*2);
      ctx.fillStyle = `rgba(${180+proximity*75},255,${210+proximity*45},${0.5+proximity*0.5})`;
      ctx.fill();
    }
    rafId = requestAnimationFrame(draw);
  }
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
  draw();

  window.addEventListener('resize', () => { size(); }, {passive:true});

  function finish(){
    loader.classList.add('bh-hide');
    document.documentElement.style.overflow = '';
    setTimeout(() => {
      cancelAnimationFrame(rafId);
      loader.remove();
    }, 950);
  }
  // Let the black hole play briefly, then reveal the site
  setTimeout(finish, 2400);
})();

// hero particle network — respects reduced motion, pauses when tab hidden, debounced resize
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, particles, rafId = null;

  function size(){
    const parent = canvas.parentElement;
    w = canvas.width = parent.offsetWidth;
    h = canvas.height = parent.offsetHeight;
  }
  function initParticles(){
    size();
    const count = Math.min(70, Math.floor(w/22));
    particles = Array.from({length:count}, () => ({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.25, vy:(Math.random()-0.5)*0.25,
      r: Math.random()*1.6+0.6
    }));
  }
  function tick(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(23,232,163,.55)';
      ctx.fill();
    }
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a=particles[i], b=particles[j];
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<120){
          ctx.beginPath();
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=`rgba(23,232,163,${0.12*(1-d/120)})`;
          ctx.lineWidth=1;
          ctx.stroke();
        }
      }
    }
    rafId = requestAnimationFrame(tick);
  }
  function startParticles(){
    if(rafId) return;
    initParticles();
    tick();
  }
  function stopParticles(){
    if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
  }

  if(prefersReducedMotion){
    // draw a single static frame instead of a continuous animation
    initParticles();
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(23,232,163,.4)'; ctx.fill();
    }
  } else {
    startParticles();
    document.addEventListener('visibilitychange', () => {
      if(document.hidden) stopParticles(); else startParticles();
    });
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(size, 150);
    }, {passive:true});
  }

  // fake bar charts (deterministic pseudo-random heights, no layout thrash)
  function makeBars(id, seed){
    const el = document.getElementById(id);
    if(!el) return;
    const frag = document.createDocumentFragment();
    let s = seed;
    for(let i=0;i<24;i++){
      s = (s*9301+49297)%233280;
      const val = 20 + (s/233280)*80;
      const bar = document.createElement('span');
      bar.style.height = val+'%';
      frag.appendChild(bar);
    }
    el.appendChild(frag);
  }
  makeBars('bars1', 12); makeBars('bars2', 47); makeBars('bars3', 91);

  // lightweight scroll-reveal (native IntersectionObserver — no external runtime dependency)
  (function(){
    var items = document.querySelectorAll('.wow');
    if(prefersReducedMotion || !('IntersectionObserver' in window)){
      items.forEach(function(el){ el.classList.add('animate__animated'); });
      return;
    }
    // Only now do we tell CSS it's safe to hide .wow elements pre-reveal —
    // if this script never runs, .js-ready is never added and content
    // stays visible by default (see style.css).
    document.documentElement.classList.add('js-ready');

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var el = entry.target;
          var delay = el.getAttribute('data-wow-delay') || '0s';
          el.style.setProperty('--wow-delay', delay);
          el.classList.add('animate__animated');
          io.unobserve(el);
        }
      });
    }, {threshold: 0.15, rootMargin: '0px 0px -80px 0px'});
    items.forEach(function(el){ io.observe(el); });

    // Safety net: force-reveal anything still hidden after a while
    // (covers edge cases where the observer never fires for an element).
    setTimeout(function(){
      document.querySelectorAll('.wow:not(.animate__animated)').forEach(function(el){
        el.classList.add('animate__animated');
      });
    }, 6000);
  })();
