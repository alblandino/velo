const { error, errorArgumentos } = require('../../../errores.js');

class ExpireCommand {
  static get nombre() { return 'EXPIRE'; }

  execute(store, args, db) {
    if (args.length !== 2) {
      return errorArgumentos('EXPIRE');
    }

    const [clave, segStr] = args;
    const segundos = parseInt(segStr, 10);

    if (isNaN(segundos)) {
      return error('comandos.noEsEntero');
    }
    if (segundos < 0) {
      return error('comandos.expiracionNegativa');
    }

    const entrada = store.get(db, clave);
    if (!entrada) return 0;

    entrada.expiresAt = Date.now() + segundos * 1000;
    return 1;
  }
}

module.exports = { ExpireCommand };
