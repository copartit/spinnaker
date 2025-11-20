FROM ubuntu:noble AS build
LABEL org.opencontainers.image.authors="Igor Cherkaev <igor.cherkaev@copart.com>"
ENV GRADLE_USER_HOME=/workspace/.gradle
ENV GRADLE_OPTS="-Xmx4g -Xms4g"
ARG APP

RUN apt-get update && apt-get install -y openjdk-17-jdk curl git nodejs yarn && rm -rf /var/lib/apt/lists/*

COPY . workdir/

WORKDIR workdir

RUN GRADLE_USER_HOME=cache ./gradlew :${APP}:build -x :${APP}:test -PskipTests

FROM debian:stable-slim AS production
LABEL org.opencontainers.image.authors="Igor Cherkaev <igor.cherkaev@copart.com>"

ARG APP
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get -uy upgrade && \
    apt-get clean && \
    rm -rf /var/cache/apt/* /var/lib/apt/lists/*

WORKDIR /opt/${APP}
RUN chown www-data:www-data .
COPY --chown=www-data:www-data --from=build /workdir/${APP}/docker /opt/${APP}/docker
RUN docker/setup-apache2.sh

COPY --chown=www-data:www-data --from=build /workdir/${APP}/build/webpack /opt/${APP}/html
USER www-data

CMD docker/run-apache2.sh
