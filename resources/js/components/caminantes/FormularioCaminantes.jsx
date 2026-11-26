import React, { useState, useEffect } from 'react';
import PasoCaminanteInfo from './PasoCaminanteInfo';
import PasoCaminanteDatos from './PasoCaminanteDatos';
import PasoCaminanteFamiliar2 from './PasoCaminanteFamiliar2';
import PantallaExitoCaminante from './PantallaExitoCaminante';
import { MODO_DEMO } from '../../config';
import { ArrowLeft, ArrowRight, Send, AlertCircle } from 'lucide-react';
import { apiFetch, obtenerClaveIdempotencia, borrarClaveIdempotencia } from '../../api';

const STORAGE_KEY = 'bartimeo_caminantes_borrador_v1';

const INITIAL_FORM = {
  // Sección 1: Familiar 1 (Tutor que inscribe)
  familiar1Email: '',
  familiar1Nombre: '',
  familiar1Dni: '',
  familiar1Telefono: '',
  aceptaRgpd: false,
  // Sección 2: Participante (Caminante 15-17 años)
  nombre: '',
  apellidos: '',
  movil: '',
  email: '',
  colegio: '',
  anioNacimiento: '',
  genero: '',
  inscripcionesPrevias: '',
  primeraVezCristoRey: '',
  bautismoRecibido: false,
  primeraComunionRecibida: false,
  familiaresAdicionales: [],
  direccion: '',
  codigoPostal: '',
  localidad: 'Córdoba',
  sacramentos: '',
  tallaCamiseta: '',
  quienInvita: '',
  quienInvitaTelefono: '',
  listaEsperaPrevia: 'No',
  vieneConAlguien: '',
  tieneAlergia: 'No',
  alergiaDetalle: '',
  trastornoSalud: '',
  medicacion: '',
  // Sección 3: Familiar 2
  familiar2Nombre: '',
  familiar2Telefono: '',
  familiar2Email: ''
};

const TITULOS_PASOS = [
  'Convocatoria y Tutor',
  'Datos del Participante',
  'Salud y Segundo Familiar'
];

export default function FormularioCaminantes({ onIrAPortada }) {
  const [pasoActual, setPasoActual] = useState(0);
  const totalPasos = 3;

  const [formData, setFormData] = useState(INITIAL_FORM);

  const [errors, setErrors] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [caminanteCreado, setCaminanteCreado] = useState(null);
  const [errorGlobal, setErrorGlobal] = useState('');
  const [plazas, setPlazas] = useState(null);
  const [catalogos, setCatalogos] = useState({ talla_caminante: [] });

  useEffect(() => {
    Promise.all([
      apiFetch('/api/plazas/caminantes').then((r) => r.ok ? r.json() : null),
      apiFetch('/api/catalogos').then((r) => r.ok ? r.json() : null)
    ]).then(([plazasData, catalogosData]) => {
      if (plazasData) setPlazas(plazasData);
      if (catalogosData) setCatalogos(catalogosData);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Almacenamiento deshabilitado. */ }
  }, []);

  const updateField = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    if (errors[campo]) {
      setErrors((prev) => ({ ...prev, [campo]: undefined }));
    }
    setErrorGlobal('');
  };

  const irSiguiente = () => {
    setErrorGlobal('');
    if (!MODO_DEMO && pasoActual === 0 && (!formData.aceptaRgpd || ['familiar1Nombre', 'familiar1Dni',
        'familiar1Telefono', 'familiar1Email'].some((campo) => !formData[campo].trim()))) {
      setErrorGlobal('Completa los datos del tutor y acepta la información de protección de datos.');
      return;
    }
    if (!MODO_DEMO && pasoActual === 1) {
      const nextErrors = {};
      if (!formData.nombre?.trim()) nextErrors.nombre = 'Indica el nombre.';
      if (!formData.tallaCamiseta) nextErrors.tallaCamiseta = 'Selecciona una talla.';
      if (!formData.colegio?.trim()) nextErrors.colegio = 'Indica el colegio.';
      if (!formData.apellidos?.trim()) nextErrors.apellidos = 'Indica los apellidos.';
      if (!/^\d{4}$/.test(String(formData.anioNacimiento || ''))) nextErrors.anioNacimiento = 'Indica un año de cuatro cifras.';
      if (!formData.genero) nextErrors.genero = 'Selecciona niño o niña.';
      if (!/^\d+$/.test(formData.inscripcionesPrevias) || ![true, false].includes(formData.primeraVezCristoRey)) {
        nextErrors.experiencia = 'Completa las dos preguntas de experiencia.';
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) {
        setErrorGlobal('Revisa los campos señalados antes de continuar.');
        return;
      }
    }
    setPasoActual((prev) => Math.min(prev + 1, totalPasos - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const irAnterior = () => {
    setErrorGlobal('');
    setPasoActual((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnviar = async (e) => {
    if (e) e.preventDefault();
    setErrorGlobal('');
    if (MODO_DEMO) {
      setCaminanteCreado(formData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setEnviando(true);

    if (!formData.anioNacimiento || !formData.genero || formData.primeraVezCristoRey === '') {
      setErrors({ anioNacimiento: !formData.anioNacimiento ? 'Campo obligatorio.' : undefined,
        genero: !formData.genero ? 'Campo obligatorio.' : undefined,
        experiencia: formData.primeraVezCristoRey === '' ? 'Responde Sí o No.' : undefined });
      setErrorGlobal('Completa el año de nacimiento, el grupo y la experiencia previa.');
      setEnviando(false);
      return;
    }
    if (plazas && (!plazas.disponibles.total || !plazas.disponibles[formData.genero === 'nino' ? 'ninos' : 'ninas'])) {
      setErrorGlobal('Ya no quedan plazas disponibles para este grupo.');
      setEnviando(false);
      return;
    }

    const datosAEnviar = {
      ...formData,
      anioNacimiento: Number(formData.anioNacimiento),
      inscripcionesPrevias: Number(formData.inscripcionesPrevias)
    };

    try {
      const res = await apiFetch('/api/caminantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': obtenerClaveIdempotencia('caminantes')
        },
        body: JSON.stringify(datosAEnviar)
      });

      const data = await res.json();

      if (data.plazas) setPlazas(data.plazas);

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la inscripción de caminante.');
      }

      setCaminanteCreado(data.caminante || datosAEnviar);
      setSubmitted(true);
      borrarClaveIdempotencia('caminantes');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Silencioso
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorGlobal(err.message || 'Error de conexión con el servidor. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (submitted) {
    return <PantallaExitoCaminante caminante={caminanteCreado} onIrAPortada={onIrAPortada} demo={MODO_DEMO} />;
  }

  return (
    <div>
      {/* Alerta de error global */}
      {errorGlobal && (
        <div className="alert-box alert-warning" role="alert" aria-atomic="true" style={{ backgroundColor: '#FFEBEE', borderColor: '#FFCDD2', color: '#C62828', marginBottom: '16px' }}>
          <AlertCircle size={18} />
          <span>{errorGlobal}</span>
        </div>
      )}

      {/* Ventana 0: Convocatoria y Tutor */}
      {pasoActual === 0 && (
        <PasoCaminanteInfo
          formData={formData}
          updateField={updateField}
          errors={errors}
        />
      )}

      {/* Ventana 1: Datos Personales del Participante */}
      {pasoActual === 1 && (
        <PasoCaminanteDatos
          formData={formData}
          updateField={updateField}
          errors={errors}
          catalogos={catalogos}
          plazas={MODO_DEMO ? null : plazas}
        />
      )}

      {/* Ventana 2: Salud, Alergias y Familiar 2 */}
      {pasoActual === 2 && (
        <PasoCaminanteFamiliar2
          formData={formData}
          updateField={updateField}
          errors={errors}
        />
      )}

      {/* Botones de navegación entre ventanas idénticos a Servidores */}
      <div className="form-nav">
        {pasoActual > 0 ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={irAnterior}
            disabled={enviando}
          >
            <ArrowLeft size={16} /> Anterior
          </button>
        ) : <div />}

        {pasoActual < totalPasos - 1 ? (
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
  );
}
