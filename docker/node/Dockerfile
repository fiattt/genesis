FROM node:6

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/
RUN npm install -g nodemon

WORKDIR /opt/app
COPY . /opt/app

EXPOSE 3000

CMD [ “node”, “/opt/app/bin/migrate.js” ]
CMD [ "node", "/opt/app/bin/www" ]
