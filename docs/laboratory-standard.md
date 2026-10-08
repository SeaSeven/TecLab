# Estructura

Cada laboratori té metadata.json i una entrada pròpia. scripts/build-catalog.js genera data/laboratories.json. Els estils són a shared/css i el càlcul és independent a shared/services/resistance.js.

Durant el prototip, shared/components/app.js centralitza les vistes. En completar cada laboratori, la seva vista i lògica passaran a la carpeta labs corresponent.

No hi ha comptes, persistència de resultats ni validació externa d’accés. Els codis d’exercici reproduïbles estan pendents. La validació visual en navegador també queda pendent.
