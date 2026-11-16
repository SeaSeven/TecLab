# LAB-011 · Revisió dels comandaments de sonda i pinça

Branca: `feature/lab-011-controls-tc`. Proposta de versió: `1.1.0-dev`. No s'ha publicat a `main`.

## Modificació

- Els controls d'activació de V1, V2, V3 i I1, I2, I3 apareixen com a interruptors al panell immediatament sota l'esquema físic, al costat dels controls de pinça i sonda corresponents.
- El born VN és una referència negativa compartida del model actual; no s'ha afegit un interruptor VN fictici.
- Cada pinça I1/I2/I3 disposa d'un selector de TC propi. El control antic que admetia una relació decimal lliure ja no es presenta.
- Opcions 5 A: primaris 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1250, 1500, 2000, 2500, 3000 i 4000 A.
- Opcions 1 A: primaris 800, 1000, 1250, 1500, 2000, 2500, 3000 i 4000 A.
- «Sense TC · directe (1:1)» és una opció docent addicional per a connexions directes.
- La selecció mostra la relació nominal com ara `100/5 A`; el motor elèctric utilitza `ctRatio = primari/secundari` (20 en l'exemple). La configuració també guarda `ctPrimary` i `ctSecondary` per fer explícit l'ajust escollit.
- Els valors comercials es representen com opcions pròpies del simulador; no es reivindica una certificació normativa del dispositiu.
- L'informe imprimible identifica la relació primari/secundari i el JSON conserva els dos valors.
- La lectura de sessions antigues és compatible: si la relació numèrica coincideix amb una opció, es representa amb l'etiqueta; si no, el desplegable identifica una «Relació anterior» i obliga a seleccionar un TC comercial per canviar-la. No es recalculen adquisicions prèvies.

## Verificació

- 35 proves del LAB-011 superades en entorn JavaScript de comprovació; inclouen opcions vàlides, absència d'entrada decimal lliure, càlcul RMS/potència, exportació i sessions heretades.
- Comprovació sintàctica positiva de `lab.js`, `instrument.js`, `exports.js`, `ct-options.js` i altres mòduls.
- Pendent prova visual dels comandaments, del disseny responsiu i de l'arrossegament en Safari/Chrome. Sense fusió a `main` fins al vistiplau docent.
