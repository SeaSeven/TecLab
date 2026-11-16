# LAB-011 — Auditoria tècnica dels 30 casos docents

Data: 16-11-2026. Estat: verificació automàtica satisfactòria, validació docent de dificultat pendent.
Branca: `feature/lab-011-qualitat-xarxa`.

## Abast

S'han revisat els 30 casos generats per `classCases(30)`, amb verificació de codis i de resultats reproduïbles. S'han reproduït mesures de tensió, corrent, potència i distorsió als tres punts de CA (P0, P1, P2), amb sondes fase-neutre i pinces correctament configurades. Les finestres de prova s'han situat sobre les transicions temporals de cada escenari per comprovar la capacitat de captura del simulador. Aquest procediment valida que el fenomen es pot observar, però **no avalua la probabilitat que l'alumne el descobreixi** en un treball ordinari.

## Resultats verificats

- 30 codis únics, vàlids i reproduïbles.
- Referència trifàsica 400/230 V i freqüència simulada al voltant de 50 Hz.
- Lectures disponibles als punts P0, P1 i P2 amb connexions completes i coherents amb l'estat generat.
- 30 conjunts de característiques físiques i temporals diferenciables.
- Variacions temporals detectables a tots els escenaris que incorporen esdeveniments, també en mesures sobre P0, P1 i P2, en una finestra que n'inclogui l'inici.
- Cap codi intern de fenomen (`kind`/`id`) exposat als registres públics d'esdeveniments.
- Les 28 proves del fitxer de test han superat una execució funcional amb el codi del repositori carregat en un entorn JavaScript de comprovació. **Pendent executar la suite nativa amb `npm test` i la prova en navegador.**

## Distribució de la sèrie de 30

| Tipus de comportament de xarxa | Nombre de casos | Nivell de recerca que previsiblement demana |
|---|---:|---|
| Estat estable, sense esdeveniment transitori | 4 | Interpretació de magnituds sense anomalia temporal |
| Distorsió harmònica persistent | 4 | Comparació d'espectres i THD |
| Variació breu de tensió | 4 | Localització temporal i registre |
| Desequilibri trifàsic persistent | 4 | Comparació entre fases |
| Variació de càrrega sostinguda | 4 | Mesures temporals i corrent |
| Variació de tensió molt curta | 5 | Captura temporal exigent |
| Fenòmens combinats | 5 | Anàlisi de diverses magnituds i instants |

La repartició és propera però no equivalent: hi ha 4 casos estables i 5 de fenòmens combinats. A més, algunes variacions de tensió duren menys de 0,25 s, mentre que altres fenòmens són permanents o duren desenes de segons.

## Decisions docents pendents abans de l'assignació

1. Determinar si els 30 alumnes han de rebre exercicis de dificultat comparable o si es permeten famílies amb una càrrega d'anàlisi diferent, per exemple mitjançant una rúbrica diferenciada.
2. Establir si la localització d'un esdeveniment breu dins dels 900 segons forma part explícita del repte. El fet que el detector intern el pugui capturar no implica que el registre per defecte el localitzi sense exploració.
3. Decidir si els casos estables han de ser plenament vàlids per a la mateixa consigna o si cal substituir-ne alguns per variants que incloguin un fenomen mesurable addicional.
4. Comprovar amb una prova docent manual els temps i les passes mínimes necessàries per desenvolupar cada tipus de cas.

## Criteri de publicació

No incloure una llista pública que associï cada codi d'alumne a la seva família, instant de pertorbació o resposta esperada. Qualsevol solucionari docent ha de romandre fora del repositori públic i fora del paquet que es distribueix a l'alumnat.

No s'han regenerat ni alterat els 30 codis existents: es mantenen perquè les sessions i les assignacions ja emeses continuïn essent reproduïbles.

## Criteris comuns d'equitat establerts en aquesta revisió

La distribució de fenòmens és intencionadament diversa i es mantenen els 30 codis originals. Per controlar la diferència en l'esforç obligatori sense revelar els casos ni modificar-ne a posteriori els fenòmens s'ha definit `docs/lab-011-criteris-avaluacio.md`, amb una rúbrica transversal de 100 punts i un paquet idèntic d'evidències. Els alumnes poden documentar estabilitat, distorsió, diferències entre fases o variacions temporals sense que el nombre d'anomalies sigui un criteri d'avaluació.

La prova addicional automatitzada efectua **dues adquisicions de 450 s** per cas, amb interval de registre de 10 s (46 files per adquisició), i verifica la disponibilitat de magnituds de CA i la captura dels esdeveniments dins dels 900 s. El resultat és **30/30 escenaris** sense adquisicions fallides i amb els seus esdeveniments capturables. Aquesta finestra comuna és un patró de verificació docent, no una pista ni un procediment publicat dins de l'analitzador.

La rúbrica iguala l'exigència formal de la pràctica, però **no garanteix temps iguals**: els cinc casos amb variacions molt breus poden requerir exploració diferent dels casos estables o persistents. És necessària una prova pilot humana si la igualtat de temps d'execució és un requisit estricte.

La bateria `scripts/lab-011.test.js` conté ara **29 proves**, superades en l'entorn JavaScript de comprovació (execució no equivalent a `npm test` natiu). La integració en `main` continua pendent.
