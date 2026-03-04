# Dev image for frontend_v2 (Next.js)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
