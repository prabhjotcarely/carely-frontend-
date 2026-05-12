/* elara-2d.js — Carely Elara 2D Cartoon Mascot */
(function () {
  'use strict';

  function makeSVG(pfx) {
    var s = [];
    s.push('<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;width:100%;height:auto;">');
    s.push('<defs>');
    s.push('<radialGradient id="' + pfx + 'hg" cx="36%" cy="30%">');
    s.push('<stop offset="0%" stop-color="#62d2d2"/><stop offset="100%" stop-color="#44ABAD"/>');
    s.push('</radialGradient>');
    s.push('<radialGradient id="' + pfx + 'bg" cx="36%" cy="30%">');
    s.push('<stop offset="0%" stop-color="#50c4c4"/><stop offset="100%" stop-color="#44ABAD"/>');
    s.push('</radialGradient>');
    s.push('<filter id="' + pfx + 'sh"><feDropShadow dx="0" dy="9" stdDeviation="13" flood-color="#44ABAD" flood-opacity="0.24"/></filter>');
    s.push('<filter id="' + pfx + 'gw" x="-70%" y="-70%" width="240%" height="240%">');
    s.push('<feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>');
    s.push('</filter></defs>');
    s.push('<ellipse cx="200" cy="510" rx="70" ry="9" fill="rgba(68,171,173,0.13)"/>');
    s.push('<ellipse cx="200" cy="386" rx="72" ry="87" fill="url(#' + pfx + 'bg)"/>');
    s.push('<ellipse cx="200" cy="380" rx="25" ry="25" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>');
    s.push('<g id="' + pfx + 'al" transform="rotate(-16,115,383)">');
    s.push('<ellipse cx="115" cy="378" rx="14" ry="40" fill="#2D8A9C"/>');
    s.push('<circle cx="107" cy="412" r="12" fill="#2D8A9C"/>');
    s.push('</g>');
    s.push('<g id="' + pfx + 'ar" transform="rotate(16,285,383)">');
    s.push('<ellipse cx="285" cy="378" rx="14" ry="40" fill="#2D8A9C"/>');
    s.push('<circle cx="293" cy="412" r="12" fill="#2D8A9C"/>');
    s.push('</g>');
    s.push('<circle cx="262" cy="356" r="28" fill="#1E6070"/>');
    s.push('<rect x="255" y="340" width="14" height="32" rx="4" fill="white"/>');
    s.push('<rect x="247" y="348" width="30" height="14" rx="4" fill="white"/>');
    s.push('<ellipse cx="200" cy="196" rx="137" ry="106" fill="url(#' + pfx + 'hg)" filter="url(#' + pfx + 'sh)"/>');
    s.push('<ellipse cx="66" cy="201" rx="18" ry="23" fill="#2D8A9C"/>');
    s.push('<ellipse cx="334" cy="201" rx="18" ry="23" fill="#2D8A9C"/>');
    s.push('<ellipse cx="200" cy="191" rx="102" ry="72" fill="#F8FFFE"/>');
    s.push('<line x1="234" y1="103" x2="273" y2="33" stroke="#2D8A9C" stroke-width="9" stroke-linecap="round"/>');
    s.push('<circle cx="281" cy="19" r="14" fill="none" stroke="#44ABAD" stroke-width="2" opacity="0">');
    s.push('<animate attributeName="r" values="13;25;13" dur="2.3s" repeatCount="indefinite"/>');
    s.push('<animate attributeName="opacity" values="0.6;0;0.6" dur="2.3s" repeatCount="indefinite"/>');
    s.push('</circle>');
    s.push('<circle id="' + pfx + 'ant" cx="281" cy="19" r="13" fill="#44ABAD" filter="url(#' + pfx + 'gw)"/>');
    s.push('<circle cx="276" cy="13" r="4" fill="rgba(255,255,255,0.88)"/>');
    s.push('<path id="' + pfx + 'ebl" d="M 149 163 Q 164 156 179 163" stroke="#1A1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>');
    s.push('<path id="' + pfx + 'ebr" d="M 221 163 Q 236 156 251 163" stroke="#1A1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>');
    s.push('<g id="' + pfx + 'el">');
    s.push('<ellipse cx="164" cy="186" rx="17" ry="19" fill="#1A1A1A"/>');
    s.push('<circle id="' + pfx + 'pl" cx="169" cy="180" r="5.5" fill="white"/>');
    s.push('<circle cx="171" cy="178" r="2" fill="rgba(255,255,255,0.65)"/>');
    s.push('</g>');
    s.push('<g id="' + pfx + 'er">');
    s.push('<ellipse cx="236" cy="186" rx="15" ry="17" fill="#1A1A1A"/>');
    s.push('<circle id="' + pfx + 'pr" cx="241" cy="180" r="4.5" fill="white"/>');
    s.push('<circle cx="243" cy="178" r="1.8" fill="rgba(255,255,255,0.65)"/>');
    s.push('</g>');
    s.push('<ellipse cx="122" cy="216" rx="20" ry="10" fill="rgba(255,125,115,0.17)"/>');
    s.push('<ellipse cx="278" cy="216" rx="20" ry="10" fill="rgba(255,125,115,0.17)"/>');
    s.push('<path id="' + pfx + 'mo" d="M 174 227 Q 200 246 226 227" stroke="#1A1A1A" stroke-width="4.5" fill="none" stroke-linecap="round"/>');
    s.push('<ellipse cx="169" cy="467" rx="35" ry="13" fill="#1E6070"/>');
    s.push('<ellipse cx="231" cy="467" rx="35" ry="13" fill="#1E6070"/>');
    s.push('</svg>');
    return s.join('');
  }

  var EM = {
    happy:   { el:{rx:17,ry:19}, er:{rx:15,ry:17}, ebl:'M 149 163 Q 164 156 179 163', ebr:'M 221 163 Q 236 156 251 163', mo:'M 174 227 Q 200 246 226 227', ar:'rotate(16,285,383)' },
    excited: { el:{rx:20,ry:23}, er:{rx:18,ry:21}, ebl:'M 146 158 Q 164 150 180 157', ebr:'M 220 157 Q 236 150 254 158', mo:'M 168 223 Q 200 250 232 223', ar:'rotate(-40,285,362)' },
    worried: { el:{rx:17,ry:13}, er:{rx:15,ry:11}, ebl:'M 149 166 Q 164 159 179 166', ebr:'M 221 166 Q 236 159 251 166', mo:'M 176 234 Q 200 222 224 234', ar:'rotate(16,285,383)' },
    sad:     { el:{rx:17,ry:12}, er:{rx:15,ry:10}, ebl:'M 151 166 Q 163 173 178 166', ebr:'M 222 166 Q 237 173 249 166', mo:'M 177 237 Q 200 225 223 237', ar:'rotate(28,285,383)' },
    wave:    { el:{rx:18,ry:20}, er:{rx:16,ry:18}, ebl:'M 149 163 Q 164 156 179 163', ebr:'M 221 163 Q 236 156 251 163', mo:'M 174 227 Q 200 246 226 227', ar:'rotate(-54,285,358)' },
  };

  function applyEm(root, state, pfx) {
    var e = EM[state] || EM.happy;
    function q(s) { return root.querySelector('#' + pfx + s); }
    var elG = q('el'), erG = q('er');
    var el = elG && elG.querySelector('ellipse');
    var er = erG && erG.querySelector('ellipse');
    if (el) { el.setAttribute('rx', e.el.rx); el.setAttribute('ry', e.el.ry); }
    if (er) { er.setAttribute('rx', e.er.rx); er.setAttribute('ry', e.er.ry); }
    var ebl = q('ebl'), ebr = q('ebr'), mo = q('mo'), ar = q('ar');
    if (ebl) ebl.setAttribute('d', e.ebl);
    if (ebr) ebr.setAttribute('d', e.ebr);
    if (mo)  mo.setAttribute('d', e.mo);
    if (ar && e.ar) ar.setAttribute('transform', e.ar);
    if (state === 'wave') doWave(root, pfx);
  }

  function doWave(root, pfx) {
    var arm = root.querySelector('#' + pfx + 'ar');
    if (!arm) return;
    var ph = 0;
    var iv = setInterval(function () {
      ph += 0.14;
      arm.setAttribute('transform', 'rotate(' + (-50 + Math.sin(ph * Math.PI) * 24) + ',285,358)');
      if (ph >= 2.1) { clearInterval(iv); arm.setAttribute('transform', 'rotate(16,285,383)'); }
    }, 28);
  }

  function startBlink(root, pfx) {
    function doBlink() {
      var el = root.querySelector('#' + pfx + 'el ellipse');
      var er = root.querySelector('#' + pfx + 'er ellipse');
      var ry0l = parseFloat((el && el.getAttribute('ry')) || 19);
      var ry0r = parseFloat((er && er.getAttribute('ry')) || 17);
      var ph = 0;
      var iv = setInterval(function () {
        ph += 0.18;
        var v = Math.sin(ph * Math.PI);
        if (el) el.setAttribute('ry', Math.max(1.5, ry0l * (1 - v)));
        if (er) er.setAttribute('ry', Math.max(1.5, ry0r * (1 - v)));
        if (ph >= 1) {
          clearInterval(iv);
          if (el) el.setAttribute('ry', ry0l);
          if (er) er.setAttribute('ry', ry0r);
          setTimeout(doBlink, 2200 + Math.random() * 3200);
        }
      }, 28);
    }
    setTimeout(doBlink, 1800 + Math.random() * 2000);
  }

  function startEyeTrack(root, pfx) {
    var svg = root.querySelector('svg');
    document.addEventListener('mousemove', function (ev) {
      if (!svg) return;
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      var sc = rect.width / 400;
      var ecx = rect.left + 164 * sc;
      var ecy = rect.top  + 186 * sc;
      var dx = (ev.clientX - ecx) / (window.innerWidth  * 0.55);
      var dy = (ev.clientY - ecy) / (window.innerHeight * 0.55);
      var ox = Math.max(-5, Math.min(5, dx * 6));
      var oy = Math.max(-4, Math.min(4, dy * 5));
      var pl = root.querySelector('#' + pfx + 'pl');
      var pr = root.querySelector('#' + pfx + 'pr');
      if (pl) { pl.setAttribute('cx', 169 + ox); pl.setAttribute('cy', 180 + oy); }
      if (pr) { pr.setAttribute('cx', 241 + ox); pr.setAttribute('cy', 180 + oy); }
    }, { passive: true });
  }

  function startAntenna(root, pfx) {
    var ant = root.querySelector('#' + pfx + 'ant');
    if (!ant) return;
    var t = 0;
    (function tick() {
      t += 0.05;
      ant.setAttribute('cy', 19 + Math.sin(t * 2.6) * 3.2);
      requestAnimationFrame(tick);
    })();
  }

  function initHero() {
    var wrap = document.querySelector('.elara-wrap');
    if (!wrap) return;
    var div = document.createElement('div');
    div.id = 'elaraHeroDiv';
    div.style.cssText = 'width:100%;max-width:320px;margin:0 auto;';
    div.innerHTML = makeSVG('eh');
    wrap.innerHTML = '';
    wrap.appendChild(div);
    var root = document.getElementById('elaraHeroDiv');
    startBlink(root, 'eh');
    startEyeTrack(root, 'eh');
    startAntenna(root, 'eh');
    applyEm(root, 'happy', 'eh');
    window.elaraSetEmotion = function (s) { applyEm(root, s, 'eh'); };
  }

  function initFloat() {
    var el = document.createElement('div');
    el.id = 'elaraFloat';
    el.style.position  = 'fixed';
    el.style.bottom    = '92px';
    el.style.left      = '-110px';
    el.style.width     = '84px';
    el.style.zIndex    = '260';
    el.style.pointerEvents = 'none';
    el.style.transition = 'left 1.5s cubic-bezier(0.34,1.45,0.64,1),bottom 1.2s cubic-bezier(0.34,1.45,0.64,1)';
    el.style.display   = 'none';

    var bubbleEl = document.createElement('div');
    bubbleEl.id = 'elaraFloatBubble';
    bubbleEl.style.cssText = [
      'position:absolute', 'bottom:calc(100% + 6px)', 'left:50%', 'transform:translateX(-50%)',
      'background:white', 'border:1.5px solid #44ABAD', 'border-radius:10px 10px 10px 3px',
      'padding:5px 9px', 'font-size:10.5px', 'font-weight:700', 'color:#0d3347',
      'white-space:nowrap', 'opacity:0', 'transition:opacity 0.35s',
      "font-family:'Inter',sans-serif", 'box-shadow:0 3px 14px rgba(68,171,173,0.22)',
      'pointer-events:none',
    ].join(';');

    var svgWrap = document.createElement('div');
    svgWrap.id = 'elaraFloatSVG';
    svgWrap.style.cssText = 'width:84px;filter:drop-shadow(0 5px 18px rgba(68,171,173,0.3));';
    svgWrap.innerHTML = makeSVG('ef');

    el.appendChild(bubbleEl);
    el.appendChild(svgWrap);
    document.body.appendChild(el);

    var froot = document.getElementById('elaraFloatSVG');
    var bubble = document.getElementById('elaraFloatBubble');

    startBlink(froot, 'ef');
    startAntenna(froot, 'ef');
    applyEm(froot, 'happy', 'ef');

    var ft = 0;
    (function bob() {
      ft += 0.04;
      el.style.transform = 'translateY(' + (Math.sin(ft) * 7) + 'px)';
      requestAnimationFrame(bob);
    })();

    function showBubble(msg) {
      bubble.textContent = msg;
      bubble.style.opacity = '1';
      setTimeout(function () { bubble.style.opacity = '0'; }, 3200);
    }

    function flyTo(left, bottom, msg, em) {
      el.style.left   = left + 'px';
      el.style.bottom = bottom + 'px';
      if (msg) setTimeout(function () { showBubble(msg); }, 900);
      if (em)  setTimeout(function () { applyEm(froot, em, 'ef'); }, 550);
    }

    var vw = window.innerWidth;
    var stops = [
      { id:'pain',         left:36,                         bottom:130, msg:'\u{1F625} I understand the worry...', em:'worried' },
      { id:'demo',         left:Math.max(0, vw - 130),      bottom:120, msg:'✨ Look what I can do!',          em:'excited' },
      { id:'features',     left:36,                         bottom:130, msg:'\u{1F48A} I’ve got you!',        em:'happy'   },
      { id:'testimonials', left:Math.max(0, vw - 130),      bottom:120, msg:'\u{1F499} Families trust me!',        em:'happy'   },
      { id:'founding',     left:Math.round(vw / 2 - 42),   bottom:116, msg:'\u{1F389} Join me today!',            em:'wave'    },
    ];

    stops.forEach(function (s) {
      var sec = document.getElementById(s.id);
      if (!sec) return;
      new IntersectionObserver(function (ents) {
        if (ents[0].isIntersecting) flyTo(s.left, s.bottom, s.msg, s.em);
      }, { threshold: 0.22 }).observe(sec);
    });

    var hero = document.querySelector('.hero');
    if (hero) {
      new IntersectionObserver(function (ents) {
        if (!ents[0].isIntersecting) {
          el.style.display = 'block';
          setTimeout(function () { flyTo(36, 92, '👋 Hi! Follow me!', 'wave'); }, 80);
        } else {
          el.style.left = '-110px';
          setTimeout(function () { el.style.display = 'none'; }, 1500);
        }
      }, { threshold: 0.1 }).observe(hero);
    }
  }

  function boot() { initHero(); initFloat(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
