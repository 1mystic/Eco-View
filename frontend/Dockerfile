FROM node:20-alpine AS build

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS serve
WORKDIR /app
RUN npm install -g pnpm
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
RUN pnpm add -D vite

EXPOSE 4173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
