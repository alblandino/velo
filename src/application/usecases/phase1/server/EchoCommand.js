const { errorArgumentos } = require('../../../errores.js');

class EchoCommand {
  static get nombre() { return 'ECHO'; }

  execute(_store, args) {
    if (args.length !== 1) {
      return errorArgumentos('ECHO');
    }
    return args[0];
  }
}

module.exports = { EchoCommand };
