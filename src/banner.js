const pkg = require('../package.json');
const { t } = require('./i18n');

const SEPARADOR = '='.repeat(60);

function imprimirBanner(titulo) {
  console.log(SEPARADOR);
  console.log(` ${titulo}`);
  console.log(` ${t('banner.autor', { autor: pkg.author })}`);
  console.log(` ${t('banner.paquete', { nombre: pkg.name, version: pkg.version })}`);
  console.log(SEPARADOR);
}

module.exports = { imprimirBanner };
