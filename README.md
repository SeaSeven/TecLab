# TecLab

Laboratoris tècnics interactius · Portal v0.3 · LAB-001 v1.1.0.

## Provar en local

Amb Node.js i Python:

```sh
npm run build
npm test
python3 -m http.server 8000
```

Obre http://localhost:8000. No hi ha dependències npm.

## Laboratoris

- LAB-001: portada pròpia, lectura de 4/5/6 bandes, conversió exacta de valor a colors, tolerància i interval, TCR, pràctica i resolució pas a pas.
- LAB-002, LAB-003 i LAB-004: fitxes en preparació.

Els codis TL-R1 reprodueixen un exercici concret; no identifiquen alumnes ni restringeixen l’accés. TECLAB-001 és un codi públic de distribució que localitza el LAB-001 al portal. No es desen respostes.

## Estructura

Cada carpeta labs conté la seva entrada i metadata.json. El LAB-001 té lab.js, lab.css, resistor.js i exercises.js. shared conté els estils comuns, el portal i el protocol de codis. scripts/build-catalog.js genera data/laboratories.json; no l’editeu manualment.

Després de modificar metadades, executeu npm run build i incorporeu el catàleg al commit.

## GitHub Pages

Settings → Pages: Deploy from a branch, main, / (root). Rutes relatives compatibles amb /TecLab/.

## Abast i validació

Codificació axial convencional; no s’inclouen 0 Ω, SMD ni variants militars o de fiabilitat. La conversió no arrodoneix i no garanteix disponibilitat comercial. Fonts tècniques enllaçades a Fonaments.

17 proves automatitzades: càlcul, rangs, conversió, respostes, codis i estabilitat del generador R1. La prova visual en navegador d’aquesta versió queda pendent.
