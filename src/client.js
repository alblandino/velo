const readline = require('readline');
const { Config } = require('./config/Config.js');
const { TcpClient } = require('./infrastructure/client/TcpClient.js');
const { imprimirBanner } = require('./banner.js');
const { t } = require('./i18n');

const conColor = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;
const ansi = (codigo) => (conColor ? codigo : '');

const RESET   = ansi('\x1b[0m');
const ROJO    = ansi('\x1b[31m');
const VERDE   = ansi('\x1b[32m');
const AMARILLO= ansi('\x1b[33m');
const CYAN    = ansi('\x1b[36m');
const GRIS    = ansi('\x1b[90m');

function esError(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor) && 'err' in valor;
}

function formatearRespuesta(valor, nivel = 0) {
  const indent = '   '.repeat(nivel);

  if (valor === null) {
    return `${GRIS}${t('cliente.formato.nulo')}${RESET}`;
  }

  if (esError(valor)) {
    return `${ROJO}${t('cliente.formato.error', { mensaje: valor.err })}${RESET}`;
  }

  if (typeof valor === 'object' && !Array.isArray(valor) && 'ok' in valor) {
    return `${VERDE}${valor.ok}${RESET}`;
  }

  if (typeof valor === 'number') {
    return `${AMARILLO}${t('cliente.formato.entero', { valor })}${RESET}`;
  }

  if (typeof valor === 'string') {
    return `${CYAN}"${valor}"${RESET}`;
  }

  if (Array.isArray(valor)) {
    if (valor.length === 0) {
      return `${GRIS}${t('cliente.formato.arrayVacio')}${RESET}`;
    }

    return valor.map((elemento, i) => {
      const num = `${indent}${GRIS}${i + 1})${RESET} `;
      return num + formatearRespuesta(elemento, nivel + 1);
    }).join('\n');
  }

  return String(valor);
}

function tokenizar(linea) {
  const tokens = [];
  let token = '';
  let dentroComillas = false;
  let tipoComilla = '';

  for (const char of linea.trim()) {
    if ((char === '"' || char === "'") && !dentroComillas) {
      dentroComillas = true;
      tipoComilla = char;
    } else if (char === tipoComilla && dentroComillas) {
      dentroComillas = false;
      tipoComilla = '';
    } else if (char === ' ' && !dentroComillas) {
      if (token) { tokens.push(token); token = ''; }
    } else {
      token += char;
    }
  }

  if (token) tokens.push(token);
  return tokens;
}

function imprimirErrorConexion(host, puerto, err) {
  console.error(`${ROJO}[velo:cliente] ${t('cliente.errorConexion', { host, puerto, error: err.message })}${RESET}`);
  console.error(`[velo:cliente] ${t('cliente.sugerenciaServidor')}`);
}

async function seleccionarBase(cliente, db) {
  if (!(db > 0)) return null;
  return cliente.enviar(['SELECT', String(db)]);
}

async function iniciarRepl(opciones) {
  const { host, puerto } = opciones;

  let dbActiva = 0;

  imprimirBanner(t('banner.cliente'));

  const cliente = new TcpClient(host, puerto);
  try {
    await cliente.conectar();
  } catch (err) {
    imprimirErrorConexion(host, puerto, err);
    process.exit(1);
  }

  console.log(`\n[velo:cliente] ${t('cliente.conectado', { host, puerto })}`);
  console.log(`[velo:cliente] ${t('cliente.instrucciones')}\n`);

  const seleccion = await seleccionarBase(cliente, opciones.db);
  if (esError(seleccion)) {
    console.error(formatearRespuesta(seleccion));
    cliente.cerrar();
    process.exit(1);
  }
  if (seleccion) dbActiva = opciones.db;

  const construirPrompt = () => `${CYAN}velo${RESET} ${host}:${puerto}[${dbActiva}]> `;

  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
    prompt: construirPrompt(),
    terminal: true,
    historySize: 200,
  });

  cliente.on('cerrado', (err) => {
    if (err) {
      console.error(`\n${ROJO}[velo:cliente] ${t('cliente.errorSocket', { error: err.message })}${RESET}`);
    }
    console.log(`\n${AMARILLO}[velo:cliente] ${t('cliente.cerradaPorServidor')}${RESET}`);
    rl.close();
    process.exit(0);
  });

  rl.prompt();

  rl.on('line', async (linea) => {
    const lineaTrimmed = linea.trim();

    if (!lineaTrimmed) {
      rl.prompt();
      return;
    }

    if (lineaTrimmed.toLowerCase() === 'exit' || lineaTrimmed.toLowerCase() === 'quit') {
      console.log(`[velo:cliente] ${t('cliente.desconectando')}`);
      cliente.cerrar();
      rl.close();
      process.exit(0);
    }

    if (lineaTrimmed.toLowerCase() === 'clear') {
      process.stdout.write('\x1b[2J\x1b[0f');
      rl.setPrompt(construirPrompt());
      rl.prompt();
      return;
    }

    const tokens = tokenizar(lineaTrimmed);
    if (tokens.length === 0) {
      rl.prompt();
      return;
    }

    const nombreCmd = tokens[0].toUpperCase();

    let respuesta;
    try {
      respuesta = await cliente.enviar(tokens);
    } catch (err) {
      return;
    }

    if (nombreCmd === 'SELECT' && respuesta !== null && typeof respuesta === 'object' && respuesta.ok === 'OK') {
      const nuevoDb = parseInt(tokens[1], 10);
      if (!isNaN(nuevoDb)) {
        dbActiva = nuevoDb;
      }
    }

    console.log(formatearRespuesta(respuesta));
    rl.setPrompt(construirPrompt());
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\n[velo:cliente] ${t('cliente.sesionTerminada')}`);
    cliente.cerrar();
    process.exit(0);
  });
}

async function ejecutarComando(opciones, tokens) {
  const { host, puerto } = opciones;
  const cliente = new TcpClient(host, puerto);

  try {
    await cliente.conectar();
  } catch (err) {
    imprimirErrorConexion(host, puerto, err);
    process.exitCode = 1;
    return;
  }

  try {
    const seleccion = await seleccionarBase(cliente, opciones.db);
    const respuesta = esError(seleccion) ? seleccion : await cliente.enviar(tokens);

    if (esError(respuesta)) {
      console.error(formatearRespuesta(respuesta));
      process.exitCode = 1;
    } else {
      console.log(formatearRespuesta(respuesta));
    }
  } catch (err) {
    console.error(`${ROJO}[velo:cliente] ${err.message}${RESET}`);
    process.exitCode = 1;
  } finally {
    cliente.cerrar();
  }
}

if (require.main === module) {
  iniciarRepl({
    host:   process.argv[2] || Config.HOST,
    puerto: parseInt(process.argv[3] || Config.PORT, 10),
  }).catch((err) => {
    console.error(`${ROJO}[velo:cliente] ${t('errorFatal', { error: err.message })}${RESET}`);
    process.exit(1);
  });
}

module.exports = { iniciarRepl, ejecutarComando };
