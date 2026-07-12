FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Prisma client generálása a schema alapján
# A generált client a src/generated/prisma/ mappába kerül
ENV DATABASE_URL=postgresql://msh:msh_secret@postgres:5432/msh
RUN npx prisma generate
RUN npm run build
CMD ["node", "dist/src/main.js"]
