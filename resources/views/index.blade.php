@extends('layouts.bartimeo')

@php
    $parroquia = $parroquia ?? 'cristorey';
    try {
        $infoPublica = app(\App\Http\Controllers\RetiroController::class)->informacion('caminantes')->getData(true);
    } catch (\Throwable) {
        $infoPublica = [];
    }
    $caminantes = is_array($infoPublica) ? $infoPublica : [];
    $emailContacto = data_get($caminantes, 'emailContacto');
    $fotos = [
        ['PHOTO-2026-09-21-14-34-31_1.jpg', 'La comunidad que acompaña', 'Jóvenes y familias caminando juntos en Bartimeo.'],
        ['PHOTO-2026-10-10-13-13-13.jpg', 'Amistad sobre el césped', 'Un equipo unido también fuera del retiro.'],
        ['WhatsApp Image 2026-11-24 at 17.49.11 (1).jpeg', 'Amistad y acogida', 'Un abrazo que dice: aquí tienes tu sitio.'],
        ['WhatsApp Image 2026-11-24 at 17.49.11 (3).jpeg', 'Servir con alegría', 'Jóvenes que ponen sus dones al servicio.'],
        ['WhatsApp Image 2026-11-24 at 17.49.11.jpeg', 'Un grupo que crece', 'Amistades que nacen al compartir.'],
        ['WhatsApp Image 2026-11-24 at 17.49.12 (1).jpeg', 'Una comunidad viva', 'Muchos caminos reunidos en una misma casa.'],
        ['WhatsApp Image 2026-11-24 at 17.49.12.jpeg', 'Equipo Bartimeo', 'Jóvenes juntos frente a la casa de espiritualidad.'],
        ['WhatsApp Image 2026-11-24 at 17.52.21.jpeg', 'Un mismo camino', 'Jóvenes y adultos compartiendo el encuentro.'],
        ['WhatsApp Image 2026-11-24 at 17.55.25.jpeg', 'Deporte y amistad', 'La alegría del equipo también se vive en el campo.'],
        ['WhatsApp Image 2026-11-24 at 18.01.24.jpeg', 'Cocinando en equipo', 'Preparar la comida también es compartir.'],
        ['WhatsApp Image 2026-11-25 at 09.07.44.jpeg', 'La familia Bartimeo', 'Un grupo grande unido por una experiencia común.'],
        ['WhatsApp Image 2026-11-25 at 09.08.43.jpeg', 'Tiempo de adoración', 'Un momento de silencio y encuentro con Dios.'],
        ['WhatsApp Image 2026-11-25 at 09.09.11.jpeg', 'Amistad que permanece', 'Compartir, escuchar y crecer juntos.'],
        ['WhatsApp Image 2026-11-25 at 09.09.29.jpeg', 'Recuerdos del retiro', 'Una tarde para guardar en el corazón.'],
        ['WhatsApp Image 2026-11-25 at 09.09.45.jpeg', 'Una comunidad que celebra', 'Jóvenes caminando juntos con esperanza.'],
        ['WhatsApp Image 2026-11-25 at 09.10.12.jpeg', 'Acompañarnos siempre', 'Un momento de oración compartida.'],
    ];
    $fotosHero = [
        ['WhatsApp Image 2026-11-24 at 17.49.11 (1).jpeg', 'Dos jóvenes se abrazan durante el retiro', 'Amistad y acogida'],
        ['WhatsApp Image 2026-11-24 at 17.49.12 (1).jpeg', 'Jóvenes reunidos en la casa de espiritualidad', 'Una comunidad viva'],
        ['WhatsApp Image 2026-11-25 at 09.08.43.jpeg', 'Adoración y paz', 'Paz y Adoración'],
        ['PHOTO-2026-10-10-13-13-13.jpg', 'Alegría compartida', 'Alegría Auténtica'],
    ];
@endphp

@section('title', 'Bartimeo Córdoba | Retiro y comunidad')

@push('styles')
    <link rel="stylesheet" href="/css/bartimeo-portada.css">
@endpush

@section('content')
<div class="portada">
    <div class="portada-aviso text-center text-white py-2 px-3">
        <span aria-hidden="true">✦</span> VII Retiro Bartimeo Córdoba @if(data_get($caminantes, 'fechas'))<span class="px-1">•</span> {{ data_get($caminantes, 'fechas') }}@endif @if(data_get($caminantes, 'lugar'))<span class="px-1">•</span> {{ data_get($caminantes, 'lugar') }}@endif
        <a class="ms-2 text-white fw-bold" href="{{ route('bartimeo.caminantes', ['parroquia' => $parroquia]) }}">Inscríbete aquí →</a>
    </div>
    <header class="portada-header sticky-top">
        <nav class="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3" aria-label="Navegación principal">
            <a class="marca d-flex align-items-center gap-3 text-decoration-none" href="#inicio" aria-label="Bartimeo Córdoba, inicio">
                <img src="/logo-bartimeo.png" alt="" width="52" height="52">
                <span><strong>BARTIMEO</strong><small>Córdoba · Parroquia Cristo Rey</small></span>
            </a>
            <div class="portada-nav d-flex flex-wrap align-items-center gap-3 gap-xl-4">
                <a href="#que-es">¿Qué es?</a><a href="#pilares">Nuestra esencia</a><a href="#galeria">Momentos</a><a href="#convocatoria">Retiro</a><a href="#faq">Dudas</a><a href="#redes">Comunidad</a>
            </div>
            <a class="btn btn-primary rounded-pill fw-bold" href="{{ route('bartimeo.caminantes', ['parroquia' => $parroquia]) }}">Inscripción Caminantes <span aria-hidden="true">→</span></a>
        </nav>
    </header>

    <main id="inicio">
        <section class="portada-hero py-5 py-lg-6">
            <div class="container py-lg-5 text-center">
                <h1 class="hero-titulo title-serif fw-bold mx-auto mb-4">UN ENCUENTRO QUE TE CAMBIA LA MIRADA.</h1>
                <p class="hero-manifiesto mx-auto mb-4">Bartimeo es un fin de semana diseñado para jóvenes de entre <strong>15 y 17 años</strong> en Córdoba. Un espacio libre de ruido, pantallas y apariencias, donde descubrir amigos de verdad y una fe viva y cercana.</p>
                <a class="btn btn-primary btn-lg hero-cta" href="{{ route('bartimeo.caminantes', ['parroquia' => $parroquia]) }}">Inscripción Caminantes <span aria-hidden="true">→</span></a>
                <div class="row g-3 g-sm-4 hero-mosaico mx-auto mt-4" aria-label="Momentos del retiro Bartimeo">
                    @foreach ($fotosHero as [$archivo, $alt, $titulo])
                        <div class="col-6 col-md-3"><figure class="hero-foto mb-0"><img src="{{ asset('fotosbartimeo1ertry/'.rawurlencode($archivo)) }}" alt="{{ $alt }}" loading="lazy" decoding="async"><figcaption>{{ $titulo }}</figcaption></figure></div>
                    @endforeach
                </div>
            </div>
        </section>

        <section id="que-es" class="seccion-blanca py-5 py-lg-6">
            <div class="container py-lg-4"><div class="row align-items-center g-5">
            <div class="col-md-6">
                <span class="etiqueta">¿Quiénes Somos?</span><h2 class="title-serif display-5 fw-bold mt-3">No somos una teoría. Somos una comunidad viva.</h2>
                <p class="lead mt-4">Bartimeo Córdoba nace en la <strong>Parroquia Cristo Rey</strong> como respuesta a una necesidad urgente: ofrecer a los jóvenes de nuestra ciudad un refugio auténtico donde dejar a un lado las presiones del móvil, las notas y las apariencias.</p>
                <p class="text-muted">El nombre de nuestro retiro procede del Evangelio: <strong>Bartimeo</strong> era un ciego sentado junto al camino que, al escuchar que Jesús pasaba cerca, gritó con todas sus fuerzas pidiendo ver. Jesús se detuvo, le abrió los ojos y él le siguió por el camino.</p>
                <blockquote class="portada-cita">«¡Ánimo, levántate, te llama! Él tiró su manto, dio un salto y vino hacia Jesús.»<span>— Evangelio según San Marcos 10, 49-50</span></blockquote>
            </div>
            <div class="col-md-6"><div class="quienes-imagen"><img src="/fotosbartimeo1ertry/PHOTO-2026-09-21-14-34-31_1.jpg" alt="Jóvenes en Bartimeo Córdoba" loading="lazy" decoding="async" width="1200" height="900"><div><strong>48 Horas</strong><span>Para desconectar del móvil y reconectar con lo que verdaderamente llena el corazón.</span></div></div></div>
            </div></div>
        </section>

        <section id="pilares" class="py-5 py-lg-6"><div class="container py-lg-4">
            <div class="text-center mb-5"><span class="etiqueta">Nuestra Esencia</span><h2 class="title-serif display-5 fw-bold mt-3">Los Tres Pilares de Bartimeo</h2></div>
            <div class="row g-4">
                <div class="col-md-4"><article class="card h-100 pilar-card"><div class="card-body p-4 p-lg-5"><span class="pilar-numero">1</span><h3 class="title-serif h3 mt-4">Kerygma &amp; Amor Real</h3><p class="text-muted">No venimos a dar sermones ni clases teóricas. Compartimos el primer anuncio: Dios te ama incondicionalmente, te conoce por tu nombre y tiene un plan único para ti.</p><div class="pilar-pie">Experiencia viva y personal</div></div></article></div>
                <div class="col-md-4"><article class="card h-100 pilar-card"><div class="card-body p-4 p-lg-5"><span class="pilar-numero pilar-dorado">2</span><h3 class="title-serif h3 mt-4">Fraternidad sin Filtros</h3><p class="text-muted">Conocerás a personas de tu misma edad en Córdoba dispuestas a escucharte sin juzgarte, sin etiquetas y sin postureo. Amistades profundas que continúan después del retiro.</p><div class="pilar-pie pilar-pie-dorado">Amigos para toda la vida</div></div></article></div>
                <div class="col-md-4"><article class="card h-100 pilar-card"><div class="card-body p-4 p-lg-5"><span class="pilar-numero pilar-verde">3</span><h3 class="title-serif h3 mt-4">Comunidad que permanece</h3><p class="text-muted">Al volver, cuentas con un grupo juvenil en Cristo Rey donde crecer, formarte, celebrar y servir juntos cada semana.</p><div class="pilar-pie">Un camino que continúa en Córdoba</div></div></article></div>
            </div>
        </div></section>

        <section id="galeria" class="seccion-blanca py-5 py-lg-6"><div class="container py-lg-4">
            <div class="text-center mb-5"><span class="etiqueta">Momentos de los retiros</span><h2 class="title-serif display-5 fw-bold mt-3">Así se vive Bartimeo</h2><p class="text-muted">Abre cualquier imagen para verla a tamaño completo.</p></div>
            <div class="row g-3 g-md-4">
                @foreach ($fotos as [$archivo, $titulo, $descripcion])
                    <div class="col-6 col-md-4 col-lg-3"><a class="foto-enlace" href="{{ asset('fotosbartimeo1ertry/'.rawurlencode($archivo)) }}" target="_blank" rel="noopener" aria-label="Abrir imagen: {{ $titulo }}. {{ $descripcion }}"><img src="{{ asset('fotosbartimeo1ertry/'.rawurlencode($archivo)) }}" alt="{{ $titulo }}: {{ $descripcion }}" loading="lazy" decoding="async"><span>{{ $titulo }}</span></a></div>
                @endforeach
            </div>
        </div></section>

        <section id="convocatoria" class="py-5 py-lg-6"><div class="container"><div class="convocatoria p-4 p-lg-5 text-center">
            <span class="etiqueta">Inscripciones Abiertas</span><h2 class="title-serif display-5 fw-bold mt-3">VII Retiro Bartimeo Córdoba</h2>
            <div class="row g-3 my-4 text-start">
                <div class="col-12 col-sm-6 col-lg-3"><div class="dato-retiro"><strong>♧ Fechas</strong><span>{{ data_get($caminantes, 'fechas', 'Próximamente') }}</span><small>Inicio: {{ data_get($caminantes, 'horarioComienzo', '—') }} · Final: {{ data_get($caminantes, 'horarioClausura', '—') }}</small></div></div>
                <div class="col-12 col-sm-6 col-lg-3"><div class="dato-retiro"><strong>⌖ Lugar</strong><span>{{ data_get($caminantes, 'lugar', 'Próximamente') }}</span><small>{{ data_get($caminantes, 'direccion', '') }}</small></div></div>
                <div class="col-12 col-sm-6 col-lg-3"><div class="dato-retiro"><strong>€ Precio</strong><span>{{ data_get($caminantes, 'precio', 'Consultar') }}</span><small>{{ data_get($caminantes, 'formaPago', '') }}</small></div></div>
                <div class="col-12 col-sm-6 col-lg-3"><div class="dato-retiro dato-plazo"><strong>◷ Plazo límite</strong><span>{{ data_get($caminantes, 'fechaLimite', 'Consultar') }}</span></div></div>
            </div>
            <p class="lead mx-auto my-4">Una experiencia de fin de semana para jóvenes que quieren vivir la fe, hacer nuevas amistades y descubrir su camino.</p>
            <a class="btn btn-primary btn-lg rounded-pill px-4" href="{{ route('bartimeo.caminantes', ['parroquia' => $parroquia]) }}">Formulario oficial de Caminantes <span aria-hidden="true">→</span></a>
        </div></div></section>

        <section id="faq" class="seccion-blanca py-5 py-lg-6"><div class="container"><div class="text-center mb-5"><span class="etiqueta">Dudas habituales</span><h2 class="title-serif display-5 fw-bold mt-3">Preguntas frecuentes</h2></div>
            <div class="faq-list mx-auto">
                <details><summary>¿Qué es exactamente el Retiro Bartimeo?</summary><p>Es un retiro católico de fin de semana organizado por jóvenes y adultos de la Parroquia Cristo Rey de Córdoba. Está pensado para jóvenes que buscan una experiencia transformadora de fe, amistad auténtica y encuentro personal con Dios.</p></details>
                <details><summary>¿Para qué edades está dirigido?</summary><p>Está enfocado principalmente a jóvenes de bachillerato.</p></details>
                <details><summary>¿Qué pasa con los teléfonos móviles durante el retiro?</summary><p>Durante el retiro se apagan y se custodian con seguridad. Queremos ofrecer un espacio libre de pantallas, notificaciones y ruido para conectar contigo mismo, con los demás y con Dios. Las familias disponen de un teléfono de emergencia atendido por coordinación.</p></details>
                <details><summary>¿Cuánto cuesta y cómo se realiza el pago?</summary><p>El coste para Caminantes es de {{ data_get($caminantes, 'precio', 'Consultar durante la inscripción') }}. {{ data_get($caminantes, 'formaPago', 'La forma de pago se comunicará por correo electrónico más adelante.') }}</p></details>
                <details><summary>¿Quién debe rellenar la inscripción?</summary><p>Para los Caminantes (participantes por primera vez), la inscripción debe completarla su padre, madre o tutor legal. Los Servidores pueden rellenarla ellos mismos.</p></details>
            </div>
        </div></section>

        <section id="redes" class="py-5 py-lg-6"><div class="container"><div class="text-center mb-5"><span class="etiqueta">Sigue conectado</span><h2 class="title-serif display-5 fw-bold mt-3">Comunidad y redes sociales</h2><p class="text-muted">Síguenos para enterarte de reuniones, veladas de adoración y novedades.</p></div>
            <div class="row justify-content-center g-4"><div class="col-md-5"><a class="contacto-card" href="https://www.instagram.com/bartimeocordoba" target="_blank" rel="noopener noreferrer"><span class="contacto-icono">◎</span><span><small>Instagram oficial</small><strong>@bartimeocordoba</strong></span></a></div>
                @if(is_string($emailContacto) && filter_var($emailContacto, FILTER_VALIDATE_EMAIL))<div class="col-md-5"><a class="contacto-card" href="mailto:{{ $emailContacto }}"><span class="contacto-icono">✉</span><span><small>Atención por correo</small><strong>{{ $emailContacto }}</strong></span></a></div>@endif
            </div>
            <div class="coordinacion mx-auto mt-5 text-center"><h3 class="title-serif h5">Equipo de Coordinación VII Bartimeo Córdoba</h3>
                @foreach (['coordinadoresJovenes', 'coordinadoresAdultos'] as $grupoContactos)
                    @if(is_array(data_get($caminantes, $grupoContactos)))<div class="coordinadores-lista">
                        @foreach(data_get($caminantes, $grupoContactos, []) as $contacto)
                            @if(is_array($contacto) && filled(data_get($contacto, 'nombre')))<span><strong>{{ data_get($contacto, 'nombre') }}</strong>@if(filled(data_get($contacto, 'telefono'))) ({{ data_get($contacto, 'telefono') }})@endif</span>@endif
                        @endforeach
                    </div>@endif
                @endforeach
                <p class="mb-2 mt-3">Parroquia Cristo Rey y Nuestra Señora del Valle</p><p class="text-muted mb-3">Calle Poeta Emilio Prados, s/n · 14012 Córdoba</p><a href="https://www.google.com/maps/search/?api=1&amp;query=Parroquia+Cristo+Rey+y+Nuestra+Se%C3%B1ora+del+Valle%2C+Calle+Poeta+Emilio+Prados%2C+C%C3%B3rdoba" target="_blank" rel="noopener noreferrer">Ver ubicación en Google Maps ↗</a></div>
        </div></section>
    </main>
    <footer class="portada-footer py-4"><div class="container d-flex flex-wrap align-items-center justify-content-between gap-3"><div class="d-flex align-items-center gap-3"><img src="/logo-bartimeo.png" alt="" width="42" height="42"><div><strong>VII Retiro Bartimeo Córdoba</strong><div class="small">Parroquia Cristo Rey · Diócesis de Córdoba</div></div></div><div class="small text-md-end">Cumplimiento RGPD (UE 2016/679 y Ley Orgánica 3/2018)<br>Hecho para la comunidad juvenil de Bartimeo</div></div></footer>
</div>
@endsection
