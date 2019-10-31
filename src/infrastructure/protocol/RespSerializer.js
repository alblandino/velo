const CRLF = '\r\n';

class RespSerializer {
  static simpleString(valor) {
    return `+${valor}${CRLF}`;
  }

  static error(mensaje) {
    const tienePrefijo = /^[A-Z]+\s/.test(mensaje);
    const texto = tienePrefijo ? mensaje : `ERR ${mensaje}`;
    return `-${texto}${CRLF}`;
  }

  static integer(valor) {
    return `:${valor}${CRLF}`;
  }

  static bulkString(valor) {
    if (valor === null || valor === undefined) {
      return RespSerializer.nullBulk();
    }

    const contenido = valor instanceof Buffer ? valor.toString('utf-8') : String(valor);
    return `$${Buffer.byteLength(contenido, 'utf-8')}${CRLF}${contenido}${CRLF}`;
  }

  static nullBulk() {
    return `$-1${CRLF}`;
  }

  static array(elementos) {
    if (elementos === null || elementos === undefined) {
      return `*-1${CRLF}`;
    }

    const partes = [`*${elementos.length}${CRLF}`];

    for (const elemento of elementos) {
      partes.push(RespSerializer.serializar(elemento));
    }

    return partes.join('');
  }

  static serializar(valor) {
    if (valor === null || valor === undefined) {
      return RespSerializer.nullBulk();
    }

    if (typeof valor === 'object' && 'ok' in valor) {
      return RespSerializer.simpleString(valor.ok);
    }

    if (typeof valor === 'object' && 'err' in valor) {
      return RespSerializer.error(valor.err);
    }

    if (typeof valor === 'number') {
      return RespSerializer.integer(valor);
    }

    if (typeof valor === 'string') {
      return RespSerializer.bulkString(valor);
    }

    if (Array.isArray(valor)) {
      return RespSerializer.array(valor);
    }

    return RespSerializer.bulkString(String(valor));
  }
}

module.exports = { RespSerializer };
