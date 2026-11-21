# syntax=docker/dockerfile:1

# Jenkins LTS sobre JDK 21 + Docker CLI para orquestar los contenedores del POS.
# El controlador no ejecuta pnpm: cada etapa corre dentro de las imágenes del
# proyecto (apps/api, apps/web) mediante `docker compose run`.

FROM jenkins/jenkins:lts-jdk21

ARG DOCKER_GID=985
ARG DOCKER_CHANNEL=stable

USER root

# --- Docker CLI + Compose + buildx (cliente, no daemon) ---
RUN apt-get update \
  && apt-get install --no-install-recommends --yes ca-certificates curl gnupg jq \
  && install -m 0755 -d /etc/apt/keyrings \
  && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
  && chmod a+r /etc/apt/keyrings/docker.asc \
  && . /etc/os-release \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian ${VERSION_CODENAME} ${DOCKER_CHANNEL}" \
    > /etc/apt/sources.list.d/docker.list \
  && apt-get update \
  && apt-get install --no-install-recommends --yes \
       docker-ce-cli docker-compose-plugin docker-buildx-plugin \
  && rm -rf /var/lib/apt/lists/*

# --- Acceso al socket del host: mismo GID que el grupo `docker` del host ---
RUN getent group docker >/dev/null 2>&1 \
      && groupmod --gid "${DOCKER_GID}" docker \
      || groupadd --gid "${DOCKER_GID}" docker \
  ; usermod --append --groups docker jenkins

# --- Plugins declarados (instalados en build, versiones resueltas por el CLI) ---
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# El CLI de Docker vive en /usr/libexec/docker/cli-plugins (buildx/compose).
ENV DOCKER_CLI_HINTS=false

USER jenkins

# Los agentes entrantes usan 50000; el controlador escucha en 8080.
EXPOSE 8080 50000
