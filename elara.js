/* Elara — Three.js mascot, bright + vibrant */
(function () {
  const canvas = document.getElementById('elaraCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding || 'srgb';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0.18, 4.6);
  camera.lookAt(0, 0, 0);

  /* ── Lights — strong, punchy ── */
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(3, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x80ffec, 1.2);
  fill.position.set(-4, 1, 3);
  scene.add(fill);
  const top = new THREE.DirectionalLight(0xffffff, 1.0);
  top.position.set(0, 8, 2);
  scene.add(top);
  const pt = new THREE.PointLight(0x00ffcc, 1.4, 8);
  pt.position.set(0, 1.5, 3.5);
  scene.add(pt);

  /* ── Materials ── */
  const M = {
    main:  new THREE.MeshStandardMaterial({ color: 0x04D9B5, roughness: 0.08, metalness: 0.05, emissive: 0x00A892, emissiveIntensity: 0.22 }),
    dark:  new THREE.MeshStandardMaterial({ color: 0x02A88C, roughness: 0.15, metalness: 0.05, emissive: 0x007060, emissiveIntensity: 0.15 }),
    base:  new THREE.MeshStandardMaterial({ color: 0x017060, roughness: 0.2,  metalness: 0.05, emissive: 0x004840, emissiveIntensity: 0.12 }),
    face:  new THREE.MeshStandardMaterial({ color: 0xf8fffd, roughness: 0.45, metalness: 0.0,  emissive: 0xddfff8, emissiveIntensity: 0.12 }),
    eye:   new THREE.MeshStandardMaterial({ color: 0x071215, roughness: 0.05, metalness: 0.3  }),
    shine: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.8, roughness: 0.0, metalness: 0 }),
    glow:  new THREE.MeshStandardMaterial({ color: 0x00ffd0, roughness: 0.05, metalness: 0.6,  emissive: 0x00efc0, emissiveIntensity: 0.9 }),
    ghost: new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.5 }),
  };

  const sp = (r, m, s = 28) => new THREE.Mesh(new THREE.SphereGeometry(r, s, s), m);
  const cy = (rt, rb, h, m, s = 14) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m);

  /* ── CHARACTER ── */
  const char = new THREE.Group();
  scene.add(char);

  /* --- HEAD --- */
  const headG = new THREE.Group();
  char.add(headG);
  headG.position.y = 0.7;

  // Main head sphere
  const headM = sp(0.76, M.main);
  headM.scale.set(1.0, 1.08, 0.97);
  headG.add(headM);

  // Face plate — bright white, clearly visible
  const faceM = sp(0.62, M.face);
  faceM.scale.set(0.98, 0.95, 0.24);
  faceM.position.set(0, 0.02, 0.52);
  headG.add(faceM);

  // LEFT EYE — larger, more expressive
  const eyeL = sp(0.13, M.eye);
  eyeL.scale.set(1.0, 1.15, 0.85);
  eyeL.position.set(-0.21, 0.1, 0.72);
  headG.add(eyeL);

  // RIGHT EYE
  const eyeR = sp(0.108, M.eye);
  eyeR.scale.set(1.0, 0.88, 0.85);
  eyeR.position.set(0.2, 0.05, 0.715);
  headG.add(eyeR);

  // Eye shines — bigger, brighter
  const shL = sp(0.042, M.shine, 8);
  shL.position.set(-0.174, 0.145, 0.828);
  headG.add(shL);
  const shR = sp(0.034, M.shine, 8);
  shR.position.set(0.226, 0.087, 0.808);
  headG.add(shR);

  // Ear bumps
  [-0.78, 0.78].forEach((x, i) => {
    const ear = sp(0.17, M.dark, 16);
    ear.scale.set(0.55, 0.62, 0.44);
    ear.position.set(x, 0.06, -0.02);
    headG.add(ear);
  });

  // Antenna
  const antS = cy(0.02, 0.02, 0.48, M.dark);
  antS.position.set(0.27, 1.02, 0);
  antS.rotation.z = -0.22;
  headG.add(antS);
  const antB = sp(0.085, M.glow, 16);
  antB.position.set(0.362, 1.245, 0);
  headG.add(antB);

  /* --- BODY --- */
  const bodyG = new THREE.Group();
  char.add(bodyG);
  bodyG.position.y = -0.26;

  const bodyM = sp(0.5, M.main, 32);
  bodyM.scale.set(1.0, 1.38, 0.92);
  bodyG.add(bodyM);

  // Belly glow circle
  const bellyM = sp(0.16, M.ghost, 16);
  bellyM.scale.set(1.0, 1.0, 0.18);
  bellyM.position.set(0, 0.05, 0.46);
  bodyG.add(bellyM);

  // Arms
  const armL = cy(0.082, 0.068, 0.36, M.dark);
  armL.position.set(-0.66, -0.05, 0.05);
  armL.rotation.z = Math.PI / 2 + 0.4;
  armL.rotation.x = 0.1;
  bodyG.add(armL);

  const armR = cy(0.082, 0.068, 0.36, M.dark);
  armR.position.set(0.66, -0.05, 0.05);
  armR.rotation.z = -(Math.PI / 2 + 0.4);
  armR.rotation.x = 0.1;
  bodyG.add(armR);

  /* --- FEET --- */
  const feetG = new THREE.Group();
  feetG.position.y = -0.68;
  char.add(feetG);

  [-0.24, 0.24].forEach(x => {
    const foot = sp(0.22, M.base, 16);
    foot.scale.set(1.35, 0.6, 1.1);
    foot.position.set(x, 0, 0.07);
    feetG.add(foot);
  });

  char.position.y = -0.12;

  /* ── Animation ── */
  let t = 0, mx = 0, my = 0;
  let blinkT = 0, nextBlink = 3.0 + Math.random() * 2.5, blinking = false, blinkPh = 0;

  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 1.5;
  }, { passive: true });

  function tick() {
    requestAnimationFrame(tick);
    t += 0.016;

    // Organic float — two sine waves for natural feel
    char.position.y = -0.12 + Math.sin(t * 0.9) * 0.09 + Math.sin(t * 0.38) * 0.04;
    char.rotation.z = Math.sin(t * 0.58) * 0.018;

    // Head follows mouse
    headG.rotation.y += (mx * 0.32 - headG.rotation.y) * 0.058;
    headG.rotation.x += (-my * 0.18 - headG.rotation.x) * 0.058;

    // Antenna bounce
    const aw = Math.sin(t * 2.4) * 0.13;
    antS.rotation.z = -0.22 + aw;
    antB.position.x = 0.362 + Math.sin(t * 2.4) * 0.07;
    antB.position.y = 1.245 + Math.cos(t * 2.4) * 0.05;

    // Antenna glow pulse
    M.glow.emissiveIntensity = 0.7 + Math.sin(t * 3.2) * 0.25;

    // Arm idle sway
    armR.rotation.z = -(Math.PI / 2 + 0.4) + Math.sin(t * 1.15) * 0.1;

    // Blink
    blinkT += 0.016;
    if (!blinking && blinkT > nextBlink) {
      blinking = true; blinkPh = 0; blinkT = 0;
      nextBlink = 2.4 + Math.random() * 5.0;
    }
    if (blinking) {
      blinkPh += 0.17;
      const v = Math.sin(blinkPh * Math.PI);
      eyeL.scale.y = Math.max(0.06, 1.15 - v * 1.09);
      eyeR.scale.y = Math.max(0.06, 0.88 - v * 0.82);
      if (blinkPh >= 1) { blinking = false; eyeL.scale.y = 1.15; eyeR.scale.y = 0.88; }
    }

    // Point light follows antenna glow
    pt.intensity = 1.2 + Math.sin(t * 3.2) * 0.25;

    renderer.render(scene, camera);
  }

  tick();

  /* ── Responsive ── */
  function resize() {
    const p = canvas.parentElement;
    if (!p) return;
    const w = p.offsetWidth || 340;
    const h = Math.round(w * 1.2);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();
})();
