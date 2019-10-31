const { KeyEntry, TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { error, errorArgumentos } = require('../../../errores.js');

class SetexCommand {
  static get nombre() { return 'SETEX'; }

  execute(store, args, db) {
    if (args.length !== 3) {
      return errorArgumentos('SETEX');
    }

    const [clave, segStr, valor] = args;
    const segundos = parseInt(segStr, 10);

    if (isNaN(segundos) || segundos <= 0) {
      return error('comandos.expiracionPositiva');
    }

    store.set(db, clave, new KeyEntry(valor, TipoDato.STRING, Date.now() + segundos * 1000));
    return { ok: 'OK' };
  }
}

module.exports = { SetexCommand };
