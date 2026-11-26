import { prepararCsv } from '../csv';
import EditarInscripcion from './EditarInscripcion';
import React, { useState, useMemo } from 'react';
import {
  Users, AlertTriangle, Shirt, Download, Search, RefreshCw,
  Eye, Trash2, Phone, MessageCircle, Smartphone, LayoutGrid,
  CheckCircle2, AlertCircle, X, Printer, HeartHandshake, School,
  Calendar, MapPin, User, Compass
} from 'lucide-react';
import { INFO_RETIRO } from '../tema';
import { apiFetch } from '../api';

const respuesta = (v) => v == null ? 'Sin dato' : v ? 'Sí' : 'No';

function describirSacramentos(c) {
  if (c.bautismoRecibido == null && c.primeraComunionRecibida == null) return c.sacramentos || 'Sin dato';
  return [c.bautismoRecibido && 'Bautismo', c.primeraComunionRecibida && 'Primera Comunión'].filter(Boolean).join(', ') || 'Ninguno';
}

export default function PanelCaminantes({
  token,
  caminantes = [],
  metricas = null,
  cargando = false,
  onRecargar
}) {
  // Modo de visualización: 'tarjetas' o 'tabla'
  const [vistaModo, setVistaModo] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 900 ? 'tarjetas' : 'tabla';
  });

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEspera, setFiltroEspera] = useState('todos');
  const [experiencia, setExperiencia] = useState('');
  const [primeraVez, setPrimeraVez] = useState('');
  const [sacramento, setSacramento] = useState('');
  const [filtroAlergia, setFiltroAlergia] = useState('todos');
  const [ordenCampo, setOrdenCampo] = useState('fechaRegistro');
  const [ordenAsc, setOrdenAsc] = useState(false);

  // Modales
  const [caminanteSeleccionado, setCaminanteSeleccionado] = useState(null);
  const [caminanteAEliminar, setCaminanteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Filtrado y ordenación
  const caminantesFiltrados = useMemo(() => {
    return caminantes.filter((c) => {
      // Búsqueda por nombre, apellidos, colegio, familiar o quien invita
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincide =
          (c.nombre && c.nombre.toLowerCase().includes(q)) ||
          (c.apellidos && c.apellidos.toLowerCase().includes(q)) ||
          (c.colegio && c.colegio.toLowerCase().includes(q)) ||
          (c.quienInvita && c.quienInvita.toLowerCase().includes(q)) ||
          (c.familiar1Nombre && c.familiar1Nombre.toLowerCase().includes(q)) ||
          (c.movil && c.movil.includes(q)) ||
          (c.familiar1Telefono && c.familiar1Telefono.includes(q));
        if (!coincide) return false;
      }

      if (filtroEspera !== 'todos') {
        const val = c.listaEsperaPrevia === 'Sí';
        if (filtroEspera === 'si' && !val) return false;
        if (filtroEspera === 'no' && val) return false;
      }

      if (filtroAlergia !== 'todos') {
        const val = c.tieneAlergia === 'Sí';
        if (filtroAlergia === 'si' && !val) return false;
        if (filtroAlergia === 'no' && val) return false;
      }

      if (experiencia === 'previa' && !(c.inscripcionesPrevias > 0)) return false;
      if (experiencia === 'ninguna' && c.inscripcionesPrevias !== 0) return false;
      if (primeraVez && c.primeraVezCristoRey !== (primeraVez === 'si')) return false;
      if (sacramento === 'ambos' && !(c.bautismoRecibido && c.primeraComunionRecibida)) return false;
      if (sacramento === 'ninguno' && (c.bautismoRecibido !== false || c.primeraComunionRecibida !== false)) return false;
      if (sacramento === 'bautismo' && !c.bautismoRecibido) return false;
      if (sacramento === 'comunion' && !c.primeraComunionRecibida) return false;
      return true;
    }).sort((a, b) => {
      let va = a[ordenCampo] || '';
      let vb = b[ordenCampo] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return ordenAsc ? -1 : 1;
      if (va > vb) return ordenAsc ? 1 : -1;
      return 0;
    });
  }, [caminantes, busqueda, filtroEspera, filtroAlergia, experiencia, primeraVez, sacramento, ordenCampo, ordenAsc]);

  const handleEliminar = async () => {
    if (!caminanteAEliminar) return;
    setEliminando(true);

    try {
      const res = await apiFetch(`/api/caminantes/${caminanteAEliminar.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      setCaminanteAEliminar(null);
      setMensajeExito(`Inscripción de ${caminanteAEliminar.nombre} eliminada correctamente.`);
      setTimeout(() => setMensajeExito(''), 4000);
      if (onRecargar) onRecargar();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setEliminando(false);
    }
  };

  const exportarCSV = () => {
    if (!caminantes || caminantes.length === 0) return;

    const encabezados = [
      'ID', 'Fecha Registro',
      'Familiar (1) Nombre', 'Familiar (1) DNI', 'Familiar (1) Teléfono', 'Familiar (1) Email',
      'Nombre Caminante', 'Apellidos Caminante', 'Móvil', 'Email',
      'Colegio / Universidad', 'Año de nacimiento', 'Grupo', 'Inscripciones previas', 'Primera vez en Cristo Rey', 'Dirección', 'Código Postal', 'Localidad',
      'Sacramentos', 'Talla Camiseta',
      'Quién le ha invitado', 'Teléfono quien invita', 'Lista de espera previa',
      'Viene con alguien', 'Tiene alergia', 'Detalle de alergia',
      'Trastorno de salud', 'Medicación',
      'Familiar (2) Nombre', 'Familiar (2) Teléfono', 'Familiar (2) Email',
      'Contactos adicionales', 'Estado', 'Acepta RGPD'
    ];

    const filas = caminantesFiltrados.map((c) => [
      c.id,
      c.fechaRegistro ? new Date(c.fechaRegistro).toLocaleString('es-ES') : '',
      c.familiar1Nombre,
      c.familiar1Dni,
      c.familiar1Telefono,
      c.familiar1Email,
      c.nombre,
      c.apellidos,
      c.movil,
      c.email,
      c.colegio,
      c.anioNacimiento, c.genero, c.inscripcionesPrevias, respuesta(c.primeraVezCristoRey),
      c.direccion,
      c.codigoPostal,
      c.localidad,
      describirSacramentos(c),
      c.tallaCamiseta,
      c.quienInvita,
      c.quienInvitaTelefono,
      c.listaEsperaPrevia,
      c.vieneConAlguien,
      c.tieneAlergia,
      c.alergiaDetalle,
      c.trastornoSalud,
      c.medicacion,
      c.familiar2Nombre,
      c.familiar2Telefono,
      c.familiar2Email,
      c.familiaresAdicionales?.length ?? 0,
      c.estado,
      c.aceptaRgpd ? 'Sí' : 'No'
    ]);

    const csvContent = prepararCsv(encabezados, filas);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bartimeo_caminantes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enlace directo a WhatsApp
  const enlaceWhatsApp = (numero, nombre) => {
    const numLimpio = String(numero || '').replace(/\D/g, '');
    const numConPrefijo = numLimpio.startsWith('34') ? numLimpio : `34${numLimpio}`;
    const texto = encodeURIComponent(`Hola ${nombre}, te contacto desde la coordinación del ${INFO_RETIRO.caminantes.titulo}.`);
    return `https://wa.me/${numConPrefijo}?text=${texto}`;
  };

  return (
    <div>
      {/* Alerta de éxito */}
      {mensajeExito && (
        <div style={{
          background: '#EDF8F2',
          border: '1.5px solid #68B984',
          color: '#1E6B3E',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Tarjetas KPIs de Caminantes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div className="card" style={{ padding: '14px', borderLeft: '4px solid #5C1824' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#7E6B6F', fontWeight: 700 }}>
            Total Caminantes
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#5C1824', marginTop: '2px' }}>
            {caminantes.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8A7A7D', marginTop: '2px' }}>
            Inscripciones recibidas
          </div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid #E08722' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#7E6B6F', fontWeight: 700 }}>
            En Lista de Espera Previa
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#B86508', marginTop: '2px' }}>
            {metricas?.listaEsperaPrevia ?? caminantes.filter(c => c.listaEsperaPrevia === 'Sí').length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8A7A7D', marginTop: '2px' }}>
            Retiros anteriores Bartimeo
          </div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid #D9383A' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#7E6B6F', fontWeight: 700 }}>
            Con Alergias / Intolerancias
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D9383A', marginTop: '2px' }}>
            {metricas?.tieneAlergias ?? caminantes.filter(c => c.tieneAlergia === 'Sí').length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8A7A7D', marginTop: '2px' }}>
            Requieren atención en cocina
          </div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid #3E68A8' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#7E6B6F', fontWeight: 700 }}>
            Con Medicación / Salud
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3E68A8', marginTop: '2px' }}>
            {metricas?.conMedicacion ?? caminantes.filter(c => c.medicacion && c.medicacion.trim().length > 0).length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8A7A7D', marginTop: '2px' }}>
            Seguimiento de enfermería
          </div>
        </div>
      </div>

      {/* Desglose de Tallas de Camisetas */}
      {metricas?.desgloseTallas && Object.keys(metricas.desgloseTallas).length > 0 && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: '18px', background: '#FAF6F3' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5C1824', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shirt size={14} /> Desglose de Camisetas de Caminantes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(metricas.desgloseTallas).map(([talla, cantidad]) => (
              <span
                key={talla}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D8CEC8',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#2A1B1E'
                }}
              >
                Talla {talla}: <span style={{ color: '#5C1824' }}>{cantidad}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Filtros, Búsqueda y Selector de Vista */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '18px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Buscador */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} color="#7E6B6F" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar caminante, familiar, colegio..."
              className="input-field"
              style={{ width: '100%', paddingLeft: '32px', fontSize: '0.84rem' }}
            />
          </div>

          {/* Filtro Lista Espera */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#6E5C60', fontWeight: 600 }}>Espera:</span>
            <select
              value={filtroEspera}
              onChange={(e) => setFiltroEspera(e.target.value)}
              className="input-field"
              style={{ padding: '6px 10px', fontSize: '0.82rem' }}
            >
              <option value="todos">Todos</option>
              <option value="si">Sí estuvo en espera</option>
              <option value="no">No estuvo en espera</option>
            </select>
          </div>

          {/* Filtro Alergias */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#6E5C60', fontWeight: 600 }}>Alergias:</span>
            <select className="select-field" aria-label="Inscripciones previas" value={experiencia} onChange={(e) => setExperiencia(e.target.value)}>
              <option value="">Inscripciones previas</option><option value="previa">Con inscripciones previas</option><option value="ninguna">Sin inscripciones previas</option>
            </select>
            <select className="select-field" aria-label="Primera vez en Cristo Rey" value={primeraVez} onChange={(e) => setPrimeraVez(e.target.value)}>
              <option value="">Primera vez en Cristo Rey</option><option value="si">Sí</option><option value="no">No</option>
            </select>
            <select className="select-field" aria-label="Sacramentos" value={sacramento} onChange={(e) => setSacramento(e.target.value)}>
              <option value="">Todos los sacramentos</option><option value="bautismo">Bautismo</option><option value="comunion">Primera Comunión</option><option value="ambos">Ambos</option><option value="ninguno">Ninguno</option>
            </select>
            <select
              value={filtroAlergia}
              onChange={(e) => setFiltroAlergia(e.target.value)}
              className="input-field"
              style={{ padding: '6px 10px', fontSize: '0.82rem' }}
            >
              <option value="todos">Todos</option>
              <option value="si">Con alergia</option>
              <option value="no">Sin alergia</option>
            </select>
          </div>

          {/* Botones de acción: Exportar y Modo de Vista */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={exportarCSV}
              disabled={caminantes.length === 0}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              title="Descargar Excel de Caminantes"
            >
              <Download size={14} /> Exportar Excel
            </button>

            {/* Selector de modo Móvil / Escritorio */}
            <div style={{ display: 'inline-flex', background: '#FAF6F3', borderRadius: '8px', border: '1px solid #D8CEC8', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setVistaModo('tarjetas')}
                style={{
                  background: vistaModo === 'tarjetas' ? '#5C1824' : 'transparent',
                  color: vistaModo === 'tarjetas' ? '#FFFFFF' : '#6E5C60',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
                title="Vista de Tarjetas (ideal para móvil con botones WhatsApp y Llamada)"
              >
                <Smartphone size={13} /> Tarjetas
              </button>
              <button
                type="button"
                onClick={() => setVistaModo('tabla')}
                style={{
                  background: vistaModo === 'tabla' ? '#5C1824' : 'transparent',
                  color: vistaModo === 'tabla' ? '#FFFFFF' : '#6E5C60',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
                title="Vista de Tabla (ideal para ordenador)"
              >
                <LayoutGrid size={13} /> Tabla
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados de búsqueda */}
      <div style={{ fontSize: '0.82rem', color: '#6E5C60', marginBottom: '12px', fontWeight: 600 }}>
        Mostrando {caminantesFiltrados.length} de {caminantes.length} caminantes registrados
      </div>

      {caminantesFiltrados.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: '#7E6B6F' }}>
          <Compass size={36} color="#8A7A7D" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No se encontraron caminantes</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
            Prueba a modificar los filtros o el término de búsqueda.
          </div>
        </div>
      ) : vistaModo === 'tarjetas' ? (
        /* VISTA TARJETAS MÓVILES (CON ACCESO DIRECTO A WHATSAPP Y LLAMADA) */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '14px'
        }}>
          {caminantesFiltrados.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: c.tieneAlergia === 'Sí' ? '4px solid #D9383A' : '4px solid #5C1824',
                position: 'relative'
              }}
            >
              <div>
                {/* Cabecera Tarjeta: Nombre y Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2A1B1E', margin: 0 }}>
                      {c.nombre} {c.apellidos}
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: '#6E5C60', marginTop: '2px' }}>
                      {c.colegio || 'Colegio no especificado'} • {c.localidad || 'Córdoba'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    background: '#FAF6F3',
                    border: '1px solid #D8CEC8',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    color: '#5C1824'
                  }}>
                    Talla {c.tallaCamiseta || '-'}
                  </span>
                </div>

                {/* Badges de Estado */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
                  {c.listaEsperaPrevia === 'Sí' && (
                    <span style={{ fontSize: '0.7rem', background: '#FFF3E0', color: '#B86508', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      ⏳ En espera previa
                    </span>
                  )}
                  {c.tieneAlergia === 'Sí' && (
                    <span style={{ fontSize: '0.7rem', background: '#FFEBEE', color: '#C62828', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }} title={c.alergiaDetalle}>
                      ⚠️ Alergia: {c.alergiaDetalle || 'Sí'}
                    </span>
                  )}
                  {c.medicacion && (
                    <span style={{ fontSize: '0.7rem', background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      💊 Medicación
                    </span>
                  )}
                  {c.quienInvita && (
                    <span style={{ fontSize: '0.7rem', background: '#F5EBE6', color: '#5C1824', padding: '2px 6px', borderRadius: '4px' }}>
                      Invitado por: <strong>{c.quienInvita}</strong>
                    </span>
                  )}
                </div>

                {/* Información de Contactos */}
                <div style={{
                  background: '#FAF6F3',
                  border: '1px solid #E8DFDA',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.78rem',
                  color: '#4A3B3E',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontWeight: 700, color: '#5C1824', marginBottom: '4px' }}>
                    Tutor (1): {c.familiar1Nombre || 'No indicado'}
                  </div>
                  <div>DNI: {c.familiar1Dni || '-'} • Tel: {c.familiar1Telefono || '-'}</div>
                  {c.familiar2Nombre && (
                    <div style={{ marginTop: '4px', borderTop: '1px dashed #D8CEC8', paddingTop: '4px' }}>
                      Familiar (2): {c.familiar2Nombre} ({c.familiar2Telefono || '-'})
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción Móvil: Llamada y WhatsApp al Caminante y al Padre */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                  {c.movil && (
                    <a
                      href={enlaceWhatsApp(c.movil, c.nombre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        background: '#25D366',
                        color: '#FFFFFF',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}

                  {c.familiar1Telefono && (
                    <a
                      href={`tel:${c.familiar1Telefono}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        background: '#5C1824',
                        color: '#FFFFFF',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={13} /> Llamar Padre
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCaminanteSeleccionado(c)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: '#FAF6F3',
                      border: '1px solid #D8CEC8',
                      color: '#2A1B1E',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={13} /> Ficha Completa
                  </button>

                  <button
                    type="button"
                    onClick={() => setCaminanteAEliminar(c)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #F0A8AB',
                      color: '#C62828',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                    title="Eliminar inscripción"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISTA TABLA ESCRITORIO */
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FAF6F3', borderBottom: '2px solid #E8DFDA', color: '#5C1824' }}>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Caminante</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Colegio / Localidad</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Talla</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Invitado por</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Espera</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Alergias / Salud</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Tutor (Familiar 1)</th>
                <th style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {caminantesFiltrados.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: '1px solid #F0EAE6',
                    background: idx % 2 === 0 ? '#FFFFFF' : '#FDFAF8'
                  }}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, color: '#2A1B1E' }}>{c.nombre} {c.apellidos}</div>
                    <div style={{ fontSize: '0.74rem', color: '#7E6B6F' }}>
                      {c.movil} • {c.email}
                    </div>
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    <div>{c.colegio || '-'}</div>
                    <div style={{ fontSize: '0.74rem', color: '#7E6B6F' }}>{c.localidad || 'Córdoba'} ({c.codigoPostal || '-'})</div>
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontWeight: 700,
                      background: '#FAF6F3',
                      border: '1px solid #D8CEC8',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#5C1824'
                    }}>
                      {c.tallaCamiseta || '-'}
                    </span>
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    <div>{c.quienInvita || '-'}</div>
                    <div style={{ fontSize: '0.74rem', color: '#7E6B6F' }}>{c.quienInvitaTelefono || '-'}</div>
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    {c.listaEsperaPrevia === 'Sí' ? (
                      <span style={{ color: '#B86508', fontWeight: 700 }}>Sí</span>
                    ) : (
                      <span style={{ color: '#7E6B6F' }}>No</span>
                    )}
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    {c.tieneAlergia === 'Sí' && (
                      <div style={{ color: '#C62828', fontWeight: 700, fontSize: '0.76rem' }}>
                        ⚠️ {c.alergiaDetalle || 'Alergia indicada'}
                      </div>
                    )}
                    {c.medicacion && (
                      <div style={{ color: '#1565C0', fontSize: '0.74rem' }}>
                        💊 {c.medicacion}
                      </div>
                    )}
                    {c.tieneAlergia !== 'Sí' && !c.medicacion && (
                      <span style={{ color: '#2E6930', fontSize: '0.76rem' }}>Sin incidencias</span>
                    )}
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{c.familiar1Nombre || '-'}</div>
                    <div style={{ fontSize: '0.74rem', color: '#7E6B6F' }}>
                      Tel: {c.familiar1Telefono || '-'} • DNI: {c.familiar1Dni || '-'}
                    </div>
                  </td>

                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setCaminanteSeleccionado(c)}
                        style={{
                          background: '#FAF6F3',
                          border: '1px solid #D8CEC8',
                          color: '#5C1824',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        title="Ver Ficha Detallada"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setCaminanteAEliminar(c)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #F0A8AB',
                          color: '#C62828',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        title="Eliminar inscripción"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FICHA DETALLADA DEL CAMINANTE */}
      {caminanteSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8DFDA', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#5C1824', fontWeight: 700 }}>
                  Ficha Oficial • {INFO_RETIRO.edicion} Bartimeo Córdoba
                </span>
                <h2 style={{ fontSize: '1.25rem', color: '#2A1B1E', margin: '2px 0 0', fontWeight: 800 }}>
                  {caminanteSeleccionado.nombre} {caminanteSeleccionado.apellidos}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCaminanteSeleccionado(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7E6B6F' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Bloque 1: Datos Participante */}
            <div style={{ marginBottom: '14px', background: '#FAF6F3', padding: '12px', borderRadius: '10px', border: '1px solid #E8DFDA' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#5C1824', textTransform: 'uppercase', marginBottom: '6px' }}>
                Datos del Participante
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.82rem' }}>
                <div><strong>Móvil:</strong> {caminanteSeleccionado.movil || '-'}</div>
                <div><strong>Email:</strong> {caminanteSeleccionado.email || '-'}</div>
                <div><strong>Nacimiento:</strong> {caminanteSeleccionado.anioNacimiento || 'Sin dato'}</div>
                <div><strong>Colegio/Univ:</strong> {caminanteSeleccionado.colegio || '-'}</div>
                <div><strong>Dirección:</strong> {caminanteSeleccionado.direccion || '-'}</div>
                <div><strong>Localidad / CP:</strong> {caminanteSeleccionado.localidad || 'Córdoba'} ({caminanteSeleccionado.codigoPostal || '-'})</div>
                <div><strong>Sacramentos:</strong> {describirSacramentos(caminanteSeleccionado)}</div>
                <div><strong>Estado:</strong> {caminanteSeleccionado.estado}</div>
                <div><strong>Grupo:</strong> {({ nino: 'Niño', nina: 'Niña' })[caminanteSeleccionado.genero] || 'Sin dato'}</div>
                <div><strong>Inscripciones previas:</strong> {caminanteSeleccionado.inscripcionesPrevias ?? 'Sin dato'}</div>
                <div><strong>Primera vez en Cristo Rey:</strong> {respuesta(caminanteSeleccionado.primeraVezCristoRey)}</div>
                {caminanteSeleccionado.familiaresAdicionales?.map((f, i) => (
                  <div key={i}><strong>Familiar adicional:</strong> {f.nombre} · {f.telefono} · {f.parentesco}</div>
                ))}
                <div><strong>Talla Camiseta:</strong> <span style={{ fontWeight: 800, color: '#5C1824' }}>{caminanteSeleccionado.tallaCamiseta || '-'}</span></div>
              </div>
            </div>

            {/* Bloque 2: Retiro y Amigos */}
            <div style={{ marginBottom: '14px', background: '#FAF6F3', padding: '12px', borderRadius: '10px', border: '1px solid #E8DFDA' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#5C1824', textTransform: 'uppercase', marginBottom: '6px' }}>
                Convocatoria y Acompañamiento
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.82rem' }}>
                <div><strong>Quién le ha invitado:</strong> {caminanteSeleccionado.quienInvita || '-'}</div>
                <div><strong>Teléfono invitante:</strong> {caminanteSeleccionado.quienInvitaTelefono || '-'}</div>
                <div><strong>¿Lista de espera previa?:</strong> <span style={{ fontWeight: 700, color: caminanteSeleccionado.listaEsperaPrevia === 'Sí' ? '#B86508' : '#2A1B1E' }}>{caminanteSeleccionado.listaEsperaPrevia || 'No'}</span></div>
                <div><strong>¿Viene con alguien?:</strong> {caminanteSeleccionado.vieneConAlguien || 'No indicado'}</div>
              </div>
            </div>

            {/* Bloque 3: Salud y Alergias */}
            <div style={{ marginBottom: '14px', background: '#FFF8F6', padding: '12px', borderRadius: '10px', border: '1px solid #F0C4BA' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#C62828', textTransform: 'uppercase', marginBottom: '6px' }}>
                Salud, Alergias y Medicación
              </div>
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>¿Tiene Alergia?:</strong> {caminanteSeleccionado.tieneAlergia}</div>
                {caminanteSeleccionado.tieneAlergia === 'Sí' && (
                  <div style={{ background: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E8B0B3', color: '#9C1A1C' }}>
                    <strong>Detalle de alergia:</strong> {caminanteSeleccionado.alergiaDetalle || 'No detallado'}
                  </div>
                )}
                <div><strong>Trastorno físico / psíquico:</strong> {caminanteSeleccionado.trastornoSalud || 'Ninguno indicado'}</div>
                <div><strong>Medicación habitual:</strong> {caminanteSeleccionado.medicacion || 'Ninguna indicada'}</div>
              </div>
            </div>

            {/* Bloque 4: Familiares */}
            <div style={{ marginBottom: '16px', background: '#FAF6F3', padding: '12px', borderRadius: '10px', border: '1px solid #E8DFDA' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#5C1824', textTransform: 'uppercase', marginBottom: '6px' }}>
                Datos de los Padres / Tutores
              </div>
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '6px', border: '1px solid #E8DFDA' }}>
                  <div style={{ fontWeight: 700, color: '#5C1824' }}>Familiar (1) - Tutor Principal</div>
                  <div>{caminanteSeleccionado.familiar1Nombre} • DNI: {caminanteSeleccionado.familiar1Dni || '-'}</div>
                  <div>Teléfono: <strong>{caminanteSeleccionado.familiar1Telefono || '-'}</strong> • Email: {caminanteSeleccionado.familiar1Email || '-'}</div>
                </div>

                {caminanteSeleccionado.familiar2Nombre && (
                  <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '6px', border: '1px solid #E8DFDA' }}>
                    <div style={{ fontWeight: 700, color: '#5C1824' }}>Familiar (2) - Contacto Adicional</div>
                    <div>{caminanteSeleccionado.familiar2Nombre}</div>
                    <div>Teléfono: <strong>{caminanteSeleccionado.familiar2Telefono || '-'}</strong> • Email: {caminanteSeleccionado.familiar2Email || '-'}</div>
                  </div>
                )}
              </div>
            </div>

            <EditarInscripcion tipo="caminantes" ficha={caminanteSeleccionado} token={token}
              onGuardado={() => { setCaminanteSeleccionado(null); onRecargar?.(); }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FAF6F3',
                  border: '1px solid #D8CEC8',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Printer size={14} /> Imprimir Ficha
              </button>
              <button
                type="button"
                onClick={() => setCaminanteSeleccionado(null)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN BORRADO */}
      {caminanteAEliminar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '440px',
            width: '100%',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '1.1rem', color: '#9C1A1C', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} /> Confirmar eliminación
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#3E2A2E', lineHeight: 1.45, marginBottom: '16px' }}>
              ¿Estás seguro de que deseas eliminar permanentemente la inscripción de <strong>{caminanteAEliminar.nombre} {caminanteAEliminar.apellidos}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCaminanteAEliminar(null)}
                disabled={eliminando}
                style={{
                  background: '#FAF6F3',
                  border: '1px solid #D8CEC8',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                disabled={eliminando}
                style={{
                  background: '#C62828',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: eliminando ? 'not-allowed' : 'pointer'
                }}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
