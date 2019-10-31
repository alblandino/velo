const { error, errorArgumentos } = require('../../../errores.js');

class RenameCommand {
  static get nombre() { return 'RENAME'; }

  execute(store, args, db) {
    if (args.length !== 2) {
      return errorArgumentos('RENAME');
    }

    const [claveOrigen, claveDestino] = args;
    const entrada = store.get(db, claveOrigen);

    if (!entrada) {
      return error('comandos.claveNoExiste');
    }

    store.set(db, claveDestino, entrada);

    store.del(db, claveOrigen);

    return { ok: 'OK' };
  }
}

module.exports = { RenameCommand };
