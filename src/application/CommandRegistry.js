const { error } = require('./errores.js');

const { SetCommand }    = require('./usecases/phase1/strings/SetCommand.js');
const { GetCommand }    = require('./usecases/phase1/strings/GetCommand.js');
const { DelCommand }    = require('./usecases/phase1/strings/DelCommand.js');
const { ExistsCommand } = require('./usecases/phase1/strings/ExistsCommand.js');
const { ExpireCommand } = require('./usecases/phase1/strings/ExpireCommand.js');
const { TtlCommand }    = require('./usecases/phase1/strings/TtlCommand.js');
const { IncrCommand }   = require('./usecases/phase1/strings/IncrCommand.js');
const { DecrCommand }   = require('./usecases/phase1/strings/DecrCommand.js');
const { MgetCommand }   = require('./usecases/phase1/strings/MgetCommand.js');
const { MsetCommand }   = require('./usecases/phase1/strings/MsetCommand.js');
const { AppendCommand } = require('./usecases/phase1/strings/AppendCommand.js');
const { StrlenCommand } = require('./usecases/phase1/strings/StrlenCommand.js');
const { SetnxCommand }  = require('./usecases/phase1/strings/SetnxCommand.js');
const { SetexCommand }  = require('./usecases/phase1/strings/SetexCommand.js');
const { GetexCommand }  = require('./usecases/phase1/strings/GetexCommand.js');

const { PingCommand }    = require('./usecases/phase1/server/PingCommand.js');
const { EchoCommand }    = require('./usecases/phase1/server/EchoCommand.js');
const { DbsizeCommand }  = require('./usecases/phase1/server/DbsizeCommand.js');
const { FlushallCommand }= require('./usecases/phase1/server/FlushallCommand.js');
const { KeysCommand }    = require('./usecases/phase1/server/KeysCommand.js');
const { TypeCommand }    = require('./usecases/phase1/server/TypeCommand.js');
const { RenameCommand }  = require('./usecases/phase1/server/RenameCommand.js');
const { SelectCommand }  = require('./usecases/phase1/server/SelectCommand.js');

class CommandRegistry {
  constructor(config) {
    this._config = config;

    this._comandos = new Map();

    this._registrarFase1();
  }

  _registrarFase1() {
    const handlers = [
      new SetCommand(),
      new GetCommand(),
      new DelCommand(),
      new ExistsCommand(),
      new ExpireCommand(),
      new TtlCommand(),
      new IncrCommand(),
      new DecrCommand(),
      new MgetCommand(),
      new MsetCommand(),
      new AppendCommand(),
      new StrlenCommand(),
      new SetnxCommand(),
      new SetexCommand(),
      new GetexCommand(),
      new PingCommand(),
      new EchoCommand(),
      new DbsizeCommand(),
      new FlushallCommand(),
      new KeysCommand(),
      new TypeCommand(),
      new RenameCommand(),
      new SelectCommand(this._config),
    ];

    for (const handler of handlers) {
      const nombre = handler.constructor.nombre;
      this._comandos.set(nombre, handler);
    }
  }

  execute(nombre, args, store, db) {
    const handler = this._comandos.get(nombre);

    if (!handler) {
      return error('comandos.desconocido', { comando: nombre.toLowerCase() });
    }

    return handler.execute(store, args, db);
  }

  listarComandos() {
    return Array.from(this._comandos.keys()).sort();
  }
}

module.exports = { CommandRegistry };
