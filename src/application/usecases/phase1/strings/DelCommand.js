const { errorArgumentos } = require('../../../errores.js');

class DelCommand {
  static get nombre() { return 'DEL'; }

  execute(store, args, db) {
    if (args.length === 0) {
      return errorArgumentos('DEL');
    }
    return store.del(db, ...args);
  }
}

module.exports = { DelCommand };
