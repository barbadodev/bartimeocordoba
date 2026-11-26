import React, { useState } from 'react';
import {
  Sparkles, Compass, Heart, Users, Calendar, MapPin, Euro, Phone, Mail,
  ArrowRight, ShieldCheck, CheckCircle2, ChevronRight,
  Clock, ExternalLink, Menu, X, Play, HelpCircle
} from 'lucide-react';
import { INFO_RETIRO } from '../../tema';

function IconInstagram({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

const FOTOS_RETIRO = [
  { src: '/fotosbartimeo1ertry/PHOTO-2026-09-21-14-34-31_1.jpg', titulo: 'La comunidad que acompaña', desc: 'Jóvenes y familias caminando juntos en Bartimeo.' },
  { src: '/fotosbartimeo1ertry/PHOTO-2026-10-10-13-13-13.jpg', titulo: 'Amistad sobre el césped', desc: 'Un equipo unido también fuera del retiro.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.49.11 (1).jpeg', titulo: 'Amistad y acogida', desc: 'Un abrazo que dice: aquí tienes tu sitio.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.49.11 (3).jpeg', titulo: 'Servir con alegría', desc: 'Jóvenes que ponen sus dones al servicio.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.49.11.jpeg', titulo: 'Un grupo que crece', desc: 'Amistades que nacen al compartir.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.49.12 (1).jpeg', titulo: 'Una comunidad viva', desc: 'Muchos caminos reunidos en una misma casa.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.49.12.jpeg', titulo: 'Equipo Bartimeo', desc: 'Jóvenes juntos frente a la casa de espiritualidad.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.52.21.jpeg', titulo: 'Un mismo camino', desc: 'Jóvenes y adultos compartiendo el encuentro.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.55.25.jpeg', titulo: 'Deporte y amistad', desc: 'La alegría del equipo también se vive en el campo.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 18.01.24.jpeg', titulo: 'Cocinando en equipo', desc: 'Preparar la comida también es compartir.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-25 at 09.07.44.jpeg', titulo: 'La familia Bartimeo', desc: 'Un grupo grande unido por una experiencia común.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-25 at 09.08.43.jpeg', titulo: 'Tiempo de adoración', desc: 'Un momento de silencio y encuentro con Dios.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-25 at 09.09.11.jpeg', titulo: 'Amistad que permanece', desc: 'Compartir, escuchar y crecer juntos.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-25 at 09.09.29.jpeg', titulo: 'Recuerdos del retiro', desc: 'Una tarde para guardar en el corazón.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-25 at 09.09.45.jpeg', titulo: 'Una comunidad que celebra', desc: 'Jóvenes caminando juntos con esperanza.' },
  { src: '/fotosbartimeo1ertry/WhatsApp Image 2026-11-25 at 09.10.12.jpeg', titulo: 'Acompañarnos siempre', desc: 'Un momento de oración compartida.' }
];

const DIRECCION_PARROQUIA_CRISTO_REY = 'Parroquia Cristo Rey y Nuestra Señora del Valle, Calle Poeta Emilio Prados, s/n, 14012 Córdoba, España';
const GOOGLE_MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY?.trim();
const GOOGLE_MAPS_EMBED_SRC = GOOGLE_MAPS_EMBED_KEY
  ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(GOOGLE_MAPS_EMBED_KEY)}&q=${encodeURIComponent(DIRECCION_PARROQUIA_CRISTO_REY)}&language=es`
  : `https://maps.google.com/maps?q=${encodeURIComponent(DIRECCION_PARROQUIA_CRISTO_REY)}&z=16&output=embed`;
const GOOGLE_MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DIRECCION_PARROQUIA_CRISTO_REY)}`;

const PREGUNTAS_FAQ = [
  {
    q: '¿Qué es exactamente el Retiro Bartimeo?',
    a: 'Es un retiro católico de fin de semana (de viernes por la tarde a domingo por la tarde) organizado por jóvenes y adultos de la Parroquia Cristo Rey de Córdoba. Está pensado para chicos y chicas de 15 y 17 años (bachillerato) que buscan una experiencia transformadora de fe, amistad auténtica y encuentro personal con Dios.'
  },
  {
    q: '¿Para qué edades está dirigido?',
    a: 'Está enfocado principalmente a jóvenes nacidos entre 2010 y 2008.'
  },
  {
    q: '¿Qué pasa con los teléfonos móviles durante el retiro?',
    a: 'Durante las 48 horas del retiro se apagan y custodian con total seguridad. Queremos ofrecerte un espacio libre de pantallas, notificaciones y ruido para que puedas conectar contigo mismo, con los demás y con Dios. Los familiares disponen de un teléfono de emergencia atendido 24 horas por la coordinación.'
  },
  {
    q: '¿Cuánto cuesta y cómo se realiza el pago?',
    a: `El coste para Caminantes es de ${INFO_RETIRO.caminantes.precio}. La forma de pago se comunicará por correo electrónico más adelante.`
  },
  {
    q: '¿Quién debe rellenar la inscripción?',
    a: 'Para los Caminantes (participantes por primera vez), la inscripción debe ser completada por sus padres o tutores legales. Para los Servidores (quienes ya vivieron Bartimeo y quieren servir), pueden rellenarla ellos mismos.'
  }
];

export default function LandingPage({
  onIrACaminantes,
  onIrACoordinacion
}) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [faqAbierta, setFaqAbierta] = useState(null);
  const [fotoModal, setFotoModal] = useState(null);

  const toggleFaq = (idx) => {
    setFaqAbierta(faqAbierta === idx ? null : idx);
  };

  const scrollSuaveHacia = (e, idDestino) => {
    if (e && e.preventDefault) e.preventDefault();
    setMenuMovilAbierto(false);

    const elemento = document.getElementById(idDestino);
    if (!elemento) return;

    const headerOffset = 85;
    const elementoTop = elemento.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, elementoTop),
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-[#2A1B1E] selection:bg-[#5C1824] selection:text-white font-sans antialiased">
      {/* Top Banner Informativo */}
      <div className="bg-[#5C1824] text-white py-2 px-4 text-center text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2">
        <Sparkles size={14} className="text-[#E0B44C] animate-pulse" />
        <span>VII Retiro Bartimeo Córdoba • {INFO_RETIRO.caminantes.fechas} • {INFO_RETIRO.caminantes.lugar}</span>
        <button
          onClick={onIrACaminantes}
          className="underline font-bold text-[#FAF6F3] hover:text-[#E0B44C] transition ml-2 hidden sm:inline"
        >
          Inscríbete aquí →
        </button>
      </div>

      {/* Navbar Transparente y Sticky */}
      <header className="sticky top-0 z-50 bg-[#FAF6F3]/90 backdrop-blur-md border-b border-[#E8DFDA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo y Marca */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-bartimeo.png"
              alt="Bartimeo Córdoba"
              className="w-12 h-12 rounded-xl object-contain shadow-sm border border-[#E8DFDA] bg-white p-1"
            />
            <div>
              <div className="font-serif text-xl sm:text-2xl font-black text-[#5C1824] tracking-tight leading-none">
                BARTIMEO
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-[#6E5C60] uppercase tracking-wider">
                Córdoba • Parroquia Cristo Rey
              </div>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#57484B]">
            <a href="#que-es" onClick={(e) => scrollSuaveHacia(e, 'que-es')} className="hover:text-[#5C1824] transition">¿Qué es?</a>
            <a href="#pilares" onClick={(e) => scrollSuaveHacia(e, 'pilares')} className="hover:text-[#5C1824] transition">Nuestra Esencia</a>
            <a href="#galeria" onClick={(e) => scrollSuaveHacia(e, 'galeria')} className="hover:text-[#5C1824] transition">Momentos</a>
            <a href="#convocatoria" onClick={(e) => scrollSuaveHacia(e, 'convocatoria')} className="hover:text-[#5C1824] transition">VII Retiro</a>
            <a href="#faq" onClick={(e) => scrollSuaveHacia(e, 'faq')} className="hover:text-[#5C1824] transition">Dudas</a>
            <a href="#redes" onClick={(e) => scrollSuaveHacia(e, 'redes')} className="hover:text-[#5C1824] transition">Comunidad</a>
          </nav>

          {/* Botones de Acción */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={onIrACaminantes}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5C1824] hover:bg-[#421019] rounded-full shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <span>Inscripción Caminantes</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Botón Menú Móvil */}
          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className="lg:hidden p-2 rounded-lg text-[#5C1824] hover:bg-[#F5EBE6] transition"
            aria-label="Abrir Menú"
          >
            {menuMovilAbierto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desplegable Móvil */}
        {menuMovilAbierto && (
          <div className="lg:hidden bg-[#FAF6F3] border-b border-[#E8DFDA] px-4 pt-3 pb-6 flex flex-col gap-3 shadow-xl">
            <a
              href="#que-es"
              onClick={(e) => scrollSuaveHacia(e, 'que-es')}
              className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#F5EBE6]"
            >
              ¿Qué es Bartimeo?
            </a>
            <a
              href="#pilares"
              onClick={(e) => scrollSuaveHacia(e, 'pilares')}
              className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#F5EBE6]"
            >
              Nuestra Esencia
            </a>
            <a
              href="#galeria"
              onClick={(e) => scrollSuaveHacia(e, 'galeria')}
              className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#F5EBE6]"
            >
              Galería de Momentos
            </a>
            <a
              href="#convocatoria"
              onClick={(e) => scrollSuaveHacia(e, 'convocatoria')}
              className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#F5EBE6]"
            >
              Fechas VII Retiro
            </a>
            <a
              href="#faq"
              onClick={(e) => scrollSuaveHacia(e, 'faq')}
              className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#F5EBE6]"
            >
              Preguntas Frecuentes
            </a>
            <a
              href="#redes"
              onClick={(e) => scrollSuaveHacia(e, 'redes')}
              className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#F5EBE6]"
            >
              Redes y Contacto
            </a>

            <div className="pt-2 flex flex-col gap-2 border-t border-[#E8DFDA]">
              <button
                type="button"
                onClick={() => { setMenuMovilAbierto(false); onIrACaminantes(); }}
                className="w-full py-3 text-center text-sm font-bold text-white bg-[#5C1824] rounded-xl shadow-md"
              >
                Inscribirme como Caminante ({INFO_RETIRO.caminantes.precio})
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION ESTILO AUTE */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32">
        {/* Glow de fondo decorativo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5C1824]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Gran Titular */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-black text-[#5C1824] leading-[1.08] tracking-tight max-w-5xl mx-auto mb-6">
            UN ENCUENTRO QUE TE CAMBIA LA MIRADA.
          </h1>

          {/* Subtítulo Estilo Manifiesto */}
          <p className="text-lg sm:text-xl md:text-2xl text-[#6E5C60] max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            Bartimeo es un fin de semana diseñado para jóvenes de entre <strong>15 y 17 años</strong> en Córdoba.
            Un espacio libre de ruido, pantallas y apariencias, donde descubrir amigos de verdad y una fe viva y cercana.
          </p>

          {/* Llamadas a la acción */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <button
              type="button"
              onClick={onIrACaminantes}
              className="w-full sm:w-auto px-8 py-4 text-base font-extrabold text-white bg-[#5C1824] hover:bg-[#421019] rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              <span>Inscripción Caminantes</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Mosaico Rápido Hero (Fotos reales de los jóvenes) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto mt-6">
            <div className="relative group overflow-hidden rounded-2xl aspect-[4/5] shadow-lg">
              <img
                src="/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.49.11 (1).jpeg"
                alt="Dos jóvenes se abrazan durante el retiro"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <span className="text-white text-xs sm:text-sm font-bold">Amistad y acogida</span>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl aspect-[4/5] shadow-lg md:translate-y-6">
              <img
                src="/fotosbartimeo1ertry/WhatsApp Image 2026-11-24 at 17.49.12 (1).jpeg"
                alt="Jóvenes reunidos en la casa de espiritualidad"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <span className="text-white text-xs sm:text-sm font-bold">Una comunidad viva</span>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl aspect-[4/5] shadow-lg">
              <img
                src="/fotosbartimeo1ertry/WhatsApp Image 2026-11-25 at 09.08.43.jpeg"
                alt="Adoración y paz"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <span className="text-white text-xs sm:text-sm font-bold">Paz y Adoración</span>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl aspect-[4/5] shadow-lg md:translate-y-6">
              <img
                src="/fotosbartimeo1ertry/PHOTO-2026-10-10-13-13-13.jpg"
                alt="Alegría compartida"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <span className="text-white text-xs sm:text-sm font-bold">Alegría Auténtica</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN "¿QUIÉNES SOMOS?" (INSPIRADO EN AUTE) */}
      <section id="que-es" className="py-20 bg-white border-y border-[#E8DFDA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Texto Manifiesto */}
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-[#FAF6F3] text-[#5C1824] text-xs font-bold uppercase tracking-wider mb-4 border border-[#E8DFDA]">
                ¿Quiénes Somos?
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#5C1824] leading-tight mb-6">
                No somos una teoría. Somos una comunidad viva.
              </h2>
              <p className="text-base sm:text-lg text-[#6E5C60] leading-relaxed mb-6">
                Bartimeo Córdoba nace en la <strong>Parroquia Cristo Rey</strong> como respuesta a una necesidad urgente: ofrecer a los jóvenes de nuestra ciudad un refugio auténtico donde dejar a un lado las presiones del móvil, las notas y las apariencias.
              </p>
              <p className="text-base sm:text-lg text-[#6E5C60] leading-relaxed mb-6">
                El nombre de nuestro retiro procede del Evangelio: <strong>Bartimeo</strong> era un ciego sentado junto al camino que, al escuchar que Jesús pasaba cerca, gritó con todas sus fuerzas pidiendo ver. Jesús se detuvo, le abrió los ojos y él le siguió por el camino.
              </p>
              <blockquote className="border-l-4 border-[#5C1824] pl-4 italic text-sm sm:text-base text-[#57484B] my-6 bg-[#FAF6F3] p-4 rounded-r-xl">
                «¡Ánimo, levántate, te llama! Él tiró su manto, dio un salto y vino hacia Jesús.»
                <span className="block font-bold text-[#5C1824] text-xs not-italic mt-2">
                  — Evangelio según San Marcos 10, 49-50
                </span>
              </blockquote>
            </div>

            {/* Tarjeta Visual de Impacto */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="/fotosbartimeo1ertry/PHOTO-2026-09-21-14-34-31_1.jpg"
                  alt="Jóvenes en Bartimeo Córdoba"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#5C1824] text-white p-5 rounded-2xl shadow-xl max-w-xs hidden sm:block">
                <div className="text-2xl font-black font-serif text-[#E0B44C]">48 Horas</div>
                <div className="text-xs text-white/90 font-medium mt-1">
                  Para desconectar del móvil y reconectar con lo que verdaderamente llena el corazón.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN "LOS TRES PILARES" (ESTILO AUTE) */}
      <section id="pilares" className="py-20 sm:py-28 bg-[#FAF6F3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-white text-[#5C1824] text-xs font-bold uppercase tracking-wider mb-4 border border-[#E8DFDA]">
            Nuestra Esencia
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-black text-[#5C1824] mb-4">
            Los Tres Pilares de Bartimeo
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {/* Pilar 1 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E8DFDA] shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#F5EBE6] text-[#5C1824] flex items-center justify-center font-serif font-black text-2xl mb-6 group-hover:bg-[#5C1824] group-hover:text-white transition">
                  1
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#5C1824] mb-3">
                  Kerygma & Amor Real
                </h3>
                <p className="text-sm text-[#6E5C60] leading-relaxed">
                  No venimos a dar sermones ni clases teóricas. Compartimos el primer anuncio: Dios te ama incondicionalmente, te conoce por tu nombre y tiene un plan único para ti.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0EAE6] text-xs font-bold text-[#5C1824]">
                Experiencia viva y personal
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E8DFDA] shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#FFF8E6] text-[#B86508] flex items-center justify-center font-serif font-black text-2xl mb-6 group-hover:bg-[#B86508] group-hover:text-white transition">
                  2
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#5C1824] mb-3">
                  Fraternidad sin Filtros
                </h3>
                <p className="text-sm text-[#6E5C60] leading-relaxed">
                  Conocerás a personas de tu misma edad en Córdoba dispuestas a escucharte sin juzgarte, sin etiquetas y sin postureo. Amistades profundas que continúan después del retiro.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0EAE6] text-xs font-bold text-[#B86508]">
                Amigos para toda la vida
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E8DFDA] shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#EAF5EC] text-[#2E6930] flex items-center justify-center font-serif font-black text-2xl mb-6 group-hover:bg-[#2E6930] group-hover:text-white transition">
                  3
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#5C1824] mb-3">
                  Comunidad que Permanece
                </h3>
                <p className="text-sm text-[#6E5C60] leading-relaxed">
                  El retiro no es un pico emocional que se apaga el lunes. Al volver, cuentas con un grupo juvenil en Cristo Rey donde crecer, formarte, celebrar y servir juntos cada semana.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0EAE6] text-xs font-bold text-[#2E6930]">
                Un camino que continúa en Córdoba
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍA DE MOMENTOS REALES (FOTOS SUBIDAS POR EL USUARIO) */}
      <section id="galeria" className="py-20 bg-white border-t border-[#E8DFDA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FAF6F3] text-[#5C1824] text-xs font-bold uppercase tracking-wider mb-3 border border-[#E8DFDA]">
              Momentos de los Retiros
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-black text-[#5C1824] mb-4">
              Así se vive Bartimeo
            </h2>
          </div>

          {/* Muro fotográfico */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {FOTOS_RETIRO.map((foto, idx) => (
              <div
                key={foto.src}
                onClick={() => setFotoModal(foto)}
                className="group relative rounded-2xl overflow-hidden aspect-square bg-[#FAF6F3] cursor-pointer shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <img
                  src={foto.src}
                  alt={foto.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-4 text-white">
                  <div className="text-xs uppercase font-bold text-[#E0B44C] tracking-wider mb-1">
                    Bartimeo Córdoba
                  </div>
                  <div className="text-sm font-bold leading-tight">{foto.titulo}</div>
                  <div className="text-[11px] text-white/80 mt-1">{foto.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL DE FOTO EN PANTALLA COMPLETA */}
      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative animate-scale-in"
          >
            <button
              type="button"
              onClick={() => setFotoModal(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
            >
              <X size={20} />
            </button>
            <div className="max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={fotoModal.src}
                alt={fotoModal.titulo}
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
            <div className="p-6 bg-white">
              <div className="text-xs font-bold uppercase tracking-wider text-[#5C1824]">
                Momento Retiro Bartimeo Córdoba
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#2A1B1E] mt-1">
                {fotoModal.titulo}
              </h3>
              <p className="text-sm text-[#6E5C60] mt-2">
                {fotoModal.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONVOCATORIA OFICIAL: VII BARTIMEO CÓRDOBA */}
      <section id="convocatoria" className="py-20 bg-[#FAF6F3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border-2 border-[#E8DFDA] p-8 sm:p-12 shadow-xl relative overflow-hidden">
            {/* Adorno superior */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#5C1824] via-[#E0B44C] to-[#5C1824]" />

            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs uppercase tracking-widest font-black text-[#5C1824]">
                Inscripciones Abiertas
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-black text-[#5C1824] mt-2 mb-4">
                VII Retiro Bartimeo Córdoba
              </h2>
            </div>

            {/* Datos Clave del Retiro */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="bg-[#FAF6F3] p-5 rounded-2xl border border-[#E8DFDA]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5C1824] uppercase mb-2">
                  <Calendar size={16} /> Fechas
                </div>
                <div className="text-base font-extrabold text-[#2A1B1E]">
                  {INFO_RETIRO.caminantes.fechas}
                </div>
                <div className="text-xs text-[#6E5C60] mt-1">
                  Inicio: {INFO_RETIRO.caminantes.horarioComienzo} · Final: {INFO_RETIRO.caminantes.horarioClausura}
                </div>
              </div>

              <div className="bg-[#FAF6F3] p-5 rounded-2xl border border-[#E8DFDA]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5C1824] uppercase mb-2">
                  <MapPin size={16} /> Lugar
                </div>
                <div className="text-base font-extrabold text-[#2A1B1E]">
                  Casa Diocesana de Espiritualidad «San Antonio»
                </div>
                <div className="text-xs text-[#6E5C60] mt-1">
                  {INFO_RETIRO.caminantes.direccion}
                </div>
              </div>

              <div className="bg-[#FAF6F3] p-5 rounded-2xl border border-[#E8DFDA]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5C1824] uppercase mb-2">
                  <Euro size={16} /> Precio
                </div>
                <div className="text-base font-extrabold text-[#5C1824]">
                  {INFO_RETIRO.caminantes.precio}
                </div>
                <div className="text-xs text-[#6E5C60] mt-1">
                  {INFO_RETIRO.caminantes.formaPago}
                </div>
              </div>

              <div className="bg-[#FAF6F3] p-5 rounded-2xl border border-[#E8DFDA]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#9C1A1C] uppercase mb-2">
                  <Clock size={16} /> Plazo Límite
                </div>
                <div className="text-base font-extrabold text-[#9C1A1C]">
                  {INFO_RETIRO.caminantes.fechaLimite}
                </div>
              </div>
            </div>
            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={onIrACaminantes}
                className="w-full sm:w-auto px-8 py-4 text-base font-black text-white bg-[#5C1824] hover:bg-[#421019] rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Compass size={18} />
                <span>Formulario Oficial de Caminantes</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES (FAQ) */}
      <section id="faq" className="py-20 bg-white border-y border-[#E8DFDA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FAF6F3] text-[#5C1824] text-xs font-bold uppercase tracking-wider mb-3 border border-[#E8DFDA]">
              Dudas habituales
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-[#5C1824]">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-4">
            {PREGUNTAS_FAQ.map((faq, idx) => {
              const abierta = faqAbierta === idx;
              return (
                <div
                  key={faq.q}
                  className="border border-[#E8DFDA] rounded-2xl overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left font-bold text-base sm:text-lg text-[#2A1B1E] flex items-center justify-between gap-4 bg-[#FAF6F3] hover:bg-[#F5EBE6] transition"
                  >
                    <span>{faq.q}</span>
                    <span className="text-[#5C1824] text-xl font-mono">{abierta ? '−' : '+'}</span>
                  </button>
                  {abierta && (
                    <div className="p-5 text-sm sm:text-base text-[#6E5C60] bg-white border-t border-[#E8DFDA] leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* REDES SOCIALES Y CONTACTO */}
      <section id="redes" className="py-20 bg-[#FAF6F3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-white text-[#5C1824] text-xs font-bold uppercase tracking-wider mb-3 border border-[#E8DFDA]">
              Sigue Conectado
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-[#5C1824]">
              Comunidad y Redes Sociales
            </h2>
            <p className="text-sm sm:text-base text-[#6E5C60] mt-2">
              Síguenos para enterarte de reuniones, veladas de adoración y novedades de los retiros.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/bartimeocordoba"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-6 rounded-3xl border border-[#E8DFDA] shadow-sm hover:shadow-xl transition group flex flex-col items-center gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FD5949] via-[#D6249F] to-[#285AEB] text-white flex items-center justify-center shrink-0 shadow-md">
                <IconInstagram size={24} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-[#7E6B6F]">Instagram Oficial</div>
                <div className="font-serif text-lg font-bold text-[#2A1B1E] group-hover:text-[#5C1824] transition">
                  @bartimeocordoba
                </div>
              </div>
            </a>
            {/* Email de Contacto */}
            <a
              href={`mailto:${INFO_RETIRO.email}`}
              className="bg-white p-6 rounded-3xl border border-[#E8DFDA] shadow-sm hover:shadow-xl transition group flex flex-col items-center gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#5C1824] text-white flex items-center justify-center shrink-0 shadow-md">
                <Mail size={24} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-[#7E6B6F]">Atención por Correo</div>
                <div className="font-serif text-base font-bold text-[#2A1B1E] group-hover:text-[#5C1824] transition break-all">
                  {INFO_RETIRO.email}
                </div>
              </div>
            </a>
          </div>

          {/* Coordinadores */}
          <div className="mt-12 mx-auto max-w-3xl bg-white rounded-3xl border border-[#E8DFDA] p-6 text-sm text-[#6E5C60] text-center">
            <div className="font-serif font-bold text-base text-[#5C1824] mb-3">
              Equipo de Coordinación VII Bartimeo Córdoba
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs justify-items-center">
              {INFO_RETIRO.coordinadoresJovenes.map((c) => <div key={c.tel}>• <strong>{c.nombre}</strong> ({c.tel})</div>)}
            </div>
            <div className="mt-3 mx-auto grid max-w-md sm:grid-cols-2 gap-3 text-xs justify-items-center">
              {INFO_RETIRO.coordinadoresAdultos.map((c) => <div key={c.tel}>• <strong>{c.nombre}</strong> ({c.tel})</div>)}
            </div>
            <div className="mt-4 text-center">
              <p className="mb-2 text-xs font-semibold text-[#6E5C60]">
                Parroquia Cristo Rey y Nuestra Señora del Valle · Calle Poeta Emilio Prados, s/n · 14012 Córdoba
              </p>
              <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-[#E8DFDA]">
                <iframe
                  title="Mapa de la Parroquia Cristo Rey y Nuestra Señora del Valle"
                  src={GOOGLE_MAPS_EMBED_SRC}
                  className="block h-36 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <a href={GOOGLE_MAPS_LINK} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#5C1824] underline">
                Abrir en Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER OFICIAL */}
      <footer className="bg-[#2A1B1E] text-white/80 py-12 border-t border-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo-bartimeo.png"
              alt="Bartimeo"
              className="w-10 h-10 rounded-lg bg-white p-1"
            />
            <div>
              <div className="font-serif text-white font-bold text-base">
                VII Retiro Bartimeo Córdoba
              </div>
              <div className="text-xs text-white/60">
                Parroquia Cristo Rey • Diócesis de Córdoba
              </div>
            </div>
          </div>

          <div className="text-xs text-center md:text-right text-white/60 space-y-1">
            <div>Cumplimiento RGPD (UE 2016/679 y Ley Orgánica 3/2018)</div>
            <div>
              Desarrollado con amor para la comunidad juvenil de Bartimeo
            </div>
            <div className="text-[10px] text-white/50">
              Hecho por Antonio Barbado (servidor)
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
