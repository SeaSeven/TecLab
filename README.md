# TecLab

Laboratoris tècnics interactius · Prototip v0.1 · Català · Grafit i ambre.

## Provar en local

Amb Node.js i Python:

```sh
npm run build
npm test
python3 -m http.server 8000
```

Obre http://localhost:8000. No hi ha dependències npm.

Portada, cerca, filtres i plantilla amb Laboratori, Fonaments i Ajuda. LAB-001 és una demostració de lectura de resistències; LAB-002 a LAB-004 estan en preparació. No es desen resultats. TECLAB-001 és un codi públic de distribució, sense protecció real.

Exercicis aleatoris, codis reproduïbles i comprovació de respostes: pendents.

## GitHub Pages

A Settings → Pages, selecciona Deploy from a branch, main i / (root), i desa. Les rutes relatives permeten servir el portal sota /TecLab/.

Després de modificar metadades, executa npm run build i incorpora data/laboratories.json al commit.
