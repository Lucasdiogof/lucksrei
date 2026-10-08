#!/bin/bash
# sheet.sh name t1,t2,... cols
S=${OUT:-/tmp/match-queue-video}
cd "$(dirname "$0")"; rm -rf $S/$1; export NODE_PATH=/opt/node22/lib/node_modules
node render.cjs sheet $S/$1 $2 2>&1 | grep -v "^$" | head -20
ffmpeg -v error -y -pattern_type glob -i "$S/$1/s*.png" -vf "scale=360:360,tile=${3:-4}x$(( ( $(echo $2 | tr ',' '\n' | wc -l) + ${3:-4} - 1 ) / ${3:-4} )):padding=4:color=gray" -frames:v 1 $S/$1.png
