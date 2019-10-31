const net = require('net');
const { ClientConnection } = require('./ClientConnection.js');
const { t } = require('../../i18n');

class TcpServer {
  constructor(store, registry, config) {
    this._store = store;
    this._registry = registry;
    this._config = config;

    this._conexionesActivas = new Set();

    this._servidor = net.createServer((socket) => this._manejarConexion(socket));

    this._configurarEventosServidor();
  }

  _configurarEventosServidor() {
    this._servidor.on('error', (err) => {
      console.error(`[velo:servidor] ${t('servidor.errorTcp', { error: err.message })}`);

      if (err.code === 'EADDRINUSE') {
        console.error(`[velo:servidor] ${t('servidor.puertoEnUso', { puerto: this._config.PORT })}`);
        process.exit(1);
      }
    });

    this._servidor.on('close', () => {
      console.log(`[velo:servidor] ${t('servidor.detenido')}`);
    });
  }

  _manejarConexion(socket) {
    const direccion = `${socket.remoteAddress}:${socket.remotePort}`;

    if (this._conexionesActivas.size >= this._config.MAX_CONNECTIONS) {
      console.warn(`[velo:servidor] ${t('servidor.limiteAlcanzado', { maximo: this._config.MAX_CONNECTIONS, direccion })}`);
      socket.destroy();
      return;
    }

    socket.setKeepAlive(true, 60000);

    this._conexionesActivas.add(socket);

    if (this._config.LOG_LEVEL !== 'error') {
      console.log(`[velo:servidor] ${t('servidor.clienteConectado', { direccion, activas: this._conexionesActivas.size })}`);
    }

    new ClientConnection(socket, this._store, this._registry, this._config);

    socket.on('close', () => {
      this._conexionesActivas.delete(socket);
    });

    socket.on('error', () => {
      this._conexionesActivas.delete(socket);
    });
  }

  iniciar() {
    return new Promise((resolve, reject) => {
      this._servidor.listen(this._config.PORT, this._config.HOST, () => {
        const { HOST, PORT, DB_COUNT, MAX_CONNECTIONS, LOG_LEVEL } = this._config;
        console.log(`[velo:servidor] ${t('servidor.iniciado', { host: HOST, puerto: PORT })}`);
        console.log(`[velo:servidor] ${t('servidor.basesDisponibles', { total: DB_COUNT, ultima: DB_COUNT - 1 })}`);
        console.log(`[velo:servidor] ${t('servidor.limiteConexiones', { maximo: MAX_CONNECTIONS })}`);
        console.log(`[velo:servidor] ${t('servidor.nivelLog', { nivel: LOG_LEVEL })}`);
        resolve();
      });

      this._servidor.once('error', reject);
    });
  }

  detener() {
    return new Promise((resolve) => {
      console.log(`[velo:servidor] ${t('servidor.cerrando', { activas: this._conexionesActivas.size })}`);

      for (const socket of this._conexionesActivas) {
        socket.destroy();
      }
      this._conexionesActivas.clear();

      this._store.detenerSweep();

      this._servidor.close(() => {
        console.log(`[velo:servidor] ${t('servidor.cierreCompletado')}`);
        resolve();
      });
    });
  }
}

module.exports = { TcpServer };
