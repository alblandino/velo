const { EventEmitter } = require('events');

class RespParser extends EventEmitter {
  constructor() {
    super();

    this._buffer = Buffer.alloc(0);
  }

  feed(chunk) {
    this._buffer = Buffer.concat([this._buffer, chunk]);
    this._procesarBuffer();
  }

  _procesarBuffer() {
    while (this._buffer.length > 0) {
      const resultado = this._parsear(0);

      if (resultado === null) {
        break;
      }

      const { valor, avance } = resultado;

      this._buffer = this._buffer.slice(avance);

      this.emit('comando', valor);
    }
  }

  _parsear(offset) {
    if (offset >= this._buffer.length) return null;

    const tipo = String.fromCharCode(this._buffer[offset]);

    switch (tipo) {
      case '+': return this._parsearLineaSimple(offset + 1, 'ok');
      case '-': return this._parsearLineaSimple(offset + 1, 'err');
      case ':': return this._parsearEntero(offset + 1);
      case '$': return this._parsearBulkString(offset + 1);
      case '*': return this._parsearArray(offset + 1);
      default:
        return this._parsearInline(offset);
    }
  }

  _parsearLinea(offset) {
    const idx = this._buffer.indexOf('\r\n', offset);
    if (idx === -1) return null;

    const linea = this._buffer.toString('utf-8', offset, idx);
    return { valor: linea, avance: idx + 2 };
  }

  _parsearLineaSimple(offset, propiedad) {
    const resultado = this._parsearLinea(offset);
    if (!resultado) return null;
    return { valor: { [propiedad]: resultado.valor }, avance: resultado.avance };
  }

  _parsearEntero(offset) {
    const resultado = this._parsearLinea(offset);
    if (!resultado) return null;
    return { valor: parseInt(resultado.valor, 10), avance: resultado.avance };
  }

  _parsearBulkString(offset) {
    const longitudRes = this._parsearLinea(offset);
    if (!longitudRes) return null;

    const longitud = parseInt(longitudRes.valor, 10);

    if (longitud === -1) {
      return { valor: null, avance: longitudRes.avance };
    }

    const inicio = longitudRes.avance;
    const fin = inicio + longitud;

    if (this._buffer.length < fin + 2) return null;

    const contenido = this._buffer.toString('utf-8', inicio, fin);
    return { valor: contenido, avance: fin + 2 };
  }

  _parsearArray(offset) {
    const conteoRes = this._parsearLinea(offset);
    if (!conteoRes) return null;

    const conteo = parseInt(conteoRes.valor, 10);

    if (conteo === -1) {
      return { valor: null, avance: conteoRes.avance };
    }

    const elementos = [];
    let posActual = conteoRes.avance;

    for (let i = 0; i < conteo; i++) {
      const elemento = this._parsear(posActual);
      if (!elemento) return null;

      elementos.push(elemento.valor);
      posActual = elemento.avance;
    }

    return { valor: elementos, avance: posActual };
  }

  _parsearInline(offset) {
    const idx = this._buffer.indexOf('\r\n', offset);
    if (idx === -1) return null;

    const linea = this._buffer.toString('utf-8', offset, idx).trim();
    if (!linea) return null;

    const tokens = [];
    let token = '';
    let dentroComillas = false;
    let tipoComilla = '';

    for (const char of linea) {
      if ((char === '"' || char === "'") && !dentroComillas) {
        dentroComillas = true;
        tipoComilla = char;
      } else if (char === tipoComilla && dentroComillas) {
        dentroComillas = false;
        tipoComilla = '';
      } else if (char === ' ' && !dentroComillas) {
        if (token) {
          tokens.push(token);
          token = '';
        }
      } else {
        token += char;
      }
    }

    if (token) tokens.push(token);

    return { valor: tokens, avance: idx + 2 };
  }

  reset() {
    this._buffer = Buffer.alloc(0);
  }
}

module.exports = { RespParser };
