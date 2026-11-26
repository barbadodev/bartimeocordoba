# Bartimeo Córdoba

![Logo de Bartimeo](public/logo-bartimeo.png)

## Guía de uso y relevo

Esta guía es para el equipo que usa la aplicación y para quien se encargue de ella el año que viene. La idea es que cualquiera pueda entender lo básico sin tener que preguntarle a la persona que la programó.

## ¿Para qué sirve?

La aplicación reúne en un solo sitio las inscripciones de caminantes y servidores, los datos del retiro y la asistencia a las reuniones. El público rellena los formularios y el equipo de coordinación consulta y gestiona la información desde un panel privado.

Las inscripciones y las asistencias se guardan en la base de datos del servidor. Descargar un CSV sirve para trabajar con una copia en Excel, pero esa copia no sustituye a los datos guardados en la aplicación.

## Entrar en cada parte

Las direcciones se abren en el dominio de Bartimeo. Las rutas de Cristo Rey son:

| Parte | Dirección | Quién la usa |
| --- | --- | --- |
| Portada | `/` | Todo el mundo |
| Inscripción de caminantes | `/cristorey/caminantes` | Familias y caminantes |
| Inscripción de servidores | `/cristorey/servidores` | Personas invitadas por coordinación |
| Panel de coordinación | `/cristorey/coordinacion` | Coordinadores con acceso privado |

El panel de Cristo Rey se abre con un **enlace privado de coordinación**. No hay que escribir una contraseña en la página. Pide el enlace a la persona que administre los accesos y no lo reenvíes a grupos públicos: quien lo tenga puede entrar a datos personales.

La sesión caduca. Si el panel te devuelve a la pantalla de acceso, vuelve a abrir el enlace privado o pide uno nuevo a la administración.

## Lo de cada día

### Inscripciones

En el panel puedes cambiar entre **Inscripciones de servidores** e **Inscripciones de caminantes**. Usa el buscador y los filtros para encontrar una ficha; al abrirla podrás revisar sus datos. El botón **Actualizar** vuelve a cargar la información del servidor.

Para descargar una hoja, usa **Exportar a Excel**. Se descarga un CSV que Excel puede abrir. Esa hoja contiene datos personales: guárdala solo donde haga falta, compártela únicamente con quien deba verla y bórrala cuando ya no sea necesaria.

Editar una ficha actualiza el registro de la aplicación. Borrar una inscripción la elimina de forma permanente; antes de confirmar, comprueba que has elegido a la persona correcta.

### Invitar a servidores

En **Configuración** está el bloque **Enlace de inscripción de servidores**:

1. Elige cuántos días estará activo, entre 1 y 30.
2. Pulsa **Generar enlace** y copia el enlace que aparece.
3. Compártelo solo con el grupo de servidores al que va dirigido.

Si ya había una invitación activa y generas otra, la anterior deja de funcionar. También puedes desactivarla desde ese mismo bloque. El formulario de caminantes, en cambio, es público.

### Asistencias

En **Asistencias** hay tres pestañas:

- **Reuniones**: añade la fecha de cada reunión. Si todavía no hay reuniones, empieza por aquí.
- **Toma de asistencia**: elige la reunión y pulsa sobre cada persona para recorrer los estados: sin marcar, presente, incidencia, ausente y de nuevo sin marcar. También puedes marcar como presentes a todas las personas que se muestran en ese momento; revisa los filtros antes de hacerlo.
- **Participantes**: consulta, busca o gestiona la lista usada para pasar asistencia. Aquí se pueden añadir casos excepcionales, como alguien que asistió sin estar inscrito.

La pantalla indica si los cambios están **Guardados** o si hay un problema de conexión. Espera a que indique que se guardaron antes de cerrar la página. Si aparece un error de conexión, pulsa actualizar y comprueba los datos antes de volver a marcar nada.

**Exportar Matriz** descarga el historial de reuniones y asistencias en CSV. Borrar una reunión también borra las marcas de asistencia asociadas; la aplicación avisa antes de hacerlo. Borrar a un participante elimina además su historial.

### Configuración

En esta sección se pueden ajustar el límite de plazas de caminantes, los valores disponibles en algunos desplegables y las ediciones del retiro. Los cambios afectan a la edición que esté seleccionada en el panel.

La opción **Crear una edición** prepara una edición nueva y sus catálogos iniciales. Por sí sola **no cambia** las fechas, el lugar, los precios, los teléfonos de contacto ni el formulario público para el año siguiente. Para abrir una nueva convocatoria hay que coordinar esos cambios con la persona técnica que mantenga el proyecto.

## Para quien se encargue el año que viene

Antes de abrir la siguiente convocatoria, deja claro quién tiene acceso a estas cuatro cosas:

1. El dominio y la cuenta del alojamiento donde está publicada la web.
2. El acceso de administración de la base de datos y las copias de seguridad.
3. El repositorio privado de código: [barbadodev/bartimeocordoba](https://github.com/barbadodev/bartimeocordoba). La nueva persona debe tener acceso antes de necesitar hacer cambios.
4. El enlace privado de coordinación y quién puede generar o renovar los accesos.

Después, prepara la nueva edición con tiempo. Como mínimo hay que revisar:

- Las fechas, el lugar, los horarios, los precios, los teléfonos y el correo de contacto.
- Los límites de plazas y las opciones de tallas y servicios.
- La invitación de servidores y su fecha de caducidad.
- Los formularios de caminantes y servidores, el acceso al panel y el guardado de asistencias.

La configuración del retiro vive en `resources/datos/retiro.json`, un archivo local ignorado por Git. El repositorio incluye `resources/datos/retiro.example.json` como plantilla sin nombres ni teléfonos. Si una persona nueva clona el proyecto, quien tenga los datos debe entregárselos por un canal seguro y ayudarle a crear el archivo real a partir de esa plantilla. No sobrescribas una copia real ya instalada.

**Ojo:** esta separación evita subir los datos reales al repositorio, pero no los oculta a quienes visitan la web. La aplicación incluye esta configuración en los formularios y en la respuesta pública de información del retiro para mostrar fechas y contactos. Pon ahí solo datos que coordinación quiera enseñar al público; cualquier dato que deba ser exclusivamente interno requiere un cambio adicional de la aplicación.

El código tiene además una edición pública predeterminada (`Retiro::PUBLICA`). Crear una edición desde el panel no cambia por sí solo la configuración ni esa edición predeterminada: quien mantenga el código debe preparar y publicar esos cambios. No copies teléfonos ni otros datos personales a este README ni a mensajes públicos.

Haz una copia de seguridad antes de tocar la base de datos o publicar una edición nueva. Tras publicar, comprueba los dos formularios, el enlace de invitación, la entrada al panel y que una marca de asistencia se guarda y sigue ahí al recargar.

## Si hay que tocar o publicar el código

La aplicación está hecha con Laravel 13, PHP 8.5, React y PostgreSQL. Para trabajar en local necesitas PHP con `pdo_pgsql`, Composer, Node.js y una base PostgreSQL.

En una copia local del proyecto:

1. Si todavía no tienes la configuración real, copia `resources/datos/retiro.example.json` como `resources/datos/retiro.json` y completa todos los datos de la nueva edición. Ese archivo está excluido de Git. No uses la plantilla vacía para compilar ni publicar.
2. Copia `.env.example` a `.env` y completa los datos de **una base de pruebas**, no los de producción.
3. Instala dependencias y prepara la base:

   ```powershell
   composer install
   php artisan key:generate
   php artisan migrate
   npm.cmd ci
   npm.cmd run build
   ```

4. Arranca la web:

   ```powershell
   php artisan serve --host=127.0.0.1 --port=8000
   ```

   Entra en `http://127.0.0.1:8000`. No subas el archivo `.env`: contiene claves de la instalación local.

El proyecto incluye `scripts/preparar-sftp.ps1` para preparar los archivos de una publicación por SFTP. Antes de generar el paquete, el script comprueba que exista la configuración real y que estén completos los datos necesarios de caminantes y servidores; el paquete copia ese archivo local. El paquete se genera dentro de `storage/app/private`; la carpeta privada de Laravel debe quedar fuera de `httpdocs`. Antes de publicar, revisa que el paquete corresponda a la versión que quieres subir y guarda una copia recuperable de la web y de la base de datos. Para migrar la base de producción o importar datos históricos, coordínalo con la persona responsable del alojamiento y haz primero una copia de seguridad.

## Cuidemos los datos

Las fichas pueden incluir teléfonos, domicilios, contactos de emergencia e información de salud. No compartas capturas, CSV ni enlaces privados fuera del equipo que los necesita. No publiques claves, enlaces de acceso ni archivos `.env` en GitHub. Si alguien deja el equipo, acuerda la renovación de sus accesos con la persona que administra la web.
