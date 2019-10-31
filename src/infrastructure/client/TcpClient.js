const net = require('net');
const { EventEmitter } = require('events');
const { RespParser } = require('../protocol/RespParser.js');
const { RespSerializer } = require('../protocol/RespSerializer.js');
const { t } = require('../../i18n');

class TcpClient extends EventEmitter {
  constructor(host, puerto) {
    super();
    this.host = host;
    this.puerto = puerto;

    this._socket = null;

    this._ultimoError = null;

    this._pendientes = [];

    this._parser = new RespParser();
    this._parser.on('comando', (valor) => {
      const pendiente = this._pendientes.shift();
      if (pendiente) pendiente.resolve(valor);
    });
  }

  conectar() {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: this.host, port: this.puerto });

      socket.once('error', reject);
      socket.once('connect', () => {
        socket.removeListener('error', reject);
        this._configurarEventos(socket);
        resolve();
      });

      this._socket = socket;
    });
  }

  _configurarEventos(socket) {
    socket.on('data', (chunk) => this._parser.feed(chunk));

    socket.on('error', (err) => {
      this._ultimoError = err;
    });

    socket.on('close', () => {
      const error = this._ultimoError || new Error(t('cliente.conexionCerrada'));
      for (const pendiente of this._pendientes.splice(0)) {
        pendiente.reject(error);
      }
      this._parser.reset();
      this.emit('cerrado', this._ultimoError);
    });
  }

  enviar(tokens) {
    return new Promise((resolve, reject) => {
      if (!this._socket || this._socket.destroyed) {
        reject(new Error(t('cliente.conexionCerrada')));
        return;
      }

      this._pendientes.push({ resolve, reject });
      this._socket.write(RespSerializer.array(tokens));
    });
  }

  cerrar() {
    if (this._socket) this._socket.destroy();
  }
}

module.exports = { TcpClient };
