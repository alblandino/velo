const { Config } = require('./config/Config.js');
const { iniciarServidor } = require('./server.js');
const { iniciarRepl, ejecutarComando } = require('./client.js');
const { t } = require('./i18n');
const pkg = require('../package.json');

const MODO_SERVIDOR = 'server';

const NIVELES_LOG = ['debug', 'info', 'warn', 'error'];

const OPCIONES = {
  '-h':                { clave: 'HOST',              tipo: 'texto' },
  '--host':            { clave: 'HOST',              tipo: 'texto' },
  '-p':                { clave: 'PORT',              tipo: 'entero' },
  '--port':            { clave: 'PORT',              tipo: 'entero' },
  '-n':                { clave: 'DB',                tipo: 'entero' },
  '--db':              { clave: 'DB',                tipo: 'entero' },
  '--max-connections': { clave: 'MAX_CONNECTIONS',   tipo: 'entero' },
  '--log-level':       { clave: 'LOG_LEVEL',         tipo: 'nivel' },
  '--db-count':        { clave: 'DB_COUNT',          tipo: 'entero' },
  '--sweep-interval':  { clave: 'SWEEP_INTERVAL_MS', tipo: 'entero' },
};

class ErrorDeUso extends Error {}

function leerValor(bandera, valor) {
  const { tipo } = OPCIONES[bandera];

  if (valor === undefined || valor === '') {
    throw new ErrorDeUso(t('cli.errores.faltaValor', { opcion: bandera }));
  }

  if (tipo === 'entero') {
    if (!/^\d+$/.test(valor)) {
      throw new ErrorDeUso(t('cli.errores.valorEntero', { opcion: bandera, valor }));
    }
    return parseInt(valor, 10);
  }

  if (tipo === 'nivel' && !NIVELES_LOG.includes(valor)) {
    throw new ErrorDeUso(t('cli.errores.valorNivel', { opcion: bandera, valor, niveles: NIVELES_LOG.join(' | ') }));
  }

  return valor;
}

function parsearArgumentos(argv) {
  const resultado = { opciones: {}, comando: [], ayuda: false, version: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const modoServidor = resultado.comando[0] === MODO_SERVIDOR;

    if (resultado.comando.length > 0 && !modoServidor) {
      resultado.comando.push(arg);
      continue;
    }

    if (arg === '--help') {
      resultado.ayuda = true;
      continue;
    }

    if (arg === '-v' || arg === '--version') {
      resultado.version = true;
      continue;
    }

    if (arg.startsWith('-')) {
      const indiceIgual = arg.indexOf('=');
      const bandera = indiceIgual === -1 ? arg : arg.slice(0, indiceIgual);

      if (!OPCIONES[bandera]) {
        throw new ErrorDeUso(t('cli.errores.opcionDesconocida', { opcion: bandera }));
      }

      const valor = indiceIgual === -1 ? argv[++i] : arg.slice(indiceIgual + 1);
      resultado.opciones[OPCIONES[bandera].clave] = leerValor(bandera, valor);
      continue;
    }

    if (modoServidor) {
      throw new ErrorDeUso(t('cli.errores.argumentoInesperado', { argumento: arg }));
    }

    resultado.comando.push(arg);
  }

  return resultado;
}

function ejecutar(argv) {
  let args;

  try {
    args = parsearArgumentos(argv);
  } catch (err) {
    if (!(err instanceof ErrorDeUso)) throw err;
    console.error(`velo: ${err.message}`);
    console.error(t('cli.errores.verAyuda'));
    process.exitCode = 2;
    return Promise.resolve();
  }

  if (args.ayuda) {
    console.log(t('cli.ayuda', { version: pkg.version, host: Config.HOST, puerto: Config.PORT }));
    return Promise.resolve();
  }

  if (args.version) {
    console.log(`${pkg.name} v${pkg.version}`);
    return Promise.resolve();
  }

  const { opciones, comando } = args;
  let tarea;

  if (comando[0] === MODO_SERVIDOR) {
    const { DB, ...configServidor } = opciones;
    tarea = iniciarServidor(configServidor);
  } else {
    const conexion = {
      host:   opciones.HOST !== undefined ? opciones.HOST : Config.HOST,
      puerto: opciones.PORT !== undefined ? opciones.PORT : Config.PORT,
      db:     opciones.DB,
    };
    tarea = comando.length === 0 ? iniciarRepl(conexion) : ejecutarComando(conexion, comando);
  }

  return tarea.catch((err) => {
    console.error(`[velo] ${t('errorFatal', { error: err.message })}`);
    process.exit(1);
  });
}

module.exports = { ejecutar, parsearArgumentos };
