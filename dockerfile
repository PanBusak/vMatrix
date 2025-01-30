# Použiť oficiálny Node.js image
FROM node:18-alpine

# Nastaviť pracovný adresár v kontajneri
WORKDIR /app

# Kopírovať package.json a package-lock.json
COPY package*.json ./src 


RUN npm install

EXPOSE 3000


CMD ["node", "index.js"]
