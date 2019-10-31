const { TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { errorArgumentos, errorTipo } = require('../../../errores.js');

class GetCommand {
  static get nombre() { return 'GET'; }

  execute(store, args, db) {
    if (args.length !== 1) {
      return errorArgumentos('GET');
    }

    const entrada = store.get(db, args[0]);
    if (!entrada) return null;

    if (entrada.type !== TipoDato.STRING) {
      return errorTipo();
    }

    return entrada.value;
  }
}

module.exports = { GetCommand };
