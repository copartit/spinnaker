FROM ubuntu:jammy AS build
LABEL org.opencontainers.image.authors="Igor Cherkaev <igor.cherkaev@copart.com>"
ENV GRADLE_USER_HOME=/workspace/.gradle
ENV GRADLE_OPTS="-Xmx12g -Xms12g"
ARG APP

RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
 && rm -rf /var/lib/apt/lists/*

COPY . workdir/

WORKDIR workdir

RUN GRADLE_USER_HOME=cache ./gradlew -PenableCrossCompilerPlugin=true --no-daemon :${APP}:${APP}-web:installDist -x test

FROM ubuntu:jammy AS production
LABEL org.opencontainers.image.authors="Igor Cherkaev <igor.cherkaev@copart.com>"

ARG APP
ARG DEBIAN_FRONTEND=noninteractive

ENV KUSTOMIZE_VERSION=3.8.6
ENV KUSTOMIZE4_VERSION=4.5.5
ENV PACKER_VERSION=1.10.1
ENV HELMFILE_VERSION=1.2.2

ARG TARGETARCH
ARG PACKER_PLUGINS="amazon azure googlecompute"

WORKDIR /packer

RUN apt-get update && apt-get -y install openjdk-17-jre-headless wget unzip curl git openssh-client && \
    apt-get clean && \
    rm -rf /var/cache/apt/* /var/lib/apt/lists/* && \
    wget https://releases.hashicorp.com/packer/${PACKER_VERSION}/packer_${PACKER_VERSION}_linux_${TARGETARCH}.zip && \
    unzip packer_${PACKER_VERSION}_linux_${TARGETARCH}.zip && \
    rm packer_${PACKER_VERSION}_linux_${TARGETARCH}.zip

ENV PATH "/packer:$PATH"

# Install Helm 3
RUN wget https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get-helm-3 && \
  chmod +x get-helm-3 && \
  ./get-helm-3 && \
  rm get-helm-3 && \
  mv /usr/local/bin/helm /usr/local/bin/helm3

# Install Helm 2
RUN wget https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get && \
  chmod +x get && \
  ./get --version v2.17.0 && \
  rm get

RUN mkdir kustomize && \
  curl -s -L https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize/v${KUSTOMIZE_VERSION}/kustomize_v${KUSTOMIZE_VERSION}_linux_${TARGETARCH}.tar.gz|\
  tar xvz -C kustomize/ && \
  mv ./kustomize/kustomize /usr/local/bin/kustomize && \
  rm -rf ./kustomize

RUN mkdir kustomize && \
  curl -s -L https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize/v${KUSTOMIZE4_VERSION}/kustomize_v${KUSTOMIZE4_VERSION}_linux_${TARGETARCH}.tar.gz|\
  tar xvz -C kustomize/ && \
  mv ./kustomize/kustomize /usr/local/bin/kustomize4 && \
  rm -rf ./kustomize

RUN mkdir helmfile && \
  curl -s -L https://github.com/helmfile/helmfile/releases/download/v${HELMFILE_VERSION}/helmfile_${HELMFILE_VERSION}_linux_${TARGETARCH}.tar.gz|\
  tar xvz -C helmfile/ && \
  mv ./helmfile/helmfile /usr/local/bin/helmfile && \
  rm -rf ./helmfile

# Install AWS CLI 2 and the session manager plugin
RUN if [ "${TARGETARCH}" = "arm64" ]; then \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip" && \
    curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_arm64/session-manager-plugin.deb" -o "session-manager-plugin.deb"; \
  else \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"; \
  fi && \
  unzip awscliv2.zip && \
  ./aws/install && \
  rm -rf ./awscliv2.zip ./aws && \
  dpkg -i session-manager-plugin.deb && \
  rm session-manager-plugin.deb

RUN adduser --system --uid 10111 --group spinnaker
COPY --from=build /workdir/${APP}/${APP}-web/build/install/${APP} /opt/${APP}
COPY --from=build /workdir/${APP}/${APP}-web/config /opt/${APP}
COPY --from=build /workdir/${APP}/halconfig/packer /opt/${APP}/config/packer
RUN mkdir -p /opt/${APP}/plugins && chown -R spinnaker:nogroup /opt/${APP}/plugins
USER spinnaker

# Install packer plugins (must be run as spinnaker user). To provide a github token (optional), run docker build with something like "--secret id=github_token,env=PACKER_GITHUB_API_TOKEN"
RUN for plugin in $PACKER_PLUGINS ; do \
  if [ -f /run/secrets/github_token ]; then \
    PACKER_GITHUB_API_TOKEN=$(cat /run/secrets/github_token) packer plugins install "github.com/hashicorp/$plugin"; \
  else \
    packer plugins install "github.com/hashicorp/$plugin"; \
  fi; \
done

HEALTHCHECK CMD curl http://localhost:8087/health | grep UP || exit 1

CMD ["/bin/bash", "-c", "/opt/rosco/bin/rosco"]
