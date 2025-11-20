FROM ubuntu:jammy AS build
LABEL org.opencontainers.image.authors="Igor Cherkaev <igor.cherkaev@copart.com>"
ENV GRADLE_USER_HOME=/workspace/.gradle
ENV GRADLE_OPTS="-Xmx4g -Xms4g"
ARG APP

RUN apt-get update && apt-get install -y openjdk-17-jdk && rm -rf /var/lib/apt/lists/*

COPY . workdir/

WORKDIR workdir

RUN GRADLE_USER_HOME=cache ./gradlew -Prelease.useLastTag=true :${APP}:${APP}-web:buildDeb -x test

FROM ubuntu:jammy AS production
LABEL org.opencontainers.image.authors="Igor Cherkaev <igor.cherkaev@copart.com>"

ARG APP
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get -uy upgrade && \
    apt-get -y install openjdk-17-jre-headless curl net-tools psmisc dumb-init && \
    apt-get clean && \
    rm -rf /var/cache/apt/* /var/lib/apt/lists/*

RUN adduser --system --uid 10111 --group spinnaker
COPY --from=build /workdir/${APP}/${APP}-web/build/distributions/*.deb /tmp/
RUN dpkg -i /tmp/*.deb && rm -rf /tmp/*.deb
RUN mkdir -p /opt/${APP}/plugins && chown -R spinnaker:nogroup /opt/${APP}/plugins
USER spinnaker
ENV BUILT_APP=${APP}
CMD ["/bin/bash", "-c", "/opt/${BUILT_APP}/bin/${BUILT_APP}"]
