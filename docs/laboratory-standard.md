# Estructura de TecLab

Cada laboratori té un identificador estable, index.html i metadata.json. scripts/build-catalog.js genera data/laboratories.json. Els estats published i planned corresponen a un recurs disponible i un recurs en preparació.

shared/css conté els tokens i components. shared/components/app.js gestiona el catàleg i la navegació. El LAB-001 separa la interfície (lab.js, lab.css), el càlcul (resistor.js) i el generador (exercises.js). Els nous laboratoris seguiran aquesta separació.

Els apartats comuns són Laboratori, Fonaments i Ajuda. Una portada pròpia presenta les activitats abans d’entrar a l’espai de treball. La identitat instrumental usa grafit i ambre; la portada i els panells de treball comparteixen un tema fosc estable. La navegació no canvia els colors. El retorn a la portada del laboratori sempre és visible. La pràctica segueix el quadern de taller: controls, enunciat il·lustrat, respostes i resolució.

shared/services/exercises.js implementa llavors de 32 bits i codis TL-R1 amb comprovació d’errors de transcripció. R1 identifica una seqüència estable; un canvi de generador requereix una nova versió i mantenir la lectura de l’anterior. El checksum no és un mecanisme de seguretat.

Cap dada d’alumne es desa o s’envia. Els codis d’accés i d’exercici són conceptes diferents. La validació externa d’accés no està implementada.

Abans de publicar: comprovar càlculs i unitats, errors d’entrada, teclat, colors amb etiqueta textual, ajuda i mida petita de pantalla. En aquesta versió les proves de lògica passen i s’ha revisat la navegació i la interacció en navegador d’ordinador. La revisió en mòbil continua pendent.


LAB-005 separa càlcul i generació (circuit.js), interfície i esquemes (lab.js), i estils (lab.css). CC1 fixa la seqüència dels exercicis. La validació cobreix 900 circuits, Kirchhoff, potències, codis i respostes. La revisió visual d’aquesta incorporació queda pendent.
