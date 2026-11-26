import { prepararCsv } from '../csv';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar, Check, CheckCircle2, Clock, Users, UserPlus,
  RefreshCw, Download, Search, AlertCircle, AlertTriangle,
  Edit2, Trash2, ArrowRight, UserCheck, Sparkles, Filter,
  ExternalLink, X, PlusCircle, CheckSquare, Square
} from 'lucide-react';
import { apiFetch } from '../api';


export default function PanelAsistencias({ token, refreshKey }) {
  // Estado principal de asistencias
  const [state, setState] = useState({
    members: [],
    meetings: [],
    att: {},
    seq: 1
  });

  // Sub-vista activa: 'asistencia' | 'participantes' | 'reuniones'
  const [vistaActiva, setVistaActiva] = useState('asistencia');

  // Estado de sincronización en la nube
  const [syncStatus, setSyncStatus] = useState('cargando'); // 'online' | 'guardando' | 'offline' | 'cargando'
  const [syncMsg, setSyncMsg] = useState('Cargando asistencias...');
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(null);

  // Sesión/Reunión seleccionada en la vista de toma
  const [reunionSeleccionadaId, setReunionSeleccionadaId] = useState(null);

  // Filtros de búsqueda
  const [busquedaToma, setBusquedaToma] = useState('');
  const [filtroTipoToma, setFiltroTipoToma] = useState('todos'); // 'todos' | 'caminantes' | 'foraneos' | 'pendientes'
  const [busquedaParticipantes, setBusquedaParticipantes] = useState('');
  const [filtroTipoParticipantes, setFiltroTipoParticipantes] = useState('todos'); // 'todos' | 'caminantes' | 'foraneos'

  // Modal participante (nuevo / edición)
  const [modalParticipanteAbierto, setModalParticipanteAbierto] = useState(false);
  const [participanteEditando, setParticipanteEditando] = useState(null);
  const [motivoExcepcion, setMotivoExcepcion] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCaminante, setFormCaminante] = useState(false);
  const [formForaneo, setFormForaneo] = useState(false);
  const [errorModalParticipante, setErrorModalParticipante] = useState('');

  // Formulario nueva reunión
  const [nuevaFechaReunion, setNuevaFechaReunion] = useState(calcularProximoDomingo());
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  // Referencias para timers y ciclo de vida seguro
  const guardados = useRef(Promise.resolve());
  const revision = useRef(null);
  const feedbackTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Limpieza segura en desmontaje
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Mostrar mensaje tipo toast
  const mostrarToast = (mensaje, tipo = 'info') => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setMensajeFeedback({ mensaje, tipo });
    feedbackTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setMensajeFeedback(null);
    }, 3200);
  };

  // Helper para formatear fecha local en formato YYYY-MM-DD sin desvío horario UTC
  function formatearFechaLocalISO(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Helper cálculo próximo domingo
  function calcularProximoDomingo() {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return formatearFechaLocalISO(d);
  }

  // Generador de IDs únicos correlativos
  const generarId = (prefijo) => {
    const nextSeq = (state.seq || 1) + 1;
    return `${prefijo}${Date.now().toString(36)}${nextSeq}`;
  };

  // 1. Cargar estado inicial desde servidor con fallback local
  const cargarEstadoDesdeServidor = async () => {
    if (!isMountedRef.current) return;
    setSyncStatus('guardando');
    setSyncMsg('Sincronizando...');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await apiFetch('/api/asistencias/state', { headers });
      if (res.ok) {
        const datos = await res.json();
        if (datos && Array.isArray(datos.members) && Array.isArray(datos.meetings)) {
          if (!isMountedRef.current) return;
          revision.current = datos.revision;
          setState(datos);
          setSyncStatus('online');
          setSyncMsg('En la nube');
          setUltimaSincronizacion(new Date());
          return;
        }
      }
    } catch (err) {
      console.warn('No se pudo conectar con el servidor para cargar asistencias:', err);
    }

    if (!isMountedRef.current) return;

    setSyncStatus('offline');
    setSyncMsg('No se pudieron cargar las asistencias');
  };

  useEffect(() => {
    try {
      localStorage.removeItem('bartimeo_asistencias_v2');
    } catch {
      // El navegador puede restringir el acceso al almacenamiento.
    }
    cargarEstadoDesdeServidor();
  }, [token]);

  // Re-sincronizar automáticamente cuando el usuario regresa a la pestaña
  useEffect(() => {
    const handleFocus = () => {
      if (syncStatus === 'online') {
        cargarEstadoDesdeServidor();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, syncStatus]);

  // Re-sincronizar si el componente padre solicita actualización explícita
  useEffect(() => {
    if (refreshKey) {
      cargarEstadoDesdeServidor();
    }
  }, [refreshKey]);

  const actualizarEstado = (nuevoEstado) => {
    if (revision.current == null) return;
    setState(nuevoEstado);
    setSyncStatus('guardando');
    setSyncMsg('Guardando…');
    guardados.current = guardados.current.then(async () => {
      if (revision.current == null) return;
      try {
        const res = await apiFetch('/api/asistencias/state', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...nuevoEstado, revision: revision.current })
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || 'Error al guardar.');
        revision.current = datos.revision;
        if (!isMountedRef.current) return;
        setSyncStatus('online');
        setSyncMsg('Guardado');
        setUltimaSincronizacion(new Date());
      } catch (error) {
        revision.current = null;
        if (!isMountedRef.current) return;
        setSyncStatus('offline');
        setSyncMsg(error.message);
      }
    });
  };

  // Reuniones ordenadas cronológicamente
  const reunionesOrdenadas = useMemo(() => {
    return [...(state.meetings || [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [state.meetings]);

  // Selección automática de la reunión más reciente o default
  useEffect(() => {
    if (!reunionesOrdenadas.length) {
      setReunionSeleccionadaId(null);
      return;
    }

    if (!reunionSeleccionadaId || !state.meetings.some(m => m.id === reunionSeleccionadaId)) {
      const hoy = formatearFechaLocalISO();
      const pasadasOHoy = reunionesOrdenadas.filter(m => m.date <= hoy);
      const seleccionada = pasadasOHoy.length 
        ? pasadasOHoy[pasadasOHoy.length - 1] 
        : reunionesOrdenadas[0];
      setReunionSeleccionadaId(seleccionada.id);
    }
  }, [reunionesOrdenadas, reunionSeleccionadaId, state.meetings]);

  // Reuniones ya celebradas o con marcas registradas
  const reunionesCelebradas = useMemo(() => {
    const hoy = formatearFechaLocalISO();
    return (state.meetings || []).filter(m => 
      m.date <= hoy || Object.keys(state.att?.[m.id] || {}).length > 0
    );
  }, [state.meetings, state.att]);

  // Estadísticas individuales de un participante
  const calcularEstadisticasParticipante = (miembro) => {
    const celebradas = reunionesCelebradas.filter((reunion) => miembro.motivoExcepcion
      ? miembro.reunionExcepcionId === reunion.id
      : miembro.inscritoActivo || Boolean(state.att?.[reunion.id]?.[miembro.id]));
    let total = 0;
    let incidencias = 0;
    let sinMarcar = 0;
    let ausentes = 0;

    for (const m of celebradas) {
      const v = (state.att?.[m.id] || {})[miembro.id];
      if (v === 'p') {
        total++;
      } else if (v === 'i') {
        total++;
        incidencias++;
      } else if (v === 'a') {
        ausentes++;
      } else {
        sinMarcar++;
      }
    }

    const pct = celebradas.length ? Math.round((total / celebradas.length) * 100) : null;
    return { total, incidencias, ausentes, sinMarcar, pct, totalCelebradas: celebradas.length };
  };

  // Estadísticas globales de una reunión
  const calcularMetricasReunion = (reunionId) => {
    const att = state.att?.[reunionId] || {};
    let p = 0;
    let i = 0;
    const miembros = state.members.filter((m) =>
      m.inscritoActivo || m.reunionExcepcionId === reunionId || att[m.id]);
    const totalMiembros = miembros.length;

    for (const m of miembros) {
      const v = att[m.id];
      if (v === 'p') p++;
      else if (v === 'i') i++;
    }

    const totalPresentes = p + i;
    const sinMarcar = totalMiembros - totalPresentes;
    const pct = totalMiembros > 0 ? Math.round((totalPresentes / totalMiembros) * 100) : 0;

    return { presentes: p, incidencias: i, sinMarcar, total: totalMiembros, pct };
  };

  // Formato legible de fecha en español (ej: "Dom, 15 mar")
  const formatearFechaCorta = (iso) => {
    try {
      const d = new Date(iso + 'T12:00:00');
      return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return iso;
    }
  };

  // Formato extendido de fecha (ej: "15 de marzo de 2026")
  const formatearFechaLarga = (iso) => {
    try {
      const d = new Date(iso + 'T12:00:00');
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  // Alternar estado de asistencia: Sin marcar -> Presente (p) -> Incidencia (i) -> Sin marcar
  const alternarAsistencia = (miembroId) => {
    if (!reunionSeleccionadaId) return;

    const nuevasMarcas = { ...(state.att || {}) };
    const marcasReunion = { ...(nuevasMarcas[reunionSeleccionadaId] || {}) };
    const actual = marcasReunion[miembroId];

    if (!actual) {
      marcasReunion[miembroId] = 'p';
    } else if (actual === 'p') {
      marcasReunion[miembroId] = 'i';
    } else if (actual === 'i') {
      marcasReunion[miembroId] = 'a';
    } else {
      delete marcasReunion[miembroId];
    }

    nuevasMarcas[reunionSeleccionadaId] = marcasReunion;
    actualizarEstado({ ...state, att: nuevasMarcas });
  };

  // Marcar a todos los miembros filtrados como presentes
  const marcarTodosPresentes = () => {
    if (!reunionSeleccionadaId) return;
    if (!confirm('¿Marcar a todos los participantes visibles de esta sesión como asistidos?')) return;

    const nuevasMarcas = { ...(state.att || {}) };
    const marcasReunion = { ...(nuevasMarcas[reunionSeleccionadaId] || {}) };

    participantesFiltradosToma.forEach(m => {
      marcasReunion[m.id] = 'p';
    });

    nuevasMarcas[reunionSeleccionadaId] = marcasReunion;
    actualizarEstado({ ...state, att: nuevasMarcas });
    mostrarToast('Asistencia completada para los participantes seleccionados', 'exito');
  };

  // Limpiar todas las marcas de la sesión actual
  const limpiarSesionActual = () => {
    if (!reunionSeleccionadaId) return;
    if (!confirm('¿Deseas reiniciar y poner en blanco todas las marcas de esta reunión?')) return;

    const nuevasMarcas = { ...(state.att || {}) };
    delete nuevasMarcas[reunionSeleccionadaId];
    actualizarEstado({ ...state, att: nuevasMarcas });
    mostrarToast('Marcas de la reunión reiniciadas', 'info');
  };

  // Crear o guardar participante
  const guardarParticipante = (e) => {
    e.preventDefault();
    const nombreLimpio = formNombre.trim();

    if (!nombreLimpio) {
      setErrorModalParticipante('El nombre no puede estar vacío.');
      return;
    }

    const nombreNormalizado = nombreLimpio.toLowerCase().replace(/\s+/g, ' ');

    if (participanteEditando) {
      // Edición: verificar que no colisione con otro participante
      const yaExisteOtro = state.members.some(
        m => m.id !== participanteEditando.id && m.name.toLowerCase().trim().replace(/\s+/g, ' ') === nombreNormalizado
      );

      if (yaExisteOtro) {
        setErrorModalParticipante('Ya existe otro participante registrado con este nombre exacto.');
        return;
      }

      const miembrosActualizados = state.members.map(m => {
        if (m.id === participanteEditando.id) {
          return {
            ...m,
            name: nombreLimpio,
            caminante: formCaminante,
            foraneo: formForaneo
          };
        }
        return m;
      });

      actualizarEstado({ ...state, members: miembrosActualizados });
      mostrarToast(`Participante "${nombreLimpio}" actualizado`);
    } else {
      if (!reunionSeleccionadaId || !motivoExcepcion.trim()) {
        setErrorModalParticipante('Selecciona una reunión e indica el motivo de la excepción.');
        return;
      }
      const yaExiste = state.members.some(
        m => (m.inscritoActivo || m.reunionExcepcionId === reunionSeleccionadaId) && m.name.toLowerCase().trim().replace(/\s+/g, ' ') === nombreNormalizado
      );

      if (yaExiste) {
        setErrorModalParticipante('Ya existe un participante registrado con este nombre exacto.');
        return;
      }

      const nuevoSeq = (state.seq || 1) + 1;
      const nuevo = {
        id: crypto.randomUUID(),
        name: nombreLimpio,
        motivoExcepcion: motivoExcepcion.trim(),
        reunionExcepcionId: reunionSeleccionadaId,
        caminante: formCaminante,
        foraneo: formForaneo
      };

      actualizarEstado({
        ...state,
        members: [...state.members, nuevo],
        att: { ...state.att, [reunionSeleccionadaId]: { ...state.att[reunionSeleccionadaId], [nuevo.id]: 'p' } },
        seq: nuevoSeq
      });
      mostrarToast(`Nuevo participante "${nombreLimpio}" añadido`, 'exito');
    }

    cerrarModalParticipante();
  };

  const abrirModalNuevoParticipante = () => {
    setParticipanteEditando(null);
    setFormNombre('');
    setMotivoExcepcion('');
    setFormCaminante(false);
    setFormForaneo(false);
    setErrorModalParticipante('');
    setModalParticipanteAbierto(true);
  };

  const abrirModalEditarParticipante = (m) => {
    setParticipanteEditando(m);
    setFormNombre(m.name);
    setFormCaminante(!!m.caminante);
    setFormForaneo(!!m.foraneo);
    setErrorModalParticipante('');
    setModalParticipanteAbierto(true);
  };

  const cerrarModalParticipante = () => {
    setModalParticipanteAbierto(false);
    setParticipanteEditando(null);
    setFormNombre('');
    setMotivoExcepcion('');
    setErrorModalParticipante('');
  };

  const eliminarParticipante = (miembro) => {
    if (!confirm(`¿Eliminar definitivamente a "${miembro.name}" y todo su historial de asistencias?`)) return;

    const miembrosFiltrados = state.members.filter(m => m.id !== miembro.id);
    const attLimpio = { ...(state.att || {}) };

    for (const reunionId of Object.keys(attLimpio)) {
      if (attLimpio[reunionId]?.[miembro.id]) {
        const marcas = { ...attLimpio[reunionId] };
        delete marcas[miembro.id];
        attLimpio[reunionId] = marcas;
      }
    }

    actualizarEstado({
      ...state,
      members: miembrosFiltrados,
      att: attLimpio
    });
    mostrarToast(`Participante eliminado`, 'info');
  };

  // Crear nueva reunión
  const handleCrearReunion = (e) => {
    e.preventDefault();
    if (!nuevaFechaReunion) {
      mostrarToast('Selecciona una fecha válida', 'error');
      return;
    }

    const yaExiste = state.meetings.some(m => m.date === nuevaFechaReunion);
    if (yaExiste) {
      mostrarToast('Ya existe una reunión programada en esa fecha', 'error');
      return;
    }

    const nuevoSeq = (state.seq || 1) + 1;
    const nuevaReunion = {
      id: crypto.randomUUID(),
      date: nuevaFechaReunion
    };

    const nuevasReuniones = [...state.meetings, nuevaReunion];
    const nuevoAtt = { ...(state.att || {}), [nuevaReunion.id]: {} };

    actualizarEstado({
      ...state,
      meetings: nuevasReuniones,
      att: nuevoAtt,
      seq: nuevoSeq
    });

    setReunionSeleccionadaId(nuevaReunion.id);
    mostrarToast(`Reunión creada para el ${formatearFechaCorta(nuevaFechaReunion)}`, 'exito');
  };

  // Eliminar reunión
  const eliminarReunion = (reunion) => {
    const marcasCount = Object.keys(state.att?.[reunion.id] || {}).length;
    const advertencia = marcasCount > 0 
      ? `\n¡Atención: tiene ${marcasCount} asistencias registradas que se perderán!`
      : '';

    if (!confirm(`¿Eliminar la reunión del ${formatearFechaCorta(reunion.date)}?${advertencia}`)) return;

    const reunionesFiltradas = state.meetings.filter(m => m.id !== reunion.id);
    const attLimpio = { ...(state.att || {}) };
    delete attLimpio[reunion.id];

    actualizarEstado({
      ...state,
      meetings: reunionesFiltradas,
      att: attLimpio
    });

    if (reunionSeleccionadaId === reunion.id) {
      setReunionSeleccionadaId(reunionesFiltradas[0]?.id || null);
    }
    mostrarToast('Reunión eliminada correctamente');
  };

  // Exportar matriz completa de asistencias a Excel/CSV
  const exportarMatrizExcel = () => {
    if (!state.members.length) {
      mostrarToast('No hay participantes para exportar', 'error');
      return;
    }

    const reuniones = reunionesOrdenadas;
    const encabezados = [
      'Participante',
      'Motivo de excepción',
      'Caminante',
      'De Otra Ciudad (Foráneo)',
      ...reuniones.map(m => formatearFechaCorta(m.date)),
      'Total Asistencias',
      'Incidencias',
      'Ausencias',
      '% Asistencia'
    ];

    const filas = state.members
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map(m => {
        const stats = calcularEstadisticasParticipante(m);
        const marcasPorReunion = reuniones.map(reunion => {
          const v = (state.att?.[reunion.id] || {})[m.id];
          if (v === 'p') return 'PRESENTE';
          if (v === 'i') return 'INCIDENCIA';
          if (v === 'a') return 'AUSENTE';
          return '-';
        });

        return [
          m.name,
          m.motivoExcepcion,
          m.caminante ? 'SÍ' : 'NO',
          m.foraneo ? 'SÍ' : 'NO',
          ...marcasPorReunion,
          stats.total,
          stats.incidencias,
          stats.ausentes,
          stats.pct !== null ? `${stats.pct}%` : '0%'
        ];
      });

    const csvContent = prepararCsv(encabezados, filas);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `asistencias-matriz-bartimeo-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarToast('Matriz de asistencias descargada en CSV');
  };

  // Filtrado de participantes en la vista de toma
  const participantesFiltradosToma = useMemo(() => {
    const q = busquedaToma.toLowerCase().trim();
    const attReunion = state.att?.[reunionSeleccionadaId] || {};

    return (state.members || []).filter(m => {
      const matchBusqueda = !q || m.name.toLowerCase().includes(q);
      if (!matchBusqueda) return false;
      if (!m.inscritoActivo && m.reunionExcepcionId !== reunionSeleccionadaId && !attReunion[m.id]) return false;

      if (filtroTipoToma === 'caminantes') return !!m.caminante;
      if (filtroTipoToma === 'foraneos') return !!m.foraneo;
      if (filtroTipoToma === 'ausentes') return attReunion[m.id] === 'a';
      if (filtroTipoToma === 'presentes') return ['p', 'i'].includes(attReunion[m.id]);
      if (filtroTipoToma === 'pendientes') {
        const val = attReunion[m.id];
        return !val; // no tiene 'p' ni 'i'
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [state.members, busquedaToma, filtroTipoToma, state.att, reunionSeleccionadaId]);

  // Filtrado de participantes en la vista de gestión
  const participantesFiltradosGestion = useMemo(() => {
    const q = busquedaParticipantes.toLowerCase().trim();

    return (state.members || [])
      .filter(m => {
        const matchBusqueda = !q || m.name.toLowerCase().includes(q);
        if (!matchBusqueda) return false;

        if (filtroTipoParticipantes === 'caminantes') return !!m.caminante;
        if (filtroTipoParticipantes === 'foraneos') return !!m.foraneo;
        return true;
      })
      .map(m => ({ m, stats: calcularEstadisticasParticipante(m) }))
      .sort((a, b) => {
        // Ordenar por asistencias desc, luego nombre asc
        return (b.stats.total - a.stats.total) || a.m.name.localeCompare(b.m.name, 'es');
      });
  }, [state.members, busquedaParticipantes, filtroTipoParticipantes, state.att, reunionesCelebradas]);

  const reunionActual = state.meetings?.find(m => m.id === reunionSeleccionadaId);
  const metricasReunionActual = reunionSeleccionadaId 
    ? calcularMetricasReunion(reunionSeleccionadaId) 
    : { presentes: 0, incidencias: 0, sinMarcar: 0, total: 0, pct: 0 };

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Toast Feedback */}
      {mensajeFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: mensajeFeedback.tipo === 'error' ? '#C62828' : '#2A1B1E',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {mensajeFeedback.tipo === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} style={{ color: '#D4A359' }} />}
          <span>{mensajeFeedback.mensaje}</span>
        </div>
      )}

      {/* Barra de Sub-Navegación y Estado de Sincronización */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Pestañas internas de asistencias */}
        <div style={{ display: 'flex', gap: '8px', background: '#F5ECE8', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => setVistaActiva('asistencia')}
            style={{
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
              backgroundColor: vistaActiva === 'asistencia' ? '#5C1824' : 'transparent',
              color: vistaActiva === 'asistencia' ? '#FFFFFF' : '#6E5C60',
              boxShadow: vistaActiva === 'asistencia' ? '0 2px 8px rgba(92, 24, 36, 0.25)' : 'none'
            }}
          >
            <CheckSquare size={16} /> Toma de Asistencia
          </button>

          <button
            type="button"
            onClick={() => setVistaActiva('participantes')}
            style={{
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
              backgroundColor: vistaActiva === 'participantes' ? '#5C1824' : 'transparent',
              color: vistaActiva === 'participantes' ? '#FFFFFF' : '#6E5C60',
              boxShadow: vistaActiva === 'participantes' ? '0 2px 8px rgba(92, 24, 36, 0.25)' : 'none'
            }}
          >
            <Users size={16} /> Participantes ({state.members?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setVistaActiva('reuniones')}
            style={{
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
              backgroundColor: vistaActiva === 'reuniones' ? '#5C1824' : 'transparent',
              color: vistaActiva === 'reuniones' ? '#FFFFFF' : '#6E5C60',
              boxShadow: vistaActiva === 'reuniones' ? '0 2px 8px rgba(92, 24, 36, 0.25)' : 'none'
            }}
          >
            <Calendar size={16} /> Reuniones ({state.meetings?.length || 0})
          </button>
        </div>

        {/* Acciones y Estado de Sincronización en la Nube */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Indicador de Estado Cloud */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: syncStatus === 'online' ? '#E8F5E9' : syncStatus === 'guardando' ? '#FFF8E1' : '#FFEBEE',
            color: syncStatus === 'online' ? '#2E7D32' : syncStatus === 'guardando' ? '#F57F17' : '#C62828',
            border: `1px solid ${syncStatus === 'online' ? '#C8E6C9' : syncStatus === 'guardando' ? '#FFE082' : '#FFCDD2'}`
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: syncStatus === 'online' ? '#2E7D32' : syncStatus === 'guardando' ? '#F57F17' : '#C62828'
            }} />
            <span>{syncMsg}</span>
          </div>

          {/* Exportar Matriz a Excel */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportarMatrizExcel}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            title="Descargar matriz histórica completa de asistencias"
          >
            <Download size={14} /> Exportar Matriz
          </button>

          {/* Recargar / Forzar Sincronización */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={cargarEstadoDesdeServidor}
            disabled={syncStatus === 'guardando'}
            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
            title="Recargar datos del servidor"
          >
            <RefreshCw size={13} className={syncStatus === 'guardando' ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: TOMA DE ASISTENCIA */}
      {/* ======================================================== */}
      {vistaActiva === 'asistencia' && (
        <div>
          {state.meetings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Calendar size={48} style={{ color: '#8C7A7D', margin: '0 auto 16px' }} />
              <h2 className="title-serif" style={{ fontSize: '1.3rem', color: '#5C1824', marginBottom: '8px' }}>
                No hay reuniones programadas
              </h2>
              <p style={{ color: '#6E5C60', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 16px' }}>
                Para comenzar a tomar asistencia de los servidores, añade la primera reunión en la pestaña "Reuniones".
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setVistaActiva('reuniones')}
                style={{ padding: '10px 20px' }}
              >
                Ir a Calendario de Reuniones
              </button>
            </div>
          ) : (
            <div>
              {/* Barra de Selección de Sesión y Métricas Rápidas */}
              <div className="card" style={{ padding: '20px 24px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#5C1824', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={18} /> Sesión / Reunión:
                    </label>
                    <select
                      className="select-field"
                      value={reunionSeleccionadaId || ''}
                      onChange={(e) => setReunionSeleccionadaId(e.target.value)}
                      style={{ minWidth: '220px', fontWeight: 600, fontSize: '0.95rem', height: '42px' }}
                    >
                      {reunionesOrdenadas.map(m => (
                        <option key={m.id} value={m.id}>
                          {formatearFechaCorta(m.date)} ({formatearFechaLarga(m.date)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Acciones de Lote */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={marcarTodosPresentes}
                      style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                      title="Marcar todos los participantes de la lista como asistidos"
                    >
                      <Check size={14} style={{ color: '#2E7D32' }} /> Marcar todos presentes
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={limpiarSesionActual}
                      style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#C62828' }}
                      title="Limpiar todas las marcas de esta reunión"
                    >
                      <X size={14} /> Limpiar sesión
                    </button>
                  </div>
                </div>

                {/* KPI Chips de Turnout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', padding: '12px 14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2E7D32', textTransform: 'uppercase' }}>Asistieron</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1B5E20' }}>{metricasReunionActual.presentes}</div>
                    <div style={{ fontSize: '0.74rem', color: '#388E3C' }}>Marcados presentes</div>
                  </div>

                  <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', padding: '12px 14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F57F17', textTransform: 'uppercase' }}>Incidencias</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#E65100' }}>{metricasReunionActual.incidencias}</div>
                    <div style={{ fontSize: '0.74rem', color: '#F57F17' }}>Voluntariado / Justificadas</div>
                  </div>

                  <div style={{ background: '#FAF6F4', border: '1px solid #E8DFDA', padding: '12px 14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6E5C60', textTransform: 'uppercase' }}>Sin Marcar</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2A1B1E' }}>{metricasReunionActual.sinMarcar}</div>
                    <div style={{ fontSize: '0.74rem', color: '#6E5C60' }}>de {metricasReunionActual.total} registrados</div>
                  </div>

                  <div style={{ background: '#F4E8D6', border: '1px solid #D4A359', padding: '12px 14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A5D18', textTransform: 'uppercase' }}>% Asistencia Total</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#5C1824' }}>{metricasReunionActual.pct}%</div>
                    <div style={{ fontSize: '0.74rem', color: '#8A5D18' }}>Presentes + Incidencias</div>
                  </div>
                </div>

                <div style={{ marginTop: '14px', fontSize: '0.8rem', color: '#6E5C60', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#5C1824' }}>Instrucciones rápidas:</span>
                  <span>Toca el botón ✓ para alternar: <strong>Presente</strong> → <strong>Incidencia (ámbar)</strong> → <strong>Ausente</strong> → <strong>Sin marcar (gris)</strong>. Los cambios se guardan automáticamente.</span>
                </div>
              </div>

              {/* Barra de Filtros y Búsqueda para el Roster */}
              <div className="card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Buscar por nombre en la lista de toma..."
                      value={busquedaToma}
                      onChange={(e) => setBusquedaToma(e.target.value)}
                      style={{ paddingLeft: '36px', height: '40px', fontSize: '0.88rem' }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8C7A7D' }} />
                    {busquedaToma && (
                      <button
                        type="button"
                        onClick={() => setBusquedaToma('')}
                        style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A7D' }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'caminantes', label: 'Caminantes' },
                      { id: 'foraneos', label: 'De otra ciudad' },
                      { id: 'pendientes', label: 'Sin marcar' },
                      { id: 'ausentes', label: 'Ausentes' },
                      { id: 'presentes', label: 'Presentes' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFiltroTipoToma(f.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: '8px',
                          border: filtroTipoToma === f.id ? '1px solid #5C1824' : '1px solid #E8DFDA',
                          backgroundColor: filtroTipoToma === f.id ? '#5C1824' : '#FFFFFF',
                          color: filtroTipoToma === f.id ? '#FFFFFF' : '#6E5C60',
                          cursor: 'pointer'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <span style={{ fontSize: '0.82rem', color: '#6E5C60', marginLeft: 'auto' }}>
                    Mostrando <strong>{participantesFiltradosToma.length}</strong> de {state.members?.length || 0}
                  </span>
                </div>
              </div>

              {/* Roster Grid / Lista de Asistencia */}
              {participantesFiltradosToma.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '36px', color: '#6E5C60' }}>
                  <p>No se encontraron participantes que coincidan con el filtro actual.</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
                  gap: '10px',
                  marginBottom: '24px'
                }}>
                  {participantesFiltradosToma.map(m => {
                    const marca = (state.att?.[reunionSeleccionadaId] || {})[m.id];
                    const esPresente = marca === 'p';
                    const esIncidencia = marca === 'i';

                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: esPresente ? '1.5px solid #A5D6A7' : esIncidencia ? '1.5px solid #FFE082' : '1px solid #E8DFDA',
                          backgroundColor: esPresente ? '#F1F8E9' : esIncidencia ? '#FFFDE7' : '#FFFFFF',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: '8px' }}>
                          <span style={{
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            color: '#2A1B1E',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }} title={m.name}>
                            {m.name}
                            {m.motivoExcepcion && <small title={m.motivoExcepcion}> · Excepción</small>}
                          </span>

                          <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {m.caminante && (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: '#F4E8D6',
                                color: '#8A5D18',
                                fontWeight: 600
                              }} title="Caminante de este retiro">
                                Caminante
                              </span>
                            )}
                            {m.foraneo && (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: '#E3F2FD',
                                color: '#1565C0',
                                fontWeight: 600
                              }} title="De otra ciudad (ha venido a servir)">
                                Otra ciudad
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón de estado interactivo */}
                        <button
                          type="button"
                          onClick={() => alternarAsistencia(m.id)}
                          style={{
                            padding: '6px 12px',
                            minWidth: '100px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            border: esPresente ? '1px solid #2E7D32' : esIncidencia ? '1px solid #F57F17' : '1px solid #D7CCC8',
                            backgroundColor: esPresente ? '#2E7D32' : esIncidencia ? '#FFF8E1' : '#FAFAFA',
                            color: esPresente ? '#FFFFFF' : esIncidencia ? '#E65100' : '#8C7A7D',
                            boxShadow: esPresente ? '0 2px 6px rgba(46, 125, 50, 0.25)' : 'none',
                            transition: 'all 0.12s ease'
                          }}
                          title={
                            esPresente ? 'Asistido (Toca para cambiar a Incidencia)' :
                            esIncidencia ? 'Incidencia (toca para marcar como ausente)' :
                            marca === 'a' ? 'Ausente (toca para desmarcar)' : 'Sin marcar (toca para marcar asistido)'
                          }
                        >
                          {esPresente ? (
                            <>
                              <Check size={14} strokeWidth={3} /> Asistió
                            </>
                          ) : esIncidencia ? (
                            <>
                              <AlertTriangle size={13} /> Incidencia
                            </>
                          ) : (
                            <>
                              <span>—</span> {marca === 'a' ? 'Ausente' : 'Sin marcar'}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: GESTIÓN DE PARTICIPANTES */}
      {/* ======================================================== */}
      {vistaActiva === 'participantes' && (
        <div>
          {/* Barra de Acciones */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: '1', minWidth: '260px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Buscar participante por nombre..."
                    value={busquedaParticipantes}
                    onChange={(e) => setBusquedaParticipantes(e.target.value)}
                    style={{ paddingLeft: '36px', height: '40px', fontSize: '0.88rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#8C7A7D' }} />
                  {busquedaParticipantes && (
                    <button
                      type="button"
                      onClick={() => setBusquedaParticipantes('')}
                      style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A7D' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'caminantes', label: 'Caminantes' },
                    { id: 'foraneos', label: 'De otra ciudad' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFiltroTipoParticipantes(f.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: filtroTipoParticipantes === f.id ? '1px solid #5C1824' : '1px solid #E8DFDA',
                        backgroundColor: filtroTipoParticipantes === f.id ? '#5C1824' : '#FFFFFF',
                        color: filtroTipoParticipantes === f.id ? '#FFFFFF' : '#6E5C60',
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>


                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={abrirModalNuevoParticipante}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <UserPlus size={15} /> Registrar excepción
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Participantes */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8DFDA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAF6F4' }}>
              <strong style={{ color: '#5C1824', fontSize: '0.92rem' }}>
                Listado General de Participantes ({participantesFiltradosGestion.length})
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#6E5C60' }}>
                Ordenado por número de asistencias desc
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="desktop-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAF6F4', borderBottom: '1.5px solid #E8DFDA' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Nombre y Apellidos</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px' }}>Tipo</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px' }}>Asistencias</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px' }}>Incidencias</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>% Asistencia</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {participantesFiltradosGestion.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6E5C60' }}>
                        No hay participantes que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    participantesFiltradosGestion.map(({ m, stats }) => {
                      const colorBarra = (stats.pct ?? 0) >= 75 ? '#2E7D32' : (stats.pct ?? 0) >= 50 ? '#D4A359' : '#C62828';

                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid #F0EAE6' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2A1B1E' }}>
                            {m.name}
                          </td>

                          <td style={{ textAlign: 'center', padding: '12px 10px' }}>
                            <div style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                              {m.caminante ? (
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#F4E8D6', color: '#8A5D18', fontWeight: 600 }}>
                                  Caminante
                                </span>
                              ) : null}
                              {m.foraneo ? (
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#E3F2FD', color: '#1565C0', fontWeight: 600 }}>
                                  Otra ciudad
                                </span>
                              ) : null}
                              {!m.caminante && !m.foraneo && (
                                <span style={{ fontSize: '0.7rem', color: '#8C7A7D' }}>Servidor</span>
                              )}
                            </div>
                          </td>

                          <td style={{ textAlign: 'center', padding: '12px 10px', fontWeight: 700, color: '#5C1824', fontSize: '0.95rem' }}>
                            {stats.total}
                          </td>

                          <td style={{ textAlign: 'center', padding: '12px 10px', color: stats.incidencias > 0 ? '#E65100' : '#8C7A7D', fontWeight: 600 }}>
                            {stats.incidencias || '—'}
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '90px', height: '8px', backgroundColor: '#E8DFDA', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${stats.pct ?? 0}%`,
                                  height: '100%',
                                  backgroundColor: colorBarra,
                                  borderRadius: '4px'
                                }} />
                              </div>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: colorBarra, minWidth: '38px' }}>
                                {stats.pct !== null ? `${stats.pct}%` : '—'}
                              </span>
                            </div>
                          </td>

                          <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => abrirModalEditarParticipante(m)}
                                style={{ padding: '5px 9px', fontSize: '0.78rem' }}
                                title="Editar datos del participante"
                              >
                                <Edit2 size={13} /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => eliminarParticipante(m)}
                                style={{
                                  padding: '5px 9px',
                                  fontSize: '0.78rem',
                                  borderRadius: '8px',
                                  border: '1px solid #FFCDD2',
                                  background: '#FFEBEE',
                                  color: '#C62828',
                                  cursor: 'pointer'
                                }}
                                title="Eliminar participante"
                              >
                                <Trash2 size={13} />
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
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: REUNIONES & CALENDARIO */}
      {/* ======================================================== */}
      {vistaActiva === 'reuniones' && (
        <div>
          {/* Card para Crear Nueva Reunión */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <PlusCircle size={20} style={{ color: '#5C1824' }} />
              <h2 className="title-serif" style={{ fontSize: '1.25rem', color: '#5C1824' }}>
                Programar Nueva Reunión de Servidores
              </h2>
            </div>

            <form onSubmit={handleCrearReunion} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '220px' }}>
                <label className="form-label" style={{ marginBottom: '4px' }}>
                  Fecha de la Reunión:
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={nuevaFechaReunion}
                  onChange={(e) => setNuevaFechaReunion(e.target.value)}
                  required
                  style={{ height: '42px', fontSize: '0.92rem' }}
                />
              </div>

              <div style={{ alignSelf: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: '42px', padding: '0 20px', fontSize: '0.9rem' }}
                >
                  <Calendar size={15} /> Añadir Reunión al Calendario
                </button>
              </div>
            </form>
          </div>

          {/* Listado de Reuniones */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8DFDA', backgroundColor: '#FAF6F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: '#5C1824' }} />
                <strong style={{ color: '#5C1824', fontSize: '1rem' }}>
                  Calendario de Reuniones ({reunionesOrdenadas.length})
                </strong>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#6E5C60' }}>
                Fechas oficiales del retiro
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="desktop-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAF6F4', borderBottom: '1.5px solid #E8DFDA' }}>
                    <th style={{ textAlign: 'left', padding: '12px 18px' }}>Día y Fecha</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>Fecha Completa</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px' }}>Asistieron</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px' }}>% Asistencia</th>
                    <th style={{ textAlign: 'right', padding: '12px 18px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reunionesOrdenadas.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#6E5C60' }}>
                        Sin reuniones. Programa la primera fecha arriba.
                      </td>
                    </tr>
                  ) : (
                    reunionesOrdenadas.map(m => {
                      const t = calcularMetricasReunion(m.id);
                      const hoy = new Date().toISOString().slice(0, 10);
                      const haOcurrido = m.date <= hoy || Object.keys(state.att?.[m.id] || {}).length > 0;

                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid #F0EAE6' }}>
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: '#5C1824', fontSize: '0.94rem' }}>
                            {formatearFechaCorta(m.date)}
                          </td>

                          <td style={{ padding: '14px 14px', color: '#2A1B1E', fontSize: '0.88rem' }}>
                            {formatearFechaLarga(m.date)}
                          </td>

                          <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                            {haOcurrido ? (
                              <span style={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.92rem' }}>
                                {t.presentes + t.incidencias} / {t.total}
                              </span>
                            ) : (
                              <span style={{ color: '#8C7A7D', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                Pendiente
                              </span>
                            )}
                          </td>

                          <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                            {haOcurrido ? (
                              <span className="badge badge-wine" style={{ fontSize: '0.78rem' }}>
                                {t.pct}%
                              </span>
                            ) : (
                              <span style={{ color: '#8C7A7D' }}>—</span>
                            )}
                          </td>

                          <td style={{ textAlign: 'right', padding: '14px 18px' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                  setReunionSeleccionadaId(m.id);
                                  setVistaActiva('asistencia');
                                }}
                                style={{ padding: '6px 12px', fontSize: '0.82rem', fontWeight: 600 }}
                                title="Abrir toma de asistencia de esta reunión"
                              >
                                <CheckSquare size={13} style={{ color: '#5C1824' }} /> Ir a toma
                              </button>

                              <button
                                type="button"
                                onClick={() => eliminarReunion(m)}
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '0.82rem',
                                  borderRadius: '8px',
                                  border: '1px solid #FFCDD2',
                                  background: '#FFEBEE',
                                  color: '#C62828',
                                  cursor: 'pointer'
                                }}
                                title="Eliminar reunión"
                              >
                                <Trash2 size={13} />
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AÑADIR / EDITAR PARTICIPANTE */}
      {/* ======================================================== */}
      {modalParticipanteAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(42, 27, 30, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1.5px solid #E8DFDA',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 12px 36px rgba(92, 24, 36, 0.16)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="title-serif" style={{ fontSize: '1.3rem', color: '#5C1824' }}>
                {participanteEditando ? 'Editar participante' : 'Registrar asistencia excepcional'}
              </h3>
              <button
                type="button"
                onClick={cerrarModalParticipante}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6E5C60' }}
              >
                <X size={20} />
              </button>
            </div>

            {errorModalParticipante && (
              <div className="alert-box alert-warning" style={{ backgroundColor: '#FFEBEE', borderColor: '#FFCDD2', color: '#C62828', marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{errorModalParticipante}</span>
              </div>
            )}

            <form onSubmit={guardarParticipante}>
              {!participanteEditando && <label className="form-group">
                <span className="form-label">Motivo de asistencia sin inscripción</span>
                <textarea className="input-field" required maxLength={500} value={motivoExcepcion}
                  onChange={(e) => setMotivoExcepcion(e.target.value)} />
              </label>}
              <div className="form-group">
                <label className="form-label">
                  Nombre y Apellidos: <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: MARÍA GARCÍA LÓPEZ"
                  value={formNombre}
                  onChange={(e) => {
                    setFormNombre(e.target.value);
                    setErrorModalParticipante('');
                  }}
                  autoFocus
                  required
                  style={{ fontSize: '0.95rem', padding: '10px 14px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0', padding: '14px', background: '#FAF6F4', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#2A1B1E' }}>
                  <input
                    type="checkbox"
                    checked={formCaminante}
                    onChange={(e) => setFormCaminante(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#5C1824' }}
                  />
                  <span>Caminante de este retiro (cuenta para elegir nuevos servidores)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#2A1B1E' }}>
                  <input
                    type="checkbox"
                    checked={formForaneo}
                    onChange={(e) => setFormForaneo(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#5C1824' }}
                  />
                  <span>De otra ciudad / Foráneo (ha venido a servir desde fuera de Córdoba)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarModalParticipante}
                  style={{ padding: '10px 18px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 22px' }}
                >
                  {participanteEditando ? 'Guardar Cambios' : 'Añadir Participante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
