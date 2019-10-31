const { RespParser } = require('../protocol/RespParser.js');
const { RespSerializer } = require('../protocol/RespSerializer.js');
const { t } = require('../../i18n');

class ClientConnection {
  constructor(socket, store, registry, config) {
    this._socket = socket;
    this._store = store;
    this._registry = registry;
    this._config = config;

    this._db = 0;

    this._parser = new RespParser();

    this._configurarEventos();
  }

  _configurarEventos() {
    this._socket.on('data', (chunk) => {
      try {
        this._parser.feed(chunk);
      } catch (err) {
        console.error(`[velo:conexion] ${t('conexion.errorParseo', { error: err.message })}`);
        this._enviarError(`ERR ${t('conexion.errorInterno')}`);
      }
    });

    this._parser.on('comando', async (tokens) => {
      await this._manejarComando(tokens);
    });

    this._socket.on('close', () => {
      if (this._config.LOG_LEVEL === 'debug') {
        const dir = `${this._socket.remoteAddress}:${this._socket.remotePort}`;
        console.log(`[velo:conexion] ${t('conexion.desconectado', { direccion: dir })}`);
      }
      this._parser.reset();
    });

    this._socket.on('error', (err) => {
      if (err.code !== 'ECONNRESET') {
        console.error(`[velo:conexion] ${t('conexion.errorSocket', { error: err.message })}`);
      }
    });
  }

  async _manejarComando(tokens) {
    if (!tokens || tokens.length === 0) {
      this._enviarError(`ERR ${t('conexion.comandoVacio')}`);
      return;
    }

    const nombre = String(tokens[0]).toUpperCase();
    const args = tokens.slice(1);

    if (this._config.LOG_LEVEL === 'debug') {
      const dir = `${this._socket.remoteAddress}:${this._socket.remotePort}`;
      console.log(`[velo:cmd] ${dir} db=${this._db} >>> ${nombre} ${args.join(' ')}`);
    }

    try {
      const resultado = await this._registry.execute(nombre, args, this._store, this._db);

      if (nombre === 'SELECT' && typeof resultado === 'object' && resultado !== null && 'nuevoDb' in resultado) {
        this._db = resultado.nuevoDb;
        this._enviar(RespSerializer.simpleString('OK'));
        return;
      }

      this._enviar(RespSerializer.serializar(resultado));
    } catch (err) {
      console.error(`[velo:cmd] ${t('conexion.errorEjecucion', { comando: nombre, error: err.message })}`);
      this._enviarError(`ERR ${err.message}`);
    }
  }

  _enviar(datos) {
    if (!this._socket.destroyed) {
      this._socket.write(datos);
    }
  }

  _enviarError(mensaje) {
    this._enviar(RespSerializer.error(mensaje));
  }
}

module.exports = { ClientConnection };
