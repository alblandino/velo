class ICommandHandler {
  static get nombre() { throw new Error('Propiedad estatica no implementada: nombre'); }

  execute(_store, _args, _db) { throw new Error('Metodo no implementado: execute'); }
}

module.exports = { ICommandHandler };
