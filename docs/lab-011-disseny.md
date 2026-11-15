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

## Registre d'implementació de la fase 2 (15-11-2026)

Implementats a la branca `feature/lab-011-qualitat-xarxa`:
- `cases.js`: protocol `TL-PQ1`, biblioteca de set famílies, 30 casos inicials amb codis únics.
- `model.js`: components harmònics vinculats a RMS, THD, P, S, Q1 i FP, formes d'ona, espectres i evolució temporal determinista.
- `instrument.js`: relació de TC, inversió de pinça, correspondència de fases, canals desactivats i topologia incompatible.
- `session.js`: historial d'adquisicions i exportació/importació de sessions versionades en JSON, amb opcions de desament local.
- `scripts/lab-011.test.js`: proves automatitzades preparades per a `npm test`.

**Verificació realitzada:** execució aïllada de 10 comprovacions funcionals sobre els mòduls combinats: codis únics, reconstitució, set famílies, RMS de la forma d'ona, error de TC, pinça invertida, fases creuades, no detecció de pertorbació fora del mostreig i exportació/importació de sessió. Resultat: 10/10 comprovacions satisfactòries. Encara no s'ha executat la suite `npm test` amb Node.js dins del repositori.

**Pendent abans de publicar:** proves amb Node i navegador, validació numèrica exhaustiva, criteris de resolució temporal, assaig docent de la dificultat dels 30 casos, mecanisme de configuració accessible, UI, Fonaments/Ajuda i exportacions CSV/impressió. El generador actual es considera prototip tècnic: les famílies s'han distribuït, però no s'ha demostrat que les 30 variants siguin pedagògicament equivalents. L'etiqueta de desequilibri RMS es manté diferenciada del desequilibri de seqüència negativa.

## Prototip d'interfície — fase 3 (15-11-2026)

Fitxers nous: `labs/lab-011/index.html`, `lab.css`, `lab.js` i `metadata.json` amb estat `planned`. La pàgina presenta: obertura de cas per codi, 3 punts de mesura de CA, topologia, correspondència de fases, canals, TC, pinça invertida, paràmetres de captura, botons de l'analitzador, pantalles de mesures, espectre de tensió, forma d'ona de tensió i registre temporal. Permet desar una sessió local o transferir-la en JSON i consultar les adquisicions anteriors. Inclou primers textos de Fonaments i Ajuda. Tot queda separat de la branca principal.

**Limitacions expressament pendents:** no hi ha encara pantalla completa de verificació de connexions ni exportació CSV/imprimible; els gràfics de corrent requereixen integrar les conseqüències de les pinces/TC a la forma d'ona; l'espectre representa la tensió del canal seleccionat però encara no un espectre de corrent capturat; l'estratègia de detecció d'esdeveniments és per mostreig discret; falta validació de navegador, accessibilitat i prova docent. No es marcarà `published` ni s'integrarà al catàleg principal fins a la validació.

Referència formal d'ergonomia: analitzadors industrials amb pantalla de dades, controls de navegació i pantalles de magnituds, formes d'ona i harmònics; evitar la còpia d'imatges, marques i distribucions propietàries.

**Verificació feta:** comprovació de sintaxi de tots els nous mòduls JavaScript, incloent la interfície i el fitxer de tests. No s'ha executat encara `npm test` ni una revisió real en navegador.

## Canvi de prioritat de persistència i informe (15-11-2026)

Després de la primera revisió visual, s'ha retirat el desament al navegador de la interfície i del mòdul de sessió. Es manté l'exportació/importació JSON com a única via de recuperació portable del treball. El codi de cas continua reconstruint només l'escenari.

S'ha incorporat `exports.js`, que genera un informe HTML instrumental amb format A4 preparat per imprimir o desar com a PDF mitjançant el diàleg d'impressió del navegador. L'informe conté el codi de cas, la data de generació, cada adquisició, el punt de mesura, la configuració de canals i TC, la finestra temporal, lectures RMS/THD/potències i un gràfic temporal de tensió quan hi ha dades suficients. No incorpora diagnòstics ni conclusions sobre conformitat; identifica clarament que són dades simulades.

**Limitació de la primera versió:** no es genera encara un PDF binari de manera directa. Safari i altres navegadors permeten l'opció d'imprimir/desar com a PDF; cal verificar-ne l'aspecte real amb proves d'impressió i de navegació. Falta comprovar gràfics harmònics, capçaleres i paginació d'informes llargs.

Verificacions fetes: sintaxi dels set mòduls JS revisats; generació d'informe d'una sessió amb una adquisició i presència de la configuració, les mesures, el gràfic i l'avís de dades simulades; recuperació JSON íntegra. No s'ha fet una prova real de diàleg d'impressió.

## Fase 4 — primer model de connexions (16-11-2026)

El LAB-011 permet seleccionar sobre un esquema de conductors virtuals l'extrem d'una sonda de tensió o una pinça de corrent i després el conductor on es col·loca. També s'ofereixen selectors convencionals accessibles per teclat. Es poden deixar sondes i pinces sense connectar. El sentit de cada pinça es canvia independentment. Les connexions es guarden dins de cada adquisició i apareixen a l'informe imprimible. La col·locació no es qualifica ni es marca com a correcta o incorrecta.

El motor `instrument.js` calcula la tensió entre els dos terminals seleccionats, incloent connexions fase-neutre, fase-fase o polaritat invertida, a partir de la diferència fasorial de les components harmòniques; la pinça obté el corrent del conductor seleccionat, amb signe i relació de TC. Els canals sense sondes o sense pinces mostren lectures incompletes. Es mantenen les lectures de sessions històriques que no tenen encara els camps nous de connexions.

**Limitacions explícites del prototip:** no simula corrent de neutre, ni contactes físics, ni categories de seguretat CAT. El diagrama de connexions és un primer esquema de conductors i no una representació elèctrica completa d'una instal·lació industrial. La pantalla de formes d'ona i espectres actual només funciona en connexió fase-neutre, per evitar representar incorrectament senyals no modelats per la visualització. Cal desenvolupar la visualització coherent de formes d'ona fase-fase i de corrent, així com les proves finals en Safari i altres navegadors.

El codi del cas s'indica com a **Codi de l'exercici** a la capçalera de l'informe PDF/impressió i a cadascuna de les seves seccions d'adquisició, de manera que continua identificable en informes de diverses pàgines. Verificació puntual: sense connexions no es produeixen lectures; amb sondes L1–N i pinça L1 s'obtenen mesures; invertir les sondes inverteix el signe de P; fase-fase modifica la tensió RMS; una pinça absent deixa el corrent sense lectura; l'informe conté el codi i els terminals. No s'ha completat encara una revisió de navegador ni la suite completa de Node.js.

## Fase 4A — connexions arrossegables i referència Pt 2.2 (16-11-2026)

S'ha substituït la zona de selecció de sondes i pinces per un panell SVG horitzontal únic que dibuixa P0 (entrada de quadre general), P1 (branca de variador) i P2 (quadre de control), els conductors L1/L2/L3/N/PE, set terminals d'instrument (V1/V2/V3/VN i I1/I2/I3), els cables que uneixen cada terminal amb la punta i la representació de l'analitzador. Les puntes es poden arrossegar amb ratolí o amb entrada tàctil; es poden manipular també amb teclat. No hi ha selectors desplegables de col·locació a la interfície activa. El doble clic sobre una pinça o la tecla R n'inverteix el sentit.

La referència de la Pt 2.2 és una xarxa trifàsica de 400/230 V i 50 Hz amb N i PE. La representació inclou 24 V CC com a circuit de control informatiu, sense punts de mesura CA. El motor físic converteix les col·locacions en lectures segons la fase i el punt: la posició P0/P1/P2 afecta tensions i corrents, el sentit de pinça afecta potències, les sondes fase-fase produeixen mesures diferents de les fase-neutre i les puntes no col·locades no produeixen lectures completes. En aquesta versió el neutre retorna la suma fasorial de corrents de fase i PE s'idealitza sense corrent de defecte, amb el mateix potencial de referència que N; cal documentar explícitament aquestes simplificacions docents abans de publicar.

Cada adquisició conserva les posicions dels terminals i l'informe imprimible presenta el codi de l'exercici i els punts P0, P1 i P2. S'han comprovat les sintaxis dels mòduls i nou casos de prova del motor (9/9 satisfactoris). **Pendent:** comprovació manual dels gestos de drag-and-drop a Safari i altres navegadors, validació visual i d'impressió, coherència de les formes d'ona per connexions entre punts, tractament físic complet de tensions/corrents PE en situacions de defecte (fora d'abast actual) i execució de la suite Node.js completa. La versió continua provisional.

## Revisió del panell de connexions — allotjaments dobles i sentit de pinça (16-11-2026)

S'han definit dos allotjaments físics separats (sockets 0 i 1) per cadascun dels conductors L1/L2/L3/N/PE als punts P0, P1 i P2. Els dos allotjaments representen el mateix node elèctric: la posició física només serveix per evitar solapaments. L'allotjament preferit s'utilitza quan és lliure; si ja està ocupat, s'usa l'altre. Quan ambdós estan ocupats, la connexió anterior de l'element no canvia. Les posicions es registren a `positiveSocket`, `negativeSocket` i `socket` dins de la configuració de l'equip, sense modificar el valor mesurat per aquest canvi de posició. Els casos recuperats de sessions anteriors sense informació de socket es representen al primer allotjament.

Les pinces I1/I2/I3 mostren ara unes mordasses i una fletxa al cos de la pinça. El doble clic o la tecla R gira la fletxa 180 graus i canvia el seu acabat visual, mantenint la connexió i alterant el sentit de la mesura segons `inverted`. Es manté la prohibició de missatges de correcte/incorrecte.

S'ha incorporat una prova automatitzada que comprova l'ocupació dels dos allotjaments i la impossibilitat d'ocupar-ne un tercer. Cal verificar visualment que l'arrossegament sigui còmode en Safari/Chrome i que els moviments de pinces amb doble clic no provoquin un desplaçament accidental.
