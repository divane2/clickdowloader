// ===== Configuration =====
// En local pendant le dev, le backend tourne sur localhost:3000.
// En prod, remplace par l'URL de ton backend déployé (Railway/Render).
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://clickdowloader-production.up.railway.app"; // ⚠️ à remplacer après déploiement du backend

// ===== Détection de plateforme =====
const PLATFORM_PATTERNS = {
  youtube: /(youtube\.com|youtu\.be)/i,
  facebook: /(facebook\.com|fb\.watch)/i,
  pinterest: /(pinterest\.[a-z.]+|pin\.it)/i,
};

const ICONS = {
  youtube: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0a12 12 0 0 0-4.4 23.2c0-1 0-2.2.2-3.3l1.6-6.6s-.4-.8-.4-2c0-1.9 1.1-3.3 2.5-3.3 1.1 0 1.7.9 1.7 1.9 0 1.2-.7 2.9-1.1 4.6-.3 1.3.7 2.4 2 2.4 2.3 0 4.1-2.5 4.1-6 0-3.1-2.3-5.3-5.5-5.3-3.7 0-5.9 2.8-5.9 5.7 0 1.1.4 2.3 1 3 .1.1.1.2.1.3l-.4 1.6c0 .3-.2.3-.4.2-1.6-.7-2.6-3-2.6-4.9 0-4 2.9-7.6 8.3-7.6 4.4 0 7.8 3.1 7.8 7.3 0 4.4-2.7 7.8-6.6 7.8-1.3 0-2.5-.7-2.9-1.4l-.8 3c-.3 1.1-1 2.5-1.6 3.3A12 12 0 1 0 12 0Z"/></svg>',
};

const urlInput = document.getElementById("video-url");
const platformBadge = document.getElementById("platform-badge");
const platformIcon = document.getElementById("platform-icon");
const detectMsg = document.getElementById("detect-msg");
const optionsBlock = document.getElementById("options");
const downloadBtn = document.getElementById("download-btn");
const btnLabel = downloadBtn.querySelector(".btn-label");
const statusMsg = document.getElementById("status-msg");
const pasteBtn = document.getElementById("paste-btn");
const form = document.getElementById("download-form");
const qualityFieldset = document.getElementById("quality-fieldset");

function detectPlatform(url) {
  for (const [name, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) return name;
  }
  return null;
}

function updateUI() {
  const url = urlInput.value.trim();

  if (!url) {
    platformBadge.dataset.state = "idle";
    platformBadge.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15"/></svg>';
    detectMsg.textContent = "";
    optionsBlock.hidden = true;
    downloadBtn.disabled = true;
    btnLabel.textContent = "Coller un lien pour commencer";
    return;
  }

  const platform = detectPlatform(url);

  if (platform) {
    platformBadge.dataset.state = platform;
    platformBadge.innerHTML = ICONS[platform];
    const names = { youtube: "YouTube", facebook: "Facebook", pinterest: "Pinterest" };
    detectMsg.textContent = `✓ Lien ${names[platform]} détecté`;
    optionsBlock.hidden = false;
    downloadBtn.disabled = false;
    btnLabel.textContent = "Télécharger";
  } else {
    platformBadge.dataset.state = "unknown";
    platformBadge.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12" y2="16.01"/></svg>';
    detectMsg.textContent = "Lien non reconnu — vérifie qu'il vient bien de YouTube, Facebook ou Pinterest";
    optionsBlock.hidden = true;
    downloadBtn.disabled = true;
    btnLabel.textContent = "Coller un lien pour commencer";
  }
}

urlInput.addEventListener("input", updateUI);

pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    urlInput.value = text;
    updateUI();
    urlInput.focus();
  } catch (err) {
    urlInput.focus();
  }
});

// Griser la qualité quand MP3 est sélectionné (l'audio n'a pas de résolution vidéo)
document.querySelectorAll('input[name="format"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const isAudio = e.target.value === "mp3";
    qualityFieldset.dataset.disabled = isAudio ? "true" : "false";
  });
});

// ===== Soumission : appel au backend =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = urlInput.value.trim();
  const format = document.querySelector('input[name="format"]:checked').value;
  const quality = document.querySelector('input[name="quality"]:checked').value;

  downloadBtn.disabled = true;
  downloadBtn.classList.add("loading");
  btnLabel.textContent = "Préparation du fichier…";
  statusMsg.textContent = "";
  statusMsg.className = "status-msg";

  try {
    const response = await fetch(`${API_BASE_URL}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format, quality }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Le téléchargement a échoué. Vérifie le lien et réessaie.");
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `video.${format}`;

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);

    statusMsg.textContent = "✓ Téléchargement terminé";
    statusMsg.className = "status-msg success";
  } catch (err) {
    statusMsg.textContent = err.message || "Une erreur est survenue. Réessaie.";
    statusMsg.className = "status-msg error";
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.classList.remove("loading");
    btnLabel.textContent = "Télécharger";
  }
});
