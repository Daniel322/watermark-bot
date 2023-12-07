FROM node:20.10-slim as BASEIMAGE

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run prebuild && npm run build && npm prune --production

FROM node:20.10-slim

COPY --from=BASEIMAGE /app/package.json /app/package.json
COPY --from=BASEIMAGE /app/dist /app/dist
COPY --from=BASEIMAGE /app/node_modules /app/node_modules

EXPOSE 3100

CMD ["/bin/sh", "-c", "npm run start:prod"]