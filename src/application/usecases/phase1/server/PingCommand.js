class PingCommand {
  static get nombre() { return 'PING'; }

  execute(_store, args) {
    if (args.length > 0) {
      return args.join(' ');
    }
    return { ok: 'PONG' };
  }
}

module.exports = { PingCommand };
