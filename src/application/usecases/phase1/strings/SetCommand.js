const { KeyEntry, TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { error, errorArgumentos } = require('../../../errores.js');

class SetCommand {
  static get nombre() { return 'SET'; }

  execute(store, args, db) {
    if (args.length < 2) {
      return errorArgumentos('SET');
    }

    const [clave, valor] = args;
    let expiresAt = null;
    let soloSiNoExiste = false;
    let soloSiExiste = false;

    let i = 2;
    while (i < args.length) {
      const opcion = args[i].toUpperCase();

      if (opcion === 'EX') {
        const segundos = parseInt(args[++i], 10);
        if (isNaN(segundos) || segundos <= 0) {
          return error('comandos.opcionEnteroPositivo', { opcion: 'EX' });
        }
        expiresAt = Date.now() + segundos * 1000;
      } else if (opcion === 'PX') {
        const ms = parseInt(args[++i], 10);
        if (isNaN(ms) || ms <= 0) {
          return error('comandos.opcionEnteroPositivo', { opcion: 'PX' });
        }
        expiresAt = Date.now() + ms;
      } else if (opcion === 'NX') {
        soloSiNoExiste = true;
      } else if (opcion === 'XX') {
        soloSiExiste = true;
      } else {
        return error('comandos.opcionDesconocida', { opcion: args[i] });
      }
      i++;
    }

    if (soloSiNoExiste && soloSiExiste) {
      return error('comandos.opcionesExclusivas', { a: 'NX', b: 'XX' });
    }

    const existe = store.exists(db, clave);

    if (soloSiNoExiste && existe) return null;
    if (soloSiExiste && !existe) return null;

    store.set(db, clave, new KeyEntry(valor, TipoDato.STRING, expiresAt));
    return { ok: 'OK' };
  }
}

module.exports = { SetCommand };
