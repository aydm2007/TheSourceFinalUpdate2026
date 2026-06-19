FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 9999
CMD ["node", "dist/main.js"]
