const { readFileSync } = require('fs');
const { resolve } = require('path');

function parseEnvFile(filePath) {
  let contenido;

  try {
    contenido = readFileSync(filePath, 'utf-8');
  } catch (err) {
    return {};
  }

  const resultado = {};

  for (const linea of contenido.split('\n')) {
    const lineaTrimmed = linea.trim();

    if (!lineaTrimmed || lineaTrimmed.startsWith('#')) continue;

    const indiceIgual = lineaTrimmed.indexOf('=');
    if (indiceIgual === -1) continue;

    const clave = lineaTrimmed.slice(0, indiceIgual).trim();
    const valor = lineaTrimmed.slice(indiceIgual + 1).trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      resultado[clave] = valor.slice(1, -1);
    } else {
      resultado[clave] = valor;
    }
  }

  return resultado;
}

const rutaEnv = resolve(__dirname, '../../.env');
const variablesEnv = parseEnvFile(rutaEnv);

function obtener(clave, valorDefecto, sobreescrituras) {
  if (sobreescrituras[clave] !== undefined) return String(sobreescrituras[clave]);
  if (process.env[clave] !== undefined) return process.env[clave];
  if (variablesEnv[clave] !== undefined) return variablesEnv[clave];
  return valorDefecto;
}

function crearConfig(sobreescrituras = {}) {
  const valor = (clave, valorDefecto) => obtener(clave, valorDefecto, sobreescrituras);

  return Object.freeze({
    HOST: valor('HOST', '127.0.0.1'),
    PORT: parseInt(valor('PORT', '6380'), 10),
    MAX_CONNECTIONS: parseInt(valor('MAX_CONNECTIONS', '100'), 10),
    LOG_LEVEL: valor('LOG_LEVEL', 'info'),
    DB_COUNT: parseInt(valor('DB_COUNT', '16'), 10),
    SWEEP_INTERVAL_MS: parseInt(valor('SWEEP_INTERVAL_MS', '1000'), 10),
    LOCALE: valor('LOCALE', 'es'),
  });
}

const Config = crearConfig();

module.exports = { Config, crearConfig };
