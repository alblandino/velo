const { KeyEntry, TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { error } = require('../../../errores.js');

class MsetCommand {
  static get nombre() { return 'MSET'; }

  execute(store, args, db) {
    if (args.length === 0 || args.length % 2 !== 0) {
      return error('comandos.argumentosEnPares', { comando: 'MSET' });
    }

    for (let i = 0; i < args.length; i += 2) {
      store.set(db, args[i], new KeyEntry(args[i + 1], TipoDato.STRING, null));
    }

    return { ok: 'OK' };
  }
}

module.exports = { MsetCommand };
