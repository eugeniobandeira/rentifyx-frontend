FROM node:22-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 4000

COPY --from=build /src/dist/rentityx-frontend/server ./server
COPY --from=build /src/dist/rentityx-frontend/browser ./browser

ENTRYPOINT ["node", "server/server.mjs"]
