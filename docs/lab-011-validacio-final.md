# LAB-011 — Validació prepublicació

Data de revisió: 16 de novembre de 2026.
Versió candidata provisional: `0.4.0-dev`.
Branca: `feature/lab-011-qualitat-xarxa`. **No s'ha fusionat amb `main`.**

## Abast validat automàticament

| Comprovació | Estat | Evidència |
|---|---|---|
| 30 codis recuperables i 30 escenaris diferenciats | Superat | Auditoria de codis i mesures de P0, P1 i P2 |
| Dos blocs de 450 s per cas | Superat | 30 casos; 46 mostres per bloc amb interval de 10 s |
| Captura de fenòmens previstos | Superat en finestres dirigides | Registres de variacions observables de tensió/corrent |
| Funcionament de pinces invertides, TC i connexions errònies | Superat en comprovació lògica | Proves unitàries de càlcul |
| Connexions 24 V CC | Superat en comprovació lògica | Model d'entrades acoblades a CA |
| Exportació JSON i recuperació | Superat | 30 sessions amb dues adquisicions |
| Construcció HTML d'informes per imprimir | Superat | 30 informes amb codi, registres, formes d'ona i espectres |
| Identificació P0/P1/P2 en historial i informe | Superat en lògica | La ubicació correspon a les posicions dels cables, no al punt predeterminat |
| Manuals de Fonaments i Ajuda | Superat en revisió estàtica | Documentació de l'equip sense solucionari |
| Suite LAB-011 | 31/31 en comprovació JavaScript | `scripts/lab-011.test.js` |
| Execució nativa `npm test` i `npm run build` | Pendent de confirmació | Workflow GitHub Actions incorporat a la branca |

La comprovació JavaScript en l'entorn de revisió emparella els mòduls ES i executa les mateixes funcions de test, però no substitueix l'execució nativa sota Node ni comprova el DOM real.

## Proves visuals i funcionals pendents en navegador

Cal executar el protocol en Safari (macOS), Chrome (macOS o Windows) i, com a mínim, un navegador mòbil tàctil:

1. Obrir LAB-011 i confirmar que es carrega sense errors de consola.
2. Veure simultàniament P0, P1, P2, els dos borns de 24 V CC, analitzador i cables.
3. Arrossegar sonda a dos allotjaments diferents del mateix conductor: no se superposen.
4. Ocupar tots dos allotjaments d'un conductor i provar de col·locar-hi un tercer element: no es modifica la connexió prèvia.
5. Moure una sonda connectada entre P0 i P1, i comprovar que la lectura posterior i el registre indiquen el punt físic.
6. Col·locar una sonda a +24 V i una altra a 0 V: lectura alterna nul·la (instrument CA); col·locar pinça sobre un conductor CC.
7. Invertir I1/I2/I3 amb doble clic i comprovar la fletxa visible i el signe de potència.
8. Repetir les accions amb teclat (Tab, Retorn, fletxes, R, Esc).
9. Repetir l'arrossegament amb pantalla tàctil, comprovant el desplaçament i la selecció del socket.
10. Deshabilitar un canal i comprovar que no es fabrica la magnitud corresponent.
11. Alterar relació de TC, confirmar que afecta I i potències però no el valor de U.
12. Capturar mesures i consultar totes cinc pantalles; triar cadascun dels tres canals.
13. Capturar una pertorbació breu amb interval de registre llarg: comparar l'històric de mostres amb la pantalla d'esdeveniments.
14. Registrar dues adquisicions, seleccionar la primera i confirmar que no es representa amb la configuració de la segona.
15. Exportar JSON i importar-lo en una pestanya nova; revisar configuració i historial.
16. Generar PDF amb una i dues adquisicions i comprovar: paginació, títols repetits, cap gràfic tallat, valors llegibles i codi d'exercici.
17. Generar una sessió més llarga i comprovar l'ús de memòria i l'obertura de la finestra d'impressió.
18. Comprovar que la visualització en amplades petites permet accedir a tot el panell.
19. Navegar a Fonaments i Ajuda; verificar esquemes i llenguatge de manual, sense consignes de resolució.
20. Confirmar navegació de tornada al catàleg i la coherència de versions, autoria i nota de llicència.

## Integració amb TecLab

- `metadata.json` continua amb `status: planned` i la versió provisional `0.4.0-dev`.
- La ruta principal del catàleg continua enviant LAB-011 a la fitxa d'activitat en preparació. **No publicar fins que el docent l'aprovi.**
- L'entrada directa `labs/lab-011/index.html` existeix i permet la revisió separada.
- La branca inclou `.github/workflows/lab-011-validation.yml` per executar tests, compilació del catàleg i validació sintàctica a GitHub Actions. El resultat de la CI encara s'ha de confirmar.
- L'autor i la indicació de llicència pendent es mantenen al peu de pàgina.

## Incidències corregides durant aquesta revisió

- L'historial mostrava sempre el `pointId` instrumental per defecte (habitualment `PCC`), encara que els cables de mesura estiguessin a P1 o P2. Ara mostra els punts realment connectats.
- La capçalera dels registres de l'informe imprimible mostrava el mateix punt instrumental genèric; ara identifica els punts físics efectius.
- S'han afegit proves de generació i serialització de 30 informes, i de la identificació correcta dels punts al PDF.
- S'ha actualitzat la identificació de versió provisional en la fitxa de laboratori i en la pàgina d'entrada.
- La pantalla de mesures ja no mostra la freqüència de l'escenari quan no existeix cap entrada de tensió alterna utilitzable (evita presentar una dada interna com si fos una lectura mesurada).

## Criteri de pas a definitiva

No passar el LAB-011 a `published` ni a `main` fins que:
1. La suite nativa de Node i la compilació del catàleg acabin sense errors.
2. El docent validi visualment el panell i els continguts de l'informe en Safari.
3. Es comprovin les interaccions de ratolí i teclat, i es resolguin les incidències de l'ús tàctil.
4. Es confirmi que els 30 casos són adequats per a la rúbrica comuna i una prova pilot d'almenys un exemple de cada família.

## Integració provisional al catàleg (revisió de navegació)

- El catàleg ofereix una cinquena àrea **Laboratoris de pràctiques** (identificador `practices`), amb el LAB-011 com a primer membre. Les quatre àrees originals i els seus laboratoris continuen sense canvis.
- La nova targeta disposa d'una il·lustració pròpia de l'analitzador i admet els filtres existents (àrea, estudis, estat i cerca).
- S'ha adaptat la graella per a cinc targetes en pantalles amples i s'han conservat les distribucions de tres, dues i una columna segons l'amplada disponible.
- S'ha incorporat la ruta `#lab-011` des de la portada perquè obri `labs/lab-011/index.html`.
- El catàleg generat `data/laboratories.json` inclou onze laboratoris, i la fitxa del LAB-011 té l'estat `published` **únicament a la branca de desenvolupament**. La branca principal `main` no s'ha modificat.
- S'ha afegit `scripts/catalog-areas.test.js` per comprovar les cinc àrees, la ruta i la coherència del catàleg generat; el workflow inclou aquests fitxers en els disparadors de PR.

**Pendent:** validar la navegació, l'aspecte de la portada i l'obertura des de les targetes en un navegador real. No es desplegarà aquesta versió a `main` fins a la revisió visual i el vistiplau del docent.
