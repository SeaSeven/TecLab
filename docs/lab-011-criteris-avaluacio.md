# LAB-011 — Criteris comuns de treball i d'avaluació (Pt 2.2)

Versió de treball: 16-11-2026. Aplicació prevista: 30 casos individuals, amb una mateixa exigència d'evidències.

## Finalitat

L'alumnat ha d'operar l'analitzador virtual, obtenir dades de les magnituds elèctriques i justificar les conclusions a partir de les mesures registrades. Un cas sense pertorbacions no es considera incomplet ni incorrecte. Un cas amb diversos fenòmens no obliga a fer una anàlisi exhaustiva de tots.

Aquesta rúbrica avalua **qualitat del procediment, suficiència de dades, ús de l'equip i interpretació tècnica**, no el nombre d'anomalies que presenta el generador. No ha d'aparèixer als apartats «Fonaments» ni «Ajuda», que continuen essent exclusivament manuals d'instrument.

## Paquet comú d'evidències per alumne

Tots els casos requereixen les mateixes categories de resultats:

1. **Configuració instrumental documentada:** topologia, connexions i pinces, sentit de pinces, relacions TC i adquisicions.
2. **Mesures elèctriques:** magnituds per fase i potències en punts de CA seleccionats i identificats, amb comparació raonada.
3. **Contingut dels senyals:** almenys una forma d'ona i informació d'harmònics de tensió i de corrent, comentades a partir del que mostra l'analitzador.
4. **Comportament temporal:** com a mínim dues finestres de registre de la mateixa instal·lació, amb una descripció del que s'hi observa, inclosa la possibilitat d'absència de variacions detectables.
5. **Informe lliurat:** codi de l'exercici, dades, gràfics, configuració pertinent i explicació de les conclusions i de les limitacions de les mesures.

El nombre de finestres, taules i gràfics obligatoris ha de ser el mateix per als 30 alumnes; no s'imposen adquisicions addicionals pel fet que un escenari contingui més d'un fenomen.

## Rúbrica comuna (100 punts)

| Àmbit | Màxim | Criteris |
|---|---:|---|
| Configuració i operació de l'instrument | 20 | Identificació i ús de punts, canals, pinces, TC i paràmetres de captura; coherència del muntatge documentat |
| Mesures i comparació entre punts/fases | 20 | Valors RMS, magnituds de potència i diferències observades; unitats i coherència |
| Formes d'ona i harmònics | 20 | Obtenció i lectura de gràfics de tensió i corrent, espectre, fonamental i THD |
| Observació temporal | 20 | Dues finestres i contrast de les lectures; registre de canvis o justificació de l'estabilitat observable |
| Interpretació i límits de la mesura | 15 | Conclusions justificades amb evidències, incerteses i absències de dades; cap afirmació inventada |
| Informe i traçabilitat | 5 | Codi identificable, gràfics, adquisicions i configuració que permeten reproduir el treball |
| **Total** | **100** | |

La puntuació de cada àmbit és independent del diagnòstic de la família del cas. Es pot obtenir la puntuació màxima argumentant correctament que les dades recollides no mostren una variació rellevant.

## Regla d'equitat específica

- **Escenaris de comportament estable:** la interpretació fundada de la manca de canvis rep el mateix crèdit que la descripció d'un canvi mesurat en altres escenaris. No s'atribueixen punts per detectar anomalies inexistents.
- **Escenaris amb distorsió o desequilibri persistents:** s'avalua el contrast mesurat entre magnituds, no la identificació d'una etiqueta de problema amagada.
- **Escenaris amb variacions temporals:** n'hi ha prou amb una observació temporal defensable a partir de les finestres registrades. L'instant exacte i la durada de l'esdeveniment no són requisits per obtenir la qualificació completa si la captura no els ha resolt.
- **Escenaris amb fenòmens combinats:** s'exigeix justificar un comportament rellevant amb les mateixes evidències que la resta. Descriure fenòmens addicionals és opcional i no dona puntuació extra.
- **Esdeveniments molt breus:** no s'exigeix un nombre superior d'intents ni cercar un instant ocult amb una precisió especial. Les finestres de la pantalla d'esdeveniments formen part de l'eina, no són indicis de solució.
- **Connexions incompletes o equivocades:** l'analitzador no emet judicis; el docent avalua com l'alumne argumenta les lectures i els límits que comporten. No s'atorga la mateixa puntuació a una dada inventada que a una lectura vàlidament identificada com a no disponible.

## Validació docent abans de publicar

La igualtat de rúbrica controla la **càrrega d'evidències i la qualificació**; no demostra per si mateixa igualtat de temps ni de dificultat cognitiva. Cal una prova pilot amb casos de cada família, observant el temps real, la navegació temporal i el volum de treball; si apareix una descompensació, cal ajustar l'enunciat o la rúbrica abans d'alterar silenciosament el model físic.

Aquesta informació genèrica es pot incloure a la documentació del projecte. **No publicar al repositori una taula que associï codis individuals a famílies, instants o resultats esperats.** El generador és JavaScript públic executat al navegador: els codis no són una mesura criptogràfica de confidencialitat dels fenòmens. El material docent de control s'ha de gestionar fora del repositori de l'alumnat.
