const { KeyEntry, TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { errorArgumentos } = require('../../../errores.js');

class SetnxCommand {
  static get nombre() { return 'SETNX'; }

  execute(store, args, db) {
    if (args.length !== 2) {
      return errorArgumentos('SETNX');
    }

    const [clave, valor] = args;

    if (store.exists(db, clave)) return 0;

    store.set(db, clave, new KeyEntry(valor, TipoDato.STRING, null));
    return 1;
  }
}

module.exports = { SetnxCommand };
