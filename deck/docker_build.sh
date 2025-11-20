#!/usr/bin/env bash
APP="deck"
BASE_VER="$(git branch --show-current --no-color)"
BUILD=`cat ../.idea/build_n.txt`

if [ -z ${APP} ]
then
  echo "Pick the app to build, e.g. deck"
  exit 1
fi

if [ -z ${BUILD} ]
then
   BUILD=3
else
   BUILD=$((BUILD+1))
fi

BUILD_OPTS="${BUILD_OPTS} --progress=plain"

echo "Building docker image, build number ${BUILD}"
TAG="dockerregistry.copart.com/devops/spinnaker-${APP}:${BASE_VER}-${BUILD}"
docker build $BUILD_OPTS -t ${TAG} --build-arg APP=${APP} -f ./Dockerfile ../

echo -n ${BUILD} > ../.idea/build_n.txt
echo "Build complete: ${TAG}"
