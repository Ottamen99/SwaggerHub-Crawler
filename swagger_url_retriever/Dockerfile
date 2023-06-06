FROM node:latest
WORKDIR /app
COPY . /app
RUN npm install
RUN npm install pm2 -g
ENTRYPOINT ["./run.sh"]