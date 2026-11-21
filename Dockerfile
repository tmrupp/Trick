# TRICK host for a cloud server (optional; npm start with a tunnel needs none of this).
# Build: docker build -t trick .   Run: docker run -p 8787:8787 -e ADMIN_TOKEN=... -v trick-saves:/data trick
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY game ./game
COPY suit_icons.js card_rules.js rules.html ./
COPY items/item_catalog.js ./items/
COPY races/race_catalog.js ./races/
COPY exports/web ./exports/web
ENV PORT=8787 SAVES_DIR=/data
VOLUME /data
EXPOSE 8787
CMD ["node", "game/server/main.mjs"]
