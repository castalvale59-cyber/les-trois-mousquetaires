const canvas = document.getElementById("jeu");
const ctx = canvas.getContext("2d");
const elimEl = document.getElementById("eliminations");
const recordEl = document.getElementById("record");
const messageEl = document.getElementById("message");
const messageTexte = document.getElementById("message-texte");
const boutonJouer = document.getElementById("jouer");
const boutonConstruire = document.getElementById("construire");

const MONDE = 2000; // taille de la carte en pixels
const VUE = canvas.width; // partie de la carte visible à l'écran
const VITESSE_JOUEUR = 190;
const VITESSE_BOT = 140;
const PORTEE_BOT = 300;
const NOMS = [
  "Athos", "Porthos", "Aramis", "Rochefort", "Milady", "Richelieu", "Jussac", "Biscarat",
  "Cahusac", "Bernajoux", "Mordaunt", "Buckingham", "Tréville", "Constance", "Planchet",
];
// La tempête : temps d'attente, durée de fermeture, rayon final, dégâts par seconde
const PHASES = [
  { attente: 30, duree: 20, rayon: 700, degats: 2 },
  { attente: 20, duree: 15, rayon: 400, degats: 4 },
  { attente: 15, duree: 15, rayon: 200, degats: 7 },
  { attente: 10, duree: 15, rayon: 70, degats: 12 },
  { attente: 10, duree: 15, rayon: 0, degats: 20 },
];

let entites, joueur, balles, arbres, coffres, murs, tempete, annonces;
let enJeu = false;
let enPause = false;
let eliminations = 0;
let camX = 0;
let camY = 0;

// Meilleur classement (0 = pas encore joué)
let record = 0;
try {
  record = Number(localStorage.getItem("bataille-record")) || 0;
} catch (e) {}
afficherRecord();

function afficherRecord() {
  recordEl.textContent = record ? "#" + record : "—";
}

// Thème clair / sombre
const boutonTheme = document.getElementById("bouton-theme");
let couleurs;

function lireCouleurs() {
  const style = getComputedStyle(document.documentElement);
  const v = (nom) => style.getPropertyValue(nom).trim();
  couleurs = {
    plateau: v("--plateau"),
    pomme: v("--pomme"),
    or: v("--or"),
    orClair: v("--or-clair"),
    roues: v("--roues"),
    texte: v("--texte"),
    voile: v("--voile"),
  };
}

function appliquerTheme(theme) {
  document.documentElement.dataset.theme = theme;
  boutonTheme.textContent = theme === "clair" ? "🌙" : "☀️";
  boutonTheme.title = theme === "clair" ? "Passer en mode sombre" : "Passer en mode clair";
  lireCouleurs();
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

// Outils
const hasard = (min, max) => min + Math.random() * (max - min);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const borner = (v, min, max) => Math.max(min, Math.min(max, v));

function annoncer(texte) {
  annonces.push({ texte, t: 4 });
  if (annonces.length > 4) annonces.shift();
}

// Création de la carte
function placeLibre(r, ecart = 0) {
  for (let essai = 0; essai < 200; essai++) {
    const p = { x: hasard(80, MONDE - 80), y: hasard(80, MONDE - 80) };
    if (arbres.some((a) => distance(a, p) < a.r + r + 15)) continue;
    if (ecart && entites.some((e) => distance(e, p) < ecart)) continue;
    return p;
  }
  return { x: hasard(80, MONDE - 80), y: hasard(80, MONDE - 80) };
}

function creerEntite(nom, estJoueur, i = 0) {
  const e = {
    nom,
    estJoueur,
    ...placeLibre(14, 220),
    r: 14,
    angle: hasard(0, Math.PI * 2),
    pv: 100,
    bouclier: 0,
    munitions: estJoueur ? 30 : Infinity,
    bois: estJoueur ? 50 : 30,
    recharge: 0,
    attenteMur: 0,
    vivant: true,
    couleur: `hsl(${(i * 360) / NOMS.length}, 55%, 55%)`,
    but: null,
    sens: Math.random() < 0.5 ? 1 : -1,
    decision: 0,
  };
  entites.push(e);
  return e;
}

function nouveauMonde() {
  arbres = [];
  entites = [];
  murs = [];
  balles = [];
  annonces = [];
  for (let i = 0; i < 70; i++) {
    arbres.push({ x: hasard(60, MONDE - 60), y: hasard(60, MONDE - 60), r: hasard(16, 30) });
  }
  coffres = [];
  for (let i = 0; i < 30; i++) coffres.push({ ...placeLibre(20), butin: false });
  joueur = creerEntite("Toi", true);
  NOMS.forEach((nom, i) => creerEntite(nom, false, i));
  nouvelleTempete();
  eliminations = 0;
  elimEl.textContent = eliminations;
}

// Tempête
function nouvelleTempete() {
  tempete = { x: MONDE / 2, y: MONDE / 2, r: MONDE * 0.75, phase: 0, etat: "attente", t: PHASES[0].attente };
  preparerPhase();
}

function preparerPhase() {
  const p = PHASES[tempete.phase];
  const a = hasard(0, Math.PI * 2);
  const d = Math.random() * (tempete.r - p.rayon) * 0.8;
  tempete.depart = { x: tempete.x, y: tempete.y, r: tempete.r };
  tempete.cible = {
    x: borner(tempete.x + Math.cos(a) * d, p.rayon, MONDE - p.rayon),
    y: borner(tempete.y + Math.sin(a) * d, p.rayon, MONDE - p.rayon),
    r: p.rayon,
  };
}

function majTempete(dt) {
  tempete.t -= dt;
  const p = PHASES[Math.min(tempete.phase, PHASES.length - 1)];
  if (tempete.etat === "attente" && tempete.t <= 0) {
    tempete.etat = "fermeture";
    tempete.t = p.duree;
    annoncer("🌀 La tempête se referme !");
  }
  if (tempete.etat === "fermeture") {
    const k = borner(1 - tempete.t / p.duree, 0, 1);
    const { depart, cible } = tempete;
    tempete.x = depart.x + (cible.x - depart.x) * k;
    tempete.y = depart.y + (cible.y - depart.y) * k;
    tempete.r = depart.r + (cible.r - depart.r) * k;
    if (tempete.t <= 0) {
      tempete.phase++;
      if (tempete.phase < PHASES.length) {
        tempete.etat = "attente";
        tempete.t = PHASES[tempete.phase].attente;
        preparerPhase();
      } else {
        tempete.etat = "fin";
      }
    }
  }
  for (const e of entites) {
    if (e.vivant && distance(e, tempete) > tempete.r) infliger(e, p.degats * dt, null);
  }
}

// Partie
function nouvellePartie() {
  nouveauMonde();
  enJeu = true;
  enPause = false;
  messageEl.classList.add("cache");
  annoncer("La bataille commence ! Sois le dernier debout.");
}

function basculerPause() {
  if (!enJeu) return;
  enPause = !enPause;
  if (enPause) {
    tir = false;
    messageTexte.textContent = "Pause";
    boutonJouer.textContent = "Reprendre";
    messageEl.classList.remove("cache");
  } else {
    messageEl.classList.add("cache");
  }
}

function finDePartie(place) {
  enJeu = false;
  tir = false;
  const nouveauRecord = !record || place < record;
  if (nouveauRecord) {
    record = place;
    afficherRecord();
    try {
      localStorage.setItem("bataille-record", record);
    } catch (e) {}
  }
  if (place === 1) {
    messageTexte.textContent = "Top 1 ! Tu es le dernier mousquetaire debout 🏆";
  } else {
    messageTexte.textContent = `Éliminé ! Classement : #${place}` + (nouveauRecord ? " — nouveau record !" : "");
  }
  boutonJouer.textContent = "Rejouer";
  // Laisse voir la fin du combat avant d'afficher le message
  setTimeout(() => {
    if (!enJeu) messageEl.classList.remove("cache");
  }, 900);
}

function maj(dt) {
  majTempete(dt);
  for (const e of entites) {
    if (!e.vivant) continue;
    e.recharge -= dt;
    e.attenteMur -= dt;
    if (e.estJoueur) majJoueur(dt);
    else majBot(e, dt);
    collisions(e);
    ramasser(e);
  }
  majBalles(dt);
  annonces = annonces.filter((a) => (a.t -= dt) > 0);
}

// Joueur
const touches = new Set();
let souris = { x: VUE / 2 + 60, y: VUE / 2 };
let tir = false;
let doigt = null;
let modeTactile = false;

const enfoncee = (...noms) => noms.some((n) => touches.has(n));
const ecranVersMonde = (p) => ({ x: p.x + camX, y: p.y + camY });

function majJoueur(dt) {
  let dx = 0;
  let dy = 0;
  if (enfoncee("arrowup", "z", "w")) dy--;
  if (enfoncee("arrowdown", "s")) dy++;
  if (enfoncee("arrowleft", "q", "a")) dx--;
  if (enfoncee("arrowright", "d")) dx++;
  if (doigt) {
    const c = ecranVersMonde(doigt);
    if (distance(c, joueur) > 20) {
      dx = c.x - joueur.x;
      dy = c.y - joueur.y;
    }
  }
  const n = Math.hypot(dx, dy);
  if (n) {
    joueur.x += (dx / n) * VITESSE_JOUEUR * dt;
    joueur.y += (dy / n) * VITESSE_JOUEUR * dt;
  }

  if (modeTactile) {
    // Sur mobile, visée et tir automatiques
    const proche = ennemiLePlusProche(joueur, 320);
    if (proche) {
      joueur.angle = Math.atan2(proche.y - joueur.y, proche.x - joueur.x);
      tirerJoueur();
    } else if (n) {
      joueur.angle = Math.atan2(dy, dx);
    }
  } else {
    const s = ecranVersMonde(souris);
    joueur.angle = Math.atan2(s.y - joueur.y, s.x - joueur.x);
    if (tir) tirerJoueur();
  }
}

function tirerJoueur() {
  if (joueur.recharge > 0) return;
  if (joueur.munitions <= 0) {
    annoncer("Plus de munitions : ouvre des coffres !");
    joueur.recharge = 1.5;
    return;
  }
  tirer(joueur);
}

// Adversaires
function ennemiLePlusProche(e, portee) {
  let proche = null;
  let dmin = portee;
  for (const autre of entites) {
    if (autre === e || !autre.vivant) continue;
    const d = distance(e, autre);
    if (d < dmin) {
      dmin = d;
      proche = autre;
    }
  }
  return proche;
}

function majBot(b, dt) {
  b.decision -= dt;
  const cible = ennemiLePlusProche(b, PORTEE_BOT);
  const zone = tempete.cible;
  let vx = 0;
  let vy = 0;

  if (distance(b, zone) > zone.r * 0.8 + 20) {
    // Rejoindre la prochaine zone avant la tempête
    vx = zone.x - b.x;
    vy = zone.y - b.y;
  } else if (cible) {
    // Tourner autour de l'adversaire en gardant ses distances
    const a = Math.atan2(cible.y - b.y, cible.x - b.x);
    const d = distance(b, cible);
    const avance = d > 220 ? 1 : d < 130 ? -1 : 0;
    vx = Math.cos(a) * avance + Math.cos(a + Math.PI / 2) * b.sens * 0.8;
    vy = Math.sin(a) * avance + Math.sin(a + Math.PI / 2) * b.sens * 0.8;
    if (b.decision <= 0) {
      if (Math.random() < 0.5) b.sens = -b.sens;
      b.decision = hasard(1, 2.5);
    }
  } else {
    if (!b.but || distance(b, b.but) < 30 || b.decision <= 0) {
      let coffre = null;
      let dmin = 400;
      for (const c of coffres) {
        const d = distance(b, c);
        if (d < dmin) {
          dmin = d;
          coffre = c;
        }
      }
      if (coffre) {
        b.but = { x: coffre.x, y: coffre.y };
      } else {
        const a = hasard(0, Math.PI * 2);
        const d = Math.random() * zone.r * 0.7;
        b.but = { x: borner(zone.x + Math.cos(a) * d, 50, MONDE - 50), y: borner(zone.y + Math.sin(a) * d, 50, MONDE - 50) };
      }
      b.decision = hasard(3, 6);
    }
    vx = b.but.x - b.x;
    vy = b.but.y - b.y;
  }

  const n = Math.hypot(vx, vy);
  if (n > 1) {
    b.x += (vx / n) * VITESSE_BOT * dt;
    b.y += (vy / n) * VITESSE_BOT * dt;
    if (!cible) b.angle = Math.atan2(vy, vx);
  }

  if (cible) {
    b.angle = Math.atan2(cible.y - b.y, cible.x - b.x);
    if (b.recharge <= 0) tirer(b, hasard(-0.18, 0.18));
    // Blessé : se protège derrière un mur
    if (b.pv < 50 && Math.random() < dt * 0.4) construire(b);
  }
}

// Combat
function tirer(e, ecart = 0) {
  const a = e.angle + ecart;
  balles.push({
    x: e.x + Math.cos(a) * (e.r + 6),
    y: e.y + Math.sin(a) * (e.r + 6),
    vx: Math.cos(a) * 650,
    vy: Math.sin(a) * 650,
    tireur: e,
    degats: e.estJoueur ? 25 : 12,
    vie: 0.6,
  });
  e.recharge = e.estJoueur ? 0.25 : hasard(0.6, 1.1);
  if (e.estJoueur) e.munitions--;
}

function construire(e) {
  if (!enJeu || enPause || !e.vivant || e.attenteMur > 0) return;
  if (e.bois < 10) {
    if (e.estJoueur) annoncer("Pas assez de bois 🪵");
    return;
  }
  murs.push({
    x: e.x + Math.cos(e.angle) * 36,
    y: e.y + Math.sin(e.angle) * 36,
    angle: e.angle + Math.PI / 2,
    long: 34,
    ep: 6,
    pv: 150,
    pvMax: 150,
  });
  e.bois -= 10;
  e.attenteMur = 0.25;
}

function infliger(c, degats, tireur) {
  if (!c.vivant) return;
  const absorbe = Math.min(c.bouclier, degats);
  c.bouclier -= absorbe;
  c.pv -= degats - absorbe;
  if (c.pv > 0) return;

  c.vivant = false;
  c.pv = 0;
  if (tireur === joueur) {
    eliminations++;
    elimEl.textContent = eliminations;
  }
  if (!tireur) annoncer(c === joueur ? "La tempête t'a emporté" : `${c.nom} a été emporté par la tempête`);
  else if (tireur === joueur) annoncer(`Tu as éliminé ${c.nom}`);
  else if (c === joueur) annoncer(`${tireur.nom} t'a éliminé`);
  else annoncer(`${tireur.nom} a éliminé ${c.nom}`);
  coffres.push({ x: c.x, y: c.y, butin: true }); // le vaincu laisse son butin

  if (!enJeu) return;
  const restants = entites.filter((e) => e.vivant).length;
  if (c === joueur) finDePartie(restants + 1);
  else if (restants === 1) finDePartie(1);
}

function majBalles(dt) {
  for (const b of balles) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vie -= dt;
    if (arbres.some((a) => distance(a, b) < a.r)) {
      b.vie = 0;
      continue;
    }
    const mur = murs.find((m) => contactMur(m, b.x, b.y, 3));
    if (mur) {
      mur.pv -= b.degats;
      b.vie = 0;
      continue;
    }
    for (const e of entites) {
      if (e.vivant && e !== b.tireur && distance(e, b) < e.r) {
        infliger(e, b.degats, b.tireur);
        b.vie = 0;
        break;
      }
    }
  }
  balles = balles.filter((b) => b.vie > 0);
  murs = murs.filter((m) => m.pv > 0);
}

// Renvoie de combien pousser un cercle (x, y, r) pour qu'il sorte du mur, ou null s'il ne le touche pas
function contactMur(m, x, y, r) {
  const c = Math.cos(m.angle);
  const s = Math.sin(m.angle);
  const dx = x - m.x;
  const dy = y - m.y;
  // Coordonnées dans le repère du mur
  const lx = dx * c + dy * s;
  const ly = -dx * s + dy * c;
  let nx = lx - borner(lx, -m.long, m.long);
  let ny = ly - borner(ly, -m.ep, m.ep);
  const d = Math.hypot(nx, ny);
  if (d >= r) return null;
  let p;
  if (d > 0) {
    nx /= d;
    ny /= d;
    p = r - d;
  } else {
    nx = 0;
    ny = ly >= 0 ? 1 : -1;
    p = r + m.ep - Math.abs(ly);
  }
  return { x: (nx * c - ny * s) * p, y: (nx * s + ny * c) * p };
}

function collisions(e) {
  for (const a of arbres) {
    const d = distance(e, a);
    const min = a.r + e.r;
    if (d < min && d > 0) {
      e.x += ((e.x - a.x) / d) * (min - d);
      e.y += ((e.y - a.y) / d) * (min - d);
    }
  }
  for (const m of murs) {
    const p = contactMur(m, e.x, e.y, e.r);
    if (p) {
      e.x += p.x;
      e.y += p.y;
    }
  }
  e.x = borner(e.x, e.r, MONDE - e.r);
  e.y = borner(e.y, e.r, MONDE - e.r);
}

function ramasser(e) {
  for (const c of coffres) {
    if (!c.ouvert && distance(c, e) < e.r + 16) {
      c.ouvert = true;
      ouvrirCoffre(e, c.butin ? 3 : 2);
    }
  }
  coffres = coffres.filter((c) => !c.ouvert);
}

function ouvrirCoffre(e, nb) {
  const objets = [
    () => {
      const n = Math.round(hasard(12, 25));
      e.munitions += n;
      return `+${n} munitions`;
    },
    () => {
      e.bois += 30;
      return "+30 bois";
    },
    () => {
      e.pv = Math.min(100, e.pv + 35);
      return "+35 vie";
    },
    () => {
      e.bouclier = Math.min(100, e.bouclier + 50);
      return "+50 bouclier";
    },
  ];
  const gains = [];
  for (let i = 0; i < nb; i++) gains.push(objets[Math.floor(Math.random() * objets.length)]());
  if (e.estJoueur) annoncer("📦 " + gains.join(", "));
}

// Dessin
function dessiner() {
  camX = borner(joueur.x - VUE / 2, 0, MONDE - VUE);
  camY = borner(joueur.y - VUE / 2, 0, MONDE - VUE);
  ctx.fillStyle = couleurs.plateau;
  ctx.fillRect(0, 0, VUE, VUE);

  ctx.save();
  ctx.translate(-camX, -camY);

  // Quadrillage pour sentir le déplacement
  ctx.strokeStyle = couleurs.roues;
  ctx.globalAlpha = 0.08;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let v = 0; v <= MONDE; v += 100) {
    ctx.moveTo(v, 0);
    ctx.lineTo(v, MONDE);
    ctx.moveTo(0, v);
    ctx.lineTo(MONDE, v);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  for (const c of coffres) dessinerCoffre(c);

  for (const m of murs) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);
    ctx.globalAlpha = 0.45 + (0.55 * m.pv) / m.pvMax;
    ctx.fillStyle = "#9b6a3a";
    ctx.fillRect(-m.long, -m.ep, m.long * 2, m.ep * 2);
    ctx.strokeStyle = couleurs.roues;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-m.long, -m.ep, m.long * 2, m.ep * 2);
    ctx.beginPath();
    for (let x = -m.long + 17; x < m.long; x += 17) {
      ctx.moveTo(x, -m.ep);
      ctx.lineTo(x, m.ep);
    }
    ctx.stroke();
    ctx.restore();
  }

  for (const e of entites) if (e.vivant) dessinerMousquetaire(e);

  for (const b of balles) {
    ctx.fillStyle = b.tireur === joueur ? couleurs.or : couleurs.pomme;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const a of arbres) {
    ctx.fillStyle = "#3f7a4a";
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2f6139";
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tempête : tout ce qui est hors du cercle
  ctx.beginPath();
  ctx.rect(-10, -10, MONDE + 20, MONDE + 20);
  ctx.arc(tempete.x, tempete.y, Math.max(tempete.r, 0.1), 0, Math.PI * 2, true);
  ctx.fillStyle = "rgba(124, 58, 237, 0.28)";
  ctx.fill("evenodd");
  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(tempete.x, tempete.y, Math.max(tempete.r, 0.1), 0, Math.PI * 2);
  ctx.stroke();
  if (tempete.etat !== "fin") {
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = couleurs.texte;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tempete.cible.x, tempete.cible.y, Math.max(tempete.cible.r, 0.1), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  dessinerInterface();
}

function dessinerCoffre(c) {
  if (c.butin) {
    ctx.fillStyle = couleurs.orClair;
    ctx.strokeStyle = couleurs.roues;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }
  ctx.fillStyle = couleurs.or;
  ctx.strokeStyle = couleurs.roues;
  ctx.lineWidth = 2;
  ctx.fillRect(c.x - 11, c.y - 8, 22, 16);
  ctx.strokeRect(c.x - 11, c.y - 8, 22, 16);
  ctx.beginPath();
  ctx.moveTo(c.x - 11, c.y - 2);
  ctx.lineTo(c.x + 11, c.y - 2);
  ctx.stroke();
}

function dessinerMousquetaire(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  // Mousquet
  ctx.save();
  ctx.rotate(e.angle);
  ctx.fillStyle = couleurs.roues;
  ctx.fillRect(4, -2.5, e.r + 10, 5);
  ctx.restore();
  // Corps
  ctx.fillStyle = e.estJoueur ? couleurs.or : e.couleur;
  ctx.strokeStyle = couleurs.roues;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, e.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Chapeau à plume
  ctx.fillStyle = couleurs.roues;
  ctx.beginPath();
  ctx.arc(0, 0, e.r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.estJoueur ? couleurs.pomme : couleurs.orClair;
  ctx.beginPath();
  ctx.ellipse(-3, -3, 5, 2.5, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (!e.estJoueur) {
    ctx.font = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = couleurs.texte;
    ctx.fillText(e.nom, e.x, e.y - e.r - 12);
    if (e.pv < 100 || e.bouclier > 0) {
      ctx.fillStyle = couleurs.roues;
      ctx.fillRect(e.x - 16, e.y - e.r - 9, 32, 5);
      ctx.fillStyle = "#4caf50";
      ctx.fillRect(e.x - 16, e.y - e.r - 9, (32 * e.pv) / 100, 5);
      if (e.bouclier > 0) {
        ctx.fillStyle = "#4aa3df";
        ctx.fillRect(e.x - 16, e.y - e.r - 9, (32 * e.bouclier) / 100, 2);
      }
    }
  }
}

function formatTemps(t) {
  const s = Math.max(0, Math.ceil(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function boite(x, y, l, h) {
  ctx.fillStyle = couleurs.voile;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, l, h, 6);
  else ctx.rect(x, y, l, h);
  ctx.fill();
}

function barre(x, y, l, h, part, couleur) {
  ctx.fillStyle = couleurs.roues;
  ctx.fillRect(x, y, l, h);
  ctx.fillStyle = couleur;
  ctx.fillRect(x, y, l * borner(part, 0, 1), h);
}

function dessinerInterface() {
  const vivants = entites.filter((e) => e.vivant).length;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Restants et tempête
  boite(10, 10, 200, 50);
  ctx.fillStyle = couleurs.texte;
  ctx.font = "bold 15px Georgia, serif";
  ctx.fillText(`👥 ${vivants} restants`, 18, 16);
  ctx.font = "13px Georgia, serif";
  let texteTempete = "🌀 Zone finale";
  if (tempete.etat === "attente") texteTempete = `🌀 Tempête dans ${formatTemps(tempete.t)}`;
  else if (tempete.etat === "fermeture") texteTempete = `🌀 La tempête avance (${formatTemps(tempete.t)})`;
  ctx.fillText(texteTempete, 18, 38);

  // Fil des événements
  annonces.forEach((a, i) => {
    ctx.globalAlpha = Math.min(1, a.t);
    ctx.fillStyle = couleurs.texte;
    ctx.fillText(a.texte, 14, 70 + i * 18);
  });
  ctx.globalAlpha = 1;

  // Mini-carte
  const T = 110;
  const mx = VUE - T - 10;
  const my = 10;
  const k = T / MONDE;
  boite(mx, my, T, T);
  ctx.save();
  ctx.beginPath();
  ctx.rect(mx, my, T, T);
  ctx.clip();
  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mx + tempete.x * k, my + tempete.y * k, Math.max(tempete.r * k, 0.1), 0, Math.PI * 2);
  ctx.stroke();
  if (tempete.etat !== "fin") {
    ctx.strokeStyle = couleurs.texte;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(mx + tempete.cible.x * k, my + tempete.cible.y * k, Math.max(tempete.cible.r * k, 0.1), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = couleurs.texte;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(mx + camX * k, my + camY * k, VUE * k, VUE * k);
  ctx.globalAlpha = 1;
  ctx.fillStyle = couleurs.or;
  ctx.beginPath();
  ctx.arc(mx + joueur.x * k, my + joueur.y * k, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = couleurs.or;
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, T, T);

  // Vie et bouclier
  const y = VUE - 52;
  boite(10, y, 220, 42);
  barre(18, y + 8, 140, 10, joueur.pv / 100, "#4caf50");
  barre(18, y + 25, 140, 10, joueur.bouclier / 100, "#4aa3df");
  ctx.fillStyle = couleurs.texte;
  ctx.font = "12px Georgia, serif";
  ctx.fillText(`❤ ${Math.ceil(joueur.pv)}`, 166, y + 6);
  ctx.fillText(`🛡 ${Math.ceil(joueur.bouclier)}`, 166, y + 23);

  // Munitions et bois
  boite(VUE - 170, y, 160, 42);
  ctx.fillStyle = couleurs.texte;
  ctx.font = "bold 16px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`🔫 ${joueur.munitions}   🪵 ${joueur.bois}`, VUE - 90, y + 21);
}

// Boucle de jeu
let precedent = performance.now();
function boucle(maintenant) {
  const dt = Math.min(0.05, (maintenant - precedent) / 1000);
  precedent = maintenant;
  if (enJeu && !enPause) maj(dt);
  dessiner();
  requestAnimationFrame(boucle);
}

// Commandes
function positionEcran(ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - r.left) * canvas.width) / r.width,
    y: ((ev.clientY - r.top) * canvas.height) / r.height,
  };
}

document.addEventListener("keydown", (e) => {
  const touche = e.key.toLowerCase();
  if (touche === " ") {
    e.preventDefault();
    if (!enJeu) nouvellePartie();
    else basculerPause();
    return;
  }
  if (touche === "p" || touche === "escape") {
    basculerPause();
    return;
  }
  if (touche === "e" || touche === "f") {
    construire(joueur);
    return;
  }
  if (touche.startsWith("arrow")) e.preventDefault();
  touches.add(touche);
});

document.addEventListener("keyup", (e) => touches.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  touches.clear();
  tir = false;
});

canvas.addEventListener("mousemove", (e) => {
  souris = positionEcran(e);
  modeTactile = false;
});
canvas.addEventListener("mousedown", (e) => {
  souris = positionEcran(e);
  modeTactile = false;
  if (e.button === 0) tir = true;
  if (e.button === 2) construire(joueur);
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0) tir = false;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// Mobile : le mousquetaire avance vers le doigt
function suivreDoigt(e) {
  e.preventDefault();
  modeTactile = true;
  doigt = e.touches.length ? positionEcran(e.touches[0]) : null;
}
canvas.addEventListener("touchstart", suivreDoigt, { passive: false });
canvas.addEventListener("touchmove", suivreDoigt, { passive: false });
canvas.addEventListener("touchend", suivreDoigt, { passive: false });
canvas.addEventListener("touchcancel", suivreDoigt, { passive: false });

boutonConstruire.addEventListener("click", () => construire(joueur));

boutonJouer.addEventListener("click", () => {
  if (enPause) basculerPause();
  else nouvellePartie();
  boutonJouer.blur();
});

// Carte de fond au chargement
nouveauMonde();
requestAnimationFrame(boucle);
