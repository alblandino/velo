const { t } = require('../i18n');

function error(clave, parametros) {
  return { err: `ERR ${t(clave, parametros)}` };
}

function errorArgumentos(comando) {
  return error('comandos.argumentosIncorrectos', { comando });
}

function errorTipo() {
  return { err: `WRONGTYPE ${t('comandos.tipoIncorrecto')}` };
}

module.exports = { error, errorArgumentos, errorTipo };
