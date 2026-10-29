#!/usr/bin/env bash
# Encodes a rendered frame sequence into the web film set.
# usage: scripts/render/encode.sh <frames-dir> <out-dir> <name> [fps]
set -euo pipefail
IN=$1; OUT=$2; NAME=$3; FPS=${4:-24}
mkdir -p "$OUT"
ffmpeg -y -loglevel error -framerate "$FPS" -i "$IN/f%04d.jpg" -c:v libx264 -preset slow -crf ${CRF:-20} -pix_fmt yuv420p -movflags +faststart -an "$OUT/$NAME.mp4"
ffmpeg -y -loglevel error -framerate "$FPS" -i "$IN/f%04d.jpg" -c:v libvpx-vp9 -b:v 0 -crf ${CRF_WEBM:-33} -row-mt 1 -an "$OUT/$NAME.webm"
ffmpeg -y -loglevel error -framerate "$FPS" -i "$IN/f%04d.jpg" -vf scale=-2:720 -c:v libx264 -preset slow -crf ${CRF_720:-23} -pix_fmt yuv420p -movflags +faststart -an "$OUT/$NAME-720.mp4"
ls -la "$OUT" | grep "$NAME"
