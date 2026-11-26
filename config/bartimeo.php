<?php

return [
    'origenes' => array_values(array_filter(array_map('trim', explode(',', (string) env('BARTIMEO_ORIGENES', env('APP_URL', 'http://localhost:8000')))))),
    'enlace_permanente_hash' => env('COORDINACION_LINK_HASH'),
    'limite_altas' => (int) env('PUBLIC_REGISTRATION_LIMIT', 300),
    'sesion_horas' => 8,
];
