const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*", // en prod, mets l'URL exacte de ton site Vercel
  })
);

// ===== Validation des liens =====
const PLATFORM_PATTERNS = [
  /(youtube\.com|youtu\.be)/i,
  /(facebook\.com|fb\.watch)/i,
  /(pinterest\.[a-z.]+|pin\.it)/i,
];

function isSupportedUrl(url) {
  try {
    new URL(url);
  } catch {
    return false;
  }
  return PLATFORM_PATTERNS.some((p) => p.test(url));
}

const ALLOWED_QUALITIES = ["480", "720", "1080"];
const ALLOWED_FORMATS = ["mp4", "mp3"];

// Dossier temporaire pour les fichiers téléchargés le temps de la requête
const TMP_DIR = path.join(os.tmpdir(), "clipdrop");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ===== Route principale =====
app.post("/api/download", async (req, res) => {
  const { url, format, quality } = req.body || {};

  // --- Validation des entrées ---
  if (!url || !isSupportedUrl(url)) {
    return res.status(400).json({ message: "Lien invalide ou plateforme non supportée." });
  }
  if (!ALLOWED_FORMATS.includes(format)) {
    return res.status(400).json({ message: "Format invalide." });
  }
  if (format === "mp4" && !ALLOWED_QUALITIES.includes(String(quality))) {
    return res.status(400).json({ message: "Qualité invalide." });
  }

  const jobId = crypto.randomUUID();
  const outputTemplate = path.join(TMP_DIR, `${jobId}.%(ext)s`);

  // --- Construction de la commande yt-dlp ---
  const args = [url, "-o", outputTemplate, "--no-playlist"];

  if (format === "mp3") {
    args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
  } else {
    // mp4 : on plafonne la hauteur à la qualité demandée, on force le merge en mp4
    const height = quality;
    args.push(
      "-f",
      `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}]`,
      "--merge-output-format",
      "mp4"
    );
  }

  try {
    await runYtDlp(args);
  } catch (err) {
    console.error("yt-dlp error:", err.message);
    return res.status(502).json({
      message: "Impossible de récupérer cette vidéo. Le lien est peut-être privé, supprimé, ou la plateforme a changé son fonctionnement.",
    });
  }

  // --- Trouver le fichier généré (l'extension réelle dépend du format) ---
  const files = fs.readdirSync(TMP_DIR).filter((f) => f.startsWith(jobId));
  if (files.length === 0) {
    return res.status(500).json({ message: "Le fichier n'a pas pu être généré." });
  }

  const outputFile = path.join(TMP_DIR, files[0]);
  const downloadName = `clipdrop-${jobId.slice(0, 8)}.${format}`;

  res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
  res.setHeader("Content-Type", format === "mp3" ? "audio/mpeg" : "video/mp4");

  const stream = fs.createReadStream(outputFile);
  stream.pipe(res);

  // Nettoyage une fois le fichier envoyé (ou en cas d'erreur)
  const cleanup = () => fs.unlink(outputFile, () => {});
  stream.on("close", cleanup);
  stream.on("error", cleanup);
  res.on("close", cleanup);
});

// ===== Helper : exécute yt-dlp et attend la fin =====
function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", args);
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      // ex: yt-dlp non installé / introuvable dans le PATH
      reject(new Error(`yt-dlp introuvable : ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `yt-dlp a quitté avec le code ${code}`));
    });
  });
}

app.get("/", (req, res) => {
  res.send("ClipDrop API — OK");
});

app.listen(PORT, () => {
  console.log(`ClipDrop backend démarré sur http://localhost:${PORT}`);
});
