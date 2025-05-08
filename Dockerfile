# Build Stage
FROM node:22-alpine3.20 AS build

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Production Stage
FROM node:22-alpine3.20 AS prod

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/src/main.js"]

