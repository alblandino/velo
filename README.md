# @alblandino/velo

**Velo** es un almacen de datos en memoria accesible a traves de la red, construido desde cero en Node.js puro sin dependencias externas. Implementa el protocolo RESP (serialization protocol) sobre TCP y sigue los principios de Clean Architecture.

**Autor:** Joel Jaime `<joel@alblandino.com>`  
**Paquete:** `@alblandino/velo`  
**Licencia:** MIT  
**Plataforma:** Node.js >= 13

## Uso rapido

El ejecutable `velo` es a la vez servidor y cliente:

```bash
npm link                     # instala el comando velo (opcional)

velo server --port 6380      # inicia el servidor
velo                         # abre el cliente REPL interactivo
velo set saludo hola         # ejecuta un solo comando y termina
velo --help                  # muestra todas las opciones
```

Sin instalarlo, usa `node bin/velo.js` en lugar de `velo`. Los mensajes estan centralizados en `src/i18n/` (`LOCALE=es` o `LOCALE=en`).

> **Documentacion completa ->** [https://alblandino.github.io/velo](https://low-level-js.github.io/velo)  
> Guia de instalacion, referencia de comandos, arquitectura interna y roadmap.
