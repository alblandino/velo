const { TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { errorArgumentos, errorTipo } = require('../../../errores.js');

class StrlenCommand {
  static get nombre() { return 'STRLEN'; }

  execute(store, args, db) {
    if (args.length !== 1) {
      return errorArgumentos('STRLEN');
    }

    const entrada = store.get(db, args[0]);
    if (!entrada) return 0;

    if (entrada.type !== TipoDato.STRING) {
      return errorTipo();
    }

    return Buffer.byteLength(entrada.value, 'utf-8');
  }
}

module.exports = { StrlenCommand };
