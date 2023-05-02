FROM node:18
WORKDIR /home/node

# cache yarn install step
COPY --chown=node:node package.json /home/node
COPY --chown=node:node yarn.lock /home/node
RUN yarn --frozen-lockfile

COPY --chown=node:node . /home/node

USER node
RUN yarn build
ENTRYPOINT ["/bin/bash", "./docker-entrypoint.sh"]
