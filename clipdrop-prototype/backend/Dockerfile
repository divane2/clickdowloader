# Image de base avec Node.js
FROM node:20-slim

# Installer Python, pip et ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Installer yt-dlp
RUN pip3 install --no-cache-dir --break-system-packages -U yt-dlp

# Dossier de travail
WORKDIR /app

# Installer les dépendances Node
COPY package*.json ./
RUN npm install --production

# Copier le reste du code
COPY . .

# Port exposé (Railway le redéfinit automatiquement via $PORT)
EXPOSE 3000

CMD ["node", "server.js"]
