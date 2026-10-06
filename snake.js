const canvas = document.getElementById("jeu");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const recordEl = document.getElementById("record");
const messageEl = document.getElementById("message");
const messageTexte = document.getElementById("message-texte");
const boutonJouer = document.getElementById("jouer");

const CASES = 20;
const TAILLE = canvas.width / CASES;
const VITESSE_DEPART = 140; // ms entre deux déplacements

const DIRECTIONS = {
  haut: { x: 0, y: -1 },
  bas: { x: 0, y: 1 },
  gauche: { x: -1, y: 0 },
  droite: { x: 1, y: 0 },
};

let serpent, direction, prochaineDirection, pomme, score, vitesse, minuteur;
let enJeu = false;
let enPause = false;

let record = 0;
try {
  record = Number(localStorage.getItem("snake-record")) || 0;
} catch (e) {}
recordEl.textContent = record;

function nouvellePartie() {
  serpent = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = DIRECTIONS.droite;
  prochaineDirection = direction;
  score = 0;
  vitesse = VITESSE_DEPART;
  scoreEl.textContent = score;
  placerPomme();
  enJeu = true;
  enPause = false;
  messageEl.classList.add("cache");
  relancerMinuteur();
}

function relancerMinuteur() {
  clearInterval(minuteur);
  minuteur = setInterval(tour, vitesse);
}

function placerPomme() {
  do {
    pomme = {
      x: Math.floor(Math.random() * CASES),
      y: Math.floor(Math.random() * CASES),
    };
  } while (serpent.some((c) => c.x === pomme.x && c.y === pomme.y));
}

function tour() {
  direction = prochaineDirection;
  const tete = {
    x: serpent[0].x + direction.x,
    y: serpent[0].y + direction.y,
  };

  const horsPlateau = tete.x < 0 || tete.y < 0 || tete.x >= CASES || tete.y >= CASES;
  const surLuiMeme = serpent.some((c) => c.x === tete.x && c.y === tete.y);
  if (horsPlateau || surLuiMeme) {
    finDePartie();
    return;
  }

  serpent.unshift(tete);

  if (tete.x === pomme.x && tete.y === pomme.y) {
    score++;
    scoreEl.textContent = score;
    placerPomme();
    // Le serpent accélère un peu à chaque pomme
    if (vitesse > 60) {
      vitesse -= 4;
      relancerMinuteur();
    }
  } else {
    serpent.pop();
  }

  dessiner();
}

function finDePartie() {
  clearInterval(minuteur);
  enJeu = false;
  if (score > record) {
    record = score;
    recordEl.textContent = record;
    try {
      localStorage.setItem("snake-record", record);
    } catch (e) {}
    messageTexte.textContent = `Nouveau record : ${score} ! 🏆`;
  } else {
    messageTexte.textContent = `Perdu ! Score : ${score}`;
  }
  boutonJouer.textContent = "Rejouer";
  messageEl.classList.remove("cache");
}

function basculerPause() {
  if (!enJeu) return;
  enPause = !enPause;
  if (enPause) {
    clearInterval(minuteur);
    messageTexte.textContent = "Pause";
    boutonJouer.textContent = "Reprendre";
    messageEl.classList.remove("cache");
  } else {
    messageEl.classList.add("cache");
    relancerMinuteur();
  }
}

function dessiner() {
  ctx.fillStyle = "#263061";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Pomme
  ctx.fillStyle = "#e0453a";
  ctx.beginPath();
  ctx.arc(
    pomme.x * TAILLE + TAILLE / 2,
    pomme.y * TAILLE + TAILLE / 2,
    TAILLE / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Serpent
  serpent.forEach((c, i) => {
    ctx.fillStyle = i === 0 ? "#f5d76a" : "#e8c547";
    ctx.fillRect(c.x * TAILLE + 1, c.y * TAILLE + 1, TAILLE - 2, TAILLE - 2);
  });
}

function changerDirection(nom) {
  const nouvelle = DIRECTIONS[nom];
  if (!nouvelle || !enJeu || enPause) return;
  // Interdit de faire demi-tour sur soi-même
  if (nouvelle.x === -direction.x && nouvelle.y === -direction.y) return;
  prochaineDirection = nouvelle;
}

const TOUCHES = {
  ArrowUp: "haut",
  ArrowDown: "bas",
  ArrowLeft: "gauche",
  ArrowRight: "droite",
  z: "haut",
  s: "bas",
  q: "gauche",
  d: "droite",
};

document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
    if (!enJeu) nouvellePartie();
    else basculerPause();
    return;
  }
  const nom = TOUCHES[e.key] || TOUCHES[e.key.toLowerCase()];
  if (nom) {
    e.preventDefault();
    changerDirection(nom);
  }
});

document.querySelectorAll(".manette button").forEach((b) => {
  b.addEventListener("click", () => changerDirection(b.dataset.dir));
});

boutonJouer.addEventListener("click", () => {
  if (enPause) basculerPause();
  else nouvellePartie();
});

// Glisser du doigt sur le plateau pour diriger
let departTouch = null;
canvas.addEventListener("touchstart", (e) => {
  departTouch = e.touches[0];
}, { passive: true });
canvas.addEventListener("touchend", (e) => {
  if (!departTouch) return;
  const fin = e.changedTouches[0];
  const dx = fin.clientX - departTouch.clientX;
  const dy = fin.clientY - departTouch.clientY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) {
    if (Math.abs(dx) > Math.abs(dy)) changerDirection(dx > 0 ? "droite" : "gauche");
    else changerDirection(dy > 0 ? "bas" : "haut");
  }
  departTouch = null;
});

// Plateau vide au chargement
serpent = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
pomme = { x: 15, y: 10 };
dessiner();
