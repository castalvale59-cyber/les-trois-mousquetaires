const grilleEl = document.getElementById("grille");
const messageEl = document.getElementById("message");
const messageTexte = document.getElementById("message-texte");
const boutonRejouer = document.getElementById("rejouer");
const tourEl = document.getElementById("tour");
const nomX = document.getElementById("nom-x");
const nomO = document.getElementById("nom-o");
const scoreEls = {
  X: document.getElementById("score-x"),
  O: document.getElementById("score-o"),
  nul: document.getElementById("score-nuls"),
};

const SYMBOLES = { X: "✕", O: "◯" };
const LIGNES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontales
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticales
  [0, 4, 8], [2, 4, 6],            // diagonales
];

let cases, joueur, enJeu, mode, premierJoueur;
const scores = { X: 0, O: 0, nul: 0 };

// Thème clair / sombre
const boutonTheme = document.getElementById("bouton-theme");

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

// Les 9 cases de la grille
const boutonsCases = [];
for (let i = 0; i < 9; i++) {
  const b = document.createElement("button");
  b.className = "case";
  b.addEventListener("click", () => jouerHumain(i));
  grilleEl.appendChild(b);
  boutonsCases.push(b);
}

function changerMode(nouveau) {
  mode = nouveau;
  document.querySelectorAll(".modes button").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.mode === mode);
  });
  nomX.textContent = mode === "ordi" ? "Toi" : "Joueur 1";
  nomO.textContent = mode === "ordi" ? "Ordi" : "Joueur 2";
  scores.X = scores.O = scores.nul = 0;
  afficherScores();
  premierJoueur = "X";
  nouvellePartie();
}

function nouvellePartie() {
  cases = Array(9).fill(null);
  joueur = premierJoueur;
  enJeu = true;
  messageEl.classList.add("cache");
  boutonsCases.forEach((b) => b.classList.remove("gagnante"));
  dessiner();
  if (tourOrdi()) setTimeout(jouerOrdi, 400);
}

function tourOrdi() {
  return enJeu && mode === "ordi" && joueur === "O";
}

function jouerHumain(i) {
  if (!enJeu || tourOrdi() || cases[i]) return;
  poser(i);
  if (tourOrdi()) setTimeout(jouerOrdi, 400);
}

function poser(i) {
  cases[i] = joueur;
  const gagnant = chercherGagnant(cases);
  if (gagnant) {
    finDePartie(gagnant);
  } else if (cases.every(Boolean)) {
    finDePartie(null);
  } else {
    joueur = joueur === "X" ? "O" : "X";
  }
  dessiner();
}

function chercherGagnant(c) {
  for (const ligne of LIGNES) {
    const [a, b, d] = ligne;
    if (c[a] && c[a] === c[b] && c[a] === c[d]) return { joueur: c[a], ligne };
  }
  return null;
}

function finDePartie(gagnant) {
  enJeu = false;
  if (gagnant) {
    scores[gagnant.joueur]++;
    gagnant.ligne.forEach((i) => boutonsCases[i].classList.add("gagnante"));
    if (mode === "ordi") {
      messageTexte.textContent = gagnant.joueur === "X" ? "Bravo, tu as gagné ! 🏆" : "L'ordi a gagné !";
    } else {
      const nom = gagnant.joueur === "X" ? "Joueur 1" : "Joueur 2";
      messageTexte.textContent = `${nom} (${SYMBOLES[gagnant.joueur]}) a gagné ! 🏆`;
    }
  } else {
    scores.nul++;
    messageTexte.textContent = "Match nul !";
  }
  afficherScores();
  // Le perdant (ou l'autre joueur en cas de nul) commence la partie suivante
  premierJoueur = premierJoueur === "X" ? "O" : "X";
  // Laisse voir la ligne gagnante avant d'afficher le message
  setTimeout(() => messageEl.classList.remove("cache"), 700);
}

function afficherScores() {
  scoreEls.X.textContent = scores.X;
  scoreEls.O.textContent = scores.O;
  scoreEls.nul.textContent = scores.nul;
}

function dessiner() {
  boutonsCases.forEach((b, i) => {
    const v = cases[i];
    b.textContent = v ? SYMBOLES[v] : "";
    b.dataset.joueur = v || "";
    b.disabled = !enJeu || Boolean(v);
    b.setAttribute("aria-label", `Case ${i + 1}${v ? ", " + SYMBOLES[v] : ", vide"}`);
  });
  if (!enJeu) {
    tourEl.textContent = "";
  } else if (mode === "ordi") {
    tourEl.textContent = joueur === "X" ? "À toi de jouer (✕)" : "L'ordi réfléchit…";
  } else {
    tourEl.textContent = `Au tour de ${joueur === "X" ? "Joueur 1 (✕)" : "Joueur 2 (◯)"}`;
  }
}

// L'ordi joue le meilleur coup (minimax), avec une petite chance de se tromper
function jouerOrdi() {
  if (!tourOrdi()) return;
  const libres = cases.map((v, i) => (v ? null : i)).filter((i) => i !== null);
  let coup;
  if (Math.random() < 0.2) {
    coup = libres[Math.floor(Math.random() * libres.length)];
  } else {
    let meilleur = -Infinity;
    for (const i of libres) {
      cases[i] = "O";
      const valeur = minimax(cases, "X", 1);
      cases[i] = null;
      if (valeur > meilleur) {
        meilleur = valeur;
        coup = i;
      }
    }
  }
  poser(coup);
}

function minimax(c, tour, profondeur) {
  const gagnant = chercherGagnant(c);
  if (gagnant) return gagnant.joueur === "O" ? 10 - profondeur : profondeur - 10;
  if (c.every(Boolean)) return 0;
  let meilleur = tour === "O" ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (c[i]) continue;
    c[i] = tour;
    const valeur = minimax(c, tour === "O" ? "X" : "O", profondeur + 1);
    c[i] = null;
    meilleur = tour === "O" ? Math.max(meilleur, valeur) : Math.min(meilleur, valeur);
  }
  return meilleur;
}

document.querySelectorAll(".modes button").forEach((b) => {
  b.addEventListener("click", () => {
    if (b.dataset.mode !== mode) changerMode(b.dataset.mode);
  });
});

boutonRejouer.addEventListener("click", nouvellePartie);

// Touches 1 à 9 : disposition du pavé numérique (7 8 9 en haut)
const PAVE = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 };
document.addEventListener("keydown", (e) => {
  if (e.key in PAVE) {
    jouerHumain(PAVE[e.key]);
  } else if ((e.key === " " || e.key === "Enter") && !enJeu && !messageEl.classList.contains("cache")) {
    e.preventDefault();
    nouvellePartie();
  }
});

changerMode("ordi");
