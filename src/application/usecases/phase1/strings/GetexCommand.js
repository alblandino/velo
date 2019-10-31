const { TipoDato } = require('../../../../domain/entities/KeyEntry.js');
const { error, errorArgumentos, errorTipo } = require('../../../errores.js');

class GetexCommand {
  static get nombre() { return 'GETEX'; }

  execute(store, args, db) {
    if (args.length === 0) {
      return errorArgumentos('GETEX');
    }

    const clave = args[0];
    const entrada = store.get(db, clave);

    if (!entrada) return null;

    if (entrada.type !== TipoDato.STRING) {
      return errorTipo();
    }

    if (args.length === 1) {
      return entrada.value;
    }

    const opcion = args[1].toUpperCase();

    switch (opcion) {
      case 'EX': {
        const segundos = parseInt(args[2], 10);
        if (isNaN(segundos) || segundos <= 0) {
          return error('comandos.opcionEnteroPositivo', { opcion: 'EX' });
        }
        entrada.expiresAt = Date.now() + segundos * 1000;
        break;
      }
      case 'PX': {
        const ms = parseInt(args[2], 10);
        if (isNaN(ms) || ms <= 0) {
          return error('comandos.opcionEnteroPositivo', { opcion: 'PX' });
        }
        entrada.expiresAt = Date.now() + ms;
        break;
      }
      case 'EXAT': {
        const ts = parseInt(args[2], 10);
        if (isNaN(ts) || ts <= 0) {
          return error('comandos.opcionTimestamp', { opcion: 'EXAT' });
        }
        entrada.expiresAt = ts * 1000;
        break;
      }
      case 'PXAT': {
        const tsMs = parseInt(args[2], 10);
        if (isNaN(tsMs) || tsMs <= 0) {
          return error('comandos.opcionTimestampMs', { opcion: 'PXAT' });
        }
        entrada.expiresAt = tsMs;
        break;
      }
      case 'PERSIST': {
        entrada.expiresAt = null;
        break;
      }
      default:
        return error('comandos.opcionDesconocidaPara', { comando: 'GETEX', opcion: args[1] });
    }

    return entrada.value;
  }
}

module.exports = { GetexCommand };
