/* Elara — Canvas 2D mascot matching the Carely brand character */
(function () {
  'use strict';

  const canvas = document.getElementById('elaraCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 380, H = 456;
  let t = 0;
  let emotion = 'happy';
  let blinkT = 0, nextBlink = 3 + Math.random() * 2.5, blinking = false, blinkPh = 0;
  let mx = 0.5, my = 0.5;

  function resize() {
    var p = canvas.parentElement;
    if (!p) return;
    var w = p.getBoundingClientRect().width || p.offsetWidth || 340;
    if (w < 10) w = 340;
    W = Math.round(w);
    H = Math.round(W * 1.2);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }
  window.addEventListener('resize', resize, { passive: true });

  /* Init after layout is painted */
  function start() {
    resize();
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { requestAnimationFrame(start); });
  } else {
    requestAnimationFrame(start);
  }

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
  }, { passive: true });

  function radGlow(x, y, r, rgb, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame() {
    requestAnimationFrame(frame);
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    var s  = W / 380;
    var cx = W / 2;
    var floatY = Math.sin(t * 0.9) * 11 * s + Math.sin(t * 0.38) * 5 * s;
    var cy = H * 0.50 + floatY;
    var tilt = Math.sin(t * 0.58) * 0.016;
    var glow = 0.48 + Math.sin(t * 1.9) * 0.13;
    var bodyR = 95 * s;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.translate(-cx, -cy);

    /* ── BACKGROUND HALO ── */
    radGlow(cx, cy, 240 * s, '68,171,173', glow * 0.16);
    radGlow(cx, cy, 140 * s, '46,232,160', glow * 0.07);

    /* ── EARS ── */
    ctx.fillStyle = '#2d8899';
    ctx.beginPath();
    ctx.ellipse(cx - bodyR * 0.87, cy - 10 * s, 13 * s, 17 * s, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + bodyR * 0.87, cy - 10 * s, 13 * s, 17 * s, 0.22, 0, Math.PI * 2);
    ctx.fill();

    /* ── MAIN BODY ── */
    ctx.shadowColor = 'rgba(68,171,173,' + (0.35 + glow * 0.2) + ')';
    ctx.shadowBlur = 30 * s;

    var bg = ctx.createRadialGradient(cx - 28 * s, cy - 28 * s, 6 * s, cx, cy, bodyR * 1.1);
    bg.addColorStop(0, '#64cbcc');
    bg.addColorStop(0.42, '#44ABAD');
    bg.addColorStop(1, '#2d8899');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    /* Body highlight */
    var hi = ctx.createRadialGradient(cx - 30 * s, cy - 30 * s, 0, cx - 30 * s, cy - 30 * s, 56 * s);
    hi.addColorStop(0, 'rgba(255,255,255,0.22)');
    hi.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hi;
    ctx.beginPath();
    ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
    ctx.fill();

    /* ── FACE PLATE ── */
    var trackX = (mx - 0.5) * 7 * s;
    var trackY = (my - 0.5) * 5 * s;
    var fpX = cx + trackX;
    var fpY = cy - 6 * s + trackY;
    var fpW = 58 * s, fpH = 53 * s;

    ctx.shadowColor = 'rgba(13,43,56,0.16)';
    ctx.shadowBlur = 10 * s;
    ctx.shadowOffsetY = 3 * s;

    var fp = ctx.createRadialGradient(fpX - 10 * s, fpY - 10 * s, 2 * s, fpX, fpY, fpW);
    fp.addColorStop(0, '#ffffff');
    fp.addColorStop(1, '#e6f8f5');
    ctx.fillStyle = fp;
    ctx.beginPath();
    ctx.ellipse(fpX, fpY, fpW, fpH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    /* ── BLINK ── */
    blinkT += 0.016;
    if (!blinking && blinkT > nextBlink) {
      blinking = true; blinkPh = 0; blinkT = 0;
      nextBlink = 2.4 + Math.random() * 4;
    }
    var blinkScale = 1;
    if (blinking) {
      blinkPh += 0.22;
      blinkScale = Math.max(0.06, 1 - Math.sin(blinkPh * Math.PI));
      if (blinkPh >= 1) { blinking = false; blinkScale = 1; }
    }

    /* ── EYES ── */
    var eyeSX = 19 * s, eyeSY = -5 * s;
    var eyeR  = emotion === 'excited' ? 11 * s : 9.5 * s;

    [[fpX - eyeSX, fpY + eyeSY], [fpX + eyeSX, fpY + eyeSY]].forEach(function (pos) {
      var ex = pos[0], ey = pos[1];
      ctx.save();
      ctx.translate(ex, ey);
      ctx.scale(1, blinkScale);

      if (emotion === 'worried') {
        ctx.fillStyle = '#0d1a1e';
        ctx.beginPath();
        ctx.arc(0, eyeR * 0.4, eyeR * 0.88, Math.PI, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillStyle = '#0d1a1e';
        ctx.beginPath();
        ctx.arc(0, 0, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(-eyeR * 0.3, -eyeR * 0.32, eyeR * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    /* ── MOUTH ── */
    var mY = fpY + 23 * s;
    ctx.strokeStyle = '#0d1a1e';
    ctx.lineWidth = 2.8 * s;
    ctx.lineCap = 'round';

    if (emotion === 'happy' || emotion === 'wave') {
      ctx.beginPath();
      ctx.arc(fpX, mY - 5 * s, 14 * s, 0.1, Math.PI - 0.1);
      ctx.stroke();
    } else if (emotion === 'excited') {
      ctx.beginPath();
      ctx.arc(fpX, mY - 5 * s, 16 * s, 0, Math.PI);
      var ef = ctx.createRadialGradient(fpX, mY, 0, fpX, mY, 20 * s);
      ef.addColorStop(0, 'rgba(230,248,245,0.9)');
      ef.addColorStop(1, 'rgba(230,248,245,0)');
      ctx.fillStyle = ef;
      ctx.fill();
      ctx.stroke();
    } else if (emotion === 'worried') {
      ctx.beginPath();
      ctx.arc(fpX, mY + 5 * s, 12 * s, Math.PI + 0.25, 2 * Math.PI - 0.25);
      ctx.stroke();
    }

    /* ── ANTENNA ── */
    var antBob = Math.sin(t * 2.4);
    var aBX = cx + 25 * s, aBY = cy - bodyR + 6 * s;
    var aTX = cx + 36 * s + antBob * 6 * s;
    var aTY = cy - bodyR - 50 * s + antBob * 3.5 * s;
    var antGlow = 0.65 + glow * 0.35;

    ctx.strokeStyle = '#1e6070';
    ctx.lineWidth = 5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(aBX, aBY);
    ctx.lineTo(aTX, aTY);
    ctx.stroke();

    var antRGB = emotion === 'excited' ? '68,221,140' : emotion === 'worried' ? '244,145,58' : '46,232,160';
    radGlow(aTX, aTY, 26 * s, antRGB, antGlow * 0.55);

    ctx.shadowColor = 'rgba(' + antRGB + ',0.85)';
    ctx.shadowBlur = 14 * s;
    var aGr = ctx.createRadialGradient(aTX - 3 * s, aTY - 3 * s, 1 * s, aTX, aTY, 11 * s);
    aGr.addColorStop(0, 'rgba(' + antRGB + ',1)');
    aGr.addColorStop(1, '#00c890');
    ctx.fillStyle = aGr;
    ctx.beginPath();
    ctx.arc(aTX, aTY, 10.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    /* ── ARMS ── */
    function drawArm(side, extraRot) {
      var ax = cx + side * (bodyR - 8 * s);
      var ay = cy + 6 * s;
      var rot = side * (Math.PI / 2 + 0.38) + extraRot;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(rot);
      /* arm tube */
      ctx.fillStyle = '#2d8899';
      ctx.beginPath();
      ctx.ellipse(0, 18 * s, 9 * s, 21 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      /* hand nub */
      ctx.fillStyle = '#44ABAD';
      ctx.beginPath();
      ctx.arc(0, 37 * s, 9.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    var armL = emotion === 'wave' ? Math.sin(t * 4.2) * 0.52 - 0.55 : Math.sin(t * 1.1) * 0.07;
    var armR = Math.sin(t * 1.15 + 0.5) * 0.07;
    drawArm(-1, armL);
    drawArm(1, armR);

    /* ── FEET ── */
    [[-24, 0], [24, 0]].forEach(function (p) {
      ctx.fillStyle = '#2d8899';
      ctx.beginPath();
      ctx.ellipse(cx + p[0] * s, cy + bodyR - 5 * s, 20 * s, 12 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    /* ── HEART BADGE ── */
    var hX = cx + 4 * s, hY = cy + 30 * s;
    var hS = 1.55 * s;
    radGlow(hX, hY, 30 * s, '68,171,173', 0.28);

    ctx.shadowColor = 'rgba(13,43,56,0.2)';
    ctx.shadowBlur = 6 * s;
    ctx.fillStyle = '#3aa9aa';
    ctx.save();
    ctx.translate(hX, hY);
    ctx.scale(hS, hS);
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.bezierCurveTo(-12, -20, -25, -2, 0, 14);
    ctx.bezierCurveTo(25, -2, 12, -20, 0, -5);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    /* Cross on heart */
    var cS = 3.6 * s;
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    ctx.beginPath();
    ctx.rect(hX - cS * 0.43, hY - cS * 1.12, cS * 0.86, cS * 2.24);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(hX - cS * 1.12, hY - cS * 0.43, cS * 2.24, cS * 0.86);
    ctx.fill();

    ctx.restore(); /* end tilt */
  }

  /* Emotion API */
  window.elaraSetEmotion = function (state) {
    emotion = state || 'happy';
    /* Reset antenna glow speed per emotion */
    switch (state) {
      case 'excited': break;
      case 'worried': break;
      case 'wave':    break;
      default: break;
    }
  };
})();
