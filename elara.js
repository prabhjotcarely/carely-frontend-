/* Elara — Three.js 3D animated character */
(function () {
  const canvas = document.getElementById('elaraCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 0.35, 5.4);
  camera.lookAt(0, 0.1, 0);

  /* ── Lights ── */
  scene.add(new THREE.AmbientLight(0xd4f5f0, 0.72));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(4, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x00d4b8, 0.5);
  fill.position.set(-4, 2, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x002233, 0.35);
  rim.position.set(0, -4, -5);
  scene.add(rim);

  /* ── Materials ── */
  const teal  = new THREE.MeshStandardMaterial({ color: 0x00C9A7, roughness: 0.22, metalness: 0.28 });
  const tealD = new THREE.MeshStandardMaterial({ color: 0x028090, roughness: 0.32, metalness: 0.35 });
  const tealDD= new THREE.MeshStandardMaterial({ color: 0x016878, roughness: 0.4,  metalness: 0.4  });
  const face  = new THREE.MeshStandardMaterial({ color: 0xecfaf6, roughness: 0.6,  metalness: 0.0  });
  const eye   = new THREE.MeshStandardMaterial({ color: 0x071820, roughness: 0.12, metalness: 0.2  });
  const shine = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 0.0 });
  const glow  = new THREE.MeshStandardMaterial({ color: 0x00eec6, roughness: 0.08, metalness: 0.55, emissive: 0x00C9A7, emissiveIntensity: 0.45 });
  const ghost = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.5 });

  const mk = (geo, mat) => new THREE.Mesh(geo, mat);
  const sp = (r, m, s = 24) => mk(new THREE.SphereGeometry(r, s, s), m);
  const cy = (rt, rb, h, m, s = 14) => mk(new THREE.CylinderGeometry(rt, rb, h, s), m);

  /* ── Character ── */
  const char = new THREE.Group();
  scene.add(char);

  /* head */
  const headG = new THREE.Group();
  char.add(headG);
  headG.position.y = 0.68;

  const headM = sp(0.74, teal);
  headM.scale.set(1.0, 1.07, 0.95);
  headG.add(headM);

  /* face plate */
  const faceM = sp(0.59, face);
  faceM.scale.set(1.0, 0.97, 0.28);
  faceM.position.set(0, 0.0, 0.5);
  headG.add(faceM);

  /* eyes */
  const eyeL = sp(0.112, eye);
  eyeL.position.set(-0.2, 0.085, 0.7);
  headG.add(eyeL);

  const eyeR = sp(0.093, eye);
  eyeR.position.set(0.192, 0.044, 0.695);
  headG.add(eyeR);

  /* eye shines */
  const sL = sp(0.035, shine, 8);
  sL.position.set(-0.167, 0.12, 0.795);
  headG.add(sL);
  const sR = sp(0.028, shine, 8);
  sR.position.set(0.217, 0.078, 0.773);
  headG.add(sR);

  /* ear bumps */
  const earL = sp(0.16, tealD, 16);
  earL.scale.set(0.58, 0.62, 0.46);
  earL.position.set(-0.76, 0.05, -0.02);
  headG.add(earL);
  const earR = sp(0.16, tealD, 16);
  earR.scale.set(0.58, 0.62, 0.46);
  earR.position.set(0.76, 0.05, -0.02);
  headG.add(earR);

  /* antenna */
  const antStick = cy(0.018, 0.018, 0.45, tealD);
  antStick.position.set(0.26, 0.98, 0);
  antStick.rotation.z = -0.2;
  headG.add(antStick);
  const antBall = sp(0.078, glow, 16);
  antBall.position.set(0.345, 1.205, 0);
  headG.add(antBall);

  /* body */
  const bodyG = new THREE.Group();
  char.add(bodyG);
  bodyG.position.y = -0.24;

  const bodyM = sp(0.48, teal, 32);
  bodyM.scale.set(1.0, 1.42, 0.9);
  bodyG.add(bodyM);

  /* belly glow */
  const bellyM = sp(0.15, ghost, 16);
  bellyM.scale.set(1.0, 1.0, 0.22);
  bellyM.position.set(0, 0.04, 0.44);
  bodyG.add(bellyM);

  /* arms */
  const armLM = cy(0.078, 0.065, 0.34, tealD);
  armLM.position.set(-0.64, -0.06, 0.05);
  armLM.rotation.z = Math.PI / 2 + 0.38;
  armLM.rotation.x = 0.1;
  bodyG.add(armLM);

  const armRM = cy(0.078, 0.065, 0.34, tealD);
  armRM.position.set(0.64, -0.06, 0.05);
  armRM.rotation.z = -(Math.PI / 2 + 0.38);
  armRM.rotation.x = 0.1;
  bodyG.add(armRM);

  /* feet */
  const feetG = new THREE.Group();
  feetG.position.y = -0.66;
  char.add(feetG);

  const footL = sp(0.21, tealDD, 16);
  footL.scale.set(1.32, 0.62, 1.08);
  footL.position.set(-0.23, 0, 0.06);
  feetG.add(footL);
  const footR = sp(0.21, tealDD, 16);
  footR.scale.set(1.32, 0.62, 1.08);
  footR.position.set(0.23, 0, 0.06);
  feetG.add(footR);

  char.position.y = -0.18;

  /* ── Animation ── */
  let t = 0;
  let mx = 0, my = 0;
  let blinkT = 0, nextBlink = 3.2 + Math.random() * 2.8;
  let blinking = false, blinkPhase = 0;

  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 1.6;
  }, { passive: true });

  function tick() {
    requestAnimationFrame(tick);
    t += 0.016;

    /* organic float */
    char.position.y = -0.18 + Math.sin(t * 0.88) * 0.088 + Math.sin(t * 0.39) * 0.042;
    char.rotation.z = Math.sin(t * 0.56) * 0.016;

    /* head mouse tracking */
    headG.rotation.y += (mx * 0.3 - headG.rotation.y) * 0.06;
    headG.rotation.x += (-my * 0.17 - headG.rotation.x) * 0.06;

    /* antenna wobble */
    const aw = Math.sin(t * 2.3) * 0.11;
    antStick.rotation.z = -0.2 + aw;
    antBall.position.x = 0.345 + Math.sin(t * 2.3) * 0.06;
    antBall.position.y = 1.205 + Math.cos(t * 2.3) * 0.045;

    /* arm idle */
    armRM.rotation.z = -(Math.PI / 2 + 0.38) + Math.sin(t * 1.1) * 0.09;

    /* blink */
    blinkT += 0.016;
    if (!blinking && blinkT > nextBlink) {
      blinking = true; blinkPhase = 0;
      blinkT = 0; nextBlink = 2.5 + Math.random() * 4.5;
    }
    if (blinking) {
      blinkPhase += 0.16;
      const v = Math.sin(blinkPhase * Math.PI);
      eyeL.scale.y = Math.max(0.07, 1 - v * 0.93);
      eyeR.scale.y = Math.max(0.07, 1 - v * 0.93);
      if (blinkPhase >= 1) { blinking = false; eyeL.scale.y = 1; eyeR.scale.y = 1; }
    }

    renderer.render(scene, camera);
  }

  tick();

  /* ── Responsive ── */
  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.offsetWidth || 320;
    const h = Math.round(w * 1.18);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();
})();
