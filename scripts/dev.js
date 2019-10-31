const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const { t } = require('../src/i18n');

const RAIZ = path.resolve(__dirname, '..');
const CARPETA_FUENTES = path.join(RAIZ, 'src');
const EJECUTABLE = path.join(RAIZ, 'bin', 'velo.js');

const ESPERA_MS = 200;

let servidor = null;
let temporizador = null;
let cerrando = false;

function arrancar() {
  servidor = fork(EJECUTABLE, ['server'].concat(process.argv.slice(2)), { stdio: 'inherit' });
  servidor.on('exit', () => {
    servidor = null;
  });
}

function reiniciar(archivo) {
  console.log(`\n[velo:dev] ${t('dev.reiniciando', { archivo: path.relative(RAIZ, archivo) })}`);

  if (servidor) {
    servidor.once('exit', arrancar);
    servidor.kill('SIGTERM');
  } else {
    arrancar();
  }
}

function programarReinicio(archivo) {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => reiniciar(archivo), ESPERA_MS);
}

function vigilar(carpeta) {
  fs.watch(carpeta, (evento, nombre) => {
    if (nombre) programarReinicio(path.join(carpeta, String(nombre)));
  });

  for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
    if (entrada.isDirectory()) vigilar(path.join(carpeta, entrada.name));
  }
}

function detener() {
  if (cerrando) return;
  cerrando = true;
  clearTimeout(temporizador);

  if (servidor) {
    servidor.once('exit', () => process.exit(0));
    servidor.kill('SIGTERM');
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', detener);
process.on('SIGTERM', detener);

console.log(`[velo:dev] ${t('dev.vigilando', { carpeta: path.relative(RAIZ, CARPETA_FUENTES) })}`);
vigilar(CARPETA_FUENTES);
arrancar();
