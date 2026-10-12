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

- LAB-005 v1.0.0: pràctica resistiva de 2 a 10 components, unitats seleccionables, correcció del 2 %, codis TL-CC1 i resolució amb esquemes equivalents.

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

17 proves automatitzades: càlcul, rangs, conversió, respostes, codis i estabilitat del generador R1. Revisió en navegador d’ordinador feta: portada, lectura de sis bandes, comprovació de resposta i retorn a la portada. La revisió en mòbil queda pendent.


## LAB-006: oscil·loscopi

- Nivell inicial: ones d'un canal (codi TL-OSC1), escales i lectura de tensió i període.
- Nivell intermedi: trigger i sincronització (codi TL-OSC3); es generen ones deterministes amb una llavor.
- Nivell avançat: dos canals (codi TL-OSC2), posicions verticals independents, cursors de temps i tensió, retard i fase.
- Els codis d'exercicis generats abans d'aquesta ampliació continuen sent vàlids.

## Autoria i reutilització

TecLab ha estat pensat, definit i creat per **Albert Marcet i Valdés**. El projecte encara **no té una llicència de reutilització publicada**. El codi es pot consultar públicament, però no s'ha d'interpretar aquesta accessibilitat com una autorització de còpia, modificació o redistribució. El peu de pàgina enllaça una fitxa d'estat.

La proposta pendent d'aprovar és utilitzar MIT per al codi i CC BY-SA 4.0 per als continguts docents, un cop s'hagi comprovat qui és titular dels drets. Vegeu [Autoria i llicència](docs/autoria-i-llicencia.md).

## LAB-006 v1.4 (pendent de revisió)

- Ajuda ampliada amb vuit seccions il·lustrades: selecció, escales, trigger, cursors, doble canal, ones aplicades i recuperació.
- Nivell «Aplicacions reals»: dent de serra, polsos PWM i sinusoide rectificada. Generació i recuperació mitjançant codis TL-OSC4; no s'alteren les sèries OSC1/2/3.
- Retroacció de comprovació en panells amb missatges detallats i resultats diferenciats.
- Les ones rectangulars i dent de serra presenten discontinuïtats intencionades. Els senyals triangulars continuen sent continus.

## LAB-006 v1.5 (branca en revisió)

- Exercici PWM: mesurar el cicle de treball d'un pols i recuperar-lo pel codi TL-OSC5-W.
- Acoblament DC/AC/GND del CH1: observar l'ona amb o sense component contínua i amb la referència a zero (TL-OSC5-C).
- Diagnosi de senyals: identificar retallament de pics, ondulació harmònica o soroll determinista superposat (TL-OSC5-F).
- Ajuda amb exemples de PWM, acoblament i diagnosi. La resta de codis OSC1-OSC4 mantenen el mateix generador.

**Limitació del model:** el filtratge AC es representa mitjançant eliminació exacta de la mitjana; no s'hi simulen transitoris ni freqüència de tall d'un condensador d'acoblament. Les anomalies són senyals de prova didàctics.
