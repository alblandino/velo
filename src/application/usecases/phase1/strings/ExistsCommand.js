const { errorArgumentos } = require('../../../errores.js');

class ExistsCommand {
  static get nombre() { return 'EXISTS'; }

  execute(store, args, db) {
    if (args.length === 0) {
      return errorArgumentos('EXISTS');
    }

    let conteo = 0;
    for (const clave of args) {
      if (store.exists(db, clave)) conteo++;
    }
    return conteo;
  }
}

module.exports = { ExistsCommand };
