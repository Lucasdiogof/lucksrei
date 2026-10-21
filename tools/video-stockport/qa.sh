#!/bin/sh
# Verificação dos MP4 exportados: ffprobe (codec, perfil, pix_fmt, resolução, fps, duração, áudio, faststart),
# quadros pretos/congelados, emenda do loop (PSNR entre o primeiro e o último quadro) e contact sheets.
# uso: FFMPEG=... FFPROBE=... sh qa.sh out/stockport-master-1080p.mp4 [colunas] [intervalo_s]
set -e
F=${FFMPEG:-ffmpeg}; FP=${FFPROBE:-ffprobe}; V=$1; C=${2:-6}; I=${3:-2}
B=$(basename "$V" .mp4); mkdir -p storyboard
$FP -v error -show_entries stream=codec_name,profile,pix_fmt,width,height,r_frame_rate,nb_frames,color_primaries:format=duration,size,bit_rate -of default=nw=1 "$V"
echo "streams de áudio: $($FP -v error -select_streams a -show_entries stream=index -of csv=p=0 "$V" | wc -l | tr -d ' ')"
head -c 200000 "$V" | grep -q moov && echo "faststart: moov no início" || echo "faststart: NÃO"
echo "--- blackdetect (>=0,2 s) / freezedetect (>=2,5 s)"
$F -v error -i "$V" -vf "blackdetect=d=0.2:pix_th=0.06,freezedetect=n=0.0008:d=2.5,metadata=print:file=-" -an -f null - 2>&1 | grep -E "black_start|freeze_start|freeze_duration" || echo "nenhum"
echo "--- emenda: PSNR primeiro × último quadro"
N=$($FP -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$V")
$F -v error -i "$V" -vf "select='eq(n\,0)+eq(n\,$((N-1)))'" -vsync 0 -f image2 /tmp/qa_seam_%d.png
$F -v info -i /tmp/qa_seam_1.png -i /tmp/qa_seam_2.png -lavfi psnr -f null - 2>&1 | grep -o "average:[0-9.inf]*" ; rm -f /tmp/qa_seam_*.png
W=480; R=$(echo "$($FP -v error -show_entries stream=width,height -of csv=p=0:s=x "$V")")
$F -v error -y -i "$V" -vf "fps=1/$I,scale=$W:-1,drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5,tile=${C}x$(( ( ${N%.*} / 30 / I + C ) / C )):padding=4:color=0x050a14" -frames:v 1 "storyboard/sheet-$B.jpg" 2>/dev/null || \
$F -v error -y -i "$V" -vf "fps=1/$I,scale=$W:-1,tile=${C}x$(( ( ${N%.*} / 30 / I + C ) / C )):padding=4:color=0x050a14" -frames:v 1 "storyboard/sheet-$B.jpg"
echo "contact sheet: storyboard/sheet-$B.jpg ($R)"
