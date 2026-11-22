# 22 November 2026 — The World in One Day

[![make.fun](https://img.shields.io/badge/make.fun-news--image--20261122-blue)](https://make.fun/c/news-image-20261122)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![entry](https://img.shields.io/badge/entry-entry.png-orange)](entry.png)

A program that writes one image summing up Sunday 22 November 2026's
world news: NATO vows to defend 'every inch' of Poland after Russian
missiles land there, COP31 nears a final deal, Mexico captures
'El Chapo Isidro', a magnitude 6.9 quake shakes Peru, Estonia shuts its
Russia border — plus six more stories in the ALSO TODAY strip.

- Competition: [news-image-20261122](https://make.fun/c/news-image-20261122) ($100 pot, 50 places)
- Program: `main.ts` (Node 22, standard library only) — verifies `entry.png`
  (1024×1024 PNG) and copies it to `/output/entry.png`, byte-identical on
  every run. No network at run time.
- Run it: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`
