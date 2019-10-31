const { crearConfig } = require('./config/Config.js');
const { InMemoryStore } = require('./infrastructure/storage/InMemoryStore.js');
const { CommandRegistry } = require('./application/CommandRegistry.js');
const { TcpServer } = require('./infrastructure/server/TcpServer.js');
const { imprimirBanner } = require('./banner.js');
const { t } = require('./i18n');

async function iniciarServidor(sobreescrituras = {}) {
  const config = crearConfig(sobreescrituras);

  imprimirBanner(t('banner.servidor'));

  const store    = new InMemoryStore(config);
  const registry = new CommandRegistry(config);
  const servidor = new TcpServer(store, registry, config);

  store.iniciarSweep();

  try {
    await servidor.iniciar();
  } catch (err) {
    console.error(`[velo:servidor] ${t('servidor.errorInicio', { error: err.message })}`);
    process.exit(1);
  }

  registrarCierre(servidor);
  return servidor;
}

function registrarCierre(servidor) {
  let cerrando = false;

  async function detenerServidor(senal) {
    if (cerrando) return;
    cerrando = true;

    console.log(`\n[velo:servidor] ${t('servidor.senalRecibida', { senal })}`);
    try {
      await servidor.detener();
    } catch (err) {
      console.error(`[velo:servidor] ${t('servidor.errorCierre', { error: err.message })}`);
    }
    process.exit(0);
  }

  process.on('SIGTERM', () => detenerServidor('SIGTERM'));
  process.on('SIGINT',  () => detenerServidor('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error(`[velo:servidor] ${t('servidor.excepcionNoCapturada', { error: err.message })}`);
    console.error(err.stack);
  });

  process.on('unhandledRejection', (razon) => {
    console.error(`[velo:servidor] ${t('servidor.promesaRechazada', { razon })}`);
  });
}

if (require.main === module) {
  iniciarServidor();
}

module.exports = { iniciarServidor };
