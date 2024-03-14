FROM node:20.10-alpine

RUN apk add python3
RUN apk add ffmpeg

WORKDIR /pepex

COPY package.json package.json      
RUN npm i 

COPY data data
COPY src src
COPY index.mjs index.mjs

RUN echo "echo dsc_token=\$TOKEN > project.conf" > init.sh
RUN echo "node index.mjs" >> init.sh

ENTRYPOINT [ "/bin/sh","init.sh" ]

