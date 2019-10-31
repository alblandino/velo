const { errorArgumentos } = require('../../../errores.js');

class DbsizeCommand {
  static get nombre() { return 'DBSIZE'; }

  execute(store, args, db) {
    if (args.length !== 0) {
      return errorArgumentos('DBSIZE');
    }
    return store.dbsize(db);
  }
}

module.exports = { DbsizeCommand };
