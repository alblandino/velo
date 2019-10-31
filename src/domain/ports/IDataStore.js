class IDataStore {
  get(db, key) { throw new Error('Metodo no implementado: get'); }

  set(db, key, entry) { throw new Error('Metodo no implementado: set'); }

  del(db, ...keys) { throw new Error('Metodo no implementado: del'); }

  exists(db, key) { throw new Error('Metodo no implementado: exists'); }

  keys(db, pattern) { throw new Error('Metodo no implementado: keys'); }

  dbsize(db) { throw new Error('Metodo no implementado: dbsize'); }

  flushDb(db) { throw new Error('Metodo no implementado: flushDb'); }

  flushAll() { throw new Error('Metodo no implementado: flushAll'); }

  iniciarSweep() { throw new Error('Metodo no implementado: iniciarSweep'); }

  detenerSweep() { throw new Error('Metodo no implementado: detenerSweep'); }
}

module.exports = { IDataStore };
