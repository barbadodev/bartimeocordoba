@props(['name'])
<svg class="coord-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    @switch($name)
        @case('usuarios') <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M15 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/> @break
        @case('brujula') <circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/> @break
        @case('ok') <circle cx="12" cy="12" r="10"/><path d="m8 12 2.5 2.5 5-5"/> @break
        @case('mapa') <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/> @break
        @case('recargar') <path d="M20 7v5h-5M4 17v-5h5"/><path d="M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3"/> @break
        @case('descargar') <path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/> @break
        @case('externo') <path d="M13 5h6v6m0-6-8 8M10 5H5v14h14v-5"/> @break
        @case('salir') <path d="M11 4H4v16h7m-1-8h11m-4-4 4 4-4 4"/> @break
        @case('camiseta') <path d="m16 4 5 3 1 5-5 1v7H7v-7l-5-1 1-5 5-3a4 4 0 0 0 8 0Z"/> @break
        @case('aviso') <path d="m12 3 10 17H2L12 3Zm0 6v4m0 3h.01"/> @break
        @case('escudo') <path d="M12 2c3 2 6 3 9 3v6c0 5-4 9-9 11-5-2-9-6-9-11V5c3 0 6-1 9-3Z"/><path d="m8 12 3 3 5-5"/> @break
        @case('buscar') <circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/> @break
        @case('calendario') <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/> @break
        @case('inicio') <path d="m3 11 9-8 9 8v9h-6v-7H9v7H3V11Z"/> @break
        @case('tarjetas') <rect x="6" y="3" width="12" height="18" rx="2"/><path d="M10 17h4"/> @break
        @default <path d="M5 12h14m-6-6 6 6-6 6"/>
    @endswitch
</svg>
