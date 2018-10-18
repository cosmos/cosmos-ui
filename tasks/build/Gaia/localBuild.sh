#!/bin/sh

. ./COMMIT.sh
source="$(pwd)/../../../builds/Gaia"
mkdir -p "$source"
export TARGET=/mnt

docker run \
  --interactive \
  --env COMMIT \
  --env TARGET \
  --mount type=bind,source="$source",target="$TARGET" \
  --rm \
  golang:1.11.1 < build.sh
