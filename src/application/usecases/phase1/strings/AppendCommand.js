const { KeyEntry, TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { errorArgumentos, errorTipo } = require('../../../errores.js');

class AppendCommand {
  static get nombre() { return 'APPEND'; }

  execute(store, args, db) {
    if (args.length !== 2) {
      return errorArgumentos('APPEND');
    }

    const [clave, sufijo] = args;
    const entrada = store.get(db, clave);

    if (entrada && entrada.type !== TipoDato.STRING) {
      return errorTipo();
    }

    const valorActual = entrada ? entrada.value : '';
    const nuevoValor = valorActual + sufijo;
    const expiresAt = entrada ? entrada.expiresAt : null;

    store.set(db, clave, new KeyEntry(nuevoValor, TipoDato.STRING, expiresAt));
    return Buffer.byteLength(nuevoValor, 'utf-8');
  }
}

module.exports = { AppendCommand };
