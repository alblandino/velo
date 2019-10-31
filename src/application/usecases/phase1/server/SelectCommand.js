const { error, errorArgumentos } = require('../../../errores.js');

class SelectCommand {
  static get nombre() { return 'SELECT'; }

  constructor(config) {
    this._config = config;
  }

  execute(_store, args) {
    if (args.length !== 1) {
      return errorArgumentos('SELECT');
    }

    const indice = parseInt(args[0], 10);

    if (isNaN(indice) || indice < 0 || indice >= this._config.DB_COUNT) {
      return error('comandos.baseFueraDeRango', { ultima: this._config.DB_COUNT - 1 });
    }

    return { nuevoDb: indice };
  }
}

module.exports = { SelectCommand };
