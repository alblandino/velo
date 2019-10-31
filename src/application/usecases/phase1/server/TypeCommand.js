const { errorArgumentos } = require('../../../errores.js');

class TypeCommand {
  static get nombre() { return 'TYPE'; }

  execute(store, args, db) {
    if (args.length !== 1) {
      return errorArgumentos('TYPE');
    }

    const entrada = store.get(db, args[0]);
    if (!entrada) return { ok: 'none' };

    return { ok: entrada.type };
  }
}

module.exports = { TypeCommand };
