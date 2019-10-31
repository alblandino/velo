const { TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { errorArgumentos } = require('../../../errores.js');

class MgetCommand {
  static get nombre() { return 'MGET'; }

  execute(store, args, db) {
    if (args.length === 0) {
      return errorArgumentos('MGET');
    }

    return args.map((clave) => {
      const entrada = store.get(db, clave);
      if (!entrada || entrada.type !== TipoDato.STRING) return null;
      return entrada.value;
    });
  }
}

module.exports = { MgetCommand };
