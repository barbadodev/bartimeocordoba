<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bartimeocordoba.org | Inscripción Caminantes</title>

    <!-- Iconos y Metadatos para Pantalla de Inicio (PWA / iOS / Android) -->
    <link rel="icon" type="image/png" href="/logo-bartimeo.png" />
    <link rel="icon" type="image/jpeg" href="/logo-bartimeo.jpg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest-caminantes.json" />

    <meta name="theme-color" content="#5C1824" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Caminantes" />

    <!-- Tipografías Oficiales -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cinzel:wght@600;700;900&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    @viteReactRefresh
    @vite('resources/js/main.jsx')
  </body>
</html>
