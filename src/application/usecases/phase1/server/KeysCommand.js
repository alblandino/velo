const { errorArgumentos } = require('../../../errores.js');

class KeysCommand {
  static get nombre() { return 'KEYS'; }

  execute(store, args, db) {
    if (args.length !== 1) {
      return errorArgumentos('KEYS');
    }
    return store.keys(db, args[0]);
  }
}

module.exports = { KeysCommand };
