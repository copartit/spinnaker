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

RUN GRADLE_USER_HOME=cache ./gradlew --no-daemon :${APP}:${APP}-web:installDist -x test

FROM ubuntu:jammy AS production
LABEL org.opencontainers.image.authors="Igor Cherkaev <igor.cherkaev@copart.com>"

ARG APP
ARG DEBIAN_FRONTEND=noninteractive

ARG TARGETARCH
ENV GOOGLE_CLOUD_SDK_VERSION=476.0.0
ENV PATH="$PATH:/opt/google-cloud-sdk/bin/"
ENV KUBECTL_DEFAULT_RELEASE=1.32.9
ENV KUBECTL_RELEASES="${KUBECTL_DEFAULT_RELEASE} 1.29.15 1.30.14 1.31.13"
ENV AWS_CLI_VERSION=2.15.57
ENV AWS_AIM_AUTHENTICATOR_VERSION=0.6.14

RUN apt-get update && apt-get install -y curl gnupg && \
  curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
  echo "deb https://packages.cloud.google.com/apt cloud-sdk  main" > /etc/apt/sources.list.d/cloud-sdk.list && \
  apt-get update && \
  apt-get upgrade -y && \
  apt-get install -y \
  curl \
  openjdk-17-jre-headless \
  wget \
  python3-pip \
  python3 \
  git \
  openssh-client \
  unzip && \
  apt-get clean && \
  rm -rf /var/cache/apt/* /var/lib/apt/lists/* && \
  rm -rf ~/.config/gcloud

# AWS CLI 2
RUN if [ "${TARGETARCH}" = "arm64" ]; then \
    wget -nv -O "awscliv2.zip" "https://awscli.amazonaws.com/awscli-exe-linux-aarch64-${AWS_CLI_VERSION}.zip"; \
  else \
    wget -nv -O "awscliv2.zip" "https://awscli.amazonaws.com/awscli-exe-linux-x86_64-${AWS_CLI_VERSION}.zip"; \
  fi && \
  unzip awscliv2.zip && \
  ./aws/install && \
  rm -rf ./awscliv2.zip ./aws

# kubectl + AWS IAM authenticator
RUN for version in $KUBECTL_RELEASES; do \
      release_version=$(echo ${version} | cut -d. -f1,2); \
      wget -nv https://cdn.dl.k8s.io/release/v${version}/bin/linux/${TARGETARCH}/kubectl -O /usr/local/bin/kubectl-${release_version}; \
      chmod +x /usr/local/bin/kubectl-${release_version}; \
      done \
  && ln -sf "/usr/local/bin/kubectl-$(echo ${KUBECTL_DEFAULT_RELEASE} | cut -d. -f1,2)" /usr/local/bin/kubectl \
  && wget -nv -O aws-iam-authenticator https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/v${AWS_AIM_AUTHENTICATOR_VERSION}/aws-iam-authenticator_${AWS_AIM_AUTHENTICATOR_VERSION}_linux_${TARGETARCH} \
  && chmod +x ./aws-iam-authenticator \
  && mv ./aws-iam-authenticator /usr/local/bin/aws-iam-authenticator\
  && ln -sf /usr/local/bin/aws-iam-authenticator /usr/local/bin/heptio-authenticator-aws

# Google cloud SDK
RUN export GCP_ARCH="x86_64" \
  && wget -nv https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-${GOOGLE_CLOUD_SDK_VERSION}-linux-${GCP_ARCH}.tar.gz \
  && mkdir -p /opt && cd /opt \
  && tar -xzf /google-cloud-sdk-${GOOGLE_CLOUD_SDK_VERSION}-linux-${GCP_ARCH}.tar.gz \
  && rm /google-cloud-sdk-${GOOGLE_CLOUD_SDK_VERSION}-linux-${GCP_ARCH}.tar.gz \
  && CLOUDSDK_PYTHON="python3" /opt/google-cloud-sdk/install.sh --usage-reporting=false --bash-completion=false  \
     --additional-components app-engine-java app-engine-go gke-gcloud-auth-plugin  \
  && rm -rf ~/.config/gcloud \
  && rm -rf /opt/google-cloud-sdk/.install/.backup


RUN adduser --system --uid 10111 --group spinnaker
COPY --from=build /workdir/${APP}/${APP}-web/build/install/${APP} /opt/${APP}
RUN mkdir -p /opt/${APP}/plugins && chown -R spinnaker:nogroup /opt/${APP}/plugins
USER spinnaker
HEALTHCHECK CMD curl --fail http://localhost:7002/health
ENV BUILT_APP=${APP}
CMD ["/bin/bash", "-c", "/opt/${BUILT_APP}/bin/${BUILT_APP}"]
