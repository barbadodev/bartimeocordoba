import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PasoInfo from './components/PasoInfo';
import PasoPersonales from './components/PasoPersonales';
import PasoServicio from './components/PasoServicio';
import PasoEmergencia from './components/PasoEmergencia';
import PantallaExito from './components/PantallaExito';
import PanelAdmin from './components/PanelAdmin';
import PanelRutas from './components/PanelRutas';
import FormularioCaminantes from './components/caminantes/FormularioCaminantes';
import { MODO_DEMO } from './config';
import LandingPage from './components/landing/LandingPage';
import { ArrowLeft, ArrowRight, Send, AlertCircle, Compass, Users, Home, Lock, ShieldCheck } from 'lucide-react';
import { INFO_RETIRO } from './tema';
import { apiFetch, PARROQUIA_SLUG, rutaParroquia, conservarAccesoCoordinacion, obtenerClaveIdempotencia, borrarClaveIdempotencia } from './api';

const STORAGE_KEY = 'bartimeo_servidores_borrador_v1';

const INITIAL_FORM = {
  nombre: '',
  apellidos: '',
  movil: '',
  email: '',
  fechaNacimiento: '',
  direccion: '',
  codigoPostal: '',
  localidad: 'Córdoba',
  bartimeoOrigen: '',
  haServido: '',
  cuantasVeces: '',
  serviciosHechos: [],
  serviciosOtro: '',
  montajeJueves: '',
  tallaCamisetaBlanca: '',
  tallaCamisetaGris: '',
  tallaSudadera: '',
  alergias: '',
  manejaExcel: '',
  emergenciaNombre: '',
  emergenciaTelefono: '',
  emergenciaRelacion: '',
  emergenciaEmail: '',
  aceptaRgpd: false
};

// Determina si la URL actual corresponde a la página privada de coordinación
function verificarEsRutaCoordinacion() {
  const path = window.location.pathname.toLowerCase().split('/').filter(Boolean).at(-1) || '';
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  return (
    (path === 'coordinacion' || path === 'coordinacion.html') ||
    (path === 'admin' || path === 'admin.html') ||
    hash.includes('coordinacion') ||
    hash.includes('admin') ||
    search.includes('admin=true') ||
    search.includes('coordinacion=true') ||
    search.includes('pwa=coord')
  );
}

function verificarEsRutaMapa() {
  const path = window.location.pathname.toLowerCase().split('/').filter(Boolean).at(-1) || '';
  return path === 'mapa' || path === 'mapa.html';
}

// Determina si la URL actual corresponde al formulario de caminantes
function verificarEsRutaCaminantes() {
  const path = window.location.pathname.toLowerCase().split('/').filter(Boolean).at(-1) || '';
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  return (
    (path === 'caminantes' || path === 'caminantes.html') ||
    hash.includes('caminantes') ||
    search.includes('caminantes') ||
    search.includes('pwa=caminantes')
  );
}

// Determina si la URL actual corresponde al formulario de servidores
function verificarEsRutaServidores() {
  const path = window.location.pathname.toLowerCase().split('/').filter(Boolean).at(-1) || '';
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  return (
    (path === 'servidores' || path === 'servidores.html') ||
    hash.includes('servidores') ||
    search.includes('servidores') ||
    search.includes('pwa=servidores')
  );
}

function obtenerVistaInicial() {
  if (verificarEsRutaMapa()) return 'mapa';
  if (verificarEsRutaCoordinacion()) return 'coordinacion';
  if (verificarEsRutaCaminantes()) return 'caminantes';
  if (verificarEsRutaServidores()) return 'servidores';
  return 'landing';
}

export default function App() {
  const [vista, setVista] = useState(obtenerVistaInicial);
  const [pantallaActual, setPantallaActual] = useState(0); // 0: Convocatoria, 1: Personales, 2: Servicio, 3: Emergencia
  const totalPantallas = 4;

  const [formData, setFormData] = useState(INITIAL_FORM);

  const [errors, setErrors] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [servidorCreado, setServidorCreado] = useState(null);
  const [errorGlobal, setErrorGlobal] = useState('');

  const [invitacion, setInvitacion] = useState('');
  const [parroquias, setParroquias] = useState([]);
  const nombreParroquia = parroquias.find((p) => p.slug === PARROQUIA_SLUG)?.nombre || (PARROQUIA_SLUG === 'cristorey' ? 'Cristo Rey' : PARROQUIA_SLUG);
  useEffect(() => {
    apiFetch('/api/parroquias').then((r) => r.ok ? r.json() : []).then(setParroquias).catch(() => {});
  }, []);
  const leerClaveEnlace = () => new URLSearchParams(window.location.hash.slice(1)).get('invitacion') || '';
  const [claveEnlace, setClaveEnlace] = useState(leerClaveEnlace);
  const [validandoEnlace, setValidandoEnlace] = useState(false);
  const [errorEnlace, setErrorEnlace] = useState('');
  const servidorAutorizado = MODO_DEMO || Boolean(claveEnlace && invitacion === claveEnlace);

  useEffect(() => {
    if (vista !== 'servidores' || MODO_DEMO || !claveEnlace) return;
    const controller = new AbortController();
    setInvitacion('');
    setValidandoEnlace(true);
    setErrorEnlace('');
    apiFetch('/api/servidores/invitacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave: claveEnlace }),
      signal: controller.signal
    }).then((res) => {
      if (!res.ok) throw new Error('La invitación ya no está activa. Pide un enlace nuevo a coordinación.');
      if (!controller.signal.aborted) setInvitacion(claveEnlace);
    }).catch((error) => {
      if (!controller.signal.aborted) setErrorEnlace(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setValidandoEnlace(false);
    });
    return () => controller.abort();
  }, [vista, claveEnlace]);

  // Escuchar cambios de URL en el navegador (popstate y hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      setVista(obtenerVistaInicial());
      setClaveEnlace(leerClaveEnlace());

    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Actualizar dinámicamente iconos, título y manifiesto según la vista activa
  useEffect(() => {
    const iconLinks = document.querySelectorAll("link[rel*='icon']");
    const appleTouchLinks = document.querySelectorAll("link[rel='apple-touch-icon']");
    const manifestLink = document.querySelector("link[rel='manifest']");
    const appleTitleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']");

    if (vista === 'coordinacion') {
      document.title = 'bartimeocordoba.org | Coordinación';
      iconLinks.forEach(el => {
        el.href = '/logo-coordinacion.png';
      });
      appleTouchLinks.forEach(el => {
        el.href = '/apple-touch-icon-coordinacion.png';
      });
      if (manifestLink) {
        manifestLink.href = '/manifest-coordinacion.json';
      }
      if (appleTitleMeta) {
        appleTitleMeta.content = 'Bartimeo Coord';
      }
    } else if (vista === 'caminantes') {
      document.title = 'bartimeocordoba.org | Inscripción Caminantes';
      iconLinks.forEach(el => {
        el.href = '/logo-bartimeo.png';
      });
      appleTouchLinks.forEach(el => {
        el.href = '/apple-touch-icon.png';
      });
      if (manifestLink) {
        manifestLink.href = '/manifest-caminantes.json';
      }
      if (appleTitleMeta) {
        appleTitleMeta.content = 'Caminantes';
      }
    } else if (vista === 'servidores') {
      document.title = 'bartimeocordoba.org | Inscripción Servidores';
      iconLinks.forEach(el => {
        el.href = '/logo-bartimeo.png';
      });
      appleTouchLinks.forEach(el => {
        el.href = '/apple-touch-icon.png';
      });
      if (manifestLink) {
        manifestLink.href = '/manifest.json';
      }
      if (appleTitleMeta) {
        appleTitleMeta.content = 'Servidores';
      }
    } else {
      document.title = `Bartimeo Córdoba • ${INFO_RETIRO.edicion} Retiro Cristo Rey (${INFO_RETIRO.caminantes.fechas})`;
      iconLinks.forEach(el => {
        el.href = '/logo-bartimeo.png';
      });
      appleTouchLinks.forEach(el => {
        el.href = '/apple-touch-icon.png';
      });
      if (manifestLink) {
        manifestLink.href = '/manifest.json';
      }
      if (appleTitleMeta) {
        appleTitleMeta.content = 'Bartimeo';
      }
    }
  }, [vista]);

  useEffect(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Almacenamiento deshabilitado. */ }
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setErrorGlobal('');
  };

  const irSiguiente = () => {
    const campos = pantallaActual === 1
      ? ['nombre', 'apellidos', 'movil', 'email', 'fechaNacimiento', 'direccion', 'localidad', 'bartimeoOrigen']
      : pantallaActual === 2 ? ['haServido', 'montajeJueves', 'alergias'] : [];
    const fallos = Object.fromEntries(campos.filter((campo) => !String(formData[campo] ?? '').trim())
      .map((campo) => [campo, 'Completa este campo.']));
    if (pantallaActual === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      fallos.email = 'Indica un correo válido.';
    }
    if (pantallaActual === 2 && formData.haServido === 'Sí' && !/^[1-9]\d*$/.test(formData.cuantasVeces)) {
      fallos.cuantasVeces = 'Indica un número entero mayor que cero.';
    }
    setErrors(MODO_DEMO ? {} : fallos);
    if (!MODO_DEMO && Object.keys(fallos).length) {
      setErrorGlobal('Revisa los campos señalados antes de continuar.');
      return;
    }
    setErrorGlobal('');
    setPantallaActual(prev => Math.min(prev + 1, totalPantallas - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const irAnterior = () => {
    setPantallaActual(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnviar = async () => {
    setErrorGlobal('');
    if (MODO_DEMO) {
      setServidorCreado(formData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const emergencia = ['emergenciaNombre', 'emergenciaTelefono', 'emergenciaRelacion'];
    const faltan = emergencia.filter((campo) => !formData[campo].trim());
    if (faltan.length) {
      setErrors(Object.fromEntries(faltan.map((campo) => [campo, 'Completa este campo.'])));
      setErrorGlobal('Completa los datos del contacto de emergencia.');
      return;
    }
    if (!formData.aceptaRgpd) {
      setErrorGlobal('Acepta la información de protección de datos para continuar.');
      return;
    }
    setEnviando(true);
    try {
      const res = await apiFetch('/api/servidores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Invitacion': invitacion,
          'Idempotency-Key': obtenerClaveIdempotencia('servidores')
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la inscripción');
      }

      setServidorCreado(data.servidor || formData);
      setSubmitted(true);
      borrarClaveIdempotencia('servidores');
      localStorage.removeItem(STORAGE_KEY);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorGlobal(err.message || 'No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  // NAVEGACIÓN ENTRE VISTAS
  const irAPortada = () => {
    if (window.history.pushState) {
        window.history.pushState({}, '', rutaParroquia());
    }
    window.location.hash = '';
    setVista('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const irACaminantes = () => {
    if (window.history.pushState) {
      window.history.pushState({}, '', rutaParroquia('caminantes'));
    }
    window.location.hash = 'caminantes';
    setVista('caminantes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const irACoordinacion = () => {
    if (window.history.pushState) {
      window.history.pushState({}, '', conservarAccesoCoordinacion(rutaParroquia('coordinacion')));
    }
    setVista('coordinacion');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (vista === 'mapa') return <PanelRutas />;

  // 1. SI LA RUTA ES COORDINACIÓN: PANEL DE ADMINISTRACIÓN
  if (vista === 'coordinacion') {
    return (
      <PanelAdmin onIrAFormulario={irAPortada} pestanaInicial="inscripciones" />
    );
  }

  // 2. SI LA RUTA ES CAMINANTES: FORMULARIO DE CAMINANTES
  if (vista === 'caminantes') {
    return (
      <div className="container" data-demo={MODO_DEMO || undefined}>
        {/* Barra superior para volver a portada */}
        <div style={{ marginBottom: '12px' }}>
          <button
            type="button"
            onClick={irAPortada}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5C1824',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowLeft size={14} /> Volver a la portada de Bartimeo
          </button>
        </div>

        <Header />
        <FormularioCaminantes
          onIrAPortada={irAPortada}
        />
        <footer style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#8C7A7D'
        }}>
          <span>{INFO_RETIRO.edicion} Bartimeo Córdoba • Parroquia {nombreParroquia}</span>
        </footer>
      </div>
    );
  }

  // 3. SI LA RUTA ES SERVIDORES: FORMULARIO DE SERVIDORES
  if (vista === 'servidores') {
    // Si no cuenta con autorización mediante el enlace privado, mostrar aviso de convocatoria exclusiva
    if (!servidorAutorizado) {
      return (
        <div className="container" style={{ maxWidth: '520px', paddingTop: '40px' }}>
          <div className="card" style={{ padding: '36px 24px', textAlign: 'center', boxShadow: '0 8px 30px rgba(92, 24, 36, 0.08)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FAF6F3',
              border: '2px solid #5C1824',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#5C1824'
            }}>
              <Lock size={30} />
            </div>

            <h2 style={{
              fontFamily: 'Cinzel, Georgia, serif',
              fontSize: '1.4rem',
              color: '#5C1824',
              marginBottom: '10px',
              fontWeight: 700
            }}>
              Convocatoria de servidores
            </h2>

            <p style={{
              fontSize: '0.9rem',
              color: '#6E5C60',
              lineHeight: 1.55,
              marginBottom: '24px'
            }}>
              {claveEnlace && validandoEnlace ? 'Comprobando la invitación…' :
                (claveEnlace && errorEnlace) || 'Abre el enlace de invitación que te ha enviado coordinación.'}
            </p>

            <div style={{ borderTop: '1px solid #E8DFDA', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={irAPortada}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#5C1824',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowLeft size={14} /> Volver a la portada de Bartimeo
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container" data-demo={MODO_DEMO || undefined}>
        {/* Barra superior para volver a portada */}
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={irAPortada}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5C1824',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowLeft size={14} /> Volver a la portada de Bartimeo
          </button>

          <button
            type="button"
            onClick={irACaminantes}
            style={{
              background: '#FAF6F3',
              border: '1px solid #5C1824',
              color: '#5C1824',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Formulario Caminantes →
          </button>
        </div>

        <Header />

        {submitted ? (
          <PantallaExito servidor={servidorCreado} demo={MODO_DEMO} />
        ) : (
          <div>
            {/* Alerta de error global */}
            {errorGlobal && (
              <div className="alert-box alert-warning" role="alert" aria-atomic="true" style={{ backgroundColor: '#FFEBEE', borderColor: '#FFCDD2', color: '#C62828' }}>
                <AlertCircle size={18} />
                <span>{errorGlobal}</span>
              </div>
            )}

            {/* Ventana 0: Convocatoria del Retiro */}
            {pantallaActual === 0 && (
              <PasoInfo />
            )}

            {/* Ventana 1: Datos Personales */}
            {pantallaActual === 1 && (
              <PasoPersonales
                formData={formData}
                updateField={updateField}
                errors={errors}
              />
            )}

            {/* Ventana 2: Experiencia, Ropa, Montaje y Alergias */}
            {pantallaActual === 2 && (
              <PasoServicio
                formData={formData}
                updateField={updateField}
                errors={errors}
              />
            )}

            {/* Ventana 3: Contacto de Emergencia */}
            {pantallaActual === 3 && (
              <div>
                <PasoEmergencia
                  formData={formData}
                  updateField={updateField}
                  errors={errors}
                />

                {/* Consentimiento de datos */}
                <div className="card" style={{ padding: '14px', background: '#FAF6F4', border: '1px solid #E8DFDA', fontSize: '0.8rem', color: '#6E5C60' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: '#2A1B1E', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={formData.aceptaRgpd === true}
                      onChange={(e) => updateField('aceptaRgpd', e.target.checked)}
                      style={{ accentColor: '#5C1824', width: '16px', height: '16px', marginTop: '2px' }}
                    />
                    <span>
                      Acepto el tratamiento de mis datos de contacto y salud para la organización y seguridad del {INFO_RETIRO.edicion} Retiro Bartimeo ({nombreParroquia}).
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Botones de navegación entre ventanas */}
            <div className="form-nav">
              {pantallaActual > 0 ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={irAnterior}
                  disabled={enviando}
                >
                  <ArrowLeft size={16} /> Anterior
                </button>
              ) : null}

              {pantallaActual < totalPantallas - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={irSiguiente}
                >
                  Siguiente <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEnviar}
                  disabled={enviando}
                  style={{
                    background: 'linear-gradient(135deg, #5C1824 0%, #3B0E16 100%)',
                    boxShadow: '0 4px 14px rgba(92, 24, 36, 0.3)'
                  }}
                >
                  {enviando ? (
                    'Registrando...'
                  ) : (
                    <>
                      <Send size={18} /> Enviar Inscripción
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        <footer style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#8C7A7D'
        }}>
          <span>{INFO_RETIRO.edicion} Bartimeo Córdoba • Parroquia {nombreParroquia}</span>
        </footer>
      </div>
    );
  }

  // 4. PORTADA POR DEFECTO (LANDING PAGE ESTILO AUTE)
  return (
    <LandingPage
      onIrACaminantes={irACaminantes}
      onIrACoordinacion={irACoordinacion}
    />
  );
}

