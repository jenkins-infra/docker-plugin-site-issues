# syntax=docker/dockerfile:1
FROM node:22.21.1 as builder
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
RUN npm run build
# hadolint ignore=DL3059
RUN npm run test

FROM node:22.21.1
RUN mkdir /app && chown node:node -R /app

USER node
WORKDIR /app

ARG GIT_COMMIT_REV
ENV GIT_COMMIT_REV=$GIT_COMMIT_REV
ENV NODE_ENV=production
COPY --chown=node:node ["package.json", "package-lock.json*", "./"]
RUN npm install --production

COPY --chown=node:node . .
COPY --chown=node:node --from=builder /app/dist ./dist

CMD [ "node", "./dist/bin/www" ]

