# syntax=docker/dockerfile:1
FROM node:16.13.1 as builder
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
RUN npm run build


FROM node:16.13.1
RUN mkdir /app && chown node:node -R /app

USER node
WORKDIR /app

ENV NODE_ENV=production
COPY --chown=node:node ["package.json", "package-lock.json*", "./"]
RUN npm install --production

COPY --chown=node:node . .
COPY --chown=node:node --from=builder /app/dist ./dist

CMD [ "node", "./dist/bin/www" ]

