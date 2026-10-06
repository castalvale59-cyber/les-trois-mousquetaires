import * as THREE from "three";

// ---------- Éléments de la page ----------

const canvas = document.getElementById("jeu");
const hud = document.getElementById("hud");
const ecran = document.getElementById("ecran");
const ecranTexte = document.getElementById("ecran-texte");
const boutonJouer = document.getElementById("jouer");
const boutonTheme = document.getElementById("bouton-theme");
const vagueEl = document.getElementById("vague");
const restantsEl = document.getElementById("restants");
const scoreEl = document.getElementById("score");
const recordEl = document.getElementById("record");
const vieEl = document.getElementById("vie");
const barreVie = document.getElementById("barre-vie");
const etatArme = document.getElementById("etat-arme");
const barreArme = document.getElementById("barre-arme");
const annonceEl = document.getElementById("annonce");
const toucheEl = document.getElementById("touche");
const degatsEl = document.getElementById("degats");

// ---------- Réglages ----------

const LIMITE = 28.5; // demi-largeur de la cour
const HAUTEUR_YEUX = 1.7;
const RAYON_JOUEUR = 0.4;
const VITESSE_MARCHE = 6;
const VITESSE_COURSE = 9.5;
const GRAVITE = 22;
const SAUT = 7.5;
const RECHARGEMENT = 1.1; // secondes pour recharger le mousquet
const RECUP_BAIONNETTE = 0.6;
const SENSIBILITE = 0.0022;

const PORTES = [
  new THREE.Vector3(0, 0, -27.5),
  new THREE.Vector3(0, 0, 27.5),
  new THREE.Vector3(-27.5, 0, 0),
  new THREE.Vector3(27.5, 0, 0),
];

// ---------- Moteur 3D ----------

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 250);
camera.rotation.order = "YXZ";
scene.add(camera);

function redimensionner() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", redimensionner);
redimensionner();

// ---------- Lumières (jour / nuit) ----------

const ciel = new THREE.HemisphereLight(0xffffff, 0x554433, 1);
scene.add(ciel);

const soleil = new THREE.DirectionalLight(0xffffff, 1);
soleil.position.set(20, 35, 12);
soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048);
Object.assign(soleil.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 90 });
soleil.shadow.bias = -0.0005;
scene.add(soleil);

const torches = [];

const AMBIANCES = {
  clair: { ciel: 0x9fcbe8, brume: [40, 140], hemi: 1.0, soleil: 1.7, couleurSoleil: 0xfff1d6, torche: 0.6 },
  sombre: { ciel: 0x0a0f2a, brume: [15, 75], hemi: 0.22, soleil: 0.35, couleurSoleil: 0x8fa5ff, torche: 3.2 },
};

function appliquerAmbiance(theme) {
  const a = AMBIANCES[theme] || AMBIANCES.sombre;
  scene.background = new THREE.Color(a.ciel);
  scene.fog = new THREE.Fog(a.ciel, a.brume[0], a.brume[1]);
  ciel.intensity = a.hemi;
  soleil.intensity = a.soleil;
  soleil.color.set(a.couleurSoleil);
  torches.forEach((t) => (t.intensity = a.torche));
}

// ---------- Textures dessinées à la main ----------

function textureMoellons(base, joint, colonnes, lignes, repetition) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = joint;
  g.fillRect(0, 0, 256, 256);
  const l = 256 / colonnes;
  const h = 256 / lignes;
  const couleur = new THREE.Color();
  for (let y = 0; y < lignes; y++) {
    const decalage = y % 2 ? l / 2 : 0;
    for (let x = -1; x <= colonnes; x++) {
      couleur.set(base).multiplyScalar(0.82 + Math.random() * 0.32);
      g.fillStyle = couleur.getStyle();
      g.fillRect(x * l + decalage + 2, y * h + 2, l - 4, h - 4);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetition[0], repetition[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Photo du visage collée sur la tête des gardes
function chargerVisage() {
  const t = new THREE.TextureLoader().load("visage.jpg");
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Matériaux ----------

const mat = {
  pave: new THREE.MeshStandardMaterial({ map: textureMoellons("#9c9284", "#5b544b", 4, 8, [14, 14]), roughness: 0.95 }),
  mur: new THREE.MeshStandardMaterial({ map: textureMoellons("#b3a68f", "#6e6455", 3, 6, [12, 2]), roughness: 0.9 }),
  pierre: new THREE.MeshStandardMaterial({ color: 0xa79c88, roughness: 0.9 }),
  ardoise: new THREE.MeshStandardMaterial({ color: 0x3d4a63, roughness: 0.7 }),
  bois: new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.85 }),
  boisFonce: new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.9 }),
  foin: new THREE.MeshStandardMaterial({ color: 0xd9b54a, roughness: 1 }),
  eau: new THREE.MeshStandardMaterial({ color: 0x3f7fb5, roughness: 0.15, metalness: 0.2 }),
  banniere: new THREE.MeshStandardMaterial({ color: 0x1f3c88, roughness: 0.8, side: THREE.DoubleSide }),
  or: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.8, roughness: 0.35 }),
  flamme: new THREE.MeshBasicMaterial({ color: 0xffa040 }),
  // Gardes du Cardinal
  tunique: new THREE.MeshStandardMaterial({ color: 0xa3121f, roughness: 0.8 }),
  tuniqueCapitaine: new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.7 }),
  blanc: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 }),
  culotte: new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.9 }),
  bottes: new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.7 }),
  peau: new THREE.MeshStandardMaterial({ color: 0xc99a7e, roughness: 0.8 }),
  cheveux: new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 1 }),
  visage: new THREE.MeshStandardMaterial({ map: chargerVisage(), roughness: 0.8 }),
  chapeau: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 }),
};

// ---------- Construction de la cour du château ----------

const obstacles = []; // boîtes de collision { minX, maxX, minZ, maxZ, h }
const decor = []; // objets qui arrêtent les balles

function ajouter(geo, matiere, x, y, z, { ombre = true, solide = true } = {}) {
  const m = new THREE.Mesh(geo, matiere);
  m.position.set(x, y, z);
  m.castShadow = ombre;
  m.receiveShadow = true;
  scene.add(m);
  if (solide) decor.push(m);
  return m;
}

function bloc(x, z, l, p, h) {
  obstacles.push({ minX: x - l / 2, maxX: x + l / 2, minZ: z - p / 2, maxZ: z + p / 2, h });
}

// Sol pavé
const sol = ajouter(new THREE.PlaneGeometry(64, 64), mat.pave, 0, 0, 0, { ombre: false });
sol.rotation.x = -Math.PI / 2;

// Remparts
const murs = [
  [0, -30, 62, 2],
  [0, 30, 62, 2],
  [-30, 0, 2, 62],
  [30, 0, 2, 62],
];
for (const [x, z, l, p] of murs) {
  ajouter(new THREE.BoxGeometry(l, 6, p), mat.mur, x, 3, z);
  bloc(x, z, l, p, 6);
}

// Créneaux en haut des remparts
const merlon = new THREE.BoxGeometry(1.2, 1, 1);
const positionsCreneaux = [];
for (let i = -29; i <= 29; i += 2.4) {
  positionsCreneaux.push([i, -30.4], [i, 30.4], [-30.4, i], [30.4, i]);
}
const creneaux = new THREE.InstancedMesh(merlon, mat.pierre, positionsCreneaux.length);
const m4 = new THREE.Matrix4();
positionsCreneaux.forEach(([x, z], i) => creneaux.setMatrixAt(i, m4.makeTranslation(x, 6.5, z)));
creneaux.castShadow = true;
scene.add(creneaux);

// Tours d'angle avec toits pointus
for (const [x, z] of [[-29, -29], [29, -29], [-29, 29], [29, 29]]) {
  ajouter(new THREE.CylinderGeometry(3.2, 3.6, 11, 16), mat.mur, x, 5.5, z);
  ajouter(new THREE.ConeGeometry(4, 5, 16), mat.ardoise, x, 13.5, z);
  bloc(x, z, 6.4, 6.4, 11);
}

// Portes par où arrivent les gardes, avec une torche de chaque côté
for (const porte of PORTES) {
  const surX = Math.abs(porte.x) > 1;
  const p = ajouter(
    new THREE.BoxGeometry(surX ? 0.3 : 4, 4.5, surX ? 4 : 0.3),
    mat.boisFonce,
    porte.x * 1.06, 2.25, porte.z * 1.06,
    { solide: false }
  );
  p.receiveShadow = true;
  for (const cote of [-1, 1]) {
    const tx = surX ? porte.x * 1.05 : cote * 3;
    const tz = surX ? cote * 3 : porte.z * 1.05;
    ajouter(new THREE.CylinderGeometry(0.06, 0.08, 0.7), mat.boisFonce, tx, 3.2, tz, { solide: false });
    ajouter(new THREE.SphereGeometry(0.14, 8, 8), mat.flamme, tx, 3.65, tz, { ombre: false, solide: false });
    const lumiere = new THREE.PointLight(0xff9a3c, 1, 16, 1.6);
    lumiere.position.set(tx * 0.97, 3.8, tz * 0.97);
    scene.add(lumiere);
    torches.push(lumiere);
  }
}

// Bannières bleues aux fleurs de lys dorées
for (const [x, z, ry] of [[-10, -28.9, 0], [10, -28.9, 0], [-10, 28.9, Math.PI], [10, 28.9, Math.PI]]) {
  const b = ajouter(new THREE.PlaneGeometry(1.8, 3.2), mat.banniere, x, 3.6, z, { solide: false });
  b.rotation.y = ry;
  const lys = ajouter(new THREE.CircleGeometry(0.35, 6), mat.or, x, 3.9, z + (ry ? -0.02 : 0.02), { ombre: false, solide: false });
  lys.rotation.y = ry;
}

// Fontaine au centre
ajouter(new THREE.CylinderGeometry(3, 3.2, 0.9, 24), mat.pierre, 0, 0.45, 0);
ajouter(new THREE.CylinderGeometry(2.6, 2.6, 0.1, 24), mat.eau, 0, 0.86, 0, { ombre: false });
ajouter(new THREE.CylinderGeometry(0.35, 0.45, 2.4, 12), mat.pierre, 0, 1.6, 0);
ajouter(new THREE.CylinderGeometry(0.9, 0.5, 0.35, 16), mat.pierre, 0, 2.8, 0);
bloc(0, 0, 6, 6, 0.9);

// Caisses
const caisse = new THREE.BoxGeometry(1.5, 1.5, 1.5);
for (const [x, z, y] of [
  [8, 6, 0], [9.6, 6, 0], [8.8, 6, 1.5], [-10, -8, 0], [-10, -9.6, 0], [14, -12, 0],
  [-15, 12, 0], [-13.4, 12, 0], [-14.2, 12, 1.5], [20, 18, 0], [-21, -18, 0], [4, -18, 0],
]) {
  const c = ajouter(caisse, mat.bois, x, y + 0.75, z);
  c.rotation.y = (x * 7 + z * 3) % 0.3;
  if (y === 0) bloc(x, z, 1.5, 1.5, 1.5);
}

// Tonneaux
const tonneau = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 14);
for (const [x, z] of [[6, -10], [7.1, -10.5], [-6, 10], [-6.6, 11], [18, -4], [-18, 3]]) {
  ajouter(tonneau, mat.boisFonce, x, 0.6, z);
  bloc(x, z, 1, 1, 1.2);
}

// Bottes de foin
for (const [x, z, rot] of [[18, 8, 0], [-20, -5, 1], [10, 20, 1], [-8, -22, 0]]) {
  const f = ajouter(new THREE.BoxGeometry(2.6, 1.2, 1.3), mat.foin, x, 0.6, z);
  f.rotation.y = rot ? Math.PI / 2 : 0;
  bloc(x, z, rot ? 1.3 : 2.6, rot ? 2.6 : 1.3, 1.2);
}

// Piliers de pierre
for (const [x, z] of [[12, 18], [-12, 18], [12, -20], [-12, -20], [22, -22], [-22, 22]]) {
  ajouter(new THREE.BoxGeometry(1.2, 4, 1.2), mat.pierre, x, 2, z);
  bloc(x, z, 1.2, 1.2, 4);
}

// ---------- Collisions ----------

function repousser(pos, rayon) {
  for (const b of obstacles) {
    const minX = b.minX - rayon;
    const maxX = b.maxX + rayon;
    const minZ = b.minZ - rayon;
    const maxZ = b.maxZ + rayon;
    if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
      // On ressort par le côté le plus proche
      const d = [pos.x - minX, maxX - pos.x, pos.z - minZ, maxZ - pos.z];
      const m = Math.min(...d);
      if (m === d[0]) pos.x = minX;
      else if (m === d[1]) pos.x = maxX;
      else if (m === d[2]) pos.z = minZ;
      else pos.z = maxZ;
    }
  }
  pos.x = THREE.MathUtils.clamp(pos.x, -LIMITE + rayon, LIMITE - rayon);
  pos.z = THREE.MathUtils.clamp(pos.z, -LIMITE + rayon, LIMITE - rayon);
}

function dansObstacle(p) {
  if (Math.abs(p.x) > LIMITE + 1 || Math.abs(p.z) > LIMITE + 1 || p.y < 0) return true;
  return obstacles.some((b) => p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ && p.y < b.h);
}

// ---------- Le mousquet du joueur ----------

const arme = new THREE.Group();
{
  const crosse = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.42), mat.bois);
  crosse.position.set(0, -0.03, 0.12);
  const fut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.62), mat.bois);
  fut.position.set(0, 0.0, -0.38);
  const canon = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.021, 1.0, 12), mat.metal);
  canon.rotation.x = Math.PI / 2;
  canon.position.set(0, 0.035, -0.47);
  const platine = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.05, 0.1), mat.metal);
  platine.position.set(0, 0.02, -0.04);
  const bague1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10), mat.or);
  bague1.rotation.x = Math.PI / 2;
  bague1.position.set(0, 0.02, -0.25);
  const bague2 = bague1.clone();
  bague2.position.z = -0.6;
  const baionnette = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.025, 0.32), mat.blanc);
  baionnette.position.set(0, 0.012, -1.1);
  arme.add(crosse, fut, canon, platine, bague1, bague2, baionnette);
}
arme.position.set(0.27, -0.26, -0.42);
camera.add(arme);
const POSE_ARME = arme.position.clone();

const boutCanon = new THREE.Object3D();
boutCanon.position.set(0, 0.035, -0.98);
arme.add(boutCanon);

const eclair = new THREE.Mesh(
  new THREE.SphereGeometry(0.07, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95 })
);
eclair.visible = false;
boutCanon.add(eclair);
const lumiereTir = new THREE.PointLight(0xffb560, 0, 10, 2);
boutCanon.add(lumiereTir);

// ---------- Gardes du Cardinal ----------

const geo = {
  jambe: new THREE.BoxGeometry(0.18, 0.8, 0.2),
  corps: new THREE.BoxGeometry(0.55, 0.72, 0.3),
  croixV: new THREE.BoxGeometry(0.07, 0.4, 0.01),
  croixH: new THREE.BoxGeometry(0.3, 0.07, 0.01),
  bras: new THREE.BoxGeometry(0.14, 0.62, 0.14),
  tete: new THREE.BoxGeometry(0.32, 0.44, 0.32),
  bord: new THREE.CylinderGeometry(0.32, 0.32, 0.04, 16),
  calotte: new THREE.CylinderGeometry(0.15, 0.17, 0.18, 12),
  plume: new THREE.BoxGeometry(0.04, 0.04, 0.4),
  fusil: new THREE.BoxGeometry(0.05, 0.05, 1.1),
};

function creerGarde(type) {
  const g = new THREE.Group();
  const tunique = type === "capitaine" ? mat.tuniqueCapitaine : mat.tunique;
  const parties = [];
  const piece = (geometrie, matiere, x, y, z, parent = g) => {
    const m = new THREE.Mesh(geometrie, matiere);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    parties.push(m);
    return m;
  };

  // Jambes et bras accrochés à un pivot pour pouvoir marcher
  const hancheG = new THREE.Group();
  const hancheD = new THREE.Group();
  hancheG.position.set(-0.13, 0.8, 0);
  hancheD.position.set(0.13, 0.8, 0);
  g.add(hancheG, hancheD);
  piece(geo.jambe, mat.bottes, 0, -0.4, 0, hancheG);
  piece(geo.jambe, mat.bottes, 0, -0.4, 0, hancheD);

  piece(geo.corps, tunique, 0, 1.16, 0);
  piece(geo.croixV, mat.blanc, 0, 1.18, 0.16);
  piece(geo.croixH, mat.blanc, 0, 1.24, 0.16);

  const epauleG = new THREE.Group();
  const epauleD = new THREE.Group();
  epauleG.position.set(-0.36, 1.46, 0);
  epauleD.position.set(0.36, 1.46, 0);
  g.add(epauleG, epauleD);
  piece(geo.bras, tunique, 0, -0.29, 0, epauleG);
  piece(geo.bras, tunique, 0, -0.29, 0, epauleD);

  // Ordre des faces : droite, gauche, dessus, dessous, avant (le visage), arrière
  const tete = piece(geo.tete, [mat.peau, mat.peau, mat.cheveux, mat.peau, mat.visage, mat.cheveux], 0, 1.74, 0);
  const bord = piece(geo.bord, mat.chapeau, 0, 1.97, 0);
  const calotte = piece(geo.calotte, mat.chapeau, 0, 2.07, 0);
  const plume = piece(geo.plume, type === "capitaine" ? mat.or : mat.tunique, 0.12, 2.11, -0.12);
  plume.rotation.x = 0.5;
  for (const m of [tete, bord, calotte, plume]) m.userData.tete = true;

  if (type === "tireur") {
    const fusil = piece(geo.fusil, mat.boisFonce, 0, -0.3, 0.45, epauleD);
    fusil.rotation.x = 0;
    epauleD.rotation.x = -1.2;
    epauleG.rotation.x = -1.0;
  }

  if (type === "capitaine") g.scale.setScalar(1.18);

  const garde = {
    groupe: g,
    parties,
    type,
    pv: type === "capitaine" ? 300 : 100,
    vitesse: type === "capitaine" ? 2.8 : type === "tireur" ? 2.6 : 3.4,
    rayon: type === "capitaine" ? 0.5 : 0.4,
    attente: 1 + Math.random(),
    pas: Math.random() * 10,
    contour: 0,
    tempsContour: 0,
    mort: false,
    tempsMort: 0,
    membres: { hancheG, hancheD, epauleG, epauleD },
  };
  for (const m of parties) m.userData.garde = garde;
  return garde;
}

// ---------- Effets : fumée, balles ennemies ----------

const particules = [];
const geoFumee = new THREE.SphereGeometry(1, 8, 6);

function fumee(position, couleur = 0xcfcfcf, nombre = 5, taille = 0.18) {
  for (let i = 0; i < nombre; i++) {
    const m = new THREE.Mesh(
      geoFumee,
      new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.4, depthWrite: false })
    );
    m.position.copy(position);
    const echelle = taille * (0.6 + Math.random() * 0.8);
    m.scale.setScalar(echelle);
    scene.add(m);
    particules.push({
      mesh: m,
      vie: 0.8 + Math.random() * 0.6,
      age: 0,
      echelle,
      vitesse: new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.6 + Math.random(), (Math.random() - 0.5) * 1.2),
    });
  }
}

const balles = [];
const geoBalle = new THREE.SphereGeometry(0.06, 8, 6);
const matBalle = new THREE.MeshBasicMaterial({ color: 0xffe08a });

// ---------- Sons (générés, aucun fichier) ----------

let audio = null;
let bruit = null;

function initialiserAudio() {
  if (audio) return;
  try {
    audio = new AudioContext();
    bruit = audio.createBuffer(1, audio.sampleRate * 0.6, audio.sampleRate);
    const d = bruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  } catch (e) {
    audio = null;
  }
}

function son(type, volume = 1) {
  if (!audio) return;
  const t = audio.currentTime;
  const gain = audio.createGain();
  gain.connect(audio.destination);
  if (type === "tir" || type === "tirEnnemi" || type === "epee") {
    const src = audio.createBufferSource();
    src.buffer = bruit;
    const filtre = audio.createBiquadFilter();
    filtre.type = type === "epee" ? "highpass" : "lowpass";
    filtre.frequency.value = type === "tir" ? 1600 : type === "epee" ? 3000 : 800;
    gain.gain.value = (type === "tir" ? 0.9 : type === "epee" ? 0.25 : 0.4) * volume;
    if (type === "epee") gain.gain.setTargetAtTime(0, t + 0.05, 0.03);
    src.connect(filtre).connect(gain);
    src.start(t);
  } else {
    const osc = audio.createOscillator();
    const reglages = {
      touche: [1300, 0.06, 0.12, "triangle"],
      tete: [1800, 0.1, 0.15, "triangle"],
      degats: [110, 0.18, 0.35, "square"],
      vague: [520, 0.5, 0.15, "sine"],
    }[type];
    osc.type = reglages[3];
    osc.frequency.value = reglages[0];
    gain.gain.value = reglages[2] * volume;
    gain.gain.setTargetAtTime(0, t + reglages[1] * 0.5, reglages[1] / 3);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + reglages[1] * 2);
  }
}

// ---------- État de la partie ----------

let gardes = [];
let enJeu = false;
let enPause = false;
let vie, score, vague, aFaireApparaitre, minuteurApparition, pauseVague;
let rechargement = 0;
let recupBaionnette = 0;
let animBaionnette = 0;
let recul = 0;
let tempsDepuisDegats = 0;
let yaw = 0;
let pitch = 0;
let vitesseY = 0;
let auSol = true;
let balancement = 0;
const touches = new Set();

let record = 0;
try {
  record = Number(localStorage.getItem("fps-record")) || 0;
} catch (e) {}
recordEl.textContent = record;

function placerJoueur() {
  camera.position.set(0, HAUTEUR_YEUX, 14);
  yaw = 0;
  pitch = 0;
  vitesseY = 0;
}

function nouvellePartie() {
  gardes.forEach((g) => scene.remove(g.groupe));
  balles.forEach((b) => scene.remove(b.mesh));
  gardes = [];
  balles.length = 0;
  vie = 100;
  score = 0;
  vague = 0;
  rechargement = 0;
  placerJoueur();
  majVie();
  scoreEl.textContent = 0;
  enJeu = true;
  vagueSuivante();
}

function vagueSuivante() {
  vague++;
  aFaireApparaitre = [];
  const normaux = 3 + vague * 2;
  const tireurs = vague >= 2 ? Math.floor(vague / 2) + 1 : 0;
  const capitaines = vague % 5 === 0 ? vague / 5 : 0;
  for (let i = 0; i < normaux; i++) aFaireApparaitre.push("garde");
  for (let i = 0; i < tireurs; i++) aFaireApparaitre.push("tireur");
  for (let i = 0; i < capitaines; i++) aFaireApparaitre.push("capitaine");
  aFaireApparaitre.sort(() => Math.random() - 0.5);
  minuteurApparition = 1.5;
  pauseVague = 0;
  vagueEl.textContent = vague;
  majRestants();
  annoncer(vague % 5 === 0 ? `Vague ${vague} — le capitaine arrive !` : `Vague ${vague}`);
  son("vague");
}

function faireApparaitre(type) {
  // Une porte assez loin du joueur
  const possibles = PORTES.filter((p) => p.distanceTo(camera.position) > 14);
  const porte = (possibles.length ? possibles : PORTES)[Math.floor(Math.random() * (possibles.length || 4))];
  const g = creerGarde(type);
  g.groupe.position.set(porte.x + (Math.random() - 0.5) * 3, 0, porte.z + (Math.random() - 0.5) * 3);
  repousser(g.groupe.position, g.rayon);
  const force = 1 + (vague - 1) * 0.06;
  g.vitesse *= Math.min(force, 1.6);
  scene.add(g.groupe);
  gardes.push(g);
}

function majRestants() {
  restantsEl.textContent = aFaireApparaitre.length + gardes.filter((g) => !g.mort).length;
}

function majVie() {
  vieEl.textContent = Math.max(0, Math.ceil(vie));
  barreVie.style.width = Math.max(0, vie) + "%";
}

let minuteurAnnonce;
function annoncer(texte) {
  annonceEl.textContent = texte;
  annonceEl.classList.add("visible");
  clearTimeout(minuteurAnnonce);
  minuteurAnnonce = setTimeout(() => annonceEl.classList.remove("visible"), 2200);
}

let minuteurTouche;
function marquerTouche(tete) {
  toucheEl.classList.toggle("tete", tete);
  toucheEl.classList.add("visible");
  clearTimeout(minuteurTouche);
  minuteurTouche = setTimeout(() => toucheEl.classList.remove("visible"), 90);
}

function prendreDegats(n) {
  if (!enJeu) return;
  vie -= n;
  tempsDepuisDegats = 0;
  majVie();
  son("degats");
  degatsEl.classList.add("visible");
  setTimeout(() => degatsEl.classList.remove("visible"), 80);
  if (vie <= 0) finDePartie();
}

function finDePartie() {
  enJeu = false;
  let texte = `Tu es tombé à la vague ${vague}. Score : ${score}`;
  if (score > record) {
    record = score;
    recordEl.textContent = record;
    try {
      localStorage.setItem("fps-record", record);
    } catch (e) {}
    texte += " — nouveau record ! 🏆";
  }
  ecranTexte.textContent = texte;
  boutonJouer.textContent = "Rejouer";
  montrerEcran();
  document.exitPointerLock?.();
}

function montrerEcran() {
  ecran.classList.remove("cache");
  hud.classList.add("cache");
  boutonTheme.classList.remove("cache");
}

function cacherEcran() {
  ecran.classList.add("cache");
  hud.classList.remove("cache");
  boutonTheme.classList.add("cache");
}

// ---------- Tir et baïonnette ----------

const viseur = new THREE.Raycaster();
const centre = new THREE.Vector2(0, 0);

function blesser(garde, degats, tete) {
  garde.pv -= degats;
  marquerTouche(tete);
  son(tete ? "tete" : "touche");
  if (garde.pv <= 0 && !garde.mort) {
    garde.mort = true;
    const gain = (garde.type === "capitaine" ? 500 : garde.type === "tireur" ? 150 : 100) + (tete ? 50 : 0);
    score += gain;
    scoreEl.textContent = score;
    majRestants();
  }
}

function tirer() {
  if (rechargement > 0) return;
  rechargement = RECHARGEMENT;
  recul = 1;
  son("tir");
  eclair.visible = true;
  lumiereTir.intensity = 4;
  setTimeout(() => {
    eclair.visible = false;
    lumiereTir.intensity = 0;
  }, 60);
  const bout = new THREE.Vector3();
  boutCanon.getWorldPosition(bout);
  fumee(bout, 0xdddddd, 4, 0.05);

  viseur.setFromCamera(centre, camera);
  viseur.far = 120;
  const cibles = decor.slice();
  for (const g of gardes) if (!g.mort) cibles.push(...g.parties);
  const impact = viseur.intersectObjects(cibles, false)[0];
  if (!impact) return;
  const garde = impact.object.userData.garde;
  if (garde) {
    const tete = !!impact.object.userData.tete;
    blesser(garde, tete ? 200 : 100, tete);
    fumee(impact.point, 0x8a1a1a, 4, 0.08);
  } else {
    fumee(impact.point, 0xb8ab95, 5, 0.1);
  }
}

function coupDeBaionnette() {
  if (recupBaionnette > 0) return;
  recupBaionnette = RECUP_BAIONNETTE;
  animBaionnette = 1;
  son("epee");
  const devant = new THREE.Vector3();
  camera.getWorldDirection(devant);
  devant.y = 0;
  devant.normalize();
  for (const g of gardes) {
    if (g.mort) continue;
    const vers = g.groupe.position.clone().sub(camera.position);
    vers.y = 0;
    const d = vers.length();
    if (d < 2.4 && vers.normalize().dot(devant) > 0.55) {
      blesser(g, 100, false);
      g.groupe.position.addScaledVector(vers, 1.2); // le garde recule sous le choc
      repousser(g.groupe.position, g.rayon);
    }
  }
}

// ---------- Commandes ----------

document.addEventListener("keydown", (e) => {
  touches.add(e.code);
  if (!enJeu || enPause) return;
  if (e.code === "KeyF") coupDeBaionnette();
  if (e.code === "Space") e.preventDefault();
});
document.addEventListener("keyup", (e) => touches.delete(e.code));
addEventListener("blur", () => touches.clear());

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * SENSIBILITE;
  pitch -= e.movementY * SENSIBILITE;
  pitch = THREE.MathUtils.clamp(pitch, -1.45, 1.45);
});

document.addEventListener("mousedown", (e) => {
  if (document.pointerLockElement !== canvas || !enJeu) return;
  if (e.button === 0) tirer();
  if (e.button === 2) coupDeBaionnette();
});
document.addEventListener("contextmenu", (e) => e.preventDefault());

function verrouillerSouris() {
  try {
    const r = canvas.requestPointerLock();
    if (r && r.catch) r.catch(() => {});
  } catch (e) {}
}

// La partie ne démarre qu'une fois la souris capturée
boutonJouer.addEventListener("click", () => {
  initialiserAudio();
  verrouillerSouris();
});

document.addEventListener("pointerlockerror", () => {
  ecranTexte.textContent = "La souris n'a pas pu être capturée. Attends une seconde et clique à nouveau.";
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === canvas) {
    if (!enJeu) nouvellePartie();
    enPause = false;
    horloge.getDelta(); // évite un grand saut de temps après une pause
    cacherEcran();
  } else if (enJeu) {
    enPause = true;
    touches.clear();
    ecranTexte.textContent = `Pause — vague ${vague}, score ${score}`;
    boutonJouer.textContent = "Reprendre";
    montrerEcran();
  }
});

// ---------- Thème : jour / nuit ----------

function appliquerTheme(theme) {
  document.documentElement.dataset.theme = theme;
  boutonTheme.textContent = theme === "clair" ? "🌙" : "☀️";
  boutonTheme.title = theme === "clair" ? "Passer à la nuit" : "Passer au jour";
  appliquerAmbiance(theme);
}

boutonTheme.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "clair" ? "sombre" : "clair";
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {}
  appliquerTheme(theme);
  boutonTheme.blur();
});

appliquerTheme(document.documentElement.dataset.theme || "sombre");

// ---------- Mise à jour à chaque image ----------

const avant = new THREE.Vector3();
const droite = new THREE.Vector3();
const deplacement = new THREE.Vector3();
const versJoueur = new THREE.Vector3();
const yeuxGarde = new THREE.Vector3();
const vueGarde = new THREE.Raycaster();

function majJoueur(dt) {
  camera.rotation.set(pitch, yaw, 0);

  avant.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  droite.set(Math.cos(yaw), 0, -Math.sin(yaw));
  deplacement.set(0, 0, 0);
  if (touches.has("KeyW") || touches.has("ArrowUp")) deplacement.add(avant);
  if (touches.has("KeyS") || touches.has("ArrowDown")) deplacement.sub(avant);
  if (touches.has("KeyD") || touches.has("ArrowRight")) deplacement.add(droite);
  if (touches.has("KeyA") || touches.has("ArrowLeft")) deplacement.sub(droite);

  const bouge = deplacement.lengthSq() > 0;
  const course = touches.has("ShiftLeft") || touches.has("ShiftRight");
  if (bouge) {
    deplacement.normalize().multiplyScalar((course ? VITESSE_COURSE : VITESSE_MARCHE) * dt);
    camera.position.x += deplacement.x;
    camera.position.z += deplacement.z;
    repousser(camera.position, RAYON_JOUEUR);
  }

  // Saut et gravité
  if (touches.has("Space") && auSol) {
    vitesseY = SAUT;
    auSol = false;
  }
  vitesseY -= GRAVITE * dt;
  let y = camera.position.y - balancementY() + vitesseY * dt;
  if (y <= HAUTEUR_YEUX) {
    y = HAUTEUR_YEUX;
    vitesseY = 0;
    auSol = true;
  }

  // Balancement de la marche
  if (bouge && auSol) balancement += dt * (course ? 13 : 9);
  else balancement = 0;
  camera.position.y = y + balancementY();

  // Mousquet : recul, balancement, coup de baïonnette
  recul = Math.max(0, recul - dt * 5);
  animBaionnette = Math.max(0, animBaionnette - dt * 4);
  const poussee = Math.sin(animBaionnette * Math.PI) * 0.35;
  arme.position.set(
    POSE_ARME.x + Math.sin(balancement * 0.5) * 0.012,
    POSE_ARME.y + Math.abs(Math.cos(balancement * 0.5)) * 0.01 + recul * 0.03,
    POSE_ARME.z + recul * 0.12 - poussee
  );
  arme.rotation.x = recul * 0.25;

  // Rechargement
  if (rechargement > 0) {
    rechargement = Math.max(0, rechargement - dt);
    etatArme.textContent = rechargement > 0 ? "Rechargement…" : "Mousquet chargé";
  }
  barreArme.style.width = (1 - rechargement / RECHARGEMENT) * 100 + "%";
  recupBaionnette = Math.max(0, recupBaionnette - dt);
  tempsDepuisDegats += dt;
}

function balancementY() {
  return Math.sin(balancement) * 0.05;
}

function majGardes(dt) {
  const joueur = camera.position;
  for (const g of gardes) {
    const corps = g.groupe;

    if (g.mort) {
      g.tempsMort += dt;
      corps.rotation.x = -Math.min(1, g.tempsMort / 0.45) * (Math.PI / 2);
      if (g.tempsMort > 2.5) corps.position.y -= dt * 0.6;
      continue;
    }

    versJoueur.set(joueur.x - corps.position.x, 0, joueur.z - corps.position.z);
    const distance = versJoueur.length();
    versJoueur.normalize();
    corps.rotation.y = Math.atan2(versJoueur.x, versJoueur.z);

    // Les tireurs gardent leurs distances, les autres foncent au corps à corps
    let avance = true;
    if (g.type === "tireur") {
      yeuxGarde.set(corps.position.x, 1.5, corps.position.z);
      const visible = distance < 22 && voitJoueur(yeuxGarde, distance);
      if (visible && distance < 16) avance = false;
      g.attente -= dt;
      if (visible && g.attente <= 0) {
        tirEnnemi(g, yeuxGarde);
        g.attente = 2.4 + Math.random() * 1.2;
      }
    } else if (distance < 1.3 + g.rayon) {
      if (!g.auContact) g.attente = Math.max(g.attente, 0.6); // le temps de lever l'épée
      g.auContact = true;
      avance = false;
      g.attente -= dt;
      if (g.attente <= 0) {
        prendreDegats(g.type === "capitaine" ? 22 : 7 + Math.min(vague, 8));
        g.attente = 1.4;
        g.membres.epauleD.rotation.x = -1.8; // coup d'épée
      }
    }

    if (avance) {
      g.auContact = false;
      const avantX = corps.position.x;
      const avantZ = corps.position.z;
      const pasMax = g.vitesse * dt;
      let dx = versJoueur.x;
      let dz = versJoueur.z;
      if (g.tempsContour > 0) {
        // Contourne un obstacle en glissant sur le côté
        g.tempsContour -= dt;
        dx += -versJoueur.z * g.contour * 1.5;
        dz += versJoueur.x * g.contour * 1.5;
        const n = Math.hypot(dx, dz);
        dx /= n;
        dz /= n;
      }
      corps.position.x += dx * pasMax;
      corps.position.z += dz * pasMax;
      repousser(corps.position, g.rayon);
      const parcouru = Math.hypot(corps.position.x - avantX, corps.position.z - avantZ);
      if (parcouru < pasMax * 0.3 && g.tempsContour <= 0) {
        g.contour = Math.random() < 0.5 ? -1 : 1;
        g.tempsContour = 0.8;
      }
      g.pas += dt * g.vitesse * 3;
    }

    // Les gardes ne se marchent pas dessus
    for (const autre of gardes) {
      if (autre === g || autre.mort) continue;
      const ex = corps.position.x - autre.groupe.position.x;
      const ez = corps.position.z - autre.groupe.position.z;
      const d = Math.hypot(ex, ez);
      const min = g.rayon + autre.rayon;
      if (d > 0 && d < min) {
        corps.position.x += (ex / d) * (min - d) * 0.5;
        corps.position.z += (ez / d) * (min - d) * 0.5;
      }
    }

    // Animation de marche
    const angle = avance ? Math.sin(g.pas) * 0.6 : 0;
    g.membres.hancheG.rotation.x = angle;
    g.membres.hancheD.rotation.x = -angle;
    if (g.type !== "tireur") {
      g.membres.epauleG.rotation.x = -angle * 0.8;
      g.membres.epauleD.rotation.x += (-angle * 0.8 - g.membres.epauleD.rotation.x) * Math.min(1, dt * 8);
    }
  }

  // On retire les gardes tombés depuis longtemps
  gardes = gardes.filter((g) => {
    if (g.mort && g.tempsMort > 4) {
      scene.remove(g.groupe);
      return false;
    }
    return true;
  });
}

function voitJoueur(depuis, distance) {
  const direction = camera.position.clone().sub(depuis).normalize();
  vueGarde.set(depuis, direction);
  vueGarde.far = distance;
  return vueGarde.intersectObjects(decor, false).length === 0;
}

function tirEnnemi(g, depuis) {
  const cible = camera.position.clone();
  cible.x += (Math.random() - 0.5) * 1.2;
  cible.y += (Math.random() - 0.5) * 0.6;
  cible.z += (Math.random() - 0.5) * 1.2;
  const direction = cible.sub(depuis).normalize();
  const depart = depuis.clone().addScaledVector(direction, 0.7);
  const mesh = new THREE.Mesh(geoBalle, matBalle);
  mesh.position.copy(depart);
  scene.add(mesh);
  balles.push({ mesh, vitesse: direction.multiplyScalar(22), age: 0 });
  fumee(depart, 0xdddddd, 3, 0.1);
  const distance = depuis.distanceTo(camera.position);
  son("tirEnnemi", Math.max(0.2, 1 - distance / 40));
}

function majBalles(dt) {
  for (let i = balles.length - 1; i >= 0; i--) {
    const b = balles[i];
    b.age += dt;
    b.mesh.position.addScaledVector(b.vitesse, dt);
    let fini = b.age > 3 || dansObstacle(b.mesh.position);
    if (!fini && b.mesh.position.distanceTo(camera.position) < 0.55) {
      prendreDegats(15);
      fini = true;
    }
    if (fini) {
      scene.remove(b.mesh);
      balles.splice(i, 1);
    }
  }
}

function majParticules(dt) {
  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.age += dt;
    p.mesh.position.addScaledVector(p.vitesse, dt);
    p.mesh.scale.setScalar(p.echelle * (1 + p.age * 1.5));
    p.mesh.material.opacity = 0.4 * (1 - p.age / p.vie);
    if (p.age >= p.vie) {
      scene.remove(p.mesh);
      p.mesh.material.dispose();
      particules.splice(i, 1);
    }
  }
}

function majVague(dt) {
  if (aFaireApparaitre.length) {
    minuteurApparition -= dt;
    const enVie = gardes.filter((g) => !g.mort).length;
    if (minuteurApparition <= 0 && enVie < 14) {
      faireApparaitre(aFaireApparaitre.pop());
      minuteurApparition = Math.max(0.4, 1.2 - vague * 0.05);
      majRestants();
    }
    return;
  }
  if (gardes.some((g) => !g.mort)) return;
  // Vague terminée : petit répit et un peu de vie en bonus
  if (pauseVague === 0) {
    const bonus = 250 * vague;
    score += bonus;
    scoreEl.textContent = score;
    vie = Math.min(100, vie + 30);
    majVie();
    annoncer(`Vague ${vague} repoussée ! +${bonus}`);
  }
  pauseVague += dt;
  if (pauseVague > 4) vagueSuivante();
}

// ---------- Boucle principale ----------

const horloge = new THREE.Clock();

// Vue d'accueil : la caméra tourne lentement au-dessus de la cour
let angleAccueil = 0;

function boucle() {
  const dt = Math.min(horloge.getDelta(), 0.05);
  if (enJeu && !enPause) {
    majJoueur(dt);
    majGardes(dt);
    majBalles(dt);
    majVague(dt);
  } else if (!enJeu) {
    angleAccueil += dt * 0.08;
    camera.position.set(Math.sin(angleAccueil) * 20, 9, Math.cos(angleAccueil) * 20);
    camera.lookAt(0, 1.5, 0);
  }
  arme.visible = enJeu;
  majParticules(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(boucle);
}

boucle();
