const { Config } = require('../config/Config.js');

const IDIOMA_POR_DEFECTO = 'es';

function cargarIdioma(codigo) {
  if (!/^[a-z]{2}$/.test(codigo)) return null;

  try {
    return require(`./${codigo}.json`);
  } catch (err) {
    return null;
  }
}

function buscar(mensajes, clave) {
  return clave.split('.').reduce(
    (nodo, parte) => (nodo !== null && typeof nodo === 'object' ? nodo[parte] : undefined),
    mensajes
  );
}

const codigoActivo = String(Config.LOCALE).toLowerCase().split(/[-_.]/)[0];
const mensajesPorDefecto = cargarIdioma(IDIOMA_POR_DEFECTO);
const mensajesActivos = cargarIdioma(codigoActivo) || mensajesPorDefecto;

function t(clave, parametros = {}) {
  let texto = buscar(mensajesActivos, clave);
  if (texto === undefined) texto = buscar(mensajesPorDefecto, clave);
  if (texto === undefined) return clave;

  if (Array.isArray(texto)) texto = texto.join('\n');

  return String(texto).replace(/\{(\w+)\}/g, (marcador, nombre) =>
    (parametros[nombre] !== undefined ? String(parametros[nombre]) : marcador)
  );
}

module.exports = { t };
