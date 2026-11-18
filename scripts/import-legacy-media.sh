#!/usr/bin/env bash
# One-time import of photos, figures, videos and PDFs from the old WordPress site.
# Run from the repository root on your own computer:   bash scripts/import-legacy-media.sh
# Resizes large images with `sips` (built into macOS) and converts .mov → .mp4 with ffmpeg if available.
set -euo pipefail
WP="https://faculty.sites.uci.edu/drakelab/files"

get() {  # get <remote path under /files> <local path under public/> [max pixel size]
  local src="$WP/$1" dst="public/$2" max="${3:-}"
  mkdir -p "$(dirname "$dst")"
  if [[ -f "$dst" ]]; then echo "  exists  $dst"; return; fi
  echo "  fetch   $dst"
  curl -fsSL "$src" -o "$dst" || { echo "  !! failed: $src"; return; }
  if [[ -n "$max" ]] && command -v sips >/dev/null; then sips -Z "$max" "$dst" >/dev/null; fi
}

echo "People photos"
get "2026/09/2026_Drake_headshot.jpg"                         images/people/henri-drake.jpg 800
get "2025/04/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20250106150115.jpg" images/people/ran-liu.jpg 800
get "2025/04/photo_new.jpg"                                   images/people/zijie-zhao.jpg 800
get "2023/10/Isba-edited.jpg"                                 images/people/isba-keshwani.jpg 800
get "2024/09/head-shot.jpeg"                                  images/people/kaila-uyeda.jpg 800
get "2024/09/IMG_6105.JPG.jpg"                                images/people/kim-willcott.jpg 800
get "2026/09/IMG_5408.jpeg"                                   images/people/hanchao-chen.jpg 800
get "2024/02/avatar-65f37ffd649be206-e1708992516851.jpg"      images/people/chih-lun-liu.jpg 800
get "2023/10/mariana_t-edited-1.png"                          images/people/mariana-torres.png 800
get "2024/05/RVaswaniFinalHeadshot.jpg"                       images/people/rohan-vaswani.jpg 800

echo "Group photos"
get "2026/04/Ocean_and_Climate_Dynamics_GroupPhoto_Spring2026-1.jpg" images/group/2026-04-group-photo.jpg 2000
get "2023/10/drake_lab_group_at_2023essbbq-2.jpg"             images/group/2023-ess-bbq.jpg 1600
get "2023/01/2018-@SWMS-planning-committee.png"               images/group/2019-swms-planning-committee.png 1600

echo "Research figures"
get "2022/10/pgcm_circulation_modified.png"                   images/projects/abyssal-circulation-schematic.png 2000
get "2022/10/Drake2017_Smov.mp4"                              images/projects/ice-ocean-upwelling-trajectories.mp4
if [[ ! -f public/images/projects/bbtre-tracer-release.mp4 ]]; then
  get "2022/10/BBTRE-1.mov" images/projects/bbtre-tracer-release.mov
  if command -v ffmpeg >/dev/null; then
    ffmpeg -loglevel error -i public/images/projects/bbtre-tracer-release.mov -vf "scale='min(1280,iw)':-2" \
      -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -movflags +faststart -an \
      public/images/projects/bbtre-tracer-release.mp4 && rm public/images/projects/bbtre-tracer-release.mov
  else
    echo "  ffmpeg not found: keeping .mov (plays in Safari/Chrome, not Firefox). Install with: brew install ffmpeg"
    sed -i.bak 's#bbtre-tracer-release.mp4#bbtre-tracer-release.mov#' content/projects/ocean-turbulence.md && rm content/projects/ocean-turbulence.md.bak
  fi
fi

echo "News figures"
get "2023/01/Screenshot-2023-01-10-at-3.36.39-PM.png"         images/news/2023-01-bbtre-hierarchy.png 1600
get "2023/01/Screenshot-2023-01-10-at-3.39.43-PM.png"         images/news/2023-01-bbtre-stratification.png 1600
get "2023/01/Screenshot-2023-01-10-at-3.26.49-PM.png"         images/news/2023-01-tracer-moments.png 1600
get "2023/01/Screenshot-2023-01-10-at-3.33.24-PM.png"         images/news/2023-01-tracer-synthetic-obs.png 1600
get "2023/01/Screenshot-2023-01-12-at-3.57.51-PM.png"         images/news/2023-01-exxon-projections.png 1600

echo "Documents"
get "2026/10/Drake_main_CV-1.pdf"                             files/Drake_CV.pdf
get "2026/08/NSF-CAREER-PhD-Position-Advertisement.pdf"       files/NSF-CAREER-PhD-Position-Advertisement.pdf

echo
du -sh public/images public/files
echo "Done. Run 'npm run build && node scripts/check-links.mjs' to confirm nothing is missing."
