# Bartimeo Córdoba

Aplicación única de Laravel 13, PHP 8.5 y PostgreSQL. Laravel sirve la interfaz React compilada y las rutas de la API en el mismo dominio. Las sesiones de coordinación se guardan en PostgreSQL en `sesiones_coordinacion`, con la huella del token, su parroquia y su caducidad. El gestor de sesiones de Laravel también usa PostgreSQL.

## Arrancar en local

1. Crea una base PostgreSQL y un usuario con permisos sobre su esquema. Instala PHP 8.5 con `pdo_pgsql`, Composer y Node.js.
2. Copia `.env.example` a `.env` y completa la conexión.
3. Ejecuta estos comandos desde esta carpeta:

   ```powershell
   composer install
   php artisan key:generate
   php artisan migrate
   npm.cmd ci
   npm.cmd run build
   php artisan serve --host=127.0.0.1 --port=8000
   ```

Abre la portada en http://127.0.0.1:8000/ o los formularios en `/cristorey/caminantes` y `/cristorey/servidores`. Coordinación está en `/cristorey/coordinacion`.

Para entrar en Cristo Rey, genera una clave aleatoria de 32 bytes y su SHA-256 con PHP. El comando pide guardar la clave en privado y copiar solo la huella al `.env` en `COORDINACION_LINK_HASH`. Si usabas una clave permanente anterior, puedes reutilizar su huella.

```powershell
php -r ' $clave = bin2hex(random_bytes(32)); echo $clave.PHP_EOL.hash(chr(115).chr(104).chr(97).chr(50).chr(53).chr(54), $clave).PHP_EOL; '
```

El enlace es `/mapa.html#acceso=CLAVE`. Las invitaciones de servidores se generan desde Configuración en el panel.

## Importar la base anterior

1. Haz una copia consistente de las bases de `backend/data/ediciones`. Usa una copia SQLite que incluya las escrituras pendientes del WAL. Conserva la estructura `cristorey/vii.db` y las demás parroquias y ediciones.
2. Con `pdo_sqlite` habilitado en PHP, ejecuta `php artisan bartimeo:importar RUTA_A_EDICIONES` para simular la carga. Revisa los recuentos.
3. Ejecuta el mismo comando con `--aplicar` en la base de destino inicializada con `php artisan migrate`. Si vuelves a ejecutar la misma copia, la carga identifica las ediciones ya importadas. Las sesiones antiguas se renuevan entrando en el panel. Habilita Sodium si necesitas validar contraseñas scrypt de otras parroquias durante su primer acceso.

La carga separa los datos por parroquia y edición y conserva las fichas, los catálogos, los límites, los enlaces y las asistencias disponibles en la copia. Los JSON históricos se conservan como referencia.

## Subir por FileZilla a bartimeocordoba.org

El script `scripts/preparar-sftp.ps1` genera dos carpetas en `storage/app/private`. El paquete incluye los recursos compilados y el vendor de producción. Puedes indicar las rutas de PHP 8.5 y de `composer.phar` con `-Php` y `-Composer`.

1. Confirma PHP 8.5 con `pdo_pgsql`, PostgreSQL, HTTPS y la posibilidad de ejecutar comandos de PHP por SSH o desde el panel del alojamiento. En Apache, la raíz pública usa el `.htaccess` incluido. Si el alojamiento ejecuta solo Nginx, pide al proveedor las reglas de redirección a `index.php`.
2. Sube `bartimeo-app` a `/var/www/vhosts/bartimeocordoba.org/bartimeo-app`, al lado de `httpdocs`. Copia `.env.sftp.example` a `.env` dentro de `bartimeo-app` y completa la configuración allí.
3. En esa carpeta privada ejecuta `php artisan key:generate --force` una sola vez y `php artisan migrate --force`. Importa la copia privada si procede. El proceso PHP necesita permiso de escritura en `storage` y `bootstrap/cache`. Configura la huella de acceso de Cristo Rey.
4. Guarda una copia del `index.html` actual fuera de `httpdocs`. Sube allí el contenido de la carpeta pública `httpdocs` del paquete, incluido `.htaccess`. Retira el `index.html` anterior de la raíz pública para que se sirva `index.php`.
5. Comprueba `/health` por HTTPS y las rutas de ambos formularios. Envía cada formulario vacío y comprueba que el servidor rechaza la inscripción incompleta. Comprueba también el acceso real a coordinación y una invitación.

Si cuentas solo con FileZilla, necesitarás que el administrador del hosting cree la base y ejecute la inicialización. Conserva fuera de `httpdocs` la aplicación, las claves y las copias de datos.

## Pruebas

Inicializa una base PostgreSQL vacía para las pruebas, configura sus credenciales y ejecuta `php artisan migrate` y `php artisan test` contra esa base. Compila el frontend antes de ejecutar la prueba de la portada.
