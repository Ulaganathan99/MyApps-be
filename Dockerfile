
#Select base image of application
FROM node:18-alpine

#Create app directory
WORKDIR /app

#Install app dependencies
COPY package*.json ./

#Run commend
RUN npm install

#Bundle app source

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]

