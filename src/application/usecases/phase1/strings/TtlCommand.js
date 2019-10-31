const { errorArgumentos } = require('../../../errores.js');

class TtlCommand {
  static get nombre() { return 'TTL'; }

  execute(store, args, db) {
    if (args.length !== 1) {
      return errorArgumentos('TTL');
    }

    const entrada = store.get(db, args[0]);
    if (!entrada) return -2;

    return entrada.getTtlSegundos();
  }
}

module.exports = { TtlCommand };
