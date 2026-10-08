#!/bin/sh
# mont.sh name t1 t2 ... : renders frames and tiles them 3 per row into sheet/<name>.png
n=$1; shift
node sheet.mjs "$@" >/dev/null 2>&1 || node sheet.mjs "$@"
inputs=""; for t in "$@"; do inputs="$inputs -i sheet/$t.png"; done
c=$#; cols=3; rows=$(( (c+cols-1)/cols ))
ffmpeg -v error -y $inputs -filter_complex "$(i=0; for t in "$@"; do printf "[$i]scale=360:360[s$i];"; i=$((i+1)); done; i=0; for t in "$@"; do printf "[s$i]"; i=$((i+1)); done; printf "xstack=inputs=$c:layout=$(i=0; for t in "$@"; do x=$(( (i%cols)*360 )); y=$(( (i/cols)*360 )); [ $i -gt 0 ] && printf '|'; printf "${x}_${y}"; i=$((i+1)); done):fill=black")" sheet/$n.png
