#!/usr/bin/env bash
# Gera os arquivos finais de vitrine (H.264 + AV1 + pôster WebP) a partir dos loops temporários validados (Etapa 2).
# uso: build-finals.sh <produto> <locale> <origem.mp4> <instante-do-pôster-em-s> [destino=assets/video]
# - GOP de 60 quadros (2 s), keyframe mínimo 30, GOP fechado: seek exato rápido para a troca de idioma sem corte.
# - Cor: as origens são BT.601 (swscale padrão), às vezes em faixa total (yuvj420p). Saída: BT.709, faixa limitada, tags explícitas
#   (Safari/Firefox/Chrome interpretam igual; sem yuvj).
# - Qualidade: H.264 CRF 29 / AV1 CRF 44 (SSIM ≈ 0,99 contra a origem nos dois).
set -euo pipefail
p=$1; l=$2; src=$3; pt=$4; out=${5:-assets/video}
mkdir -p "$out"
case "$(ffprobe -v error -select_streams v -show_entries stream=pix_fmt -of csv=p=0 "$src" | tr -d ',')" in
  yuvj*) inr=full ;; *) inr=limited ;;
esac
vf="scale=in_range=$inr:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv"
tags="-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"
ffmpeg -v error -y -i "$src" -an -r 30 -vf "$vf" -c:v libx264 -profile:v high -level 3.1 -preset veryslow -crf 29 \
  -x264-params keyint=60:min-keyint=30:scenecut=40:open-gop=0 $tags -movflags +faststart "$out/$p-loop.$l.mp4"
ffmpeg -v error -y -i "$src" -an -r 30 -vf "$vf" -c:v libsvtav1 -preset 4 -crf 44 -g 60 -svtav1-params tune=0 $tags -movflags +faststart "$out/$p-loop.$l.av1.mp4" 2>/dev/null
ffmpeg -v error -y -ss "$pt" -i "$src" -frames:v 1 -vf "$vf,scale=720:720:flags=lanczos" -c:v libwebp -quality 84 -compression_level 6 "$out/$p-loop-poster.$l.webp"
echo "ok $p $l"
