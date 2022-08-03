FROM quay.io/cloudservices/caddy-ubi:357c825

COPY ./Caddyfile /opt/app-root/src/Caddyfile
COPY dist /opt/app-root/src/dist/
COPY ./package.json /opt/app-root/src
WORKDIR /opt/app-root/src
ENV PLUGIN_URL=/
ENV FALLBACK_URL=/
CMD ["caddy", "run", "--config", "/opt/app-root/src/Caddyfile"]
