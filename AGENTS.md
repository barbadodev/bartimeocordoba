<laravel-boost-guidelines>
=== reglas fundamentales ===

# Directrices de Laravel Boost

## Contexto fundamental

Esta aplicación usa Laravel 13 y PHP 8.5. Utiliza siempre las API que correspondan a la versión principal instalada de cada paquete; no las des por supuestas.

Antes de depender de la API de un paquete, confirma su versión instalada:
- Paquetes PHP: ejecuta `composer show --direct` para ver las dependencias directas y sus versiones, o `composer show <vendor/package>` para consultar una.
- Paquetes JavaScript: consulta las versiones instaladas en `package.json`.

## Activación de skills

Este proyecto contiene skills específicas por dominio en `**/skills/**`. Activa obligatoriamente la skill pertinente cuando trabajes en ese dominio; no esperes a tener un problema.

## Convenciones

- Respeta todas las convenciones de código existentes. Antes de crear o editar un archivo, revisa archivos hermanos para seguir su estructura, enfoque y nombres.
- Usa nombres descriptivos para variables y métodos. Por ejemplo, `isRegisteredForDiscounts` en lugar de `discount()`.
- Comprueba si ya hay componentes reutilizables antes de crear otros.

## Scripts de verificación

No crees scripts de verificación ni uses Tinker cuando las pruebas existentes cubran esa funcionalidad. Las pruebas unitarias y de funcionalidad tienen prioridad.

## Estructura y arquitectura de la aplicación

- Respeta la estructura de directorios existente; no crees carpetas base sin autorización.
- No cambies las dependencias de la aplicación sin autorización.

## Vistas y recursos del frontend

Las vistas Blade y los estilos estáticos se sirven con Laravel. Si una vista no refleja un cambio, ejecuta `php artisan view:clear`.

## Archivos de documentación

Crea archivos de documentación únicamente cuando se soliciten explícitamente.

=== reglas de Boost ===

## Herramientas

Laravel Boost es un servidor MCP con herramientas específicas para esta aplicación. Prefiere las herramientas de Boost a las alternativas manuales, como comandos de terminal o lectura de archivos.
- Usa `database-query` para consultas de solo lectura a la base de datos, en lugar de SQL escrito en Tinker.
- Usa `database-schema` para inspeccionar la estructura antes de escribir migraciones o modelos.
- Usa `get-absolute-url` para resolver el esquema, dominio y puerto correctos antes de compartir una URL con el usuario.
- Usa `browser-logs` para consultar errores y registros recientes del navegador; ignora los antiguos.

## Búsqueda de documentación (importante)

- Antes de hacer cambios que dependan de API, comportamiento, configuración o sintaxis específica de versión del ecosistema Laravel, usa `search-docs`. No hace falta para cambios que solo copian texto u otros cambios sin dependencia de documentación de paquetes. Reutiliza resultados suficientes que ya estén disponibles en el contexto.
- Si conoces los paquetes relevantes, pasa un arreglo `packages` para limitar la búsqueda.
- Usa varias consultas amplias sobre el tema, por ejemplo: `['rate limiting', 'routing rate limiting', 'routing']`. Los resultados más pertinentes suelen aparecer primero.
- No incluyas nombres de paquetes en las consultas: la herramienta ya conoce la información de paquetes. Usa `test resource table`, no `filament 4 test resource table`.

### Sintaxis de búsqueda

1. Las palabras aplican lógica AND con derivación automática; `rate limit` busca ambos términos.
2. Las frases entre comillas buscan coincidencias exactas y contiguas; `"infinite scroll"` exige esas palabras en ese orden.
3. Combina palabras y frases según necesites.
4. Usa varias consultas para buscar alternativas, por ejemplo `queries=["authentication", "middleware"]`.

## Reglas del proyecto

Si existe `.ai/rules`, contiene reglas agrupadas por áreas y puede incluir directrices de framework en `.ai/rules/boost`. Antes de entrar en modo de planificación o crear/editar archivos:
1. Abre `.ai/rules/index.md`, que relaciona patrones de rutas con archivos de reglas.
2. Lee cada regla cuyo patrón incluya las rutas afectadas.
3. Ejecuta `grep -rin 'keyword' .ai/rules` para localizar reglas adicionales que la coincidencia de rutas no detecte.

No escribas código hasta haber leído y estar siguiendo todas las reglas aplicables. Si no existe `.ai/rules`, continúa sin este paso.

## Artisan

- Ejecuta los comandos de Artisan directamente desde la terminal, por ejemplo `php artisan route:list`.
- Usa `php artisan list` para descubrir comandos y `php artisan [comando] --help` para consultar sus opciones.
- Inspecciona rutas con `php artisan route:list`; puedes filtrar con `--method=GET`, `--name=users`, `--path=api`, `--except-vendor` o `--only-vendor`.
- Consulta configuración mediante notación de puntos, por ejemplo `php artisan config:show app.name` o `php artisan config:show database.default`, o lee directamente los archivos de `config/`.

## Tinker

- Ejecuta PHP en el contexto de la aplicación para depurar o probar. No crees modelos sin autorización del usuario; prefiere las pruebas con factories. Prioriza los comandos Artisan existentes sobre Tinker.
- Usa comillas simples para evitar la expansión del shell: `php artisan tinker --execute 'Your::code();'`.
- Dentro del PHP usa comillas dobles cuando sea necesario: `php artisan tinker --execute 'User::where("active", true)->count();'`.

=== reglas PHP ===

- Usa siempre llaves en las estructuras de control, incluso si el cuerpo tiene una sola línea.
- Usa promoción de propiedades en el constructor de PHP 8, por ejemplo: `public function __construct(public GitHub $github) { }`. No dejes constructores vacíos sin parámetros, salvo que sean privados.
- Declara tipos de retorno explícitos y tipos para todos los parámetros de métodos, por ejemplo: `function isAccessible(User $user, ?string $path = null): bool`.
- Usa PascalCase para las claves de enumeraciones, por ejemplo `FavoritePerson`, `BestLake`, `Monthly`.
- Prefiere bloques PHPDoc a comentarios en línea. Añade comentarios en línea solo para lógica excepcionalmente compleja.
- Define las formas de los arreglos en PHPDoc.

=== reglas de despliegue ===

Laravel puede desplegarse en Laravel Cloud. Activa la skill `deploying-to-cloud` al desplegar en Laravel Cloud, configurar sus entornos o recursos, usar su CLI o resolver problemas de despliegue.

=== reglas de Laravel ===

## Sigue las prácticas de Laravel

- Usa comandos `php artisan make:` para crear archivos (migraciones, controladores, modelos, etc.). Consulta `php artisan list` para descubrir comandos y `php artisan [comando] --help` para ver opciones.
- Para una clase PHP genérica, usa `php artisan make:class`.
- Añade `--no-interaction` a todos los comandos Artisan para que no soliciten información, junto con las opciones apropiadas.

### Creación de modelos

Al crear modelos, crea también factories y seeders útiles. Consulta `php artisan make:model --help` para comprobar las opciones disponibles.

### API y recursos de Eloquent

Para API, usa por defecto recursos de API de Eloquent y versionado. Si las rutas API existentes no siguen ese patrón, respeta la convención actual de la aplicación.

### Generación de URL

Al generar enlaces a otras páginas, prefiere rutas con nombre y la función `route()`.

### Pruebas

- Al crear modelos para pruebas, usa factories y revisa si tienen estados personalizados antes de configurar los modelos manualmente.
- Con Faker, utiliza métodos como `$this->faker->word()` o `fake()->randomDigit()`. Sigue la convención existente del proyecto entre `$this->faker` y `fake()`.
- Crea pruebas de funcionalidad con `php artisan make:test [opciones] {Nombre}` y añade `--unit` para pruebas unitarias. La mayoría de las pruebas deberían ser de funcionalidad.

=== reglas de Pint ===

Si modificas archivos PHP, antes de finalizar ejecuta `vendor/bin/pint --dirty --format agent` para aplicar el formato esperado por el proyecto. No ejecutes `vendor/bin/pint --test --format agent`; usa Pint para corregir el formato.

=== reglas de PHPUnit ===

- El proyecto usa PHPUnit. Crea pruebas con `php artisan make:test --phpunit {NombreDePrueba}`.
- No incluyas el directorio de la suite en el nombre. Usa `SomeFeatureTest`, no `Feature/SomeFeatureTest`.
- Lee la skill `testing-best-practices` al decidir cobertura, nombres, estructura, aislamiento de dependencias, revisar pruebas o mejorar su rendimiento.

## Ejecución de pruebas

- Ejecuta el conjunto más pequeño que cubra el cambio. Pasa una ruta de archivo o `--filter=nombreDePrueba` a `php artisan test --compact`.
- Vuelve a ejecutar cada prueba después de modificarla.
- También puedes ejecutar `vendor/bin/phpunit` directamente; acepta las mismas rutas y filtros.
</laravel-boost-guidelines>

## Proyecto: Bartimeo Córdoba

### Stack y estructura

- La aplicación usa Laravel 13, PHP `^8.5`, PostgreSQL, Blade y Bootstrap CSS. El frontend funciona sin JavaScript, Node ni compilación.
- La API está en `routes/api.php`; las páginas Laravel, en `routes/web.php`. Los controladores están en `app/Http/Controllers`, la lógica de dominio en `app/Bartimeo` y el aislamiento de parroquia/edición en `ContextoBartimeo` y `Retiro`.
- Las vistas están en `resources/views`. Los estilos están en `public/css` y se usan desde `resources/views/layouts/bartimeo.blade.php`.
- El esquema propio está definido en `database/migrations`. Actualmente, los datos Bartimeo no usan modelos Eloquent: la lógica emplea `DB` y Query Builder. Sigue ese patrón donde corresponda, sin añadir otra capa ni dependencias por iniciativa propia.
- `resources/datos/retiro.json` es configuración local privada. No la copies, imprimas ni incluyas en entregas. Usa `retiro.example.json` como plantilla segura.

### Dominio y seguridad

- Los datos se aíslan por `edicion_id`; el middleware de contexto resuelve la parroquia y edición de cada petición. Toda consulta nueva debe mantener ese ámbito y no confiar en identificadores recibidos del cliente.
- Las rutas de coordinación se protegen en el servidor con `SesionCoordinacion`. No expongas tokens, hashes, credenciales ni datos personales en respuestas, registros o exportaciones fuera del flujo autorizado.
- Las escrituras críticas de inscripción y aforo usan `Retiro::escribir()` para gestionar transacciones y bloqueos de edición. Conserva la atomicidad y las claves de idempotencia al modificar altas o importaciones.
- Valida en el servidor todos los datos recibidos; el frontend solo mejora la experiencia. Mantén las respuestas JSON y los códigos HTTP coherentes con los controladores existentes y usa `Retiro::error()` para errores HTTP del dominio.
- La importación de asistencias debe preservar identidad e historial y ser idempotente. Revisa la lógica existente en `Asistencias` antes de añadir una implementación paralela.
- No cambies datos de producción, configuración del alojamiento ni credenciales durante tareas locales sin autorización explícita.

### Convenciones del código

- El backend usa nombres de dominio en español, controladores `final`, consultas explícitas con Query Builder, transacciones de Laravel y respuestas `response()->json(...)`. Mantén estas convenciones en los archivos relacionados.
- Usa formularios HTML con CSRF para escrituras, enlaces de rutas con nombre para navegación y elementos nativos como `details` para desplegables.
- Conserva el contexto de parroquia y edición en las rutas privadas y aplica la autenticación por sesión de Laravel. Solo los administradores pueden gestionar usuarios.
- Conserva la accesibilidad, los estados de carga/error/vacío y la validación visibles en los formularios y paneles existentes. No añadas valores simulados a flujos de producción.
- No añadas dependencias sin autorización. Revisa `composer.json` antes de proponer cambios en el stack.

### Verificación

- Pruebas backend: `php artisan test --compact` (PHPUnit; `tests/Feature/BartimeoTest.php` cubre flujos de negocio y PostgreSQL).
- Compilación de plantillas: `php artisan view:cache`.
- Si modificas archivos PHP, ejecuta `vendor/bin/pint --dirty --format agent`.
- Ejecuta las comprobaciones pertinentes al cambio e informa si alguna no está disponible. No afirmes haber validado manualmente la interfaz ni una base de datos si no lo hiciste.
