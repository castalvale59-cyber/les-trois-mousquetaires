// ---------- Mini-golf des Trois Mousquetaires ----------

const canvas = document.getElementById("golf");
const ctx = canvas.getContext("2d");
const bandeau = document.getElementById("bandeau");
const menu = document.getElementById("menu-golf");
const carteScore = document.getElementById("carte-score");
const scoreTitre = document.getElementById("score-titre");
const scoreContenu = document.getElementById("score-contenu");
const boutonSuite = document.getElementById("score-suite");
const atoutsTitre = document.getElementById("atouts-titre");
const atoutsListe = document.getElementById("atouts-liste");
const atoutAide = document.getElementById("atout-aide");
const panneaux = [document.getElementById("panneau-0"), document.getElementById("panneau-1")];
const boutonTheme = document.getElementById("bouton-theme");

// ---------- Réglages ----------

const L = 1000; // taille logique du terrain
const H = 600;
const RAYON = 9; // balle
const COUPE = 13; // trou
const VITESSE_MAX = 950;
const TIRAGE_MAX = 160; // distance de glisser pour la puissance maximale
const COUPS_MAX = 10;
const ATOUTS_MAX = 3;
const PAS = 1 / 240;
const FROTTEMENT = { herbe: 230, sable: 950, boue: 1500, glace: 30 };
const COULEURS_JOUEURS = [
  { balle: "#ff5a4f", fonce: "#b3261e" },
  { balle: "#3d8bff", fonce: "#1d4fa8" },
];

// ---------- Formes pour dessiner les parcours ----------

const R = (x, y, l, h) => [[x, y], [x + l, y], [x + l, y + h], [x, y + h]];
const C = (x, y, r) => ({ cercle: [x, y, r] });
const P = (pts) => ({ poly: pts });
function octogone(x, y, r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  return pts;
}
function pont(x1, y1, x2, y2, largeur) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const nx = (-Math.sin(a) * largeur) / 2;
  const ny = (Math.cos(a) * largeur) / 2;
  return [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]];
}

// ---------- Les 20 parcours ----------

const PARCOURS = [
  {
    nom: "Premier pas", theme: "prairie", par: 2, depart: [180, 300], trou: [820, 300],
    zones: [R(100, 200, 800, 200)],
    atouts: [[500, 250]],
  },
  {
    nom: "Le virage", theme: "prairie", par: 3, depart: [260, 150], trou: [830, 460],
    zones: [[[100, 80], [420, 80], [420, 380], [900, 380], [900, 540], [100, 540]]],
    sols: [{ type: "sable", forme: P(R(600, 392, 110, 45)) }],
    bumpers: [[165, 478, 22]],
    atouts: [[260, 330]],
  },
  {
    nom: "Champ de bumpers", theme: "bonbon", par: 3, depart: [140, 300], trou: [860, 300],
    zones: [R(80, 80, 840, 440)],
    bumpers: [[350, 200, 28], [350, 400, 28], [500, 300, 30], [650, 200, 28], [650, 400, 28]],
    atouts: [[500, 140], [500, 460]],
  },
  {
    nom: "Le moulin", theme: "prairie", par: 3, depart: [150, 300], trou: [850, 300],
    zones: [R(80, 200, 840, 200)],
    obstacles: [R(440, 200, 120, 65), R(440, 335, 120, 65)],
    moulins: [[500, 300, 34, 1.6]],
    sols: [{ type: "sable", forme: C(700, 350, 40) }],
    atouts: [[300, 250]],
  },
  {
    nom: "L'oasis", theme: "desert", par: 3, depart: [140, 440], trou: [860, 160],
    zones: [R(80, 100, 840, 400)],
    sols: [
      { type: "eau", forme: C(500, 300, 115) },
      { type: "sable", forme: C(290, 170, 50) },
      { type: "sable", forme: C(710, 430, 55) },
    ],
    atouts: [[500, 455]],
  },
  {
    nom: "Zigzag", theme: "prairie", par: 4, depart: [200, 130], trou: [800, 470],
    zones: [R(80, 60, 840, 480)],
    obstacles: [R(330, 60, 22, 360), R(650, 180, 22, 360)],
    boosts: [{ x: 500, y: 300, l: 90, h: 70, angle: -90, force: 900 }],
    atouts: [[500, 470]],
  },
  {
    nom: "La patinoire", theme: "neige", par: 3, depart: [130, 300], trou: [860, 300],
    zones: [R(80, 120, 840, 360)],
    sols: [
      { type: "glace", forme: P(R(160, 130, 640, 340)) },
      { type: "sable", forme: P(R(820, 130, 90, 70)) },
    ],
    bumpers: [[430, 220, 24], [570, 380, 24], [500, 300, 18]],
    atouts: [[300, 400]],
  },
  {
    nom: "Le pont", theme: "prairie", par: 3, depart: [110, 300], trou: [880, 300],
    zones: [R(60, 230, 880, 140)],
    sols: [
      { type: "eau", forme: P(R(500, 230, 150, 55)) },
      { type: "eau", forme: P(R(500, 315, 150, 55)) },
    ],
    boosts: [{ x: 300, y: 300, l: 80, h: 60, angle: 0, force: 700 }],
    atouts: [[400, 255]],
  },
  {
    nom: "Téléporteur", theme: "nuit", par: 2, depart: [140, 300], trou: [860, 300],
    zones: [R(80, 120, 330, 360), R(590, 120, 330, 360)],
    teleports: [[350, 300, 650, 300]],
    bumpers: [[760, 200, 22], [760, 400, 22]],
    atouts: [[245, 170]],
  },
  {
    nom: "Les douves", theme: "prairie", par: 4, depart: [140, 460], trou: [500, 300],
    zones: [R(80, 80, 840, 440)],
    sols: [
      { type: "eau", forme: P(R(320, 170, 360, 260)) },
      { type: "herbe", forme: P(R(390, 230, 220, 140)) },
      { type: "herbe", forme: P(R(480, 170, 40, 62)) },
    ],
    atouts: [[200, 150], [820, 450]],
  },
  {
    nom: "Désert ardent", theme: "desert", par: 4, depart: [150, 150], trou: [850, 460],
    zones: [R(80, 80, 840, 440)],
    obstacles: [R(80, 225, 620, 30), R(300, 355, 620, 30)],
    sols: [
      { type: "sable", forme: C(500, 305, 42) },
      { type: "sable", forme: P(R(720, 100, 60, 110)) },
    ],
    atouts: [[200, 305], [480, 460]],
  },
  {
    nom: "Le labyrinthe", theme: "nuit", par: 4, depart: [140, 460], trou: [850, 140],
    zones: [R(80, 80, 840, 440)],
    obstacles: [R(220, 80, 30, 300), R(380, 220, 30, 300), R(540, 80, 30, 300), R(700, 220, 30, 300)],
    atouts: [[465, 460], [635, 140]],
  },
  {
    nom: "Le flipper", theme: "bonbon", par: 3, depart: [160, 500], trou: [820, 120],
    zones: [R(100, 60, 800, 480)],
    bumpers: [
      [300, 180, 24], [420, 250, 24], [540, 180, 24], [660, 250, 24],
      [360, 370, 24], [480, 430, 24], [600, 370, 24], [720, 430, 24],
    ],
    boosts: [{ x: 175, y: 430, l: 80, h: 60, angle: -60, force: 800 }],
    atouts: [[500, 300]],
  },
  {
    nom: "La glissade", theme: "neige", par: 3, depart: [150, 470], trou: [860, 130],
    zones: [R(80, 80, 840, 440)],
    obstacles: [[[80, 80], [600, 80], [80, 380]], [[920, 520], [400, 520], [920, 220]]],
    sols: [{ type: "glace", forme: P([[300, 420], [520, 240], [700, 290], [480, 460]]) }],
    atouts: [[500, 300]],
  },
  {
    nom: "Le volcan", theme: "volcan", par: 4, depart: [140, 300], trou: [860, 300],
    zones: [R(80, 80, 840, 440)],
    sols: [
      { type: "eau", forme: C(320, 300, 85) },
      { type: "eau", forme: C(680, 300, 85) },
      { type: "eau", forme: P(R(450, 80, 100, 130)) },
      { type: "eau", forme: P(R(450, 390, 100, 130)) },
    ],
    moulins: [[500, 300, 55, -2]],
    atouts: [[230, 140], [780, 460]],
  },
  {
    nom: "Double moulin", theme: "prairie", par: 3, depart: [130, 300], trou: [870, 300],
    zones: [R(80, 200, 840, 200)],
    moulins: [[340, 300, 90, 1.4], [660, 300, 90, -1.8]],
    bumpers: [[500, 228, 16], [500, 372, 16]],
    atouts: [[500, 300]],
  },
  {
    nom: "L'archipel", theme: "prairie", par: 5, depart: [140, 460], trou: [865, 145],
    zones: [R(60, 60, 880, 480)],
    sols: [
      { type: "eau", forme: P(R(60, 60, 880, 480)) },
      { type: "herbe", forme: C(150, 450, 70) },
      { type: "herbe", forme: C(330, 320, 62) },
      { type: "herbe", forme: C(520, 420, 60) },
      { type: "herbe", forme: C(530, 170, 58) },
      { type: "herbe", forme: C(720, 300, 66) },
      { type: "herbe", forme: C(860, 150, 68) },
      { type: "herbe", forme: P(pont(150, 450, 330, 320, 54)) },
      { type: "herbe", forme: P(pont(330, 320, 520, 420, 54)) },
      { type: "herbe", forme: P(pont(520, 420, 720, 300, 54)) },
      { type: "herbe", forme: P(pont(330, 320, 530, 170, 50)) },
      { type: "herbe", forme: P(pont(720, 300, 860, 150, 54)) },
    ],
    atouts: [[530, 165]],
  },
  {
    nom: "Le huit", theme: "bonbon", par: 3, depart: [120, 300], trou: [880, 300],
    zones: [R(60, 80, 880, 440)],
    obstacles: [octogone(330, 300, 115), octogone(670, 300, 115)],
    boosts: [
      { x: 500, y: 140, l: 90, h: 60, angle: 0, force: 700 },
      { x: 500, y: 460, l: 90, h: 60, angle: 0, force: 700 },
    ],
    atouts: [[500, 300]],
  },
  {
    nom: "La forteresse", theme: "nuit", par: 5, depart: [120, 300], trou: [720, 300],
    zones: [R(60, 60, 880, 480)],
    obstacles: [
      R(620, 200, 20, 200), R(620, 200, 200, 20), R(620, 380, 200, 20),
      R(800, 200, 20, 70), R(800, 330, 20, 70),
    ],
    moulins: [[880, 300, 45, 2.2]],
    sols: [{ type: "sable", forme: C(870, 140, 45) }, { type: "sable", forme: C(870, 460, 45) }],
    bumpers: [[400, 160, 26], [400, 440, 26]],
    atouts: [[300, 300], [900, 515]],
  },
  {
    nom: "La grande finale", theme: "volcan", par: 5, depart: [140, 120], trou: [860, 110],
    zones: [R(60, 60, 880, 480)],
    obstacles: [R(250, 60, 25, 330), R(500, 210, 25, 330), R(750, 60, 25, 330)],
    sols: [{ type: "eau", forme: C(390, 300, 45) }, { type: "sable", forme: C(870, 200, 35) }],
    moulins: [[637, 300, 70, 1.7]],
    boosts: [{ x: 857, y: 330, l: 110, h: 70, angle: -90, force: 800 }],
    teleports: [[160, 470, 640, 470]],
    atouts: [[160, 300], [390, 140]],
  },
];

// ---------- Thèmes graphiques ----------

const THEMES = {
  prairie: {
    fond: "#2f6b3a", fond2: "#2a6034", herbe: ["#74c94f", "#69bd46"], bord: "#8b5a2b", bordClair: "#c58a4f",
    eau: ["#4fb6ee", "#2a86cf"], sable: "#ecd596", deco: "fleurs",
  },
  desert: {
    fond: "#d39a55", fond2: "#c88d49", herbe: ["#a8d45c", "#9cc853"], bord: "#a0522d", bordClair: "#d27d4b",
    eau: ["#48c7d9", "#1f97b8"], sable: "#f2d48f", deco: "cactus",
  },
  neige: {
    fond: "#dfeaf5", fond2: "#d2e0ee", herbe: ["#86d39a", "#7ac78e"], bord: "#5b7898", bordClair: "#8eaacb",
    eau: ["#6ac3f0", "#3c95d6"], sable: "#ffffff", deco: "sapins",
  },
  volcan: {
    fond: "#2a1c1c", fond2: "#332222", herbe: ["#5fa64c", "#559a43"], bord: "#3b3b40", bordClair: "#6a6a72",
    eau: ["#ff8a1f", "#e0420e"], sable: "#b9a27a", deco: "rochers", lave: true,
  },
  bonbon: {
    fond: "#ffd3e6", fond2: "#ffc6de", herbe: ["#7ee3c6", "#70d7b9"], bord: "#e2609f", bordClair: "#f59bc6",
    eau: ["#8fd8ff", "#5fb6f0"], sable: "#fff1b8", deco: "bonbons",
  },
  nuit: {
    fond: "#121834", fond2: "#161d3d", herbe: ["#3e9a52", "#368c49"], bord: "#4b3a6b", bordClair: "#7b65a8",
    eau: ["#3d7fd9", "#2457a8"], sable: "#c8b98a", deco: "etoiles",
  },
};

// ---------- Atouts ----------

const ATOUTS = {
  inverse: { icone: "🔄", nom: "Inversion", cible: "adversaire", desc: "Ses commandes sont inversées au prochain coup" },
  boue: { icone: "🟤", nom: "Boue", cible: "adversaire", desc: "Une flaque de boue devant sa balle" },
  vent: { icone: "💨", nom: "Rafale", cible: "adversaire", desc: "Un coup de vent pendant son prochain tir" },
  faible: { icone: "🪶", nom: "Bras mou", cible: "adversaire", desc: "Son prochain coup est deux fois moins fort" },
  echange: { icone: "🔀", nom: "Échange", cible: "adversaire", desc: "Tu échanges ta balle avec la sienne" },
  aimant: { icone: "🧲", nom: "Aimant", cible: "soi", desc: "Ton prochain coup est attiré par le trou" },
};
const LISTE_ATOUTS = Object.keys(ATOUTS);

// ---------- Géométrie ----------

function dansPoly(x, y, pts) {
  let dedans = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

function dansForme(x, y, f) {
  if (f.cercle) return Math.hypot(x - f.cercle[0], y - f.cercle[1]) < f.cercle[2];
  return dansPoly(x, y, f.poly);
}

function dansBoost(x, y, b) {
  const a = (b.angle * Math.PI) / 180;
  const dx = x - b.x;
  const dy = y - b.y;
  const lx = dx * Math.cos(a) + dy * Math.sin(a);
  const ly = -dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(lx) < b.l / 2 && Math.abs(ly) < b.h / 2;
}

// ---------- État du trou en cours ----------

let carte = null; // parcours en cours
let segments = []; // bords et obstacles : [ax, ay, bx, by]
let champ = null; // distance au trou, case par case, pour l'ordi et la boue
const CASE = 10;
const COLS = L / CASE;
const LIGNES = H / CASE;
let flaques = [];
let boites = [];
let temps = 0;
let flashBumpers = [];

function preparerCarte(c) {
  carte = c;
  c.sols = c.sols || [];
  c.obstacles = c.obstacles || [];
  c.bumpers = c.bumpers || [];
  c.moulins = c.moulins || [];
  c.boosts = c.boosts || [];
  c.teleports = c.teleports || [];
  c.atouts = c.atouts || [];
  segments = [];
  for (const poly of [...c.zones, ...c.obstacles]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      segments.push([a[0], a[1], b[0], b[1]]);
    }
  }
  flaques = [];
  boites = c.atouts.map(([x, y]) => ({ x, y, active: true }));
  flashBumpers = c.bumpers.map(() => 0);
  calculerChamp();
}

// Type de sol sous un point
function surface(x, y) {
  if (!carte.zones.some((z) => dansPoly(x, y, z))) return "dehors";
  if (carte.obstacles.some((o) => dansPoly(x, y, o))) return "dehors";
  let s = "herbe";
  for (const sol of carte.sols) if (dansForme(x, y, sol.forme)) s = sol.type;
  if (s !== "eau") for (const f of flaques) if (Math.hypot(x - f.x, y - f.y) < f.r) s = "boue";
  return s;
}

// Distance de chaque case au trou en suivant le parcours (pour viser intelligemment)
function calculerChamp() {
  const libre = new Uint8Array(COLS * LIGNES);
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < LIGNES; j++) {
      const s = surface(i * CASE + CASE / 2, j * CASE + CASE / 2);
      libre[i * LIGNES + j] = s !== "dehors" && s !== "eau" ? 1 : 0;
    }
  }
  champ = new Float32Array(COLS * LIGNES).fill(Infinity);
  const ci = Math.floor(carte.trou[0] / CASE);
  const cj = Math.floor(carte.trou[1] / CASE);
  const file = [[ci, cj]];
  champ[ci * LIGNES + cj] = 0;
  const liens = new Map();
  for (const [x1, y1, x2, y2] of carte.teleports) {
    const a = Math.floor(x1 / CASE) * LIGNES + Math.floor(y1 / CASE);
    const b = Math.floor(x2 / CASE) * LIGNES + Math.floor(y2 / CASE);
    liens.set(a, b);
    liens.set(b, a);
  }
  for (let t = 0; t < file.length; t++) {
    const [i, j] = file[t];
    const k = i * LIGNES + j;
    const voisins = [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]];
    if (liens.has(k)) {
      const l = liens.get(k);
      voisins.push([Math.floor(l / LIGNES), l % LIGNES]);
    }
    for (const [a, b] of voisins) {
      if (a < 0 || b < 0 || a >= COLS || b >= LIGNES) continue;
      const kk = a * LIGNES + b;
      if (!libre[kk] || champ[kk] !== Infinity) continue;
      champ[kk] = champ[k] + CASE;
      file.push([a, b]);
    }
  }
}

function distanceChamp(x, y) {
  const i = Math.floor(x / CASE);
  const j = Math.floor(y / CASE);
  if (i < 0 || j < 0 || i >= COLS || j >= LIGNES) return 99999;
  const d = champ[i * LIGNES + j];
  return d === Infinity ? 99999 : d;
}

// ---------- Physique ----------

function brasMoulin(m, t) {
  const [x, y, longueur, vitesse] = m;
  const a = t * vitesse;
  const bras = [];
  for (const da of [0, Math.PI / 2]) {
    const c = Math.cos(a + da) * longueur;
    const s = Math.sin(a + da) * longueur;
    bras.push([x - c, y - s, x + c, y + s]);
  }
  return bras;
}

function rebondSegment(b, ax, ay, bx, by, epaisseur, rebond, vitesseMur) {
  const dx = bx - ax;
  const dy = by - ay;
  const long2 = dx * dx + dy * dy;
  let t = ((b.x - ax) * dx + (b.y - ay) * dy) / long2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + dx * t;
  const qy = ay + dy * t;
  let nx = b.x - qx;
  let ny = b.y - qy;
  const d = Math.hypot(nx, ny);
  const min = RAYON + epaisseur;
  if (d >= min || d === 0) return false;
  nx /= d;
  ny /= d;
  b.x = qx + nx * min;
  b.y = qy + ny * min;
  let rvx = b.vx;
  let rvy = b.vy;
  if (vitesseMur) {
    rvx -= vitesseMur(qx, qy)[0];
    rvy -= vitesseMur(qx, qy)[1];
  }
  const vn = rvx * nx + rvy * ny;
  if (vn < 0) {
    b.vx -= (1 + rebond) * vn * nx;
    b.vy -= (1 + rebond) * vn * ny;
    return Math.abs(vn) > 40;
  }
  return false;
}

// Un pas de physique pour une balle. Renvoie la liste des évènements.
function pasBalle(b, dt, t, autres) {
  const ev = [];
  const [tx, ty] = carte.trou;

  // Accélérations : tapis, vent, aimant
  for (const bo of carte.boosts) {
    if (dansBoost(b.x, b.y, bo)) {
      const a = (bo.angle * Math.PI) / 180;
      b.vx += Math.cos(a) * bo.force * dt;
      b.vy += Math.sin(a) * bo.force * dt;
    }
  }
  // Le vent pousse, mais moins fort que le frottement (sinon la balle ne s'arrêterait jamais)
  if (b.vent && Math.hypot(b.vx, b.vy) > 20) {
    const f = Math.min(1, (FROTTEMENT[surface(b.x, b.y)] || FROTTEMENT.herbe) / 300);
    b.vx += b.vent[0] * f * dt;
    b.vy += b.vent[1] * f * dt;
  }
  if (b.aimant) {
    const d = Math.hypot(tx - b.x, ty - b.y);
    if (d < 170 && d > 1) {
      b.vx += ((tx - b.x) / d) * 650 * dt;
      b.vy += ((ty - b.y) / d) * 650 * dt;
    }
  }

  // Frottements selon le sol
  const sol = surface(b.x, b.y);
  const v = Math.hypot(b.vx, b.vy);
  if (v > 0) {
    const nv = Math.max(0, v - ((FROTTEMENT[sol] || FROTTEMENT.herbe) + 0.45 * v) * dt);
    b.vx *= nv / v;
    b.vy *= nv / v;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // Bords et obstacles
  for (const s of segments) if (rebondSegment(b, s[0], s[1], s[2], s[3], 0, 0.72)) ev.push("mur");

  // Moulins qui tournent
  for (const m of carte.moulins) {
    const w = m[3];
    const vitesseMur = (qx, qy) => [-(qy - m[1]) * w, (qx - m[0]) * w];
    for (const br of brasMoulin(m, t)) {
      if (rebondSegment(b, br[0], br[1], br[2], br[3], 5, 0.6, vitesseMur)) ev.push("mur");
    }
  }

  // Bumpers qui renvoient la balle
  carte.bumpers.forEach(([x, y, r], i) => {
    const dx = b.x - x;
    const dy = b.y - y;
    const d = Math.hypot(dx, dy);
    if (d < r + RAYON && d > 0) {
      const nx = dx / d;
      const ny = dy / d;
      b.x = x + nx * (r + RAYON);
      b.y = y + ny * (r + RAYON);
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= 2.15 * vn * nx;
        b.vy -= 2.15 * vn * ny;
        const nv = Math.hypot(b.vx, b.vy);
        if (nv < 260) {
          b.vx += nx * (260 - nv);
          b.vy += ny * (260 - nv);
        }
        ev.push("bumper:" + i);
      }
    }
  });

  // Les autres balles
  for (const o of autres) {
    const dx = b.x - o.x;
    const dy = b.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d < RAYON * 2 && d > 0) {
      const nx = dx / d;
      const ny = dy / d;
      const chevauche = RAYON * 2 - d;
      if (o.fixe) {
        b.x += nx * chevauche;
        b.y += ny * chevauche;
      } else {
        b.x += (nx * chevauche) / 2;
        b.y += (ny * chevauche) / 2;
        o.x -= (nx * chevauche) / 2;
        o.y -= (ny * chevauche) / 2;
      }
      const vr = (b.vx - (o.vx || 0)) * nx + (b.vy - (o.vy || 0)) * ny;
      if (vr < 0) {
        const j = vr * 0.95;
        b.vx -= j * nx;
        b.vy -= j * ny;
        if (!o.fixe) {
          o.vx += j * nx;
          o.vy += j * ny;
        }
        ev.push("choc");
      }
    }
  }

  // Téléporteurs (dans les deux sens)
  b.tp = Math.max(0, (b.tp || 0) - dt);
  if (b.tp === 0) {
    for (const [x1, y1, x2, y2] of carte.teleports) {
      let arrivee = null;
      if (Math.hypot(b.x - x1, b.y - y1) < 14) arrivee = [x2, y2];
      else if (Math.hypot(b.x - x2, b.y - y2) < 14) arrivee = [x1, y1];
      if (arrivee) {
        const nv = Math.hypot(b.vx, b.vy) || 1;
        b.x = arrivee[0] + (b.vx / nv) * 22;
        b.y = arrivee[1] + (b.vy / nv) * 22;
        b.tp = 0.6;
        ev.push("tp");
        break;
      }
    }
  }

  // Boîtes d'atouts
  boites.forEach((bo, i) => {
    if (bo.active && Math.hypot(b.x - bo.x, b.y - bo.y) < RAYON + 13) ev.push("atout:" + i);
  });

  // Eau ou lave
  if (sol === "eau" || sol === "dehors") ev.push(sol);

  // Le trou : trop vite, la balle passe par-dessus en étant déviée
  const dt2 = Math.hypot(b.x - tx, b.y - ty);
  const vit = Math.hypot(b.vx, b.vy);
  if (dt2 < COUPE) {
    if (vit < 480) ev.push("trou");
    else {
      b.vx += ((tx - b.x) / dt2) * 2600 * dt;
      b.vy += ((ty - b.y) / dt2) * 2600 * dt;
    }
  } else if (dt2 < COUPE + 7 && vit < 160) {
    b.vx += ((tx - b.x) / dt2) * 320 * dt;
    b.vy += ((ty - b.y) / dt2) * 320 * dt;
  }

  // Arrêt
  const surTapis = carte.boosts.some((bo) => dansBoost(b.x, b.y, bo));
  if (vit < 6 && !surTapis) {
    b.vx = 0;
    b.vy = 0;
  }
  return ev;
}

// ---------- Joueurs et partie ----------

let mode = "ordi";
let choixParcours = "debut";
let ordreTrous = [];
let numeroTrou = 0;
let joueurs = [];
let courant = 0;
let phase = "menu"; // menu, visee, roule, ordi, score, fin
let tempsTir = 0;
let visee = null; // { x0, y0, x, y } pendant le glisser
let viseeOrdi = null;
let particules = [];
let textes = [];
let couche = null; // décor qui ne bouge pas, dessiné une seule fois par trou

function creerJoueur(i, nom, ordi) {
  return {
    i,
    nom,
    ordi,
    couleur: COULEURS_JOUEURS[i],
    balle: { x: 0, y: 0, vx: 0, vy: 0, actif: false, dansTrou: false, noyee: 0, trace: [], echelle: 1 },
    coups: 0,
    total: 0,
    cartes: [],
    atouts: [],
    effets: {},
    fini: false,
    avant: null,
  };
}

function adversaire(j) {
  return joueurs[1 - j.i];
}

function nouvellePartie() {
  ordreTrous =
    choixParcours === "debut" ? [...Array(10).keys()] :
    choixParcours === "fin" ? [...Array(10).keys()].map((i) => i + 10) :
    [...Array(20).keys()];
  joueurs = [
    creerJoueur(0, mode === "ordi" ? "Toi" : "Joueur 1", false),
    creerJoueur(1, mode === "ordi" ? "Ordi" : "Joueur 2", mode === "ordi"),
  ];
  numeroTrou = 0;
  menu.classList.add("cache");
  demarrerTrou();
}

function demarrerTrou() {
  preparerCarte(PARCOURS[ordreTrous[numeroTrou]]);
  for (const j of joueurs) {
    j.coups = 0;
    j.fini = false;
    j.effets = {};
    Object.assign(j.balle, { vx: 0, vy: 0, actif: false, dansTrou: false, noyee: 0, trace: [], echelle: 1 });
  }
  particules = [];
  textes = [];
  couche = null;
  courant = numeroTrou % 2; // chacun commence un trou sur deux
  majInfos();
  annoncer(`Trou ${numeroTrou + 1} : ${carte.nom}`);
  preparerTour();
}

function placerSurDepart(j) {
  const b = j.balle;
  const [dx, dy] = carte.depart;
  b.x = dx;
  b.y = dy;
  const autre = adversaire(j).balle;
  if (autre.actif && !autre.dansTrou && Math.hypot(autre.x - dx, autre.y - dy) < RAYON * 2 + 2) {
    b.y += RAYON * 2.6;
  }
  b.actif = true;
}

function preparerTour() {
  const j = joueurs[courant];
  if (!j.balle.actif) placerSurDepart(j);
  phase = j.ordi ? "ordi" : "visee";
  visee = null;
  viseeOrdi = null;
  majInfos();
  majAtouts();
  const e = j.effets;
  const avertissements = [];
  if (e.inverse) avertissements.push("🔄 Commandes inversées !");
  if (e.faible) avertissements.push("🪶 Bras mou : moitié de puissance");
  if (e.vent) avertissements.push("💨 Gros coup de vent !");
  if (e.aimant) avertissements.push("🧲 Aimant prêt");
  if (avertissements.length) annoncer(`${j.nom} — ${avertissements.join(" · ")}`, 3000);
  if (j.ordi) setTimeout(tourOrdi, 700);
}

function tirer(j, angle, puissance) {
  const e = j.effets;
  if (e.inverse) angle += Math.PI;
  if (e.faible) puissance *= 0.5;
  const b = j.balle;
  for (const k of joueurs) k.avant = { x: k.balle.x, y: k.balle.y };
  b.vx = Math.cos(angle) * puissance * VITESSE_MAX;
  b.vy = Math.sin(angle) * puissance * VITESSE_MAX;
  b.vent = e.vent || null;
  b.aimant = !!e.aimant;
  e.inverse = false;
  e.faible = false;
  j.coups++;
  phase = "roule";
  tempsTir = 0;
  son("tir", puissance);
  majInfos();
  majAtouts();
}

function balleMobile(b) {
  return b.actif && !b.dansTrou && (b.noyee > 0 || Math.hypot(b.vx, b.vy) > 0);
}

function finDuTir() {
  const j = joueurs[courant];
  j.balle.vent = null;
  j.balle.aimant = false;
  j.effets.vent = null;
  j.effets.aimant = false;
  for (const k of joueurs) {
    if (!k.fini && k.coups >= COUPS_MAX) {
      k.fini = true;
      k.coups = COUPS_MAX;
      annoncer(`${k.nom} a atteint ${COUPS_MAX} coups`);
    }
  }
  if (joueurs.every((k) => k.fini)) {
    setTimeout(finDuTrou, 1100);
    phase = "attente";
    return;
  }
  const autre = adversaire(j);
  courant = autre.fini ? j.i : autre.i;
  preparerTour();
}

function finDuTrou() {
  for (const j of joueurs) j.total += j.coups;
  scoresParTrou.push(joueurs.map((j) => j.coups));
  majInfos();
  phase = "score";
  const dernier = numeroTrou === ordreTrous.length - 1;
  const lignes = joueurs
    .map((j) => `<tr><td>${j.nom}</td><td>${j.coups}</td><td>${nomScore(j.coups - carte.par)}</td><td>${j.total}</td></tr>`)
    .join("");
  scoreTitre.textContent = `Trou ${numeroTrou + 1} — ${carte.nom} (par ${carte.par})`;
  scoreContenu.innerHTML = `<table class="tableau-score"><tr><th></th><th>Coups</th><th></th><th>Total</th></tr>${lignes}</table>`;
  if (dernier) {
    const [a, b] = joueurs;
    const gagnant = a.total === b.total ? "Égalité !" : `${(a.total < b.total ? a : b).nom} gagne ! 🏆`;
    scoreTitre.textContent = "Fin du parcours";
    scoreContenu.innerHTML = `<p><b>${gagnant}</b></p>` + tableauFinal();
    boutonSuite.textContent = "Rejouer";
  } else {
    boutonSuite.textContent = "Trou suivant";
  }
  carteScore.classList.remove("cache");
}

function nomScore(ecart) {
  if (ecart <= -3) return "Albatros !";
  if (ecart === -2) return "Eagle !";
  if (ecart === -1) return "Birdie";
  if (ecart === 0) return "Par";
  if (ecart === 1) return "Bogey";
  return `+${ecart}`;
}

const scoresParTrou = [];
function tableauFinal() {
  const tetes = ordreTrous.map((_, i) => `<th>${i + 1}</th>`).join("");
  const pars = ordreTrous.map((t) => `<td>${PARCOURS[t].par}</td>`).join("");
  const lignes = joueurs
    .map((j) => {
      const cases = scoresParTrou.map((s) => `<td>${s[j.i]}</td>`).join("");
      const meilleur = j.total <= adversaire(j).total ? ' class="meilleur"' : "";
      return `<tr><td>${j.nom}</td>${cases}<td${meilleur}>${j.total}</td></tr>`;
    })
    .join("");
  return `<div class="defile"><table class="tableau-score"><tr><th></th>${tetes}<th>Total</th></tr><tr><td>Par</td>${pars}<td>${ordreTrous.reduce((s, t) => s + PARCOURS[t].par, 0)}</td></tr>${lignes}</table></div>`;
}

boutonSuite.addEventListener("click", () => {
  carteScore.classList.add("cache");
  if (numeroTrou === ordreTrous.length - 1) {
    scoresParTrou.length = 0;
    menu.classList.remove("cache");
    phase = "menu";
    return;
  }
  numeroTrou++;
  demarrerTrou();
});

// ---------- Atouts ----------

function donnerAtout(j, i) {
  boites[i].active = false;
  const nom = LISTE_ATOUTS[Math.floor(Math.random() * LISTE_ATOUTS.length)];
  eclats(boites[i].x, boites[i].y, ["#ffd23f", "#ff5aa5", "#5ad1ff", "#9b5aff"], 22);
  son("atout");
  if (j.atouts.length >= ATOUTS_MAX) {
    texteFlottant(boites[i].x, boites[i].y, "Sac plein !");
    return;
  }
  j.atouts.push(nom);
  texteFlottant(boites[i].x, boites[i].y, `${ATOUTS[nom].icone} ${ATOUTS[nom].nom} !`);
  majAtouts();
  majInfos();
}

function atoutUtilisable(j, nom) {
  const adv = adversaire(j);
  if (ATOUTS[nom].cible === "soi") return !j.effets.aimant;
  if (adv.fini) return false;
  if (nom === "echange") return adv.balle.actif && !adv.balle.dansTrou;
  return true;
}

function utiliserAtout(j, index) {
  const nom = j.atouts[index];
  if (!nom || !atoutUtilisable(j, nom)) return;
  j.atouts.splice(index, 1);
  const adv = adversaire(j);
  son("atout");
  if (nom === "inverse") adv.effets.inverse = true;
  if (nom === "faible") adv.effets.faible = true;
  if (nom === "aimant") j.effets.aimant = true;
  if (nom === "vent") {
    const a = Math.random() * Math.PI * 2;
    adv.effets.vent = [Math.cos(a) * 190, Math.sin(a) * 190];
  }
  if (nom === "boue") poserBoue(adv);
  if (nom === "echange") {
    const a = j.balle;
    const b = adv.balle;
    [a.x, b.x] = [b.x, a.x];
    [a.y, b.y] = [b.y, a.y];
    eclats(a.x, a.y, ["#ffffff", "#c38bff"], 14);
    eclats(b.x, b.y, ["#ffffff", "#c38bff"], 14);
  }
  annoncer(`${j.nom} utilise ${ATOUTS[nom].icone} ${ATOUTS[nom].nom} !`);
  majAtouts();
  majInfos();
}

// La flaque se pose sur le chemin entre la balle adverse et le trou
function poserBoue(adv) {
  const depart = adv.balle.actif ? adv.balle : { x: carte.depart[0], y: carte.depart[1] };
  let i = Math.floor(depart.x / CASE);
  let j = Math.floor(depart.y / CASE);
  for (let pas = 0; pas < 8; pas++) {
    let meilleur = null;
    let d = champ[i * LIGNES + j];
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1], [i + 1, j + 1], [i - 1, j - 1], [i + 1, j - 1], [i - 1, j + 1]]) {
      if (a < 0 || b < 0 || a >= COLS || b >= LIGNES) continue;
      if (champ[a * LIGNES + b] < d) {
        d = champ[a * LIGNES + b];
        meilleur = [a, b];
      }
    }
    if (!meilleur || d < 40) break;
    [i, j] = meilleur;
  }
  const x = i * CASE + CASE / 2;
  const y = j * CASE + CASE / 2;
  flaques.push({ x, y, r: 46, graines: Array.from({ length: 9 }, () => [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()]) });
  eclats(x, y, ["#5b3a1e", "#7a5230"], 18);
  couche = null; // la flaque change le décor fixe
}

// ---------- L'ordi ----------

function simuler(j, angle, puissance, avecAimant) {
  const b = { x: j.balle.x, y: j.balle.y, vx: Math.cos(angle) * puissance * VITESSE_MAX, vy: Math.sin(angle) * puissance * VITESSE_MAX, aimant: avecAimant, tp: 0 };
  const autres = joueurs.filter((k) => k !== j && k.balle.actif && !k.balle.dansTrou).map((k) => ({ x: k.balle.x, y: k.balle.y, fixe: true }));
  const pas = 1 / 120;
  let t = temps;
  for (let n = 0; n < 720; n++) {
    const ev = pasBalle(b, pas, t, autres);
    t += pas;
    if (ev.includes("trou")) return -100000 + n;
    if (ev.includes("eau") || ev.includes("dehors")) return 1e6;
    if (b.vx === 0 && b.vy === 0) break;
  }
  const sol = surface(b.x, b.y);
  return distanceChamp(b.x, b.y) + (sol === "sable" ? 40 : sol === "boue" ? 70 : 0);
}

function meilleurCoup(j) {
  const aimant = !!j.effets.aimant;
  const facteur = j.effets.faible ? 0.5 : 1;
  let meilleur = { score: Infinity, angle: 0, puissance: 0.5 };
  const essayer = (angle, puissance) => {
    const s = simuler(j, angle, puissance * facteur, aimant);
    if (s < meilleur.score) meilleur = { score: s, angle, puissance };
  };
  for (let a = 0; a < 72; a++) {
    for (const p of [0.12, 0.2, 0.3, 0.42, 0.56, 0.72, 0.88, 1]) essayer((a / 72) * Math.PI * 2, p);
  }
  const base = { ...meilleur };
  for (let n = 0; n < 40; n++) {
    essayer(base.angle + (Math.random() - 0.5) * 0.09, Math.min(1, Math.max(0.08, base.puissance + (Math.random() - 0.5) * 0.12)));
  }
  // Un peu d'imprécision pour rester battable
  meilleur.angle += (Math.random() - 0.5) * 0.08;
  meilleur.puissance *= 1 + (Math.random() - 0.5) * 0.16;
  return meilleur;
}

function tourOrdi() {
  if (phase !== "ordi") return;
  const j = joueurs[courant];
  // Utilise parfois un atout
  if (j.atouts.length && Math.random() < 0.65) {
    const i = j.atouts.findIndex((n) => atoutUtilisable(j, n) && (n !== "echange" || echangeInteressant(j)));
    if (i >= 0) utiliserAtout(j, i);
  }
  setTimeout(() => {
    const coup = meilleurCoup(j);
    // Sous l'effet de l'inversion, l'ordi ne pense à compenser qu'une fois sur deux
    if (j.effets.inverse && Math.random() < 0.5) coup.angle += Math.PI;
    viseeOrdi = { angle: coup.angle, puissance: 0, cible: coup.puissance };
    const debut = performance.now();
    const animer = () => {
      const t = Math.min(1, (performance.now() - debut) / 700);
      viseeOrdi.puissance = coup.puissance * t;
      if (t < 1) requestAnimationFrame(animer);
      else {
        viseeOrdi = null;
        tirer(j, coup.angle, coup.puissance);
      }
    };
    animer();
  }, 500);
}

function echangeInteressant(j) {
  const adv = adversaire(j);
  return distanceChamp(adv.balle.x, adv.balle.y) + 30 < distanceChamp(j.balle.x, j.balle.y);
}

// ---------- Commandes ----------

function versTerrain(e) {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * L, ((e.clientY - r.top) / r.height) * H];
}

canvas.addEventListener("pointerdown", (e) => {
  if (phase !== "visee") return;
  initialiserAudio();
  const [x, y] = versTerrain(e);
  visee = { x0: x, y0: y, x, y };
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (err) {}
});

canvas.addEventListener("pointermove", (e) => {
  if (!visee) return;
  [visee.x, visee.y] = versTerrain(e);
});

function finVisee(e) {
  if (!visee || phase !== "visee") return;
  const dx = visee.x0 - visee.x;
  const dy = visee.y0 - visee.y;
  const d = Math.hypot(dx, dy);
  visee = null;
  if (d < 12) return; // trop court : on annule
  tirer(joueurs[courant], Math.atan2(dy, dx), Math.min(1, d / TIRAGE_MAX));
}
canvas.addEventListener("pointerup", finVisee);
canvas.addEventListener("pointercancel", () => (visee = null));

document.querySelectorAll("[data-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    mode = b.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  })
);
document.querySelectorAll("[data-parcours]").forEach((b) =>
  b.addEventListener("click", () => {
    choixParcours = b.dataset.parcours;
    document.querySelectorAll("[data-parcours]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  })
);
document.getElementById("commencer").addEventListener("click", () => {
  initialiserAudio();
  scoresParTrou.length = 0;
  nouvellePartie();
});

// ---------- Interface ----------

function majInfos() {
  document.getElementById("trou-numero").textContent = `Trou ${numeroTrou + 1}/${ordreTrous.length}`;
  document.getElementById("trou-nom").textContent = carte ? carte.nom : "—";
  document.getElementById("trou-par").textContent = carte ? `Par ${carte.par}` : "";
  joueurs.forEach((j, i) => {
    const p = panneaux[i];
    p.querySelector(".nom").textContent = j.nom + (j.fini && j.balle.dansTrou ? " ⛳" : "");
    p.querySelector(".coups").textContent = j.coups;
    p.querySelector(".total").textContent = j.total;
    const e = j.effets;
    p.querySelector(".effets").textContent =
      (e.inverse ? "🔄" : "") + (e.faible ? "🪶" : "") + (e.vent ? "💨" : "") + (e.aimant ? "🧲" : "") +
      (j.atouts.length ? "  🎁" + j.atouts.length : "");
    p.classList.toggle("actif", i === courant && phase !== "score" && phase !== "menu");
  });
}

function majAtouts() {
  const j = joueurs[courant];
  atoutsListe.innerHTML = "";
  if (!j) return;
  atoutsTitre.textContent = j.ordi ? `Atouts de ${j.nom} :` : mode === "deux" ? `Atouts de ${j.nom} :` : "Tes atouts :";
  if (!j.atouts.length) {
    atoutsListe.innerHTML = '<span class="atouts-vide">aucun — touche une boîte ? pour en gagner</span>';
    return;
  }
  j.atouts.forEach((nom, i) => {
    const a = ATOUTS[nom];
    const bouton = document.createElement("button");
    bouton.className = "atout";
    bouton.innerHTML = `<span>${a.icone}</span><b>${a.nom}</b>`;
    bouton.title = a.desc;
    bouton.disabled = j.ordi || phase !== "visee" || !atoutUtilisable(j, nom);
    bouton.addEventListener("click", () => utiliserAtout(j, i));
    bouton.addEventListener("mouseenter", () => (atoutAide.textContent = `${a.icone} ${a.nom} : ${a.desc}.`));
    atoutsListe.appendChild(bouton);
  });
}

let minuteurBandeau;
function annoncer(texte, duree = 2200) {
  bandeau.textContent = texte;
  bandeau.classList.add("visible");
  clearTimeout(minuteurBandeau);
  minuteurBandeau = setTimeout(() => bandeau.classList.remove("visible"), duree);
}

// ---------- Effets visuels ----------

function eclats(x, y, couleurs, nombre) {
  for (let i = 0; i < nombre; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 60 + Math.random() * 220;
    particules.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      vie: 0.6 + Math.random() * 0.6, age: 0,
      couleur: couleurs[i % couleurs.length], taille: 2 + Math.random() * 3,
    });
  }
}

function texteFlottant(x, y, texte) {
  textes.push({ x, y, texte, age: 0 });
}

// ---------- Sons ----------

let audio = null;
function initialiserAudio() {
  if (audio) return;
  try {
    audio = new AudioContext();
  } catch (e) {}
}

function son(type, force = 1) {
  if (!audio) return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.connect(g).connect(audio.destination);
  const r = {
    tir: ["triangle", 900, 300, 0.05, 0.25 * (0.4 + force)],
    mur: ["square", 220, 160, 0.05, 0.06],
    bumper: ["sine", 600, 1200, 0.15, 0.2],
    trou: ["sine", 880, 220, 0.5, 0.3],
    eau: ["sawtooth", 300, 60, 0.4, 0.12],
    atout: ["triangle", 700, 1400, 0.25, 0.18],
    tp: ["sine", 300, 1500, 0.3, 0.15],
  }[type];
  osc.type = r[0];
  osc.frequency.setValueAtTime(r[1], t);
  osc.frequency.exponentialRampToValueAtTime(r[2], t + r[3]);
  g.gain.setValueAtTime(r[4], t);
  g.gain.exponentialRampToValueAtTime(0.001, t + r[3] + 0.05);
  osc.start(t);
  osc.stop(t + r[3] + 0.08);
}

// ---------- Boucle de jeu ----------

let accumule = 0;
let derniere = performance.now();

function mettreAJour(dt) {
  temps += dt;
  flashBumpers = flashBumpers.map((f) => Math.max(0, f - dt * 3));

  if (phase === "roule") {
    tempsTir += dt;
    accumule += dt;
    let sonMur = false;
    while (accumule >= PAS) {
      accumule -= PAS;
      for (const j of joueurs) {
        const b = j.balle;
        if (!b.actif || b.dansTrou || b.noyee > 0) continue;
        if (b.vx === 0 && b.vy === 0 && !carte.boosts.some((bo) => dansBoost(b.x, b.y, bo))) continue;
        const autres = joueurs.filter((k) => k !== j && k.balle.actif && !k.balle.dansTrou && k.balle.noyee <= 0).map((k) => k.balle);
        const ev = pasBalle(b, PAS, temps, autres);
        for (const e of ev) {
          if (e === "mur" || e === "choc") sonMur = true;
          else if (e.startsWith("bumper:")) {
            flashBumpers[+e.split(":")[1]] = 1;
            son("bumper");
          } else if (e === "tp") {
            son("tp");
            eclats(b.x, b.y, ["#c38bff", "#ffffff"], 12);
          } else if (e.startsWith("atout:")) {
            donnerAtout(j, +e.split(":")[1]);
          } else if (e === "eau" || e === "dehors") {
            b.noyee = 0.8;
            b.vx = b.vy = 0;
            son("eau");
            eclats(b.x, b.y, THEMES[carte.theme].lave ? ["#ffb347", "#ff5a1f"] : ["#bfe9ff", "#ffffff"], 20);
            texteFlottant(b.x, b.y, "+1 coup");
            break;
          } else if (e === "trou") {
            b.dansTrou = true;
            b.vx = b.vy = 0;
            j.fini = true;
            son("trou");
            eclats(carte.trou[0], carte.trou[1], ["#ffd23f", "#ff5a4f", "#3d8bff", "#7ee3c6", "#ffffff"], 40);
            const ecart = j.coups - carte.par;
            texteFlottant(carte.trou[0], carte.trou[1] - 20, j.coups === 1 ? "Trou en un !" : nomScore(ecart));
            majInfos();
            break;
          }
        }
      }
    }
    if (sonMur) son("mur");

    // Balle tombée à l'eau : elle revient à sa place d'avant, avec un coup de pénalité
    for (const j of joueurs) {
      const b = j.balle;
      if (b.noyee > 0) {
        b.noyee -= dt;
        if (b.noyee <= 0) {
          b.noyee = 0;
          b.x = j.avant ? j.avant.x : carte.depart[0];
          b.y = j.avant ? j.avant.y : carte.depart[1];
          j.coups++;
          majInfos();
        }
      }
      if (b.actif && !b.dansTrou) {
        b.trace.push([b.x, b.y]);
        if (b.trace.length > 14) b.trace.shift();
      }
    }

    // Tout le monde est arrêté : au suivant (au bout de 15 s on arrête tout)
    if (!joueurs.some((j) => balleMobile(j.balle)) || tempsTir > 15) {
      for (const j of joueurs) {
        j.balle.vx = j.balle.vy = 0;
        j.balle.trace = [];
      }
      finDuTir();
    }
  }

  for (const j of joueurs) {
    if (j.balle.dansTrou) j.balle.echelle = Math.max(0, j.balle.echelle - dt * 4);
  }
  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 1 - dt * 3;
    p.vy *= 1 - dt * 3;
    if (p.age > p.vie) particules.splice(i, 1);
  }
  for (let i = textes.length - 1; i >= 0; i--) {
    textes[i].age += dt;
    textes[i].y -= dt * 30;
    if (textes[i].age > 1.6) textes.splice(i, 1);
  }
}

function boucle(maintenant) {
  const dt = Math.min(0.05, (maintenant - derniere) / 1000);
  derniere = maintenant;
  if (carte) mettreAJour(dt);
  dessiner();
  requestAnimationFrame(boucle);
}

// ---------- Dessin ----------

let echelle = 1;

function redimensionner() {
  const r = canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(r.width * ratio);
  canvas.height = Math.round(r.height * ratio);
  echelle = canvas.width / L;
  couche = null;
}
addEventListener("resize", redimensionner);

function hasard(graine) {
  return () => {
    graine |= 0;
    graine = (graine + 0x6d2b79f5) | 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cheminPoly(c, pts) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
}

function cheminForme(c, f) {
  if (f.cercle) {
    c.beginPath();
    c.arc(f.cercle[0], f.cercle[1], f.cercle[2], 0, Math.PI * 2);
  } else cheminPoly(c, f.poly);
}

function remplirHerbe(c, th, clip) {
  c.save();
  clip();
  c.clip();
  c.fillStyle = th.herbe[0];
  c.fillRect(0, 0, L, H);
  // Bandes de tonte en diagonale
  c.fillStyle = th.herbe[1];
  c.translate(L / 2, H / 2);
  c.rotate(-0.5);
  for (let x = -900; x < 900; x += 80) c.fillRect(x, -900, 40, 1800);
  c.restore();
}

function dessinerDeco(c, th, alea) {
  for (let n = 0; n < 70; n++) {
    const x = alea() * L;
    const y = alea() * H;
    const t = 0.6 + alea() * 0.8;
    c.save();
    c.translate(x, y);
    c.scale(t, t);
    switch (th.deco) {
      case "fleurs":
        if (alea() < 0.5) {
          c.fillStyle = "#245a2e";
          for (const [dx, dy, r] of [[-8, 2, 12], [8, 2, 12], [0, -6, 14]]) {
            c.beginPath();
            c.arc(dx, dy, r, 0, Math.PI * 2);
            c.fill();
          }
        } else {
          c.fillStyle = ["#ffd23f", "#ff7eb6", "#ffffff", "#c38bff"][n % 4];
          for (let p = 0; p < 5; p++) {
            c.beginPath();
            c.arc(Math.cos(p * 1.256) * 4, Math.sin(p * 1.256) * 4, 3, 0, Math.PI * 2);
            c.fill();
          }
          c.fillStyle = "#f29b00";
          c.beginPath();
          c.arc(0, 0, 2.5, 0, Math.PI * 2);
          c.fill();
        }
        break;
      case "cactus":
        if (alea() < 0.45) {
          c.fillStyle = "#3f8f4a";
          c.fillRect(-5, -22, 10, 26);
          c.fillRect(-14, -14, 6, 10);
          c.fillRect(8, -18, 6, 10);
          c.fillRect(-14, -8, 10, 5);
          c.fillRect(4, -12, 10, 5);
        } else {
          c.fillStyle = "#b9824a";
          c.beginPath();
          c.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
          c.fill();
        }
        break;
      case "sapins":
        if (alea() < 0.55) {
          c.fillStyle = "#2f6b4f";
          for (const [w, y0] of [[16, -6], [12, -16], [8, -24]]) {
            c.beginPath();
            c.moveTo(-w, y0 + 10);
            c.lineTo(w, y0 + 10);
            c.lineTo(0, y0 - 6);
            c.fill();
          }
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.moveTo(-5, -26);
          c.lineTo(5, -26);
          c.lineTo(0, -30);
          c.fill();
        } else {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
          c.fill();
        }
        break;
      case "rochers":
        c.fillStyle = alea() < 0.3 ? "#ff6a1f" : "#4a3a3a";
        c.beginPath();
        c.moveTo(-10, 6);
        c.lineTo(-6, -8);
        c.lineTo(6, -10);
        c.lineTo(12, 4);
        c.closePath();
        c.fill();
        break;
      case "bonbons":
        c.fillStyle = ["#ff6fae", "#7ee3c6", "#ffd23f", "#9b8bff"][n % 4];
        c.beginPath();
        c.arc(0, 0, 8, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "rgba(255,255,255,0.8)";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(0, 0, 4.5, 0, Math.PI * 1.4);
        c.stroke();
        break;
      case "etoiles":
        c.fillStyle = alea() < 0.15 ? "#ffd23f" : "rgba(255,255,255,0.7)";
        c.beginPath();
        c.arc(0, 0, alea() * 1.8 + 0.6, 0, Math.PI * 2);
        c.fill();
        break;
    }
    c.restore();
  }
}

// Tout ce qui ne bouge pas : fond, gazon, bords, sable, obstacles, trou
function dessinerCouche() {
  couche = document.createElement("canvas");
  couche.width = canvas.width;
  couche.height = canvas.height;
  const c = couche.getContext("2d");
  c.setTransform(echelle, 0, 0, echelle, 0, 0);
  const th = THEMES[carte.theme];
  const alea = hasard(ordreTrous[numeroTrou] * 977 + 13);

  // Fond avec un léger damier et des décorations
  c.fillStyle = th.fond;
  c.fillRect(0, 0, L, H);
  c.fillStyle = th.fond2;
  for (let x = 0; x < L; x += 50) for (let y = (x / 50) % 2 ? 0 : 50; y < H; y += 100) c.fillRect(x, y, 50, 50);
  dessinerDeco(c, th, alea);

  // Ombre portée du parcours
  c.save();
  c.shadowColor = "rgba(0,0,0,0.45)";
  c.shadowBlur = 18;
  c.shadowOffsetX = 6;
  c.shadowOffsetY = 10;
  c.fillStyle = th.bord;
  for (const z of carte.zones) {
    cheminPoly(c, z);
    c.lineJoin = "round";
    c.lineWidth = 26;
    c.strokeStyle = th.bord;
    c.stroke();
    c.fill();
  }
  c.restore();

  // Bordure en relief
  for (const z of carte.zones) {
    cheminPoly(c, z);
    c.lineJoin = "round";
    c.lineWidth = 26;
    c.strokeStyle = th.bord;
    c.stroke();
    c.lineWidth = 16;
    c.strokeStyle = th.bordClair;
    c.stroke();
  }

  // Gazon
  remplirHerbe(c, th, () => {
    c.beginPath();
    for (const z of carte.zones) z.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  });

  // Sols spéciaux, dans l'ordre (les îles d'herbe recouvrent l'eau)
  for (const sol of carte.sols) {
    c.save();
    if (sol.type === "herbe") {
      remplirHerbe(c, th, () => cheminForme(c, sol.forme));
      c.restore();
      continue;
    }
    cheminForme(c, sol.forme);
    c.clip();
    if (sol.type === "eau") {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, th.eau[0]);
      g.addColorStop(1, th.eau[1]);
      c.fillStyle = g;
      c.fillRect(0, 0, L, H);
    } else if (sol.type === "sable") {
      c.fillStyle = th.sable;
      c.fillRect(0, 0, L, H);
      c.fillStyle = "rgba(120,90,40,0.18)";
      for (let n = 0; n < 900; n++) c.fillRect(alea() * L, alea() * H, 1.6, 1.6);
    } else if (sol.type === "glace") {
      c.fillStyle = "#dff4ff";
      c.fillRect(0, 0, L, H);
      c.strokeStyle = "rgba(255,255,255,0.9)";
      c.lineWidth = 2;
      for (let n = 0; n < 40; n++) {
        const x = alea() * L;
        const y = alea() * H;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 30 + alea() * 40, y - 10 - alea() * 20);
        c.stroke();
      }
    }
    c.restore();
    // Liseré autour
    c.save();
    cheminForme(c, sol.forme);
    c.lineWidth = sol.type === "eau" ? 4 : 2;
    c.strokeStyle = sol.type === "eau" ? (th.lave ? "rgba(255,220,120,0.8)" : "rgba(255,255,255,0.7)") : "rgba(0,0,0,0.12)";
    c.stroke();
    c.restore();
  }

  // Ombre intérieure le long des bords
  c.save();
  c.beginPath();
  for (const z of carte.zones) z.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.clip();
  for (const z of carte.zones) {
    cheminPoly(c, z);
    c.lineWidth = 10;
    c.strokeStyle = "rgba(0,0,0,0.16)";
    c.stroke();
  }
  c.restore();

  // Obstacles en relief
  for (const o of carte.obstacles) {
    c.save();
    c.shadowColor = "rgba(0,0,0,0.4)";
    c.shadowBlur = 10;
    c.shadowOffsetX = 4;
    c.shadowOffsetY = 6;
    cheminPoly(c, o);
    c.fillStyle = th.bord;
    c.fill();
    c.restore();
    cheminPoly(c, o);
    c.lineJoin = "round";
    c.lineWidth = 3;
    c.strokeStyle = th.bordClair;
    c.stroke();
  }

  // Flaques de boue
  for (const f of flaques) {
    c.save();
    c.fillStyle = "#5b3a1e";
    c.beginPath();
    for (let a = 0; a <= 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const r = f.r * (0.88 + 0.12 * Math.sin(a * 2.3 + f.x));
      a ? c.lineTo(f.x + Math.cos(ang) * r, f.y + Math.sin(ang) * r) : c.moveTo(f.x + r, f.y);
    }
    c.fill();
    c.fillStyle = "#7a5230";
    for (const [gx, gy, gr] of f.graines) {
      c.beginPath();
      c.arc(f.x + gx * f.r * 0.55, f.y + gy * f.r * 0.55, 4 + gr * 7, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // Le trou
  const [tx, ty] = carte.trou;
  c.fillStyle = "rgba(255,255,255,0.35)";
  c.beginPath();
  c.arc(tx, ty, COUPE + 4, 0, Math.PI * 2);
  c.fill();
  const g = c.createRadialGradient(tx - 3, ty - 3, 2, tx, ty, COUPE);
  g.addColorStop(0, "#000");
  g.addColorStop(1, "#2a2a2a");
  c.fillStyle = g;
  c.beginPath();
  c.arc(tx, ty, COUPE, 0, Math.PI * 2);
  c.fill();

  // Tapis de départ
  const [dx, dy] = carte.depart;
  c.fillStyle = "rgba(255,255,255,0.25)";
  c.beginPath();
  c.roundRect ? c.roundRect(dx - 18, dy - 18, 36, 36, 6) : c.rect(dx - 18, dy - 18, 36, 36);
  c.fill();
}

function dessiner() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!carte) {
    ctx.fillStyle = "#2f6b3a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  if (!couche) dessinerCouche();
  ctx.drawImage(couche, 0, 0);
  ctx.setTransform(echelle, 0, 0, echelle, 0, 0);
  const th = THEMES[carte.theme];

  // Reflets qui bougent sur l'eau (ou bulles de lave)
  for (const sol of carte.sols) {
    if (sol.type !== "eau") continue;
    ctx.save();
    cheminForme(ctx, sol.forme);
    ctx.clip();
    ctx.strokeStyle = th.lave ? "rgba(255,230,120,0.35)" : "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    for (let y = 0; y < H; y += 26) {
      ctx.beginPath();
      for (let x = 0; x <= L; x += 20) {
        const yy = y + Math.sin(x * 0.03 + temps * 2 + y) * 4;
        x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Tapis accélérateurs avec des chevrons qui défilent
  for (const b of carte.boosts) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate((b.angle * Math.PI) / 180);
    ctx.fillStyle = "rgba(30,30,40,0.55)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-b.l / 2, -b.h / 2, b.l, b.h, 8) : ctx.rect(-b.l / 2, -b.h / 2, b.l, b.h);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(-b.l / 2, -b.h / 2, b.l, b.h);
    ctx.clip();
    const decal = (temps * 60) % 24;
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 4;
    for (let x = -b.l / 2 - 24 + decal; x < b.l / 2 + 24; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x - 8, -b.h / 4);
      ctx.lineTo(x, 0);
      ctx.lineTo(x - 8, b.h / 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Téléporteurs : anneaux qui tournent
  for (const t of carte.teleports) {
    for (const [x, y] of [[t[0], t[1]], [t[2], t[3]]]) {
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = ["#c38bff", "#ff8be0", "#8bd8ff"][k];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 8 + k * 5, temps * (2 + k) + k, temps * (2 + k) + k + Math.PI * 1.3);
        ctx.stroke();
      }
    }
  }

  // Bumpers
  carte.bumpers.forEach(([x, y, r], i) => {
    const f = flashBumpers[i] || 0;
    const rr = r * (1 + f * 0.12);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(x + 3, y + 5, rr, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(x - rr * 0.35, y - rr * 0.35, 2, x, y, rr);
    g.addColorStop(0, f > 0 ? "#fff6a8" : "#ff9ad0");
    g.addColorStop(1, f > 0 ? "#ffb300" : "#d6337a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, rr * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Boîtes d'atouts qui flottent
  for (const b of boites) {
    if (!b.active) continue;
    const flotte = Math.sin(temps * 3 + b.x) * 3;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(b.x + 2, b.y + 12, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(b.x - 12, b.y - 12, b.x + 12, b.y + 12);
    const teinte = (temps * 80) % 360;
    g.addColorStop(0, `hsl(${teinte},90%,65%)`);
    g.addColorStop(1, `hsl(${(teinte + 120) % 360},90%,55%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(b.x - 12, b.y - 12 + flotte, 24, 24, 6) : ctx.rect(b.x - 12, b.y - 12 + flotte, 24, 24);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", b.x, b.y + 1 + flotte);
  }

  // Drapeau qui flotte au vent
  const [tx, ty] = carte.trou;
  const tousDedans = joueurs.length && joueurs.every((j) => j.balle.dansTrou);
  if (!tousDedans) {
    ctx.strokeStyle = "#eeeeee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx, ty - 52);
    ctx.stroke();
    ctx.fillStyle = "#ff3b3b";
    ctx.beginPath();
    ctx.moveTo(tx, ty - 52);
    for (let k = 0; k <= 10; k++) ctx.lineTo(tx + k * 3, ty - 52 + Math.sin(temps * 6 - k * 0.6) * 2.5 + k * 0.4);
    for (let k = 10; k >= 0; k--) ctx.lineTo(tx + k * 3, ty - 34 + Math.sin(temps * 6 - k * 0.6) * 2.5 - k * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  // Moulins
  for (const m of carte.moulins) {
    ctx.lineCap = "round";
    for (const [ax, ay, bx, by] of brasMoulin(m, temps)) {
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(ax + 3, ay + 5);
      ctx.lineTo(bx + 3, by + 5);
      ctx.stroke();
    }
    for (const [ax, ay, bx, by] of brasMoulin(m, temps)) {
      ctx.strokeStyle = th.bord;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.strokeStyle = th.bordClair;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.fillStyle = "#ffd23f";
    ctx.beginPath();
    ctx.arc(m[0], m[1], 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = "butt";
  }

  // Balles
  for (const j of joueurs) {
    const b = j.balle;
    if (!b.actif || b.echelle <= 0) continue;
    // Traînée
    b.trace.forEach(([x, y], i) => {
      ctx.fillStyle = j.couleur.balle;
      ctx.globalAlpha = (i / b.trace.length) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, RAYON * (i / b.trace.length), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = b.noyee > 0 ? b.noyee : 1;
    const r = RAYON * b.echelle;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(b.x + 3, b.y + 5, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(b.x - r * 0.4, b.y - r * 0.4, 1, b.x, b.y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, j.couleur.balle);
    g.addColorStop(1, j.couleur.fonce);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Halo autour de la balle du joueur qui doit jouer
    if (j.i === courant && (phase === "visee" || phase === "ordi")) {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, RAYON + 6 + Math.sin(temps * 5) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Visée
  const j = joueurs[courant];
  let angle = null;
  let puissance = 0;
  if (visee && phase === "visee") {
    const dx = visee.x0 - visee.x;
    const dy = visee.y0 - visee.y;
    angle = Math.atan2(dy, dx);
    puissance = Math.min(1, Math.hypot(dx, dy) / TIRAGE_MAX);
  } else if (viseeOrdi) {
    angle = viseeOrdi.angle;
    puissance = viseeOrdi.puissance;
  }
  if (angle !== null && puissance > 0.05) {
    const b = j.balle;
    const longueur = 40 + puissance * 150;
    const couleur = `hsl(${120 - puissance * 120},90%,55%)`;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -temps * 40;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + Math.cos(angle) * longueur, b.y + Math.sin(angle) * longueur);
    ctx.stroke();
    ctx.setLineDash([]);
    // Flèche
    const fx = b.x + Math.cos(angle) * (RAYON + 10 + puissance * 40);
    const fy = b.y + Math.sin(angle) * (RAYON + 10 + puissance * 40);
    ctx.fillStyle = couleur;
    ctx.beginPath();
    ctx.moveTo(fx + Math.cos(angle) * 12, fy + Math.sin(angle) * 12);
    ctx.lineTo(fx + Math.cos(angle + 2.4) * 10, fy + Math.sin(angle + 2.4) * 10);
    ctx.lineTo(fx + Math.cos(angle - 2.4) * 10, fy + Math.sin(angle - 2.4) * 10);
    ctx.fill();
    // Jauge de puissance autour de la balle
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, RAYON + 12, -Math.PI / 2, -Math.PI / 2 + puissance * Math.PI * 2);
    ctx.stroke();
  }

  // Indicateur de vent pour le joueur concerné
  if (j && j.effets.vent && (phase === "visee" || phase === "ordi" || phase === "roule")) {
    const [vx, vy] = j.effets.vent;
    const a = Math.atan2(vy, vx);
    ctx.save();
    ctx.translate(L - 60, 60);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(a);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(10, -7);
    ctx.moveTo(18, 0);
    ctx.lineTo(10, 7);
    ctx.stroke();
    ctx.restore();
  }

  // Particules et textes
  for (const p of particules) {
    ctx.globalAlpha = 1 - p.age / p.vie;
    ctx.fillStyle = p.couleur;
    ctx.fillRect(p.x - p.taille / 2, p.y - p.taille / 2, p.taille, p.taille);
  }
  ctx.globalAlpha = 1;
  ctx.font = "bold 20px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const t of textes) {
    ctx.globalAlpha = Math.min(1, 2 - t.age * 1.25);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.strokeText(t.texte, t.x, t.y);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(t.texte, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

// ---------- Thème clair / sombre de la page ----------

function appliquerTheme(theme) {
  document.documentElement.dataset.theme = theme;
  boutonTheme.textContent = theme === "clair" ? "🌙" : "☀️";
  boutonTheme.title = theme === "clair" ? "Passer en mode sombre" : "Passer en mode clair";
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

// ---------- Démarrage ----------

// Affiche le premier trou derrière le menu
redimensionner();
ordreTrous = [...Array(20).keys()];
preparerCarte(PARCOURS[0]);
requestAnimationFrame(boucle);
