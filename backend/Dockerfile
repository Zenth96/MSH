FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV DATABASE_URL=postgresql://msh:msh_secret@postgres:5432/msh
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]
