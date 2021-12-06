# syntax=docker/dockerfile:1
FROM node:16.13.1
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
RUN npm run build


ENV NODE_ENV=production
RUN npm prune --production
CMD [ "node", "./dist/bin/www" ]

