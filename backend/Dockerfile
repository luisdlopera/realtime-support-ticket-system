FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run prisma:generate && npm run build

EXPOSE 3001

CMD ["sh", "-c", "npm run prisma:push && npm run prisma:seed && npm run start"]
