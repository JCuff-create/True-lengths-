# Cloud Run–compatible image for the AI Studio Express + Vite template.
# Build: docker build -t true-lengths .
# Run:   docker run -p 8080:8080 -e PORT=8080 -e GEMINI_API_KEY=... true-lengths

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Firebase applet config is read at runtime by many AI Studio apps
COPY firebase-applet-config.json metadata.json ./
EXPOSE 8080
USER node
CMD ["node", "dist/server.cjs"]
