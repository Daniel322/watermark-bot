FROM node:20.10-slim as BASEIMAGE

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci
COPY . .
RUN npm run prebuild && npm run build && npm prune --production

FROM node:20.10-slim

COPY --from=BASEIMAGE /app/package.json /package.json
COPY --from=BASEIMAGE /app/dist /dist
COPY --from=BASEIMAGE /app/node_modules /node_modules

RUN apt-get update && apt-get install -y -q libfontconfig1

EXPOSE 3100

CMD ["/bin/sh", "-c", "npm run start:prod"]