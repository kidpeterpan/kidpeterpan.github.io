// Hero 3D scene — low-poly coding desk: a MacBook writing code by itself,
// coffee-shop cup and books alongside, all in a slow spin.
// Built from Three.js primitives only (no model files). Colors follow the
// "Plus Ultra Paper" palette in assets/css/main.css. The static logo <img>
// stays as the fallback and is hidden only after the first successful frame.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

(function () {
  const heroArt = document.querySelector('.hero-art');
  if (!heroArt) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-cat';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // no WebGL — keep the static logo
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  // Pulled back far enough that the desk's corners stay inside the frame at
  // every spin angle (sweep radius ≈ 1.7 world units around the pivot).
  camera.position.set(0, 2.6, 5.8);
  camera.lookAt(0, 1.35, 0);

  // ---------- palette ----------
  const C = {
    gold: 0xd9a53a,
    goldDeep: 0xb5821f,
    cream: 0xfdfbf4,
    green: 0x1c5c49,
    greenDeep: 0x123e31,
    greenBright: 0x2e8c66,
    ink: 0x0f211b,
    red: 0xc23b2e,
    sky: 0x4d9fd8,
    pink: 0xe8938c,
    aluminum: 0xb9bdc4,
    keys: 0x3a4148,
  };

  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign(
      { color, roughness: 0.85, metalness: 0, flatShading: true }, opts));
  }

  function put(parent, geo, material, x, y, z) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  // Spinner pivot at scene origin — the desk is already centered on it.
  const root = new THREE.Group();
  const world = new THREE.Group();
  root.add(world);
  scene.add(root);

  // ---------- desk ----------
  const deskMat = mat(C.green);
  put(world, new THREE.BoxGeometry(2.9, 0.18, 1.7), deskMat, 0, 1.5, 0);
  const legGeo = new THREE.BoxGeometry(0.14, 1.41, 0.14);
  const legMat = mat(C.greenDeep);
  [[-1.3, 0.68], [1.3, 0.68], [-1.3, -0.68], [1.3, -0.68]].forEach(([x, z]) => {
    put(world, legGeo, legMat, x, 0.705, z);
  });

  // ---------- MacBook ----------
  const alu = mat(C.aluminum, { roughness: 0.5, metalness: 0.35 });
  put(world, new THREE.BoxGeometry(1.15, 0.05, 0.75), alu, 0, 1.615, -0.45);
  put(world, new THREE.BoxGeometry(0.95, 0.015, 0.4), mat(C.keys, { roughness: 0.95 }), 0, 1.645, -0.55);
  put(world, new THREE.BoxGeometry(0.34, 0.012, 0.2), mat(C.keys, { roughness: 0.6 }), 0, 1.645, -0.2);

  // Screen half, hinged at the back edge of the base, tilted back like an open laptop.
  const screenGroup = new THREE.Group();
  screenGroup.position.set(0, 1.64, -0.075);
  screenGroup.rotation.x = 0.4;
  world.add(screenGroup);
  put(screenGroup, new THREE.BoxGeometry(1.15, 0.75, 0.04), alu, 0, 0.37, 0);

  // Live "code" texture on the display side (faces the viewer at rest).
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 256;
  screenCanvas.height = 168;
  const sctx = screenCanvas.getContext('2d');
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  const lineColors = ['#4cc893', '#e9bc52', '#6fb7e8', '#e25a4c', '#eaf3ed'];
  let codeLines = [];
  function drawScreen() {
    sctx.fillStyle = '#0a1410';
    sctx.fillRect(0, 0, 256, 168);
    sctx.fillStyle = '#16281f';
    sctx.fillRect(0, 0, 256, 20);
    ['#e25a4c', '#e9bc52', '#4cc893'].forEach((c, i) => {
      sctx.fillStyle = c;
      sctx.beginPath();
      sctx.arc(14 + i * 16, 10, 4, 0, Math.PI * 2);
      sctx.fill();
    });
    codeLines.forEach((l, i) => {
      sctx.fillStyle = l.color;
      sctx.fillRect(14 + l.indent, 32 + i * 16, l.width, 7);
    });
    screenTex.needsUpdate = true;
  }
  function typeLine() {
    if (codeLines.length >= 8) codeLines = [];
    codeLines.push({
      width: 40 + Math.random() * 150,
      indent: Math.random() < 0.4 ? 22 : 0,
      color: lineColors[Math.floor(Math.random() * lineColors.length)],
    });
    drawScreen();
  }
  typeLine(); typeLine(); typeLine();

  const display = put(screenGroup,
    new THREE.PlaneGeometry(1.03, 0.63),
    new THREE.MeshBasicMaterial({ map: screenTex }),
    0, 0.37, -0.021);
  display.rotation.y = Math.PI;

  // Glowing dot on the lid (visible from the front while spinning).
  const lidGlow = put(screenGroup,
    new THREE.CircleGeometry(0.09, 20),
    new THREE.MeshBasicMaterial({ color: C.cream }),
    0, 0.4, 0.021);

  // ---------- desk props ----------
  // Coffee-shop to-go cup: white cone cup, white lid, green circle badge.
  const cup = new THREE.Group();
  cup.position.set(0.95, 1.59, 0.25);
  world.add(cup);
  const cupWhite = mat(0xffffff, { roughness: 0.6 });
  put(cup, new THREE.CylinderGeometry(0.115, 0.085, 0.3, 14), cupWhite, 0, 0.15, 0);
  put(cup, new THREE.CylinderGeometry(0.128, 0.122, 0.05, 14), cupWhite, 0, 0.325, 0);
  put(cup, new THREE.CylinderGeometry(0.05, 0.062, 0.035, 10), cupWhite, 0, 0.365, 0);
  put(cup, new THREE.CircleGeometry(0.055, 16),
    new THREE.MeshBasicMaterial({ color: 0x00704a }), 0, 0.17, 0.104);

  put(world, new THREE.BoxGeometry(0.55, 0.09, 0.4), mat(C.sky), -1.05, 1.635, 0.3);
  const topBook = put(world, new THREE.BoxGeometry(0.48, 0.09, 0.35), mat(C.greenBright), -1.08, 1.725, 0.28);
  topBook.rotation.y = 0.25;

  // ---------- lights (fixed while the model spins) ----------
  const hemi = new THREE.HemisphereLight(0xfff6e0, 0xcfc4a6, 1.25);
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(C.sky, 0.6);
  rim.position.set(-4, 3, -3);
  scene.add(hemi, key, rim);

  function applyTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    if (dark) {
      hemi.color.set(0x9fd8c0);
      hemi.groundColor.set(0x0a1410);
      hemi.intensity = 0.6;
      key.color.set(0xdfeee6);
      key.intensity = 1.0;
      rim.intensity = 0.9;
      lidGlow.material.color.set(0xe9bc52);
    } else {
      hemi.color.set(0xfff6e0);
      hemi.groundColor.set(0xcfc4a6);
      hemi.intensity = 1.25;
      key.color.set(0xffffff);
      key.intensity = 1.7;
      rim.intensity = 0.6;
      lidGlow.material.color.set(C.cream);
    }
  }
  applyTheme();
  new MutationObserver(() => {
    applyTheme();
    // While paused (offscreen / reduced motion) no frame is coming — repaint once.
    if (!running) renderStatic();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---------- sizing ----------
  function resize() {
    const w = canvas.clientWidth || 340;
    const h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // ---------- animation ----------
  const SPIN = (Math.PI * 2) / 32; // one revolution every 32s, near the ring's 34s
  let t = 0;
  let last = 0;
  let typeTimer = 0;
  let rafId = 0;
  let running = false;

  function animate(now) {
    rafId = requestAnimationFrame(animate);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;

    root.rotation.y = -0.5 + t * SPIN;

    // new "code line" on screen every so often
    typeTimer += dt;
    if (typeTimer > 0.45) {
      typeTimer = 0;
      typeLine();
    }

    renderer.render(scene, camera);
  }

  function start() {
    if (running || reducedMotion.matches) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(animate);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function renderStatic() {
    root.rotation.y = -0.5;
    renderer.render(scene, camera);
  }

  // ---------- mount ----------
  heroArt.appendChild(canvas);
  resize();
  try {
    renderStatic(); // first frame; only now is it safe to hide the logo
  } catch (e) {
    canvas.remove();
    return;
  }
  heroArt.classList.add('is-3d');

  new ResizeObserver(resize).observe(canvas);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
  });
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (isOnScreen()) start();
  });
  function isOnScreen() {
    const r = canvas.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      stop();
      renderStatic();
    } else {
      start();
    }
  });
})();
