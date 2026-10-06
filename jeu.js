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
const grenadesEl = document.getElementById("grenades");
const annonceEl = document.getElementById("annonce");
const toucheEl = document.getElementById("touche");
const degatsEl = document.getElementById("degats");

// ---------- Réglages ----------

const MONDE = 70; // on ne peut pas aller plus loin que ça
const HAUTEUR_YEUX = 1.7;
const HAUTEUR_CORPS = 1.8;
const RAYON_JOUEUR = 0.4;
const MARCHE_JOUEUR = 0.55; // hauteur d'une marche qu'on monte sans sauter
const MARCHE_GARDE = 1.1; // les gardes escaladent un peu mieux
const VITESSE_MARCHE = 6;
const VITESSE_COURSE = 9.5;
const GRAVITE = 22;
const SAUT = 7.5;
const RECHARGEMENT = 1.1; // secondes pour recharger le mousquet
const RECUP_BAIONNETTE = 0.6;
const RECUP_GRENADE = 0.7;
const MECHE = 2.2; // secondes avant que la grenade explose
const GRENADES_MAX = 6;
const RAYON_CRATERE = 3.2;
const PROFONDEUR_CRATERE = 2.2;
const RAYON_MUR = 2.4; // les blocs de rempart plus proches que ça sont soufflés
const RAYON_DEGATS = 5.5;
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
Object.assign(soleil.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 100 });
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

// Visage peint des gardes : moustache et barbiche à la mode du Cardinal
function textureVisage() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 176;
  const g = c.getContext("2d");
  g.fillStyle = "#d6a982";
  g.fillRect(0, 0, 128, 176);
  g.fillStyle = "#2b1d14";
  g.fillRect(0, 0, 128, 26); // cheveux
  g.fillRect(24, 56, 32, 7); // sourcils
  g.fillRect(72, 56, 32, 7);
  g.fillStyle = "#ffffff";
  g.fillRect(28, 70, 24, 13); // yeux
  g.fillRect(76, 70, 24, 13);
  g.fillStyle = "#1b1b1b";
  g.fillRect(37, 71, 10, 11);
  g.fillRect(81, 71, 10, 11);
  g.fillStyle = "#bf8c66";
  g.fillRect(57, 80, 14, 32); // nez
  g.strokeStyle = "#2b1d14";
  g.lineWidth = 8;
  g.lineCap = "round";
  g.beginPath(); // moustache
  g.moveTo(64, 120);
  g.quadraticCurveTo(44, 114, 26, 128);
  g.moveTo(64, 120);
  g.quadraticCurveTo(84, 114, 102, 128);
  g.stroke();
  g.fillStyle = "#8a3b30";
  g.fillRect(52, 133, 24, 5); // bouche
  g.fillStyle = "#2b1d14";
  g.beginPath(); // barbiche
  g.moveTo(55, 146);
  g.lineTo(73, 146);
  g.lineTo(64, 172);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Matériaux ----------

const mat = {
  paveCase: new THREE.MeshStandardMaterial({ map: textureMoellons("#9c9284", "#5b544b", 2, 4, [1, 1]), roughness: 0.95 }),
  terre: new THREE.MeshStandardMaterial({ color: 0x7a5a3c, roughness: 1 }),
  herbe: new THREE.MeshStandardMaterial({ color: 0x55743a, roughness: 1 }),
  murBloc: new THREE.MeshStandardMaterial({ map: textureMoellons("#b3a68f", "#6e6455", 2, 3, [1, 1]), roughness: 0.9 }),
  mur: new THREE.MeshStandardMaterial({ map: textureMoellons("#b3a68f", "#6e6455", 3, 6, [4, 3]), roughness: 0.9 }),
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
  meche: new THREE.MeshBasicMaterial({ color: 0xffe08a }),
  // Gardes du Cardinal
  tunique: new THREE.MeshStandardMaterial({ color: 0xa3121f, roughness: 0.8 }),
  tuniqueCapitaine: new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.7 }),
  blanc: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 }),
  bottes: new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.7 }),
  peau: new THREE.MeshStandardMaterial({ color: 0xd6a982, roughness: 0.8 }),
  cheveux: new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 1 }),
  visage: new THREE.MeshStandardMaterial({ map: textureVisage(), roughness: 0.8 }),
  chapeau: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 }),
};

// ---------- Outils de construction ----------

const obstacles = []; // boîtes de collision { minX, maxX, minZ, maxZ, h, actif }
const decor = []; // objets qui arrêtent les balles
const objets = []; // caisses, tonneaux, foin, portes : tout ce qu'une grenade peut détruire

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
  const o = { minX: x - l / 2, maxX: x + l / 2, minZ: z - p / 2, maxZ: z + p / 2, h, actif: true };
  obstacles.push(o);
  return o;
}

function objet(meshes, x, y, z, taille, obstacle = null, appuis = null) {
  const o = { meshes, x, y, z, taille, obstacle, appuis, detruit: false };
  objets.push(o);
  return o;
}

// ---------- Sol de la cour : une grille de cases qu'on peut creuser ----------

const DEMI = 29; // la cour va de -29 à 29
const N = DEMI * 2;
const FOND = -6;
const PROFONDEUR_MAX = -5;
const hauteurs = new Float32Array(N * N);
const protege = new Uint8Array(N * N);
const teinteCase = new Float32Array(N * N);

// Faces d'un cube : droite, gauche, dessus, dessous, avant, arrière
const solMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  [mat.terre, mat.terre, mat.paveCase, mat.terre, mat.terre, mat.terre],
  N * N
);
solMesh.castShadow = true;
solMesh.receiveShadow = true;
solMesh.frustumCulled = false;
scene.add(solMesh);
decor.push(solMesh);

const matTemp = new THREE.Matrix4();
const posTemp = new THREE.Vector3();
const echTemp = new THREE.Vector3();
const rotNulle = new THREE.Quaternion();
const couleurTemp = new THREE.Color();
const couleurTerre = new THREE.Color(0x9a7650);

for (let k = 0; k < N * N; k++) teinteCase[k] = 0.88 + Math.random() * 0.17;

function indexCase(x, z) {
  const i = Math.floor(x + DEMI);
  const j = Math.floor(z + DEMI);
  if (i < 0 || j < 0 || i >= N || j >= N) return -1;
  return i * N + j;
}

function majCase(k) {
  const i = Math.floor(k / N);
  const j = k % N;
  const h = hauteurs[k];
  posTemp.set(i - DEMI + 0.5, (h + FOND) / 2, j - DEMI + 0.5);
  echTemp.set(1, h - FOND, 1);
  solMesh.setMatrixAt(k, matTemp.compose(posTemp, rotNulle, echTemp));
  // Plus c'est creusé, plus la case prend la couleur de la terre
  const t = Math.min(1, -h / 1.2);
  couleurTemp.setScalar(teinteCase[k]).lerp(couleurTerre, t);
  solMesh.setColorAt(k, couleurTemp);
}

function hauteurSol(x, z) {
  const k = indexCase(x, z);
  return k < 0 ? 0 : hauteurs[k];
}

function protegerZone(x, z, rayon) {
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const cx = i - DEMI + 0.5;
      const cz = j - DEMI + 0.5;
      if (Math.hypot(cx - x, cz - z) < rayon) protege[i * N + j] = 1;
    }
  }
}

// Prairie autour du château (on ne peut pas la creuser)
for (const [x, z, l, p] of [
  [0, -55, 160, 52], [0, 55, 160, 52], [-55, 0, 52, 58], [55, 0, 52, 58],
]) {
  const herbe = ajouter(new THREE.PlaneGeometry(l, p), mat.herbe, x, 0, z, { ombre: false, solide: false });
  herbe.rotation.x = -Math.PI / 2;
}

// ---------- Remparts en blocs de pierre ----------

const cle = (bx, by, bz) => `${bx},${by},${bz}`;
const blocs = new Map(); // "x,y,z" -> numéro du bloc
const blocsDepart = [];
const blocPos = [];
const attaches = new Map(); // décor accroché à un bloc (torches, bannières)
const chutes = []; // blocs en train de tomber
const CACHE = new THREE.Matrix4().compose(new THREE.Vector3(0, -500, 0), rotNulle, new THREE.Vector3(0.001, 0.001, 0.001));

const surMurNS = (bz) => bz === -31 || bz === -30 || bz === 29 || bz === 30;
const surMurEO = (bx) => bx === -31 || bx === -30 || bx === 29 || bx === 30;
const exterieur = (bx, bz) => bz === -31 || bz === 30 || bx === -31 || bx === 30;
const colonnePorte = (bx, bz) =>
  (surMurNS(bz) && bx >= -2 && bx <= 1) || (surMurEO(bx) && bz >= -2 && bz <= 1);

for (let bx = -31; bx <= 30; bx++) {
  for (let bz = -31; bz <= 30; bz++) {
    if (!surMurNS(bz) && !surMurEO(bx)) continue;
    for (let by = 0; by <= 5; by++) {
      if (colonnePorte(bx, bz) && by <= 3) continue; // l'ouverture des portes
      blocsDepart.push([bx, by, bz]);
    }
    // Créneaux : un bloc sur deux, côté extérieur
    const long = surMurNS(bz) ? bx : bz;
    if (exterieur(bx, bz) && long % 2 === 0) blocsDepart.push([bx, 6, bz]);
  }
}

const murMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat.murBloc, blocsDepart.length);
murMesh.castShadow = true;
murMesh.receiveShadow = true;
murMesh.frustumCulled = false;
scene.add(murMesh);
decor.push(murMesh);

function placerBloc(idx, bx, y, bz) {
  posTemp.set(bx + 0.5, y + 0.5, bz + 0.5);
  murMesh.setMatrixAt(idx, matTemp.makeTranslation(posTemp));
}

function attacher(x, y, z, versExterieur, choses) {
  const k = cle(Math.floor(x + versExterieur.x * 0.5), Math.floor(y), Math.floor(z + versExterieur.z * 0.5));
  if (!attaches.has(k)) attaches.set(k, []);
  attaches.get(k).push(...choses);
}

function detacher(k) {
  const choses = attaches.get(k);
  if (!choses) return;
  for (const c of choses) c.visible = false;
}

// ---------- Tours, portes, torches, bannières ----------

for (const [x, z] of [[-29, -29], [29, -29], [-29, 29], [29, 29]]) {
  ajouter(new THREE.CylinderGeometry(3.2, 3.6, 11, 16), mat.mur, x, 5.5, z);
  ajouter(new THREE.ConeGeometry(4, 5, 16), mat.ardoise, x, 13.5, z);
  bloc(x, z, 6.4, 6.4, 11);
}

for (const porte of PORTES) {
  const surX = Math.abs(porte.x) > 1;
  const sens = new THREE.Vector3(Math.sign(porte.x), 0, Math.sign(porte.z)); // vers l'extérieur
  // Porte en bois dans l'ouverture : une grenade peut la faire sauter
  const px = surX ? Math.sign(porte.x) * 29.4 : 0;
  const pz = surX ? 0 : Math.sign(porte.z) * 29.4;
  const battant = ajouter(new THREE.BoxGeometry(surX ? 0.4 : 4, 4, surX ? 4 : 0.4), mat.boisFonce, px, 2, pz);
  objet([battant], px, 2, pz, 2, bloc(px, pz, surX ? 0.4 : 4, surX ? 4 : 0.4, 4));

  for (const cote of [-1, 1]) {
    const tx = surX ? porte.x * 1.05 : cote * 3;
    const tz = surX ? cote * 3 : porte.z * 1.05;
    const manche = ajouter(new THREE.CylinderGeometry(0.06, 0.08, 0.7), mat.boisFonce, tx, 3.2, tz, { solide: false });
    const feu = ajouter(new THREE.SphereGeometry(0.14, 8, 8), mat.flamme, tx, 3.65, tz, { ombre: false, solide: false });
    const lumiere = new THREE.PointLight(0xff9a3c, 1, 16, 1.6);
    lumiere.position.set(tx * 0.97, 3.8, tz * 0.97);
    scene.add(lumiere);
    torches.push(lumiere);
    attacher(tx, 3.2, tz, sens, [manche, feu, lumiere]);
  }
}

for (const [x, z, ry] of [[-10, -28.9, 0], [10, -28.9, 0], [-10, 28.9, Math.PI], [10, 28.9, Math.PI]]) {
  const b = ajouter(new THREE.PlaneGeometry(1.8, 3.2), mat.banniere, x, 3.6, z, { solide: false });
  b.rotation.y = ry;
  const lys = ajouter(new THREE.CircleGeometry(0.35, 6), mat.or, x, 3.9, z + (ry ? -0.02 : 0.02), { ombre: false, solide: false });
  lys.rotation.y = ry;
  attacher(x, 3.6, z, new THREE.Vector3(0, 0, Math.sign(z)), [b, lys]);
}

// ---------- Fontaine, piliers (indestructibles) ----------

ajouter(new THREE.CylinderGeometry(3, 3.2, 0.9, 24), mat.pierre, 0, 0.45, 0);
ajouter(new THREE.CylinderGeometry(2.6, 2.6, 0.1, 24), mat.eau, 0, 0.86, 0, { ombre: false });
ajouter(new THREE.CylinderGeometry(0.35, 0.45, 2.4, 12), mat.pierre, 0, 1.6, 0);
ajouter(new THREE.CylinderGeometry(0.9, 0.5, 0.35, 16), mat.pierre, 0, 2.8, 0);
bloc(0, 0, 6, 6, 0.9);
protegerZone(0, 0, 3.6);

for (const [x, z] of [[12, 18], [-12, 18], [12, -20], [-12, -20], [22, -22], [-22, 22]]) {
  ajouter(new THREE.BoxGeometry(1.2, 4, 1.2), mat.pierre, x, 2, z);
  bloc(x, z, 1.2, 1.2, 4);
  protegerZone(x, z, 1.3);
}

// ---------- Caisses, tonneaux, foin (destructibles) ----------

const caisse = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const caisses = {};
for (const [nom, x, z] of [
  ["a", 8, 6], ["b", 9.6, 6], ["c", -10, -8], ["d", -10, -9.6], ["e", 14, -12],
  ["f", -15, 12], ["g", -13.4, 12], ["h", 20, 18], ["i", -21, -18], ["j", 4, -18],
]) {
  const c = ajouter(caisse, mat.bois, x, 0.75, z);
  c.rotation.y = (x * 7 + z * 3) % 0.3;
  caisses[nom] = objet([c], x, 0.75, z, 1.5, bloc(x, z, 1.5, 1.5, 1.5));
}
// Caisses posées sur deux autres : elles tombent si on fait sauter un appui
for (const [x, z, a, b] of [[8.8, 6, "a", "b"], [-14.2, 12, "f", "g"]]) {
  const c = ajouter(caisse, mat.bois, x, 2.25, z);
  c.rotation.y = 0.15;
  objet([c], x, 2.25, z, 1.5, null, [caisses[a], caisses[b]]);
}

const tonneau = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 14);
for (const [x, z] of [[6, -10], [7.1, -10.5], [-6, 10], [-6.6, 11], [18, -4], [-18, 3]]) {
  const t = ajouter(tonneau, mat.boisFonce, x, 0.6, z);
  objet([t], x, 0.6, z, 1, bloc(x, z, 1, 1, 1.2));
}

for (const [x, z, rot] of [[18, 8, 0], [-20, -5, 1], [10, 20, 1], [-8, -22, 0]]) {
  const f = ajouter(new THREE.BoxGeometry(2.6, 1.2, 1.3), mat.foin, x, 0.6, z);
  f.rotation.y = rot ? Math.PI / 2 : 0;
  objet([f], x, 0.6, z, 2.6, bloc(x, z, rot ? 1.3 : 2.6, rot ? 2.6 : 1.3, 1.2));
}

// Remet la cour comme neuve (au début de chaque partie)
function reconstruire() {
  hauteurs.fill(0);
  for (let k = 0; k < N * N; k++) majCase(k);
  solMesh.instanceMatrix.needsUpdate = true;
  solMesh.instanceColor.needsUpdate = true;
  solMesh.computeBoundingSphere();

  blocs.clear();
  chutes.length = 0;
  blocsDepart.forEach(([bx, by, bz], idx) => {
    blocs.set(cle(bx, by, bz), idx);
    blocPos[idx] = [bx, by, bz];
    placerBloc(idx, bx, by, bz);
  });
  murMesh.instanceMatrix.needsUpdate = true;
  murMesh.computeBoundingSphere();
  for (const choses of attaches.values()) for (const c of choses) c.visible = true;

  for (const o of objets) {
    o.detruit = false;
    for (const m of o.meshes) {
      m.visible = true;
      if (!decor.includes(m)) decor.push(m);
    }
    if (o.obstacle) o.obstacle.actif = true;
  }
}
reconstruire();

// ---------- Collisions ----------

function blocEn(bx, by, bz) {
  return blocs.has(cle(bx, by, bz));
}

// Hauteur sur laquelle on se tient : le sol, ou un bloc tombé qu'on peut enjamber
function soutien(x, z, pied, marche) {
  let s = hauteurSol(x, z);
  const bx = Math.floor(x);
  const bz = Math.floor(z);
  for (let by = Math.floor(pied + marche) - 1; by >= Math.max(0, Math.floor(s)); by--) {
    if (blocEn(bx, by, bz)) {
      s = Math.max(s, by + 1);
      break;
    }
  }
  return s;
}

function bloque(x, z, pied, rayon, hauteur, marche) {
  if (hauteurSol(x, z) > pied + marche) return true;
  const yMin = Math.max(0, Math.floor(pied + marche));
  const yMax = Math.floor(pied + hauteur - 0.001);
  for (let bx = Math.floor(x - rayon); bx <= Math.floor(x + rayon); bx++) {
    for (let bz = Math.floor(z - rayon); bz <= Math.floor(z + rayon); bz++) {
      for (let by = yMin; by <= yMax; by++) {
        if (blocEn(bx, by, bz)) return true;
      }
    }
  }
  return false;
}

// Déplace un personnage (pos = position des pieds) en glissant contre les obstacles
function deplacer(pos, dx, dz, rayon, marche) {
  if (!bloque(pos.x + dx, pos.z, pos.y, rayon, HAUTEUR_CORPS, marche)) pos.x += dx;
  if (!bloque(pos.x, pos.z + dz, pos.y, rayon, HAUTEUR_CORPS, marche)) pos.z += dz;
  repousser(pos, rayon);
}

function repousser(pos, rayon) {
  for (const b of obstacles) {
    if (!b.actif) continue;
    const minX = b.minX - rayon;
    const maxX = b.maxX + rayon;
    const minZ = b.minZ - rayon;
    const maxZ = b.maxZ + rayon;
    if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ && pos.y < b.h) {
      // On ressort par le côté le plus proche
      const d = [pos.x - minX, maxX - pos.x, pos.z - minZ, maxZ - pos.z];
      const m = Math.min(...d);
      if (m === d[0]) pos.x = minX;
      else if (m === d[1]) pos.x = maxX;
      else if (m === d[2]) pos.z = minZ;
      else pos.z = maxZ;
    }
  }
  pos.x = THREE.MathUtils.clamp(pos.x, -MONDE, MONDE);
  pos.z = THREE.MathUtils.clamp(pos.z, -MONDE, MONDE);
}

// Un point est-il dans quelque chose de solide ?
function solideEn(x, y, z) {
  if (Math.abs(x) > MONDE || Math.abs(z) > MONDE) return true;
  if (y < hauteurSol(x, z)) return true;
  if (blocEn(Math.floor(x), Math.floor(y), Math.floor(z))) return true;
  return obstacles.some((b) => b.actif && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ && y < b.h);
}

// ---------- Destruction ----------

const debris = [];
const geoDebris = new THREE.BoxGeometry(0.22, 0.22, 0.22);

function projeterDebris(x, y, z, matiere, nombre, force = 7) {
  for (let i = 0; i < nombre; i++) {
    const m = new THREE.Mesh(geoDebris, matiere);
    m.position.set(x + (Math.random() - 0.5) * 0.6, y + Math.random() * 0.4, z + (Math.random() - 0.5) * 0.6);
    m.scale.setScalar(0.5 + Math.random());
    m.castShadow = true;
    scene.add(m);
    debris.push({
      mesh: m,
      age: 0,
      v: new THREE.Vector3((Math.random() - 0.5) * force, Math.random() * force + 2, (Math.random() - 0.5) * force),
      rot: new THREE.Vector3(Math.random() * 10, Math.random() * 10, 0),
    });
  }
}

function creuser(centre) {
  const base = centre.y - 0.1;
  let change = false;
  const r = Math.ceil(RAYON_CRATERE);
  for (let i = Math.floor(centre.x + DEMI) - r; i <= Math.floor(centre.x + DEMI) + r; i++) {
    for (let j = Math.floor(centre.z + DEMI) - r; j <= Math.floor(centre.z + DEMI) + r; j++) {
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const k = i * N + j;
      if (protege[k]) continue;
      const d = Math.hypot(i - DEMI + 0.5 - centre.x, j - DEMI + 0.5 - centre.z);
      if (d >= RAYON_CRATERE) continue;
      const fond = Math.max(PROFONDEUR_MAX, base - PROFONDEUR_CRATERE * (1 - (d / RAYON_CRATERE) ** 2));
      if (fond < hauteurs[k] - 0.01) {
        hauteurs[k] = fond;
        majCase(k);
        change = true;
      }
    }
  }
  if (change) {
    solMesh.instanceMatrix.needsUpdate = true;
    solMesh.instanceColor.needsUpdate = true;
    solMesh.computeBoundingSphere();
    projeterDebris(centre.x, Math.max(base, hauteurSol(centre.x, centre.z)), centre.z, mat.terre, 12, 9);
  }
}

function souffler(centre) {
  const colonnes = new Set();
  const r = Math.ceil(RAYON_MUR);
  for (let bx = Math.floor(centre.x) - r; bx <= Math.floor(centre.x) + r; bx++) {
    for (let by = Math.max(0, Math.floor(centre.y) - r); by <= Math.floor(centre.y) + r; by++) {
      for (let bz = Math.floor(centre.z) - r; bz <= Math.floor(centre.z) + r; bz++) {
        const k = cle(bx, by, bz);
        if (!blocs.has(k)) continue;
        if (Math.hypot(bx + 0.5 - centre.x, by + 0.5 - centre.y, bz + 0.5 - centre.z) > RAYON_MUR) continue;
        const idx = blocs.get(k);
        blocs.delete(k);
        blocPos[idx] = null;
        murMesh.setMatrixAt(idx, CACHE);
        detacher(k);
        projeterDebris(bx + 0.5, by + 0.5, bz + 0.5, mat.pierre, 2);
        colonnes.add(`${bx},${bz}`);
      }
    }
  }
  if (colonnes.size) {
    effondrer(colonnes);
    murMesh.instanceMatrix.needsUpdate = true;
    murMesh.computeBoundingSphere();
  }
}

// Gravité : un bloc qui n'a plus rien en dessous tombe jusqu'au prochain appui
function effondrer(colonnes) {
  for (const c of colonnes) {
    const [bx, bz] = c.split(",").map(Number);
    let sommet = colonnePorte(bx, bz) ? 4 : 0; // l'arche de la porte tient le haut
    for (let by = 0; by <= 7; by++) {
      const k = cle(bx, by, bz);
      if (!blocs.has(k)) continue;
      if (by > sommet) {
        const idx = blocs.get(k);
        blocs.delete(k);
        detacher(k);
        blocs.set(cle(bx, sommet, bz), idx);
        blocPos[idx] = [bx, sommet, bz];
        chutes.push({ idx, bx, bz, y: by, cible: sommet, v: 0 });
        sommet++;
      } else {
        sommet = by + 1;
      }
    }
  }
}

function majChutes(dt) {
  if (!chutes.length) return;
  for (let i = chutes.length - 1; i >= 0; i--) {
    const c = chutes[i];
    c.v += GRAVITE * dt;
    c.y = Math.max(c.cible, c.y - c.v * dt);
    placerBloc(c.idx, c.bx, c.y, c.bz);
    if (c.y === c.cible) {
      chutes.splice(i, 1);
      projeterDebris(c.bx + 0.5, c.cible, c.bz + 0.5, mat.pierre, 1, 3);
    }
  }
  murMesh.instanceMatrix.needsUpdate = true;
}

function detruireObjet(o) {
  if (o.detruit) return;
  o.detruit = true;
  for (const m of o.meshes) {
    m.visible = false;
    const i = decor.indexOf(m);
    if (i >= 0) decor.splice(i, 1);
    projeterDebris(o.x, o.y, o.z, m.material, 6);
  }
  if (o.obstacle) o.obstacle.actif = false;
}

function casserObjets(centre) {
  for (const o of objets) {
    if (o.detruit) continue;
    const d = Math.hypot(o.x - centre.x, o.y - centre.y, o.z - centre.z);
    if (d < RAYON_CRATERE + o.taille / 2) detruireObjet(o);
  }
  // Ce qui était posé sur un objet détruit tombe et se brise
  for (const o of objets) {
    if (!o.detruit && o.appuis && o.appuis.some((a) => a.detruit)) detruireObjet(o);
  }
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
    piece(geo.fusil, mat.boisFonce, 0, -0.3, 0.45, epauleD);
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
    vy: 0,
    poussee: new THREE.Vector3(),
    vue: false,
    tempsVue: 0,
    mort: false,
    tempsMort: 0,
    membres: { hancheG, hancheD, epauleG, epauleD },
  };
  for (const m of parties) m.userData.garde = garde;
  return garde;
}

// ---------- Effets : fumée, balles ennemies, grenades ----------

const particules = [];
const geoFumee = new THREE.SphereGeometry(1, 8, 6);

function fumee(position, couleur = 0xcfcfcf, nombre = 5, taille = 0.18, montee = 1) {
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
      vitesse: new THREE.Vector3(
        (Math.random() - 0.5) * 1.2 * montee,
        (0.6 + Math.random()) * montee,
        (Math.random() - 0.5) * 1.2 * montee
      ),
    });
  }
}

const balles = [];
const geoBalle = new THREE.SphereGeometry(0.06, 8, 6);
const matBalle = new THREE.MeshBasicMaterial({ color: 0xffe08a });

const grenades = [];
const geoGrenade = new THREE.SphereGeometry(0.12, 12, 10);
const geoMeche = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6);
const geoEtincelle = new THREE.SphereGeometry(0.04, 6, 6);

const lumiereExplosion = new THREE.PointLight(0xffa64d, 0, 30, 1.5);
scene.add(lumiereExplosion);

// ---------- Sons (générés, aucun fichier) ----------

let audio = null;
let bruit = null;

function initialiserAudio() {
  if (audio) return;
  try {
    audio = new AudioContext();
    bruit = audio.createBuffer(1, audio.sampleRate * 1.2, audio.sampleRate);
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
  if (type === "tir" || type === "tirEnnemi" || type === "epee" || type === "explosion") {
    const src = audio.createBufferSource();
    src.buffer = bruit;
    const filtre = audio.createBiquadFilter();
    filtre.type = type === "epee" ? "highpass" : "lowpass";
    filtre.frequency.value = { tir: 1600, epee: 3000, tirEnnemi: 800, explosion: 380 }[type];
    gain.gain.value = { tir: 0.9, epee: 0.25, tirEnnemi: 0.4, explosion: 1.6 }[type] * volume;
    if (type === "epee") gain.gain.setTargetAtTime(0, t + 0.05, 0.03);
    src.connect(filtre).connect(gain);
    src.start(t);
    if (type === "explosion") {
      // Un grondement grave en plus
      const osc = audio.createOscillator();
      const g2 = audio.createGain();
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
      g2.gain.setValueAtTime(0.8 * volume, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(g2).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.9);
    }
  } else {
    const osc = audio.createOscillator();
    const reglages = {
      touche: [1300, 0.06, 0.12, "triangle"],
      tete: [1800, 0.1, 0.15, "triangle"],
      degats: [110, 0.18, 0.35, "square"],
      vague: [520, 0.5, 0.15, "sine"],
      lancer: [300, 0.08, 0.08, "sine"],
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
let recupGrenade = 0;
let stockGrenades = 3;
let animBaionnette = 0;
let animLancer = 0;
let recul = 0;
let tremblement = 0;
let yaw = 0;
let pitch = 0;
let vitesseY = 0;
let auSol = true;
let balancement = 0;
const joueur = new THREE.Vector3(); // position des pieds du joueur
const touches = new Set();

let record = 0;
try {
  record = Number(localStorage.getItem("fps-record")) || 0;
} catch (e) {}
recordEl.textContent = record;

function placerJoueur() {
  joueur.set(0, 0, 14);
  camera.position.set(0, HAUTEUR_YEUX, 14);
  yaw = 0;
  pitch = 0;
  vitesseY = 0;
}

function nouvellePartie() {
  gardes.forEach((g) => scene.remove(g.groupe));
  balles.forEach((b) => scene.remove(b.mesh));
  grenades.forEach((g) => scene.remove(g.mesh));
  gardes = [];
  balles.length = 0;
  grenades.length = 0;
  reconstruire();
  vie = 100;
  score = 0;
  vague = 0;
  rechargement = 0;
  stockGrenades = 3;
  majGrenades();
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
  const pos = g.groupe.position;
  pos.set(porte.x + (Math.random() - 0.5) * 3, 0, porte.z + (Math.random() - 0.5) * 3);
  repousser(pos, g.rayon);
  pos.y = soutien(pos.x, pos.z, 3, 0);
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

function majGrenades() {
  grenadesEl.textContent = stockGrenades;
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

// ---------- Tir, baïonnette, grenade ----------

const viseur = new THREE.Raycaster();
const centre = new THREE.Vector2(0, 0);

function blesser(garde, degats, tete, signal = true) {
  garde.pv -= degats;
  if (signal) {
    marquerTouche(tete);
    son(tete ? "tete" : "touche");
  }
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
    const vers = g.groupe.position.clone().sub(joueur);
    if (Math.abs(vers.y) > 1.5) continue;
    vers.y = 0;
    const d = vers.length();
    if (d < 2.4 && vers.normalize().dot(devant) > 0.55) {
      blesser(g, 100, false);
      g.poussee.addScaledVector(vers, 6); // le garde recule sous le choc
    }
  }
}

function lancerGrenade() {
  if (recupGrenade > 0) return;
  if (stockGrenades <= 0) {
    annoncer("Plus de grenades !");
    return;
  }
  stockGrenades--;
  majGrenades();
  recupGrenade = RECUP_GRENADE;
  animLancer = 1;
  son("lancer");

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const groupe = new THREE.Group();
  const boule = new THREE.Mesh(geoGrenade, mat.metal);
  boule.castShadow = true;
  const meche = new THREE.Mesh(geoMeche, mat.boisFonce);
  meche.position.y = 0.15;
  const etincelle = new THREE.Mesh(geoEtincelle, mat.meche);
  etincelle.position.y = 0.21;
  groupe.add(boule, meche, etincelle);
  groupe.position.copy(camera.position).addScaledVector(direction, 0.6);
  groupe.position.y -= 0.2;
  scene.add(groupe);
  grenades.push({
    mesh: groupe,
    etincelle,
    v: direction.multiplyScalar(16).add(new THREE.Vector3(0, 3.5, 0)),
    minuterie: MECHE,
  });
}

function majGrenades3D(dt) {
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    const p = g.mesh.position;
    // Petits pas pour ne pas traverser les murs à grande vitesse
    const pas = 3;
    for (let s = 0; s < pas; s++) {
      const h = dt / pas;
      g.v.y -= GRAVITE * h;
      // On avance axe par axe et on rebondit sur ce qu'on touche
      p.x += g.v.x * h;
      if (solideEn(p.x, p.y, p.z)) {
        p.x -= g.v.x * h;
        g.v.x *= -0.4;
      }
      p.z += g.v.z * h;
      if (solideEn(p.x, p.y, p.z)) {
        p.z -= g.v.z * h;
        g.v.z *= -0.4;
      }
      p.y += g.v.y * h;
      if (solideEn(p.x, p.y - 0.1, p.z)) {
        p.y -= g.v.y * h;
        if (g.v.y < 0) {
          g.v.x *= 0.75;
          g.v.z *= 0.75;
        }
        g.v.y *= -0.3;
      }
    }
    g.mesh.rotation.x += g.v.z * dt * 2;
    g.mesh.rotation.z -= g.v.x * dt * 2;
    g.etincelle.scale.setScalar(0.7 + Math.random() * 0.8);
    g.minuterie -= dt;
    if (g.minuterie <= 0) {
      scene.remove(g.mesh);
      grenades.splice(i, 1);
      exploser(p.clone());
    }
  }
}

function exploser(p) {
  son("explosion", Math.max(0.3, 1 - p.distanceTo(camera.position) / 60));
  lumiereExplosion.position.copy(p).y += 1;
  lumiereExplosion.intensity = 60;
  fumee(p, 0xffa040, 10, 0.5, 2.5);
  fumee(p, 0x4a4a4a, 18, 0.7, 2);
  tremblement = Math.max(tremblement, 1.2 * (1 - Math.min(1, p.distanceTo(camera.position) / 30)));

  creuser(p);
  souffler(p);
  casserObjets(p);

  // Les gardes proches sont soufflés
  for (const g of gardes) {
    const centreGarde = g.groupe.position.clone();
    centreGarde.y += 1;
    const d = centreGarde.distanceTo(p);
    if (d > RAYON_DEGATS) continue;
    const force = 1 - d / RAYON_DEGATS;
    const vers = centreGarde.sub(p).setY(0).normalize();
    g.poussee.addScaledVector(vers, 14 * force);
    g.vy = Math.max(g.vy, 9 * force);
    if (!g.mort) blesser(g, d < 2.5 ? 300 : 300 * force, false, false);
  }

  // Le joueur aussi, s'il est trop près
  const centreJoueur = joueur.clone();
  centreJoueur.y += 1;
  const d = centreJoueur.distanceTo(p);
  if (d < RAYON_DEGATS) {
    const force = 1 - d / RAYON_DEGATS;
    prendreDegats(Math.round(70 * force));
    vitesseY = Math.max(vitesseY, 7 * force);
    auSol = false;
  }
}

// ---------- Commandes ----------

document.addEventListener("keydown", (e) => {
  touches.add(e.code);
  if (!enJeu || enPause) return;
  if (e.code === "KeyF") coupDeBaionnette();
  if (e.code === "KeyB" && !e.repeat) lancerGrenade();
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
    deplacer(joueur, deplacement.x, deplacement.z, RAYON_JOUEUR, MARCHE_JOUEUR);
  }

  // Saut et gravité : si le sol s'est creusé sous nos pieds, on tombe
  if (touches.has("Space") && auSol) {
    vitesseY = SAUT;
    auSol = false;
  }
  vitesseY -= GRAVITE * dt;
  joueur.y += vitesseY * dt;
  const sol = soutien(joueur.x, joueur.z, joueur.y, MARCHE_JOUEUR);
  if (joueur.y <= sol) {
    joueur.y = sol;
    vitesseY = 0;
    auSol = true;
  } else if (joueur.y > sol + 0.05) {
    auSol = false;
  }

  // Balancement de la marche et tremblement des explosions
  if (bouge && auSol) balancement += dt * (course ? 13 : 9);
  else balancement = 0;
  tremblement = Math.max(0, tremblement - dt * 2);
  const secousse = tremblement * tremblement * 0.06;
  camera.position.set(joueur.x, joueur.y + HAUTEUR_YEUX + Math.sin(balancement) * 0.05, joueur.z);
  camera.rotation.set(
    pitch + (Math.random() - 0.5) * secousse,
    yaw + (Math.random() - 0.5) * secousse,
    0
  );

  // Mousquet : recul, balancement, coup de baïonnette, lancer de grenade
  recul = Math.max(0, recul - dt * 5);
  animBaionnette = Math.max(0, animBaionnette - dt * 4);
  animLancer = Math.max(0, animLancer - dt * 3);
  const poussee = Math.sin(animBaionnette * Math.PI) * 0.35;
  const baisse = Math.sin(animLancer * Math.PI) * 0.25;
  arme.position.set(
    POSE_ARME.x + Math.sin(balancement * 0.5) * 0.012,
    POSE_ARME.y + Math.abs(Math.cos(balancement * 0.5)) * 0.01 + recul * 0.03 - baisse,
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
  recupGrenade = Math.max(0, recupGrenade - dt);
}

function physiqueGarde(g, dt) {
  const pos = g.groupe.position;
  // Poussée des explosions et des coups de baïonnette
  if (g.poussee.lengthSq() > 0.01) {
    deplacer(pos, g.poussee.x * dt, g.poussee.z * dt, g.rayon, MARCHE_GARDE);
    g.poussee.multiplyScalar(Math.max(0, 1 - dt * 4));
  }
  // Gravité : ils tombent aussi dans les trous
  g.vy -= GRAVITE * dt;
  pos.y += g.vy * dt;
  const sol = soutien(pos.x, pos.z, pos.y, MARCHE_GARDE);
  if (pos.y <= sol) {
    pos.y = sol;
    g.vy = 0;
  }
}

function majGardes(dt) {
  for (const g of gardes) {
    const corps = g.groupe;

    if (g.mort) {
      g.tempsMort += dt;
      corps.rotation.x = -Math.min(1, g.tempsMort / 0.45) * (Math.PI / 2);
      if (g.tempsMort > 2.5) corps.position.y -= dt * 0.6;
      else physiqueGarde(g, dt);
      continue;
    }

    versJoueur.set(joueur.x - corps.position.x, 0, joueur.z - corps.position.z);
    const distance = versJoueur.length();
    versJoueur.normalize();
    corps.rotation.y = Math.atan2(versJoueur.x, versJoueur.z);

    // Les tireurs gardent leurs distances, les autres foncent au corps à corps
    let avance = true;
    if (g.type === "tireur") {
      yeuxGarde.set(corps.position.x, corps.position.y + 1.5, corps.position.z);
      g.tempsVue -= dt;
      if (g.tempsVue <= 0) {
        g.vue = distance < 22 && voitJoueur(yeuxGarde);
        g.tempsVue = 0.25;
      }
      if (g.vue && distance < 16) avance = false;
      g.attente -= dt;
      if (g.vue && g.attente <= 0) {
        tirEnnemi(g, yeuxGarde);
        g.attente = 2.4 + Math.random() * 1.2;
      }
    } else if (distance < 1.3 + g.rayon && Math.abs(corps.position.y - joueur.y) < 1.5) {
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
      deplacer(corps.position, dx * pasMax, dz * pasMax, g.rayon, MARCHE_GARDE);
      const parcouru = Math.hypot(corps.position.x - avantX, corps.position.z - avantZ);
      if (parcouru < pasMax * 0.3 && g.tempsContour <= 0) {
        g.contour = Math.random() < 0.5 ? -1 : 1;
        g.tempsContour = 0.8;
      }
      g.pas += dt * g.vitesse * 3;
    }

    physiqueGarde(g, dt);

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

function voitJoueur(depuis) {
  const direction = camera.position.clone().sub(depuis);
  const distance = direction.length();
  vueGarde.set(depuis, direction.normalize());
  vueGarde.far = distance;
  // Le sol ne compte pas : seulement les murs et les objets
  const obstaclesVue = decor.filter((m) => m !== solMesh);
  return vueGarde.intersectObjects(obstaclesVue, false).length === 0;
}

function tirEnnemi(g, depuis) {
  const cible = camera.position.clone();
  cible.x += (Math.random() - 0.5) * 1.2;
  cible.y += (Math.random() - 0.5) * 0.6 - 0.4;
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
    const p = b.mesh.position;
    b.age += dt;
    p.addScaledVector(b.vitesse, dt);
    let fini = b.age > 3 || solideEn(p.x, p.y, p.z);
    const touche = Math.hypot(p.x - joueur.x, p.z - joueur.z) < 0.45 && p.y > joueur.y && p.y < joueur.y + HAUTEUR_CORPS;
    if (!fini && touche) {
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
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    const p = d.mesh.position;
    d.age += dt;
    d.v.y -= GRAVITE * dt;
    p.addScaledVector(d.v, dt);
    d.mesh.rotation.x += d.rot.x * dt;
    d.mesh.rotation.y += d.rot.y * dt;
    const sol = hauteurSol(p.x, p.z);
    if (p.y < sol + 0.1) {
      p.y = sol + 0.1;
      d.v.multiplyScalar(0.4);
      d.v.y = Math.abs(d.v.y);
      d.rot.multiplyScalar(0.5);
    }
    if (d.age > 2.5) {
      scene.remove(d.mesh);
      debris.splice(i, 1);
    }
  }
  if (lumiereExplosion.intensity > 0) {
    lumiereExplosion.intensity = Math.max(0, lumiereExplosion.intensity - dt * 200);
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
  // Vague terminée : petit répit, un peu de vie et des grenades en bonus
  if (pauseVague === 0) {
    const bonus = 250 * vague;
    score += bonus;
    scoreEl.textContent = score;
    vie = Math.min(100, vie + 30);
    majVie();
    stockGrenades = Math.min(GRENADES_MAX, stockGrenades + 2);
    majGrenades();
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
    majGrenades3D(dt);
    majVague(dt);
  } else if (!enJeu) {
    angleAccueil += dt * 0.08;
    camera.position.set(Math.sin(angleAccueil) * 20, 9, Math.cos(angleAccueil) * 20);
    camera.lookAt(0, 1.5, 0);
  }
  if (!enPause) {
    majChutes(dt);
    majParticules(dt);
  }
  arme.visible = enJeu;
  renderer.render(scene, camera);
  requestAnimationFrame(boucle);
}

boucle();
