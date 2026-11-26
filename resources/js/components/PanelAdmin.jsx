import { prepararCsv } from '../csv';
import EditarInscripcion from './EditarInscripcion';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Truck, AlertTriangle, Shirt, Download, Search, 
  RefreshCw, CheckCircle2, HeartHandshake, Eye, Trash2,
  Lock, LogOut, ArrowUpDown, ExternalLink, ShieldCheck, Printer, X,
  ClipboardList, Phone, MessageCircle, Smartphone, LayoutGrid, Compass
} from 'lucide-react';
import { apiFetch, borrarClaveAccesoCoordinacion, getClaveAccesoCoordinacion, recordarClaveAccesoCoordinacion, conservarAccesoCoordinacion, PARROQUIA_SLUG, EDICION_SLUG, rutaParroquia } from '../api';
import PanelAsistencias from './PanelAsistencias';
import PanelCaminantes from './PanelCaminantes';
import PanelConfiguracion from './PanelConfiguracion';
import PanelRutas from './PanelRutas';
import { INFO_RETIRO } from '../tema';

const TOKEN_KEY = `bartimeo_coord_token_${PARROQUIA_SLUG}`;
const leerEnlaceCoordinacion = getClaveAccesoCoordinacion;

export default function PanelAdmin({ onIrAFormulario, pestanaInicial = 'inscripciones' }) {
  // Pestaña principal activa: 'inscripciones' (servidores), 'caminantes' o 'asistencias'
  const [ediciones, setEdiciones] = useState([]);
  const [filtroParroquia, setFiltroParroquia] = useState('');
  const [filtroServicio, setFiltroServicio] = useState('');
  const [tabPrincipal, setTabPrincipal] = useState(() => {
    const solicitada = new URLSearchParams(window.location.search).get('seccion');
    return ['inscripciones', 'caminantes', 'asistencias', 'configuracion', 'rutas'].includes(solicitada)
      ? solicitada
      : pestanaInicial;
  });

  // Modo de visualización en inscripciones: 'tarjetas' (ideal móvil) o 'tabla' (escritorio)
  const [vistaModo, setVistaModo] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'tarjetas' : 'tabla';
  });

  // El acceso de Cristo Rey se obtiene mediante el enlace privado de coordinación.
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem(TOKEN_KEY) || '';
      } catch (e) {
        console.warn('Error analizando Magic Link de coordinación:', e);
      }
    }

    return '';
  });
  const [loginError, setLoginError] = useState('');
  const [password, setPassword] = useState('');
  const [canjeando, setCanjeando] = useState(() => Boolean(leerEnlaceCoordinacion()));
  const canjeIniciado = useRef(false);

  useEffect(() => {
    const clave = leerEnlaceCoordinacion();
    if (!clave || canjeIniciado.current) return;
    canjeIniciado.current = true;
    recordarClaveAccesoCoordinacion(clave);
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    apiFetch('/api/coordinacion/enlaces/canjear', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave })
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || 'No se pudo abrir el enlace de acceso.');
      try { sessionStorage.setItem(TOKEN_KEY, data.token); } catch { /* La sesión permanece en memoria. */ }
      setToken(data.token);
    }).catch((error) => setLoginError(error.message))
      .finally(() => setCanjeando(false));
  }, []);

  const entrar = async (event) => {
    event.preventDefault();
    setLoginError('');
    setCanjeando(true);
    try {
      const res = await apiFetch('/api/coordinacion/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || 'No se pudo iniciar sesión.');
      try { sessionStorage.setItem(TOKEN_KEY, data.token); } catch { /* La sesión sigue en memoria. */ }
      setToken(data.token);
      setPassword('');
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setCanjeando(false);
    }
  };

  // Estados de datos
  const [servidores, setServidores] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [caminantes, setCaminantes] = useState([]);
  const [metricasCaminantes, setMetricasCaminantes] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroJueves, setFiltroJueves] = useState('todos');
  const [filtroAlergias, setFiltroAlergias] = useState('todos');
  const [filtroExperiencia, setFiltroExperiencia] = useState('todos');
  const [ordenCampo, setOrdenCampo] = useState('fechaRegistro');
  const [ordenAsc, setOrdenAsc] = useState(false);

  // Modal de ficha
  const [servidorSeleccionado, setServidorSeleccionado] = useState(null);
  const [servidorAEliminar, setServidorAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Comprobar autenticación y cargar datos al montar
  useEffect(() => {
    if (token) {
      cargarDatos(token);
      apiFetch('/api/ediciones', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : []).then(setEdiciones).catch(() => {});

    }
  }, [token]);

  const handleLogout = () => {
    if (token) apiFetch('/api/coordinacion/logout', {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
    sessionStorage.removeItem(TOKEN_KEY);
    borrarClaveAccesoCoordinacion();
    setToken('');
    setServidores([]);
    setMetricas(null);
    setCaminantes([]);
    setMetricasCaminantes(null);
  };

  const cargarDatos = async (authToken) => {
    const tokenAUsar = authToken || token;
    if (!tokenAUsar) return;

    setCargando(true);
    setErrorCarga('');

    try {
      const headers = {
        'Authorization': `Bearer ${tokenAUsar}`,
        'Content-Type': 'application/json'
      };

      const [resServidores, resMetricas, resCaminantes, resMetricasCam] = await Promise.all([
        apiFetch('/api/servidores', { headers }),
        apiFetch('/api/metricas', { headers }),
        apiFetch('/api/caminantes', { headers }),
        apiFetch('/api/metricas/caminantes', { headers })
      ]);

      if (resServidores.status === 401 || resMetricas.status === 401 || resCaminantes.status === 401) {
        handleLogout();
        setLoginError('Tu sesión ha expirado o no es válida. Por favor, introduce la clave de nuevo.');
        return;
      }

      if (resServidores.ok) {
        const data = await resServidores.json();
        setServidores(data);
      }
      if (resMetricas.ok) {
        const dataMetricas = await resMetricas.json();
        setMetricas(dataMetricas);
      }
      if (resCaminantes.ok) {
        const dataCaminantes = await resCaminantes.json();
        setCaminantes(dataCaminantes);
      }
      if (resMetricasCam.ok) {
        const dataMetricasCam = await resMetricasCam.json();
        setMetricasCaminantes(dataMetricasCam);
      }
    } catch (err) {
      setErrorCarga('No se pudieron obtener los datos. Comprueba la conexión con el servidor.');
      console.error('Error cargando datos de coordinación:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarServidor = async () => {
    if (!servidorAEliminar) return;
    setEliminando(true);

    try {
      const res = await apiFetch(`/api/servidores/${servidorAEliminar.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      // Actualizar estado local
      setServidores(prev => prev.filter(s => s.id !== servidorAEliminar.id));
      setServidorAEliminar(null);
      if (servidorSeleccionado?.id === servidorAEliminar.id) {
        setServidorSeleccionado(null);
      }
      // Recargar métricas
      cargarDatos(token);
      apiFetch('/api/ediciones', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : []).then(setEdiciones).catch(() => {});

    } catch (err) {
      alert('Error al eliminar registro: ' + err.message);
    } finally {
      setEliminando(false);
    }
  };

  // Filtrado y ordenación para la tabla de escritorio
  const servidoresFiltrados = servidores
    .filter(s => {
      const texto = (
        (s.nombre || '') + ' ' + 
        (s.apellidos || '') + ' ' + 
        (s.email || '') + ' ' + 
        (s.movil || '') + ' ' + 
        (s.localidad || '') + ' ' + 
        (s.bartimeoOrigen || '') + ' ' +
        (s.alergias || '')
      ).toLowerCase();

      const textoMatch = texto.includes(busqueda.toLowerCase());

      const juevesMatch = 
        filtroJueves === 'todos' ? true :
        filtroJueves === 'si' ? s.montajeJueves === 'Sí' : s.montajeJueves === 'No';

      const alergiaMatch = 
        filtroAlergias === 'todos' ? true :
        filtroAlergias === 'con_alergia' 
          ? ((s.alergias || '').trim().toLowerCase() !== 'ninguna' && (s.alergias || '').trim().toLowerCase() !== 'no' && (s.alergias || '').trim() !== '')
          : ((s.alergias || '').trim().toLowerCase() === 'ninguna' || (s.alergias || '').trim().toLowerCase() === 'no' || (s.alergias || '').trim() === '');

      const expMatch = 
        filtroExperiencia === 'todos' ? true :
        filtroExperiencia === 'con_exp' ? s.haServido === 'Sí' : s.haServido === 'No';

      return textoMatch && juevesMatch && alergiaMatch && expMatch &&
        (!filtroParroquia || s.bartimeoOrigen === filtroParroquia) &&
        (!filtroServicio || s.serviciosHechos?.includes(filtroServicio));
    })
    .sort((a, b) => {
      let valA = a[ordenCampo] || '';
      let valB = b[ordenCampo] || '';

      if (ordenCampo === 'nombre') {
        valA = `${a.nombre} ${a.apellidos}`.toLowerCase();
        valB = `${b.nombre} ${b.apellidos}`.toLowerCase();
      }

      if (valA < valB) return ordenAsc ? -1 : 1;
      if (valA > valB) return ordenAsc ? 1 : -1;
      return 0;
    });

  const cambiarOrden = (campo) => {
    if (ordenCampo === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenCampo(campo);
      setOrdenAsc(true);
    }
  };

  // Exportar a Excel (CSV compatible con tildes y caracteres españoles)
  const exportarCSV = () => {
    if (!servidores.length) return;
    
    const headers = [
      'ID', 'Fecha Registro', 'Nombre', 'Apellidos', 'Móvil', 'Email', 
      'Fecha Nacimiento', 'Dirección', 'Código Postal', 'Localidad', 
      'Parroquia de procedencia', 'Ha Servido Antes', 'Veces Servidas',
      'Servicios Anteriores', 'Otro Servicio', 'Montaje Jueves 4 de febrero',
      'Camiseta Blanca', 'Camiseta Gris', 'Sudadera', 'Alergias / Dieta', 
      'Maneja Excel', 'Contacto Emergencia (Tutor)', 'Teléfono Emergencia', 
      'Parentesco Emergencia', 'Email Emergencia'
    ];

    const rows = servidoresFiltrados.map(s => [
      s.id,
      s.fechaRegistro,
      s.nombre || '',
      s.apellidos || '',
      s.movil,
      s.email,
      s.fechaNacimiento,
      s.direccion || '',
      s.codigoPostal,
      s.localidad || '',
      s.bartimeoOrigen || '',
      s.haServido,
      s.cuantasVeces,
      Array.isArray(s.serviciosHechos) ? s.serviciosHechos.join(', ') : '',
      s.serviciosOtro || '',
      s.montajeJueves,
      s.tallaCamisetaBlanca || 'No',
      s.tallaCamisetaGris || 'No',
      s.tallaSudadera || 'No',
      s.alergias || '',
      s.manejaExcel,
      s.emergenciaNombre || '',
      s.emergenciaTelefono,
      s.emergenciaRelacion || '',
      s.emergenciaEmail || ''
    ]);

    const csvContent = prepararCsv(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `servidores-${INFO_RETIRO.edicion.toLowerCase()}-bartimeo-cordoba-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Si no está autenticado, mostramos la pantalla de login privado para coordinadores
  if (!token) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="login-card-desktop">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img
              src="/logo-coordinacion.png"
              alt="Bartimeo Coordinación"
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '20px',
                objectFit: 'contain',
                marginBottom: '14px',
                border: '1.5px solid #E8DFDA',
                boxShadow: '0 6px 18px rgba(92, 24, 36, 0.12)'
              }}
            />
            <div className="badge badge-wine" style={{ marginBottom: '8px' }}>
              Acceso Restringido Coordinación
            </div>
            <h1 className="title-serif" style={{ fontSize: '1.6rem', color: '#5C1824', marginBottom: '6px' }}>
              Panel de Coordinación
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#6E5C60' }}>
              {INFO_RETIRO.edicion} Retiro Bartimeo Córdoba • Exclusivo para Coordinadores
            </p>
          </div>

          {loginError && (
            <div className="alert-box alert-warning" style={{ backgroundColor: '#FFEBEE', borderColor: '#FFCDD2', color: '#C62828' }}>
              <AlertTriangle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          {canjeando ? <p role="status">Abriendo el portal…</p> : (
                        PARROQUIA_SLUG === 'cristorey'
              ? <p>Este panel se abre con el enlace privado de coordinación.</p>
              : <form onSubmit={entrar}>
                  <label htmlFor="clave-coordinacion">Contraseña de coordinación</label>
                  <input id="clave-coordinacion" type="password" autoComplete="current-password"
                    value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={128} />
                  <button type="submit" className="btn btn-primary">Entrar</button>
                </form>
          )}

          {onIrAFormulario && (
            <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #E8DFDA', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={onIrAFormulario}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6E5C60',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Volver al formulario público de inscripción
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista de Coordinador Autenticado (Optimizado para ORDENADOR / Pantalla Ancha)
  return (
    <div className="container-admin-desktop">
      {/* Barra Superior de Escritorio */}
      <div className="admin-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/logo-coordinacion.png"
            alt="Bartimeo Coordinación"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              objectFit: 'contain',
              border: '1px solid #E8DFDA',
              boxShadow: '0 2px 8px rgba(92, 24, 36, 0.08)'
            }}
          />
          <div>
            <h1 className="title-serif" style={{ fontSize: '1.6rem', margin: 0, color: '#5C1824' }}>
              Panel de Coordinación • {INFO_RETIRO.edicion} Bartimeo Córdoba
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => cargarDatos()}
            disabled={cargando}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Recargar datos actualizados del servidor"
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> {cargando ? 'Cargando...' : 'Actualizar'}
          </button>

          {tabPrincipal === 'inscripciones' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={exportarCSV}
              disabled={servidores.length === 0}
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              title="Descargar tabla completa de servidores en formato compatible con Excel"
            >
              <Download size={15} /> Exportar a Excel
            </button>
          )}

          {onIrAFormulario && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onIrAFormulario}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              title="Abrir formulario público de inscripción"
            >
              <ExternalLink size={14} /> Ver Formulario
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderRadius: '10px',
              border: '1px solid #FFCDD2',
              background: '#FFEBEE',
              color: '#C62828',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600
            }}
            title="Cerrar sesión segura de coordinador"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      {/* Pestañas Principales de Navegación del Panel */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '20px',
        borderBottom: '2px solid #E8DFDA',
        paddingBottom: '2px',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setTabPrincipal('inscripciones')}
          style={{
            flex: '1 1 140px',
            justifyContent: 'center',
            padding: '10px 16px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: tabPrincipal === 'inscripciones' ? '3px solid #5C1824' : '3px solid transparent',
            color: tabPrincipal === 'inscripciones' ? '#5C1824' : '#6E5C60',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={18} /> Servidores ({servidores.length})
        </button>

        <button
          type="button"
          onClick={() => setTabPrincipal('caminantes')}
          style={{
            flex: '1 1 140px',
            justifyContent: 'center',
            padding: '10px 16px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: tabPrincipal === 'caminantes' ? '3px solid #5C1824' : '3px solid transparent',
            color: tabPrincipal === 'caminantes' ? '#5C1824' : '#6E5C60',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Compass size={18} /> Caminantes ({caminantes.length})
        </button>

        <button
          type="button"
          onClick={() => setTabPrincipal('asistencias')}
          style={{
            flex: '1 1 140px',
            justifyContent: 'center',
            padding: '10px 16px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: tabPrincipal === 'asistencias' ? '3px solid #5C1824' : '3px solid transparent',
            color: tabPrincipal === 'asistencias' ? '#5C1824' : '#6E5C60',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <CheckCircle2 size={18} /> Asistencias
        </button>
        <button
          type="button"
          onClick={() => setTabPrincipal('rutas')}
          style={{
            flex: '1 1 140px', justifyContent: 'center', padding: '10px 16px', fontSize: '0.95rem',
            fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none',
            borderBottom: tabPrincipal === 'rutas' ? '3px solid #5C1824' : '3px solid transparent',
            color: tabPrincipal === 'rutas' ? '#5C1824' : '#6E5C60', display: 'inline-flex',
            alignItems: 'center', gap: '8px', transition: 'all 0.15s ease'
          }}
        >
          <LayoutGrid size={18} /> Mapa de pantallas
        </button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <label>Edición <select className="select-field" value={EDICION_SLUG || INFO_RETIRO.edicion.toLowerCase()}
          onChange={(e) => window.location.assign(conservarAccesoCoordinacion(rutaParroquia('coordinacion') + '?edicion=' + encodeURIComponent(e.target.value)))}>
          {ediciones.map((edicion) => <option key={edicion.slug} value={edicion.slug}>{edicion.nombre}</option>)}
        </select></label>
        <button type="button" className="btn btn-secondary" aria-pressed={tabPrincipal === 'configuracion'}
          onClick={() => setTabPrincipal('configuracion')}>Configuración</button>
      </div>
      {tabPrincipal === 'rutas' ? <PanelRutas onAbrirSeccion={setTabPrincipal} /> : tabPrincipal === 'configuracion' ? <PanelConfiguracion token={token} /> : tabPrincipal === 'asistencias' ? (
        <PanelAsistencias token={token} />
      ) : tabPrincipal === 'caminantes' ? (
        <PanelCaminantes
          token={token}
          caminantes={caminantes}
          metricas={metricasCaminantes}
          cargando={cargando}
          onRecargar={() => cargarDatos()}
        />
      ) : (
        <>
          {errorCarga && (
            <div className="alert-box alert-warning" style={{ backgroundColor: '#FFEBEE', borderColor: '#FFCDD2', color: '#C62828' }}>
              <AlertTriangle size={18} />
              <span>{errorCarga}</span>
            </div>
          )}

          {/* KPI Cards de Escritorio (5 columnas) */}
          <div className="desktop-kpi-grid">
        {/* Total Servidores */}
        <div className="card" style={{ padding: '20px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6E5C60', fontSize: '0.82rem', marginBottom: '8px' }}>
            <span>Total Servidores</span>
            <Users size={20} style={{ color: '#5C1824' }} />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#5C1824', lineHeight: 1 }}>
            {metricas?.total ?? servidores.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#6E5C60', marginTop: '6px' }}>
            Inscripciones confirmadas
          </div>
        </div>

        {/* Montaje Jueves 4 de febrero */}
        <div className="card" style={{ padding: '20px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6E5C60', fontSize: '0.82rem', marginBottom: '8px' }}>
            <span>Montaje Jueves 4 de febrero</span>
            <Truck size={20} style={{ color: '#D4A359' }} />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2A1B1E', lineHeight: 1 }}>
            {metricas?.montajeJueves ?? servidores.filter(s => s.montajeJueves === 'Sí').length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#2E7D32', fontWeight: 600, marginTop: '6px' }}>
            Disponibles para subir el jueves
          </div>
        </div>

        {/* Alergias / Dietas Médicas */}
        <div className="card" style={{ padding: '20px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6E5C60', fontSize: '0.82rem', marginBottom: '8px' }}>
            <span>Alergias / Dietas</span>
            <AlertTriangle size={20} style={{ color: '#C62828' }} />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#C62828', lineHeight: 1 }}>
            {metricas?.cuentaAlergias ?? servidores.filter(s => {
              const val = (s.alergias || '').trim().toLowerCase();
              return val !== '' && val !== 'ninguna' && val !== 'no';
            }).length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#C62828', fontWeight: 600, marginTop: '6px' }}>
            Requieren atención en cocina
          </div>
        </div>

        {/* Con Experiencia Previa */}
        <div className="card" style={{ padding: '20px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6E5C60', fontSize: '0.82rem', marginBottom: '8px' }}>
            <span>Han Servido Antes</span>
            <HeartHandshake size={20} style={{ color: '#2E7D32' }} />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2A1B1E', lineHeight: 1 }}>
            {metricas?.hanServidoAntes ?? servidores.filter(s => s.haServido === 'Sí').length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#6E5C60', marginTop: '6px' }}>
            Con experiencia en Bartimeo
          </div>
        </div>

        {/* Nuevos Servidores */}
        <div className="card" style={{ padding: '20px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6E5C60', fontSize: '0.82rem', marginBottom: '8px' }}>
            <span>Primer Servicio</span>
            <ShieldCheck size={20} style={{ color: '#1E88E5' }} />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2A1B1E', lineHeight: 1 }}>
            {metricas?.nuevosServidores ?? servidores.filter(s => s.haServido === 'No').length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#1E88E5', fontWeight: 600, marginTop: '6px' }}>
            Nuevas incorporaciones
          </div>
        </div>
      </div>

      {/* Desglose de Tallas de Ropa para Pedidos de Coordinación */}
      <div className="card" style={{ marginBottom: '24px', padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shirt size={20} style={{ color: '#5C1824' }} />
            <h2 className="title-serif" style={{ fontSize: '1.25rem', color: '#5C1824' }}>
              Conteo de ropa para el pedido
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', fontSize: '0.86rem' }}>
          {/* Camiseta Blanca */}
          <div style={{ background: '#FAF6F4', padding: '16px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #E8DFDA', paddingBottom: '6px' }}>
              <strong style={{ color: '#5C1824', fontSize: '0.92rem' }}>Camiseta BLANCA:</strong>
              <span className="badge badge-wine">
                {metricas?.desgloseTallas?.blanca 
                  ? Object.values(metricas.desgloseTallas.blanca).reduce((a, b) => a + b, 0)
                  : 0} uds.
              </span>
            </div>
            {metricas?.desgloseTallas?.blanca && Object.keys(metricas.desgloseTallas.blanca).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                {Object.entries(metricas.desgloseTallas.blanca).map(([talla, cant]) => (
                  <div key={talla} style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E8DFDA', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{talla}:</span>
                    <strong>{cant}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ color: '#6E5C60', fontStyle: 'italic' }}>Sin prendas solicitadas</span>
            )}
          </div>

          {/* Camiseta Gris */}
          <div style={{ background: '#FAF6F4', padding: '16px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #E8DFDA', paddingBottom: '6px' }}>
              <strong style={{ color: '#5C1824', fontSize: '0.92rem' }}>Camiseta GRIS:</strong>
              <span className="badge badge-wine">
                {metricas?.desgloseTallas?.gris 
                  ? Object.values(metricas.desgloseTallas.gris).reduce((a, b) => a + b, 0)
                  : 0} uds.
              </span>
            </div>
            {metricas?.desgloseTallas?.gris && Object.keys(metricas.desgloseTallas.gris).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                {Object.entries(metricas.desgloseTallas.gris).map(([talla, cant]) => (
                  <div key={talla} style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E8DFDA', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{talla}:</span>
                    <strong>{cant}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ color: '#6E5C60', fontStyle: 'italic' }}>Sin prendas solicitadas</span>
            )}
          </div>

          {/* Sudaderas */}
          <div style={{ background: '#FAF6F4', padding: '16px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #E8DFDA', paddingBottom: '6px' }}>
              <strong style={{ color: '#5C1824', fontSize: '0.92rem' }}>Sudadera:</strong>
              <span className="badge badge-wine">
                {metricas?.desgloseTallas?.sudadera 
                  ? Object.values(metricas.desgloseTallas.sudadera).reduce((a, b) => a + b, 0)
                  : 0} uds.
              </span>
            </div>
            {metricas?.desgloseTallas?.sudadera && Object.keys(metricas.desgloseTallas.sudadera).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                {Object.entries(metricas.desgloseTallas.sudadera).map(([talla, cant]) => (
                  <div key={talla} style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E8DFDA', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{talla}:</span>
                    <strong>{cant}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ color: '#6E5C60', fontStyle: 'italic' }}>Sin prendas solicitadas</span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda Responsiva */}
      <div className="card" style={{ padding: '16px 18px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'center' }}>
          {/* Campo de Búsqueda */}
          <div style={{ position: 'relative', gridColumn: '1 / -1' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por nombre, apellidos, teléfono, origen o alergias..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: '38px', height: '42px', fontSize: '0.9rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8C7A7D' }} />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '11px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8C7A7D'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select className="select-field" aria-label="Parroquia de procedencia" value={filtroParroquia} onChange={(e) => setFiltroParroquia(e.target.value)}>
            <option value="">Todas las parroquias de procedencia</option>
            {[...new Set(servidores.map((s) => s.bartimeoOrigen).filter(Boolean))].sort().map((v) => <option key={v}>{v}</option>)}
          </select>
          <select className="select-field" aria-label="Servicio anterior" value={filtroServicio} onChange={(e) => setFiltroServicio(e.target.value)}>
            <option value="">Todos los servicios anteriores</option>
            {[...new Set(servidores.flatMap((s) => s.serviciosHechos || []))].sort().map((v) => <option key={v}>{v}</option>)}
          </select>
          {/* Filtro Montaje Jueves */}
          <select
            className="select-field"
            value={filtroJueves}
            onChange={(e) => setFiltroJueves(e.target.value)}
            style={{ height: '42px', fontSize: '0.86rem' }}
          >
            <option value="todos">Montaje Jueves: Todos</option>
            <option value="si">Solo suben Jueves (Sí)</option>
            <option value="no">Llegan el Viernes (No)</option>
          </select>

          {/* Filtro Alergias */}
          <select
            className="select-field"
            value={filtroAlergias}
            onChange={(e) => setFiltroAlergias(e.target.value)}
            style={{ height: '42px', fontSize: '0.86rem' }}
          >
            <option value="todos">Alergias: Todas</option>
            <option value="con_alergia">Con Alergias / Dietas</option>
            <option value="sin_alergia">Sin alergias</option>
          </select>

          {/* Filtro Experiencia */}
          <select
            className="select-field"
            value={filtroExperiencia}
            onChange={(e) => setFiltroExperiencia(e.target.value)}
            style={{ height: '42px', fontSize: '0.86rem' }}
          >
            <option value="todos">Experiencia: Todos</option>
            <option value="con_exp">Con experiencia previa</option>
            <option value="sin_exp">Nuevos servidores</option>
          </select>
        </div>

        {/* Resumen de conteo y Selector de vista */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.84rem', color: '#6E5C60' }}>
          <span>
            Mostrando <strong>{servidoresFiltrados.length}</strong> de <strong>{servidores.length}</strong> servidores registrados
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`view-toggle-btn ${vistaModo === 'tarjetas' ? 'active' : ''}`}
              onClick={() => setVistaModo('tarjetas')}
              title="Vista en tarjetas táctiles (ideal móvil)"
            >
              <Smartphone size={14} /> Tarjetas
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${vistaModo === 'tabla' ? 'active' : ''}`}
              onClick={() => setVistaModo('tabla')}
              title="Vista en tabla de datos"
            >
              <LayoutGrid size={14} /> Tabla
            </button>
          </div>
        </div>
      </div>

      {/* Renderizado según la vista activa: Tarjetas Móviles o Tabla */}
      {vistaModo === 'tarjetas' ? (
        <div style={{ marginBottom: '24px' }}>
          {servidoresFiltrados.length === 0 ? (
            <div className="card" style={{ padding: '36px 20px', textAlign: 'center', color: '#6E5C60' }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
                No se han encontrado registros con los filtros actuales
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                Prueba a cambiar los términos de búsqueda o los selectores superiores.
              </div>
            </div>
          ) : (
            servidoresFiltrados.map((s, idx) => {
              const tieneAlergia = (s.alergias || '').trim().toLowerCase() !== 'ninguna' && 
                                   (s.alergias || '').trim().toLowerCase() !== 'no' && 
                                   (s.alergias || '').trim() !== '';
              const telLimpio = (s.movil || '').replace(/[^0-9]/g, '');

              return (
                <div key={s.id || idx} className="servidor-card-mobile">
                  {/* Encabezado de la tarjeta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#2A1B1E' }}>
                        {s.nombre} {s.apellidos}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6E5C60', marginTop: '2px' }}>
                        {s.localidad || 'Córdoba'} • <span className="badge badge-wine" style={{ fontSize: '0.72rem', padding: '1px 6px' }}>{s.bartimeoOrigen || 'Bartimeo'}</span>
                      </div>
                    </div>
                    {s.haServido === 'Sí' ? (
                      <span className="badge badge-gold" style={{ fontSize: '0.72rem', flexShrink: 0 }}>
                        ✓ Ya sirvió ({s.cuantasVeces || '1 vez'})
                      </span>
                    ) : (
                      <span className="badge badge-wine" style={{ fontSize: '0.72rem', background: '#E3F2FD', color: '#1565C0', border: '1px solid #BBDEFB', flexShrink: 0 }}>
                        ★ Primer Retiro
                      </span>
                    )}
                  </div>

                  {/* Badges de Logística y Salud */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.78rem' }}>
                    {s.montajeJueves === 'Sí' ? (
                      <span className="badge badge-green">
                        ✓ Sube Jueves 17
                      </span>
                    ) : (
                      <span style={{ background: '#F5F5F5', color: '#6E5C60', padding: '3px 8px', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                        Viernes 14h
                      </span>
                    )}

                    {tieneAlergia ? (
                      <span style={{
                        color: '#C62828',
                        background: '#FFEBEE',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        border: '1px solid #FFCDD2',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <AlertTriangle size={13} /> {s.alergias}
                      </span>
                    ) : (
                      <span style={{ color: '#2E7D32', background: '#F1F8E9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #DCEDC8' }}>
                        Sin alergias
                      </span>
                    )}

                    {(s.tallaCamisetaBlanca || s.tallaCamisetaGris || s.tallaSudadera) && (
                      <span style={{ background: '#FAF6F4', color: '#5C1824', padding: '3px 8px', borderRadius: '6px', border: '1px solid #E8DFDA', fontWeight: 600 }}>
                        👕 B: {s.tallaCamisetaBlanca || '-'} | G: {s.tallaCamisetaGris || '-'} | Sud: {s.tallaSudadera || '-'}
                      </span>
                    )}
                  </div>

                  {/* Botones de Contacto Directo Móvil */}
                  <div className="mobile-contact-bar">
                    <a
                      href={`tel:${s.movil}`}
                      className="btn-mobile-call"
                    >
                      <Phone size={14} /> Llamar ({s.movil})
                    </a>

                    {telLimpio && (
                      <a
                        href={`https://wa.me/34${telLimpio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-mobile-whatsapp"
                      >
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    )}
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0EAE6', paddingTop: '10px', marginTop: '2px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#6E5C60' }}>
                      {s.emergenciaNombre ? `Tutor: ${s.emergenciaNombre}` : ''}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setServidorSeleccionado(s)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                      >
                        <Eye size={13} /> Ficha
                      </button>
                      <button
                        type="button"
                        onClick={() => setServidorAEliminar(s)}
                        style={{
                          padding: '6px 8px',
                          background: '#FFF5F5',
                          border: '1px solid #FFCDD2',
                          borderRadius: '8px',
                          color: '#C62828',
                          cursor: 'pointer'
                        }}
                        title="Eliminar este registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Vista de Tabla Clásica */
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E8DFDA' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="desktop-table">
              <thead>
                <tr>
                  <th onClick={() => cambiarOrden('nombre')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Servidor <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th>Contacto Directo</th>
                  <th>Alergias y Dietas</th>
                  <th>Tallas Pedidas</th>
                  <th>Contacto Emergencia</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servidoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#6E5C60' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
                        No se han encontrado registros con los filtros seleccionados
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        Prueba a cambiar los términos de búsqueda o los selectores superiores.
                      </div>
                    </td>
                  </tr>
                ) : (
                  servidoresFiltrados.map((s, idx) => {
                    const tieneAlergia = (s.alergias || '').trim().toLowerCase() !== 'ninguna' && 
                                         (s.alergias || '').trim().toLowerCase() !== 'no' && 
                                         (s.alergias || '').trim() !== '';
                    return (
                      <tr key={s.id || idx}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#2A1B1E', fontSize: '0.94rem' }}>
                            {s.nombre} {s.apellidos}
                          </div>
                        </td>

                        <td>
                          <div>
                            <a
                              href={`tel:${s.movil}`}
                              style={{ color: '#5C1824', fontWeight: 600, textDecoration: 'none' }}
                              title="Llamar por teléfono"
                            >
                              {s.movil}
                            </a>
                          </div>
                          <div style={{ fontSize: '0.78rem' }}>
                            <a
                              href={`mailto:${s.email}`}
                              style={{ color: '#6E5C60', textDecoration: 'none' }}
                              title="Enviar correo"
                            >
                              {s.email}
                            </a>
                          </div>
                        </td>

                        <td>
                          {tieneAlergia && (
                            <span style={{
                              color: '#C62828',
                              background: '#FFEBEE',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid #FFCDD2'
                            }}>
                              <AlertTriangle size={14} /> {s.alergias}
                            </span>
                          )}
                        </td>

                        <td style={{ fontSize: '0.8rem', color: '#2A1B1E' }}>
                          <div>B: <strong>{s.tallaCamisetaBlanca || '-'}</strong> | G: <strong>{s.tallaCamisetaGris || '-'}</strong></div>
                          <div>Sud: <strong>{s.tallaSudadera || '-'}</strong></div>
                        </td>

                        <td style={{ fontSize: '0.82rem' }}>
                          <div style={{ fontWeight: 600, color: '#2A1B1E' }}>{s.emergenciaNombre}</div>
                          <div>
                            <a href={`tel:${s.emergenciaTelefono}`} style={{ color: '#6E5C60', textDecoration: 'none' }}>
                              {s.emergenciaTelefono}
                            </a>
                            {s.emergenciaRelacion ? ` (${s.emergenciaRelacion})` : ''}
                          </div>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setServidorSeleccionado(s)}
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              title="Ver ficha completa con todos los campos"
                            >
                              <Eye size={14} /> Ver Ficha
                            </button>
                            <button
                              type="button"
                              onClick={() => setServidorAEliminar(s)}
                              style={{
                                padding: '6px 8px',
                                background: '#FFF5F5',
                                border: '1px solid #FFCDD2',
                                borderRadius: '8px',
                                color: '#C62828',
                                cursor: 'pointer'
                              }}
                              title="Eliminar este registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Ficha Completa Responsiva (Escritorio y Móvil) */}
      {servidorSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(20, 10, 12, 0.7)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          zIndex: 1000
        }}>
          <div className="card" style={{
            maxWidth: '820px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            position: 'relative',
            marginBottom: 0,
            padding: '24px 20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
          }}>
            <button
              type="button"
              onClick={() => setServidorSeleccionado(null)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: '#FAF6F4',
                border: '1px solid #E8DFDA',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: '#6E5C60',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '16px', borderBottom: '1px solid #E8DFDA', paddingBottom: '12px', paddingRight: '40px' }}>
              <span className="badge badge-wine" style={{ marginBottom: '6px' }}>
                Ficha Oficial de Servidor • {INFO_RETIRO.edicion} Bartimeo Córdoba
              </span>
              <h2 className="title-serif" style={{ fontSize: '1.45rem', color: '#5C1824', margin: '4px 0' }}>
                {servidorSeleccionado.nombre} {servidorSeleccionado.apellidos}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#6E5C60' }}>
                ID: {servidorSeleccionado.id} • Inscrito: {new Date(servidorSeleccionado.fechaRegistro || Date.now()).toLocaleDateString('es-ES')}
              </div>
            </div>

            {/* Acciones directas de contacto para teléfono */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '18px' }}>
              <a
                href={`tel:${servidorSeleccionado.movil}`}
                className="btn-mobile-call"
                style={{ padding: '10px 12px' }}
              >
                <Phone size={15} /> Llamar ({servidorSeleccionado.movil})
              </a>
              {servidorSeleccionado.movil && (
                <a
                  href={`https://wa.me/34${(servidorSeleccionado.movil || '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mobile-whatsapp"
                  style={{ padding: '10px 12px' }}
                >
                  <MessageCircle size={16} /> WhatsApp Servidor
                </a>
              )}
            </div>

            {/* Cuadrícula adaptable para la ficha */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '0.88rem' }}>
              {/* Columna Izquierda: Datos Personales y Retiro */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#FAF6F4', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#5C1824', marginBottom: '10px', fontWeight: 700 }}>
                    1. Datos Personales y Contacto
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><strong>Teléfono:</strong> <a href={`tel:${servidorSeleccionado.movil}`} style={{ color: '#5C1824', fontWeight: 600 }}>{servidorSeleccionado.movil}</a></div>
                    <div><strong>Email:</strong> <a href={`mailto:${servidorSeleccionado.email}`} style={{ color: '#5C1824' }}>{servidorSeleccionado.email}</a></div>
                    <div><strong>Fecha Nacimiento:</strong> {servidorSeleccionado.fechaNacimiento || '-'}</div>
                    <div><strong>Dirección:</strong> {servidorSeleccionado.direccion || '-'}</div>
                    <div><strong>Localidad:</strong> {servidorSeleccionado.localidad} ({servidorSeleccionado.codigoPostal})</div>
                  </div>
                </div>

                <div style={{ background: '#FAF6F4', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#5C1824', marginBottom: '10px', fontWeight: 700 }}>
                    2. Experiencia y Bartimeo de Origen
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><strong>Bartimeo que hizo:</strong> {servidorSeleccionado.bartimeoOrigen}</div>
                    <div><strong>¿Ha servido antes?:</strong> {servidorSeleccionado.haServido} {servidorSeleccionado.cuantasVeces ? `(${servidorSeleccionado.cuantasVeces})` : ''}</div>
                    <div><strong>Servicios anteriores:</strong> {(servidorSeleccionado.serviciosHechos || []).join(', ') || 'Ninguno'}</div>
                    {servidorSeleccionado.serviciosOtro && (
                      <div><strong>Otro servicio:</strong> {servidorSeleccionado.serviciosOtro}</div>
                    )}
                    <div><strong>Manejo de Excel:</strong> {servidorSeleccionado.manejaExcel}</div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Disponibilidad, Ropa, Alergias y Tutor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#FAF6F4', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#5C1824', marginBottom: '10px', fontWeight: 700 }}>
                    3. Logística, Montaje y Ropa
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><strong>Montaje Jueves 4 de febrero:</strong> <span style={{ fontWeight: 700, color: servidorSeleccionado.montajeJueves === 'Sí' ? '#2E7D32' : '#6E5C60' }}>{servidorSeleccionado.montajeJueves === 'Sí' ? 'Sube el jueves por la tarde' : 'Llega el viernes 5 de febrero a las 14:00h'}</span></div>
                    <div><strong>Camiseta Blanca:</strong> {servidorSeleccionado.tallaCamisetaBlanca || 'Ya tiene (no necesita)'}</div>
                    <div><strong>Camiseta Gris:</strong> {servidorSeleccionado.tallaCamisetaGris || 'Ya tiene (no necesita)'}</div>
                    <div><strong>Sudadera:</strong> {servidorSeleccionado.tallaSudadera || 'Ya tiene (no necesita)'}</div>
                  </div>
                </div>

                <div style={{ background: '#FFF5F5', padding: '14px 16px', borderRadius: '12px', border: '1px solid #FFCDD2' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#C62828', marginBottom: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> 4. Salud, Alergias y Dietas
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: '#2A1B1E', fontWeight: 600 }}>
                    {servidorSeleccionado.alergias || 'Ninguna alergia ni intolerancia comunicada.'}
                  </div>
                </div>

                <div style={{ background: '#FAF6F4', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#5C1824', marginBottom: '10px', fontWeight: 700 }}>
                    5. Contacto de Emergencia (Tutor/Familiar)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><strong>Nombre:</strong> {servidorSeleccionado.emergenciaNombre}</div>
                    <div><strong>Parentesco:</strong> {servidorSeleccionado.emergenciaRelacion || 'Familiar'}</div>
                    <div><strong>Teléfono:</strong> <a href={`tel:${servidorSeleccionado.emergenciaTelefono}`} style={{ color: '#5C1824', fontWeight: 700 }}>{servidorSeleccionado.emergenciaTelefono}</a></div>
                    {servidorSeleccionado.emergenciaEmail && (
                      <div><strong>Email:</strong> <a href={`mailto:${servidorSeleccionado.emergenciaEmail}`} style={{ color: '#5C1824' }}>{servidorSeleccionado.emergenciaEmail}</a></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción modal */}
            <EditarInscripcion tipo="servidores" ficha={servidorSeleccionado} token={token}
              onGuardado={() => { setServidorSeleccionado(null); cargarDatos(); }} />
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E8DFDA', paddingTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
                style={{ fontSize: '0.85rem' }}
              >
                <Printer size={15} /> Imprimir Ficha
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setServidorSeleccionado(null)}
                style={{ padding: '8px 20px', flex: '1 1 auto', maxWidth: '200px' }}
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {servidorAEliminar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1100
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px', marginBottom: 0, textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FFEBEE',
              color: '#C62828',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <AlertTriangle size={28} />
            </div>
            <h3 className="title-serif" style={{ fontSize: '1.25rem', color: '#5C1824', marginBottom: '8px' }}>
              ¿Eliminar inscripción?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#6E5C60', marginBottom: '20px' }}>
              Se eliminará el registro de <strong>{servidorAEliminar.nombre} {servidorAEliminar.apellidos}</strong> permanentemente. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setServidorAEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleEliminarServidor}
                disabled={eliminando}
                style={{ background: '#C62828', color: '#FFFFFF' }}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
