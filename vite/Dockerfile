FROM node:20

#seleccionamos o creamos un directorio de trabajo en el contenedor
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173