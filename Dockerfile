
#Select base image of application
FROM node:18-alpine

#Create app directory
WORKDIR /app

#Install app dependencies
COPY package*.json ./

#Run commend
RUN npm ci

#Bundle app source

COPY . .

CMD [ "npm", "start" ]