(function BlockShotOnline() {
  'use strict';
  document.addEventListener('contextmenu', e => e.preventDefault());

  let playerData = { nickname: '', email: '', isVisitor: false, kills: 0, headshots: 0, score: 0 };
  let isRegistering = false;
  let playerHP = 100;
  let selectedWeaponType = 'revolver';
  let isAiming = false;
  let isMouseDown = false;

  // Scope estilo AWP com bolinha vermelha no centro
  const scopeOverlay = document.createElement('div');
  scopeOverlay.id = 'awp-scope';
  scopeOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,1) 60%);
    display: none; pointer-events: none; z-index: 10;
  `;
  scopeOverlay.innerHTML = `
    <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: #000;"></div>
    <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 100%; background: #000;"></div>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; background: #ff0000; border: 2px solid #8b0000; border-radius: 50%;"></div>
  `;
  document.body.appendChild(scopeOverlay);

  // CONSOLE CS (' ou ")
  const consoleEl = document.getElementById('cs-console');
  const consoleInput = document.getElementById('cs-console-input');
  const consoleOutput = document.getElementById('cs-console-output');

  window.addEventListener('keydown', e => {
    if (e.key === "'" || e.key === '"') {
      if (document.activeElement === consoleInput) return;
      e.preventDefault();
      const isOpen = consoleEl.style.display === 'flex';
      consoleEl.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) consoleInput.focus();
    }
  });

  consoleInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = consoleInput.value.trim();
      consoleOutput.innerHTML += `<br>> ${val}`;
      if (val.toLowerCase() === 'tk admin') {
        consoleOutput.innerHTML += `<br><span style="color:#f39c12">Abrindo autenticação de Admin...</span>`;
        consoleEl.style.display = 'none';
        document.getElementById('admin-modal').style.display = 'flex';
      } else {
        consoleOutput.innerHTML += `<br><span style="color:#e74c3c">Comando desconhecido. Digite 'tk admin'</span>`;
      }
      consoleInput.value = '';
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
  });

  // SELEÇÃO DE ARMAS (MENU E PAUSA)
  function setupWeaponSelectors(selectorClass) {
    document.querySelectorAll(selectorClass).forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll(selectorClass).forEach(b => { b.classList.add('sec'); b.classList.remove('active'); });
        const targetWeapon = e.target.getAttribute('data-weapon');
        document.querySelectorAll(`[data-weapon="${targetWeapon}"]`).forEach(b => {
          b.classList.remove('sec');
          b.classList.add('active');
        });
        selectedWeaponType = targetWeapon;
        if (playing || !inMainMenu) initWeapon();
      });
    });
  }
  setupWeaponSelectors('.weapon-select');
  setupWeaponSelectors('.weapon-select-pause');

  // AUTENTICAÇÃO E TELAS
  const authScreen = document.getElementById('auth-screen');
  const menuScreenEl = document.getElementById('main-menu-screen');
  const pauseScreenEl = document.getElementById('pause-screen');
  const authFormArea = document.getElementById('auth-form-area');
  const authModeChoice = document.getElementById('auth-mode-choice');

  document.getElementById('play-visitor-btn').addEventListener('click', () => {
    playerData = { nickname: 'Visitante_' + Math.floor(Math.random()*1000), email: '', isVisitor: true, kills: 0, headshots: 0, score: 0 };
    enterMainMenu();
  });

  document.getElementById('go-login-btn').addEventListener('click', () => {
    authModeChoice.style.display = 'none';
    authFormArea.style.display = 'block';
    isRegistering = false;
    updateAuthFormUI();
  });

  document.getElementById('auth-back-btn').addEventListener('click', () => {
    authFormArea.style.display = 'none';
    authModeChoice.style.display = 'block';
  });

  const toggleRegMode = document.getElementById('toggle-reg-mode');
  toggleRegMode.addEventListener('click', () => {
    isRegistering = !isRegistering;
    updateAuthFormUI();
  });

  function updateAuthFormUI() {
    document.getElementById('auth-form-title').textContent = isRegistering ? 'Criar Nova Conta' : 'Login';
    document.getElementById('auth-nickname').style.display = isRegistering ? 'block' : 'none';
    document.getElementById('age-check-box').style.display = isRegistering ? 'block' : 'none';
    toggleRegMode.textContent = isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se';
  }

  document.getElementById('auth-submit-btn').addEventListener('click', () => {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if (!email || !pass) { alert("Preencha todos os campos!"); return; }

    if (isRegistering) {
      const nick = document.getElementById('auth-nickname').value.trim();
      const ageChecked = document.getElementById('auth-age').checked;
      if (!nick) { alert("Informe um Nickname!"); return; }
      if (!ageChecked) { alert("Você deve confirmar a caixa de idade livre!"); return; }
      
      playerData = { nickname: nick, email: email, isVisitor: false, kills: 0, headshots: 0, score: 0 };
      alert("Conta criada com sucesso!");
      enterMainMenu();
    } else {
      playerData = { nickname: email.split('@')[0], email: email, isVisitor: false, kills: 12, headshots: 5, score: 145 };
      enterMainMenu();
    }
  });

  function enterMainMenu() {
    authScreen.style.display = 'none';
    menuScreenEl.style.display = 'flex';
    if (pauseScreenEl) pauseScreenEl.style.display = 'none';
    document.getElementById('welcome-player-title').textContent = `OLÁ, ${playerData.nickname.toUpperCase()}`;
    document.getElementById('stat-kills').textContent = playerData.kills;
    document.getElementById('stat-hs').textContent = playerData.headshots;
    document.getElementById('stat-score').textContent = playerData.score;
    document.getElementById('stat-mode-label').textContent = playerData.isVisitor ? 'VISITANTE' : 'CLOUDFLARE SECURE';
  }

  document.getElementById('logout-btn').addEventListener('click', () => {
    menuScreenEl.style.display = 'none';
    authScreen.style.display = 'flex';
    authFormArea.style.display = 'none';
    authModeChoice.style.display = 'block';
  });

  document.getElementById('admin-auth-submit').addEventListener('click', () => {
    const u = document.getElementById('admin-user-input').value;
    const p = document.getElementById('admin-pass-input').value;
    if (u === 'tk_master' && p === 'TKTI@ADMIN2026') {
      document.getElementById('admin-modal').style.display = 'none';
      document.getElementById('admin-dashboard-modal').style.display = 'flex';
      loadAdminDashboardData();
    } else {
      alert("Credenciais Inválidas!");
    }
  });

  document.getElementById('close-admin-modal').addEventListener('click', () => document.getElementById('admin-modal').style.display = 'none');
  document.getElementById('close-dashboard-btn').addEventListener('click', () => document.getElementById('admin-dashboard-modal').style.display = 'none');

  function loadAdminDashboardData() {
    document.getElementById('admin-list-container').innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:4px;">
        <span><b>${playerData.nickname}</b></span>
        <div>
          <button style="background:#e67e22; border:none; color:#fff; cursor:pointer;" onclick="alert('Kick executado!')">KICK</button>
          <button style="background:#c0392b; border:none; color:#fff; cursor:pointer;" onclick="alert('Banido!')">BAN</button>
        </div>
      </div>`;
  }

  // ============ WEB AUDIO API ============
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    
    if (type === 'revolver') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);
      gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    } else if (type === 'smg') {
      osc.type = 'square'; osc.frequency.setValueAtTime(320, now); osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      gain.gain.setValueAtTime(0.35, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    } else if (type === 'sniper') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(160, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
      gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    } else if (type === 'headshot') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(987.77, now); osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    } else if (type === 'hit') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    }
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.4);
  }

  // ============ THREE.JS: CENA E MUNDO 3D ============
  const FOG = 0xf2b09a;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG, 25, 110);

  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 600);
  camera.position.set(0, 1.7, 0);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Céu
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; void main(){
        float h = clamp(normalize(vP).y, 0.0, 1.0);
        vec3 horizon = vec3(1.0, 0.80, 0.58);
        vec3 mid     = vec3(0.96, 0.66, 0.64);
        vec3 top     = vec3(0.80, 0.54, 0.66);
        vec3 c = mix(horizon, mid, smoothstep(0.0, 0.25, h));
        c = mix(c, top, smoothstep(0.2, 0.9, h));
        gl_FragColor = vec4(c, 1.0); }`
    })
  );
  scene.add(sky);

  // Luzes
  const sunDir = new THREE.Vector3(-1, 0.16, -0.7).normalize();
  const sun = new THREE.DirectionalLight(0xffb06a, 1.25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 160 });
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xffc7b0, 0x6a8a30, 0.75));

  const sunDisc = new THREE.Group();
  sunDisc.add(new THREE.Mesh(new THREE.PlaneGeometry(90, 90),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.35, fog: false, depthWrite: false })));
  sunDisc.add(new THREE.Mesh(new THREE.PlaneGeometry(28, 28),
    new THREE.MeshBasicMaterial({ color: 0xfffbe8, fog: false, depthWrite: false })));
  scene.add(sunDisc);

  // Chão Gramado
  const FIELD = 50;
  const cv = document.createElement('canvas'); cv.width = cv.height = 16;
  const cx = cv.getContext('2d');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const g = 110 + Math.random() * 50;
    cx.fillStyle = `rgb(${g * 0.55 | 0},${g | 0},${g * 0.25 | 0})`; cx.fillRect(x, y, 1, 1);
  }
  const gTex = new THREE.CanvasTexture(cv);
  gTex.magFilter = THREE.NearestFilter; gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping;
  gTex.repeat.set(FIELD * 2, FIELD * 2);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(FIELD * 2 + 80, FIELD * 2 + 80),
    new THREE.MeshLambertMaterial({ map: gTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const rand = (a, b) => a + Math.random() * (b - a);
  const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  function instanced(geo, n) {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.frustumCulled = false;
    scene.add(m); return m;
  }

  const GRASS = 7000, grass = instanced(boxGeo(0.16, 1, 0.16), GRASS), d = new THREE.Object3D();
  for (let i = 0; i < GRASS; i++) {
    const h = rand(0.25, 0.7);
    d.position.set(rand(-FIELD, FIELD), h / 2, rand(-FIELD, FIELD));
    d.scale.set(1, h, 1); d.rotation.y = rand(0, 3); d.updateMatrix();
    grass.setMatrixAt(i, d.matrix);
    grass.setColorAt(i, new THREE.Color().setHSL(rand(0.19, 0.25), 0.65, rand(0.28, 0.42)));
  }

  const PALETTE = [0xc0221f, 0xf2c230, 0x8a3fc4, 0xf4f4f0, 0xe0509a, 0x3a5fd0];
  const NF = 1600;
  const stems = instanced(boxGeo(0.07, 1, 0.07), NF);
  const petA = instanced(boxGeo(0.46, 0.1, 0.17), NF);
  const petB = instanced(boxGeo(0.17, 0.1, 0.46), NF);
  const core = instanced(boxGeo(0.15, 0.13, 0.15), NF);
  const flowers = [];
  for (let i = 0; i < NF; i++) {
    const f = { x: rand(-FIELD, FIELD), z: rand(-FIELD, FIELD), h: rand(0.5, 1.1), ph: rand(0, 6.28), ry: rand(0, 3.14) };
    const c = new THREE.Color(PALETTE[(Math.random() * PALETTE.length) | 0]);
    stems.setColorAt(i, new THREE.Color(0x3f7a22));
    petA.setColorAt(i, c); petB.setColorAt(i, c);
    core.setColorAt(i, new THREE.Color(f.h > 0.8 ? 0xd99a1e : 0xf2b620));
    flowers.push(f);
  }
  const headMat = new THREE.Matrix4(), tmp = new THREE.Matrix4();
  function updateFlowers(t) {
    for (let i = 0; i < NF; i++) {
      const f = flowers[i];
      d.position.set(f.x, 0, f.z);
      d.rotation.set(Math.sin(t * 1.6 + f.ph) * 0.14, f.ry, Math.cos(t * 1.3 + f.ph * 1.7) * 0.14);
      d.scale.set(1, 1, 1); d.updateMatrix();
      tmp.makeScale(1, f.h, 1).setPosition(0, f.h / 2, 0);
      stems.setMatrixAt(i, headMat.multiplyMatrices(d.matrix, tmp));
      tmp.makeTranslation(0, f.h, 0); petA.setMatrixAt(i, headMat.multiplyMatrices(d.matrix, tmp));
      petB.setMatrixAt(i, headMat);
      tmp.makeTranslation(0, f.h + 0.08, 0); core.setMatrixAt(i, headMat.multiplyMatrices(d.matrix, tmp));
    }
    [stems, petA, petB, core].forEach(m => m.instanceMatrix.needsUpdate = true);
  }

  const obstacles = [], obstacleBoxes = [];
  function addSolidBlock(x, y, z, w, h, depth, color) {
    const m = new THREE.Mesh(boxGeo(w, h, depth), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true;
    scene.add(m); obstacles.push(m);
    obstacleBoxes.push(new THREE.Box3().setFromObject(m));
    return m;
  }

  const wallH = 6, wallThick = 2;
  addSolidBlock(0, 0, -FIELD - wallThick/2, FIELD * 2, wallH, wallThick, 0x736c63);
  addSolidBlock(0, 0, FIELD + wallThick/2, FIELD * 2, wallH, wallThick, 0x736c63);
  addSolidBlock(-FIELD - wallThick/2, 0, 0, wallThick, wallH, FIELD * 2, 0x736c63);
  addSolidBlock(FIELD + wallThick/2, 0, 0, wallThick, wallH, FIELD * 2, 0x736c63);

  for (let y = 0; y < 10; y++) {
    const w = 6 - y * 0.25;
    addSolidBlock(0, y * 1.2, 0, w, 1.2, w, y % 2 === 0 ? 0x8c857b : 0x736c63);
  }
  addSolidBlock(0, 12, 0, 4.8, 2.2, 4.8, 0x5c2c16);
  const millBlades = new THREE.Group();
  millBlades.position.set(0, 10.5, 2.8);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Mesh(boxGeo(0.3, 7.5, 0.1), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
    arm.position.set(0, 3.5, 0);
    const pivot = new THREE.Group(); pivot.rotation.z = (Math.PI / 2) * i; pivot.add(arm); millBlades.add(pivot);
  }
  scene.add(millBlades);

  function createAppleTree(tx, tz) {
    addSolidBlock(tx, 0, tz, 1.2, 4.5, 1.2, 0x5c3a21);
    for (let lx = -2; lx <= 2; lx++) {
      for (let ly = 3.8; ly <= 6.8; ly += 0.9) {
        for (let lz = -2; lz <= 2; lz++) {
          if (Math.abs(lx) + Math.abs(lz) <= 3) {
            addSolidBlock(tx + lx * 0.9, ly, tz + lz * 0.9, 0.95, 0.95, 0.95, (lx + lz) % 2 === 0 ? 0x2e7d32 : 0x1b5e20);
          }
        }
      }
    }
  }
  [[26, -18], [-28, 20], [32, 28], [-24, -28], [18, 35], [-32, -12], [35, -30]].forEach(([tx, tz]) => createAppleTree(tx, tz));
  [[-22, -18], [25, 16], [-30, -20], [28, -22]].forEach(([hx, hz]) => addSolidBlock(hx, 0, hz, 1.5, 1.0, 1.5, 0xd4ac0d));

  function isPositionSafe(px, pz, radius = 0.6) {
    const testBox = new THREE.Box3(new THREE.Vector3(px - radius, 0, pz - radius), new THREE.Vector3(px + radius, 2, pz + radius));
    for (let i = 0; i < obstacleBoxes.length; i++) { if (testBox.intersectsBox(obstacleBoxes[i])) return false; }
    return true;
  }
  function findSafeSpawn(minR = 12, maxR = 25) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const angle = Math.random() * Math.PI * 2, dist = rand(minR, maxR);
      const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
      if (isPositionSafe(x, z)) return new THREE.Vector3(x, 1.7, z);
    }
    return new THREE.Vector3(15, 1.7, 15);
  }
  camera.position.copy(findSafeSpawn(10, 20));

  const controls = new THREE.PointerLockControls(camera, renderer.domElement);
  const crosshairEl = document.getElementById('cross');
  let playing = false, inMainMenu = true;

  document.getElementById('play-game-btn').addEventListener('click', () => {
    inMainMenu = false;
    menuScreenEl.style.display = 'none';
    if (pauseScreenEl) pauseScreenEl.style.display = 'none';
    document.getElementById('score').style.display = 'block';
    document.getElementById('room-info').style.display = 'block';
    hud.style.display = 'block';
    crosshairEl.style.display = 'block';
    initWeapon();
    controls.lock();
  });

  const resumeBtn = document.getElementById('resume-btn');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      if (pauseScreenEl) pauseScreenEl.style.display = 'none';
      controls.lock();
    });
  }

  const exitBtn = document.getElementById('exit-to-main-btn');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (pauseScreenEl) pauseScreenEl.style.display = 'none';
      menuScreenEl.style.display = 'flex';
      inMainMenu = true;
      document.getElementById('score').style.display = 'none';
      document.getElementById('room-info').style.display = 'none';
      hud.style.display = 'none';
      crosshairEl.style.display = 'none';
    });
  }

  controls.addEventListener('lock', () => { 
    playing = true; 
    if (pauseScreenEl) pauseScreenEl.style.display = 'none';
  });

  controls.addEventListener('unlock', () => { 
    playing = false; 
    isAiming = false;
    scopeOverlay.style.display = 'none';
    crosshairEl.style.display = 'block';
    camera.fov = 75;
    camera.updateProjectionMatrix();
    if (!inMainMenu && pauseScreenEl) {
      document.getElementById('pause-kills').textContent = playerData.kills;
      document.getElementById('pause-hs').textContent = playerData.headshots;
      document.getElementById('pause-score').textContent = playerData.score;
      pauseScreenEl.style.display = 'flex';
    }
  });

  addEventListener('keydown', e => {
    if ((e.code === 'KeyB' || e.code === 'Escape') && playing) {
      controls.unlock();
    }
    if (e.code === 'KeyR' && playing) {
      startReload();
    }
  });

  const keys = {};
  addEventListener('keydown', e => keys[e.code] = true);
  addEventListener('keyup', e => keys[e.code] = false);

  const gun = new THREE.Group();
  camera.add(gun);
  const flash = new THREE.Mesh(boxGeo(0.2, 0.2, 0.12), new THREE.MeshBasicMaterial({ color: 0xffe28a, fog: false }));
  flash.position.set(0, 0.045, -0.42); flash.visible = false; gun.add(flash);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.045, -0.42); gun.add(muzzle);
  gun.position.set(0.28, -0.26, -0.55);

  let W = { name: '', ammo: 6, mag: 6, reserve: 36, headDmg: 100, bodyDmg: 35, rate: 0.65, cd: 0, reloading: false, rt: 0, soundType: 'revolver' };

  function initWeapon() {
    isAiming = false;
    scopeOverlay.style.display = 'none';
    crosshairEl.style.display = 'block';
    camera.fov = 75;
    camera.updateProjectionMatrix();

    while(gun.children.length > 2) gun.remove(gun.children[2]);
    const gm = (c) => new THREE.MeshLambertMaterial({ color: c });
    const part = (w, h, dd, c, x, y, z) => { const m = new THREE.Mesh(boxGeo(w, h, dd), gm(c)); m.position.set(x, y, z); gun.add(m); return m; };

    if (selectedWeaponType === 'revolver') {
      W = { name: 'REVÓLVER (.38)', ammo: 6, mag: 6, reserve: 36, headDmg: 100, bodyDmg: 35, rate: 0.65, cd: 0, reloading: false, rt: 0, soundType: 'revolver' };
      part(0.08, 0.13, 0.32, 0x5a5a62, 0, 0.02, -0.12);
      part(0.06, 0.06, 0.28, 0x303035, 0, 0.05, -0.34);
      part(0.12, 0.12, 0.14, 0x8a8a92, 0, 0.02, -0.1);
      part(0.08, 0.22, 0.12, 0x6b4423, 0, -0.14, 0.08);
    } else if (selectedWeaponType === 'smg') {
      W = { name: 'METRALHADORA', ammo: 20, mag: 20, reserve: 100, headDmg: 25, bodyDmg: 10, rate: 0.12, cd: 0, reloading: false, rt: 0, soundType: 'smg' };
      part(0.09, 0.14, 0.45, 0x3a3a40, 0, 0.02, -0.15);
      part(0.05, 0.05, 0.35, 0x1a1a1e, 0, 0.06, -0.45);
      part(0.06, 0.26, 0.10, 0x222225, 0, -0.16, -0.05);
      part(0.07, 0.18, 0.09, 0x2a2a2e, 0, -0.14, 0.12);
    } else if (selectedWeaponType === 'sniper') {
      W = { name: 'SNIPER RIFLE', ammo: 1, mag: 1, reserve: 15, headDmg: 100, bodyDmg: 90, rate: 1.2, cd: 0, reloading: false, rt: 0, soundType: 'sniper' };
      part(0.07, 0.11, 0.70, 0x243024, 0, 0.02, -0.2);
      part(0.04, 0.04, 0.55, 0x151815, 0, 0.05, -0.55);
      part(0.07, 0.08, 0.30, 0x111, 0, 0.12, -0.2);
      part(0.08, 0.13, 0.30, 0x4a3319, 0, 0.0, 0.22);
    }
    updateHud();
  }

  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.style.cssText = `position: fixed; left: 22px; bottom: 18px; color: #fff; font-size: 16px; letter-spacing: 1px; text-shadow: 2px 2px 0 #000; pointer-events: none; z-index: 2; display: none;`;
  document.body.appendChild(hud);

  function updateHud() {
    hud.innerHTML = `${W.name} | VIDA: <b>${Math.max(0, Math.round(playerHP))}</b><br><b>${W.reloading ? 'RECARREGANDO...' : W.ammo + ' / ' + W.reserve}</b>`;
  }

  const BM = { black: new THREE.MeshLambertMaterial({ color: 0x161618 }), red: new THREE.MeshLambertMaterial({ color: 0xd01e1e }), eye: new THREE.MeshBasicMaterial({ color: 0xff4040 }) };
  const bots = [];
  function makeBot() {
    const g = new THREE.Group();
    const addB = (w, h, dd, m, x, y, z, isHead = false) => { 
      const b = new THREE.Mesh(boxGeo(w, h, dd), m); 
      b.position.set(x, y, z); 
      b.castShadow = true; 
      b.userData.head = isHead; 
      g.add(b); 
    };
    addB(0.55, 0.65, 0.35, BM.black, 0, 0.95, 0);
    addB(0.45, 0.45, 0.45, BM.black, 0, 1.55, 0, true);
    addB(0.1, 0.1, 0.05, BM.eye, -0.1, 1.6, 0.24);
    addB(0.1, 0.1, 0.05, BM.eye, 0.1, 1.6, 0.24);
    addB(0.18, 0.55, 0.18, BM.red, -0.38, 0.95, 0);
    addB(0.18, 0.55, 0.18, BM.red, 0.38, 0.95, 0);
    addB(0.2, 0.6, 0.2, BM.black, -0.15, 0.3, 0);
    addB(0.2, 0.6, 0.2, BM.black, 0.15, 0.3, 0);
    
    g.position.copy(findSafeSpawn(12, 38)); g.position.y = 0; g.scale.setScalar(1.5);
    g.userData = { target: new THREE.Vector3(), t: 0, ph: Math.random() * 6, hp: 100 };
    scene.add(g); bots.push(g);
  }
  for (let i = 0; i < 6; i++) makeBot();
  let spawnTimer = 0;

  const ray = new THREE.Raycaster();
  const lasers = [];
  let flashT = 0;

  function triggerHeadshotEffect() {
    const hsEl = document.getElementById('hs-indicator');
    if (hsEl) {
      hsEl.classList.add('show');
      setTimeout(() => hsEl.classList.remove('show'), 600);
    }
  }

  // Controle de clique e soltar botão do mouse (Scope abre ao segurar e fecha ao soltar)
  addEventListener('mousedown', e => {
    if (!playing) return;

    if (e.button === 2 && selectedWeaponType === 'sniper') {
      isAiming = true;
      camera.fov = 20;
      camera.updateProjectionMatrix();
      scopeOverlay.style.display = 'block';
      crosshairEl.style.display = 'none';
      return;
    }

    if (e.button === 0) {
      isMouseDown = true;
      fireWeapon();
    }
  });

  addEventListener('mouseup', e => {
    if (!playing) return;

    // Ao soltar o botão direito, o scope da sniper fecha e volta ao normal
    if (e.button === 2 && selectedWeaponType === 'sniper') {
      isAiming = false;
      camera.fov = 75;
      camera.updateProjectionMatrix();
      scopeOverlay.style.display = 'none';
      crosshairEl.style.display = 'block';
      return;
    }

    if (e.button === 0) {
      isMouseDown = false;
    }
  });

  function fireWeapon() {
    if (!playing || W.cd > 0 || W.reloading) return;
    if (W.ammo <= 0) { startReload(); return; }
    W.ammo--; W.cd = W.rate;
    playSound(W.soundType);
    updateHud();

    ray.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = ray.intersectObjects([...bots, ...obstacles], true);
    const from = new THREE.Vector3(); muzzle.getWorldPosition(from);
    let to = ray.ray.at(70, new THREE.Vector3());

    if (hits.length) {
      to = hits[0].point.clone();
      let hitObj = hits[0].object, curr = hitObj;
      while (curr && curr.parent) { if (bots.includes(curr)) break; curr = curr.parent; }
      if (curr && bots.includes(curr)) {
        const isHead = hitObj.userData.head;
        const dmg = isHead ? W.headDmg : W.bodyDmg;
        curr.userData.hp -= dmg;
        playSound(isHead ? 'headshot' : 'hit');

        if (curr.userData.hp <= 0) {
          scene.remove(curr); bots.splice(bots.indexOf(curr), 1);
          playerData.kills++;
          if (isHead) {
            playerData.headshots++;
            triggerHeadshotEffect();
          }
          playerData.score = playerData.kills * 10;
          document.getElementById('score').textContent = 'PONTOS: ' + playerData.score;
        }
      }
    }

    const l = new THREE.Mesh(boxGeo(0.03, 0.03, from.distanceTo(to)), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
    l.position.copy(from).lerp(to, 0.5); l.lookAt(to); l.userData.life = 0.12;
    scene.add(l); lasers.push(l);
    flash.visible = true; flashT = 0.05;

    if (W.ammo <= 0) {
      startReload();
    }
  }

  function startReload() {
    if (W.reloading || W.reserve <= 0 || W.ammo === W.mag) return;
    W.reloading = true;
    W.rt = 1.2;
    updateHud();
  }

  const clock = new THREE.Clock();
  const fwdVector = new THREE.Vector3(), sideVector = new THREE.Vector3();

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (W.cd > 0) W.cd -= dt;

    if (isMouseDown && selectedWeaponType === 'smg' && playing && W.cd <= 0 && !W.reloading) {
      fireWeapon();
    }

    if (W.reloading) {
      W.rt -= dt;
      if (W.rt <= 0) {
        const needed = W.mag - W.ammo;
        const take = Math.min(needed, W.reserve);
        W.ammo += take;
        W.reserve -= take;
        W.reloading = false;
        updateHud();
      }
    }

    if (playing) {
      const sp = 7 * dt;
      const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
      const r = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      
      camera.getWorldDirection(fwdVector); fwdVector.y = 0; fwdVector.normalize();
      sideVector.crossVectors(fwdVector, camera.up).normalize();

      const moveX = (fwdVector.x * f + sideVector.x * r) * sp;
      const moveZ = (fwdVector.z * f + sideVector.z * r) * sp;

      if (isPositionSafe(camera.position.x + moveX, camera.position.z)) camera.position.x += moveX;
      if (isPositionSafe(camera.position.x, camera.position.z + moveZ)) camera.position.z += moveZ;
      camera.position.y = 1.7;
    } else if (inMainMenu) {
      const camR = 24;
      camera.position.x = Math.cos(t * 0.12) * camR;
      camera.position.z = Math.sin(t * 0.12) * camR;
      camera.position.y = 7;
      camera.lookAt(0, 2, 0);
    }

    updateFlowers(t);
    millBlades.rotation.z += dt * 0.8;

    sky.position.copy(camera.position);
    sunDisc.position.copy(camera.position).addScaledVector(sunDir, 350); sunDisc.lookAt(camera.position);
    sun.position.copy(camera.position).addScaledVector(sunDir, 70); sun.target.position.copy(camera.position);

    spawnTimer += dt;
    if (bots.length < 8 && spawnTimer > 1.5) { makeBot(); spawnTimer = 0; }
    bots.forEach(b => {
      const u = b.userData; u.t -= dt;
      if (u.t <= 0) { u.target.set(rand(-FIELD + 3, FIELD - 3), 0, rand(-FIELD + 3, FIELD - 3)); u.t = rand(4, 9); }
      if (playing) {
        const dist = b.position.distanceTo(camera.position);
        if (dist < 12) u.target.copy(camera.position);
        if (dist < 2.2) {
          playerHP -= 15 * dt; updateHud();
          const flashEl = document.getElementById('damage-flash');
          if (flashEl) { flashEl.style.background = 'rgba(255,0,0,0.4)'; setTimeout(() => flashEl.style.background = 'rgba(255,0,0,0)', 100); }
          if (playerHP <= 0) { 
            playerHP = 100; 
            camera.position.copy(findSafeSpawn(10, 18));
            isAiming = false;
            scopeOverlay.style.display = 'none';
            crosshairEl.style.display = 'block';
            camera.fov = 75;
            camera.updateProjectionMatrix();
            initWeapon();
          }
        }
      }
      const dir = u.target.clone().sub(b.position); dir.y = 0;
      if (dir.length() > 0.5) {
        dir.normalize(); b.position.addScaledVector(dir, 2.0 * dt);
        b.rotation.y = Math.atan2(dir.x, dir.z);
      }
      b.position.y = Math.abs(Math.sin(t * 5 + u.ph)) * 0.08;
    });

    if (flashT > 0 && (flashT -= dt) <= 0) flash.visible = false;
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i]; l.userData.life -= dt;
      if (l.userData.life <= 0) { scene.remove(l); lasers.splice(i, 1); }
    }

    renderer.render(scene, camera);
  }

  loop();
})();