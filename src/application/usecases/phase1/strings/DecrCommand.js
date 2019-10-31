const { KeyEntry, TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { error, errorArgumentos, errorTipo } = require('../../../errores.js');

class DecrCommand {
  static get nombre() { return 'DECR'; }

  execute(store, args, db) {
    if (args.length !== 1) {
      return errorArgumentos('DECR');
    }

    const clave = args[0];
    const entrada = store.get(db, clave);

    if (entrada && entrada.type !== TipoDato.STRING) {
      return errorTipo();
    }

    const valorActual = entrada ? entrada.value : '0';
    const numero = parseInt(valorActual, 10);

    if (isNaN(numero) || String(numero) !== valorActual) {
      return error('comandos.noEsEntero');
    }

    const nuevoValor = numero - 1;
    const expiresAt = entrada ? entrada.expiresAt : null;
    store.set(db, clave, new KeyEntry(String(nuevoValor), TipoDato.STRING, expiresAt));
    return nuevoValor;
  }
}

module.exports = { DecrCommand };
