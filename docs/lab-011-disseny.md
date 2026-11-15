# LAB-011 · Analitzador virtual de qualitat de xarxa

Document de disseny inicial (15-11-2026). Estat: proposta tècnica, **no implementació funcional**.

## Objecte docent

Mòdul 0968 · Integració de sistemes d'automatització industrial; pràctica Pt 2.2; CA 2.9. Simulació instrumental d'una estació automàtica de classificació de peces. L'alumne configura i opera un analitzador, obté dades i les interpreta posteriorment. El laboratori **no** dona notes, no corregeix la configuració i no declara la conformitat normativa de la xarxa.

**Dimensionament:** 30 alumnes, amb un mínim de 30 casos individuals diferents i de dificultat comparable.

## Comprovacions sobre TecLab (branca main)

- El projecte és una aplicació estàtica en JavaScript ESM, sense dependències npm; `npm run build` genera `data/laboratories.json` a partir de cada `labs/lab-XXX/metadata.json`.
- `shared/css/tokens.css`, `shared/css/components.css` i `shared/components/catalog.js` defineixen el llenguatge visual i el catàleg.
- `shared/components/app.js` envia LAB-007/008/009/010 a pàgines independents. Proposta: fer el mateix amb LAB-011.
- `shared/services/exercises.js` ja ofereix `checksum`, `seededRandom` i `randomSeed`. El protocol `TL-...` és compatible amb un format propi versionat.
- Els codis d'exercici existents reconstrueixen el cas; no resolen per si sols la persistència portable d'una sessió completa.
- TecLab publica autoria al peu de pàgina; la llicència de reutilització està pendent, i el laboratori nou ha de conservar aquesta indicació.

## Estructura prevista (només fitxers nous, excepte integració mínima)

```text
labs/lab-011/
  metadata.json        Fitxa per al catàleg (planned mentre no passi les proves)
  index.html           Entrada HTML, navegació Laboratori/Fonaments/Ajuda
  lab.css              Estils propis sobre els tokens compartits
  lab.js               Estat de la interfície i controls instrumentals
  model.js             Estat físic simulat, fenòmens i càlculs elèctrics
  cases.js             Plantilles i variacions deterministes (30+ casos)
  instrument.js        Connexions, limitacions i transformació en lectures
  session.js           Sessió, adquisicions i serialització versionada
  exports.js           Exportació CSV, JSON i informe imprimible
scripts/lab-011.test.js  Proves automàtiques de models, codis i recuperació
docs/lab-011-disseny.md  Aquest document
```

L'ordre d'implementació serà `cases.js` + `model.js`, després `instrument.js`, després `session.js`, i finalment la interfície i les exportacions. El motor no ha de dependre del DOM.

## Model elèctric mínim

Xarxes 230 V monofàsica i 400/230 V trifàsica, 50 Hz. Diferenciar per punt els canals de tensió i corrent. Definir la fonamental i un conjunt limitat d'harmònics (per defecte ordres 3, 5, 7, 11, 13; només els que corresponguin al cas). Derivar d'aquestes components els valors RMS i les THD: `THD_X = 100 * sqrt(sum(X_n^2,n>=2))/X_1`. Les formes d'ona i espectres han d'usar les mateixes components.

Per a potències, evitar l'equivalència errònia entre factor de potència total i cos(phi) quan hi ha distorsió: calcular P de les components de tensió i corrent corresponents, S a partir dels valors eficaços i `FP=P/S`. Documentar per separat convenció i limitacions de Q en règim no sinusoidal; en una primera versió, etiquetar expressament `Q1` quan es representi només la potència reactiva fonamental. En trifàsic, calcular per fase i sumar potències, no multiplicar mecànicament magnituds quan hi ha desequilibri.

Temps simulat reproduïble: fenòmens calendaritzats en segons des de l'inici del cas, amb durada i amplitud definides. Les adquisicions tenen instant inicial, durada, interval de mostreig/resum i mode de captura. Un esdeveniment fora de finestra no apareix. Un esdeveniment curt pot perdre's quan el mode de registre no té resolució suficient.

## Casos per a 30 alumnes

Set famílies de situació: A subministrament estable; B càrregues no lineals; C sot de tensió; D desequilibri; E variació de càrrega; F pertorbació esporàdica; G combinació. Preparar una distribució inicial de 30 casos: A=5, B=5, C=4, D=4, E=4, F=4, G=4. Les variants s'obtenen amb llavors diferents i modificacions acotades de càrrega, punt, intensitat dels fenòmens, instants i configuració inicial. Aquesta distribució és una proposta de treball, no una garantia d'equivalència didàctica: cal validar temps i complexitat de diagnosi de cada cas. Hi ha d'haver casos sense anomalies significatives; no revelar la família al mode alumne.

## Codi de cas i persistència

Format proposat: `TL-PQ1-<LLAVOR_BASE36>-<CHECKSUM>`, reutilitzant les funcions del servei compartit. El codi identifica el generador v1 i la llavor; comprovar la integritat i els límits del nombre; documentar qualsevol canvi de generador i mantenir una ruta de compatibilitat. Per a una classe, el docent genera 30 llavors/codis únics i en conserva la correspondència externament, sense dades personals dins del codi.

L'estat d'escenari **no** equival a sessió: la sessió inclourà `schemaVersion`, `caseCode`, temps simulat, punt de mesura, configuració de canals i pinces, adquisicions, metadades de la captura i observacions. Guardar una còpia local (preferentment `localStorage`, amb comprovació d'errors/quota) i permetre exportar/importar JSON de sessió amb validació de format, esquema i límits. El codi curt sol **no** recupera l'historial des d'un altre navegador.

## Separació instrumental

Conservar separadament (1) estat real del punt, (2) configuració de l'equip, (3) lectures mostrades i (4) limitacions visibles. Models explícits d'error: relació de TC errònia (afecta I i potències dependents, no V), pinça invertida (signe de potència per canal), fases creuades (angles/potència), topologia inadequada, canals omesos, finestra insuficient, resolució insuficient i saturació d'escala. No substituir els errors físics per soroll independent.

## Interfície

Pàgina pròpia que reutilitza capçalera, peu, paleta, tipografia i pestanyes TecLab. Zona de dades de cas, esquema amb punts CA, panell de configuració, pantalla amb valors, formes d'ona, espectre, registre temporal, historial i exportació. `Fonaments` i `Ajuda` han de ser detallats i amb esquemes del mateix instrument, però no revelar la configuració correcta del cas obert.

## Proves i criteris d'acceptació de la primera versió

1. El mateix codi i instant generen exactament les mateixes magnituds i esdeveniments.
2. RMS i THD concorden amb les formes d'ona i l'espectre.
3. P, S, FP i Q1 segueixen la convenció declarada.
4. Els errors de TC, pinça i fases afecten només els resultats físicament dependents.
5. Una captura fora de la finestra d'un sot de tensió no el registra.
6. Les adquisicions repetides no esborren mesures antigues.
7. Desar i recuperar la sessió conserva rellotge, configuracions i registres.
8. CSV, JSON i informe imprimible concorden amb les lectures mostrades.
9. Es generen almenys 30 casos diferents amb dificultat comparable després de la revisió docent.
10. S'usa sense servidor ni servei comercial; navegació amb teclat i etiquetes accessibles.

## Canvis al portal, només en la fase d'integració

Afegir LAB-011 a l'àrea Instrumentació de `shared/components/catalog.js`, crear `metadata.json`, adaptar l'encaminament de `shared/components/app.js`, executar `npm run build` i `npm test`. No marcar com a `published` fins a validar la pràctica al navegador i la coherència dels registres. No tocar els laboratoris existents.
