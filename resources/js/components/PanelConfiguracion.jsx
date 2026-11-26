import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, PARROQUIA_SLUG } from '../api';
import InvitacionServidores from './InvitacionServidores';

const CATALOGOS = [
  { tipo: 'servicio', titulo: 'Servicios' },
  { tipo: 'talla_caminante', titulo: 'Tallas de camiseta de caminantes' },
  { tipo: 'talla_ropa', titulo: 'Tallas de ropa de servidores' }
];

const panelStyle = {
  background: '#fff', border: '1px solid #eadfe1', borderRadius: 14,
  padding: 18, marginBottom: 16, boxShadow: '0 2px 8px rgba(42,27,30,.04)'
};
const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #d9c9cc',
  borderRadius: 8, font: 'inherit', color: '#2a1b1e', boxSizing: 'border-box'
};
const buttonStyle = {
  border: 0, borderRadius: 8, padding: '10px 14px', background: '#5c1824',
  color: '#fff', fontWeight: 700, cursor: 'pointer'
};

async function leerRespuesta(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error de servidor (${res.status})`);
  return data;
}

export default function PanelConfiguracion({ token }) {
  const esAdministracionGeneral = PARROQUIA_SLUG === 'cristorey';
  const [edicion, setEdicion] = useState({ slug: '', nombre: '' });
  const [plazas, setPlazas] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [catalogos, setCatalogos] = useState({ servicio: [], talla_caminante: [], talla_ropa: [] });
  const [parroquias, setParroquias] = useState([]);
  const [nuevoValor, setNuevoValor] = useState({});
  const [nuevaParroquia, setNuevaParroquia] = useState({ nombre: '', slug: '', passwordInicial: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const headers = { Authorization: `Bearer ${token}` };
  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const peticiones = [
        apiFetch('/api/plazas/caminantes'),
        apiFetch('/api/catalogos/gestion', { headers })
      ];
      if (esAdministracionGeneral) peticiones.push(apiFetch('/api/parroquias'));
      const respuestas = await Promise.all(peticiones);
      const [datosPlazas, datosCatalogos] = await Promise.all(respuestas.slice(0, 2).map(leerRespuesta));
      setPlazas(datosPlazas.limites || datosPlazas);
      setOcupacion(datosPlazas.ocupacion);
      setCatalogos(Object.fromEntries(CATALOGOS.map(({ tipo }) => [tipo, datosCatalogos[tipo] || []])));
      if (esAdministracionGeneral) setParroquias(await leerRespuesta(respuestas[2]));
    } catch (err) {
      setError(err.message || 'No se pudo cargar la configuración.');
    } finally {
      setCargando(false);
    }
  }, [esAdministracionGeneral, token]);

  useEffect(() => { cargar(); }, [cargar]);

  async function nuevaEdicion(evento) {
    evento.preventDefault();
    setGuardando('edicion');
    setError('');
    setMensaje('');
    try {
      await leerRespuesta(await apiFetch('/api/ediciones', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(edicion)
      }));
      window.location.assign('?edicion=' + encodeURIComponent(edicion.slug));
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando('');
    }
  }

  const guardarPlazas = async (event) => {
    event.preventDefault();
    setGuardando('plazas'); setError(''); setMensaje('');
    try {
      const res = await apiFetch('/api/plazas/caminantes', {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxNinos: Number(plazas.max_ninos), maxNinas: Number(plazas.max_ninas),
          maxTotal: Number(plazas.max_total)
        })
      });
      const data = await leerRespuesta(res);
      setPlazas(data.limites || data);
      setOcupacion(data.ocupacion);
      setMensaje('Límites de plazas guardados.');
    } catch (err) { setError(err.message); }
    finally { setGuardando(''); }
  };

  const actualizarValor = (tipo, indice, cambios) => {
    setCatalogos((actuales) => ({
      ...actuales,
      [tipo]: actuales[tipo].map((item, i) => i === indice ? { ...item, ...cambios } : item)
    }));
  };

  const guardarCatalogo = async (tipo) => {
    setGuardando(tipo); setError(''); setMensaje('');
    try {
      const res = await apiFetch(`/api/catalogos/${tipo}`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valores: catalogos[tipo].map(({ valor, activo }) => ({ valor: valor.trim(), activo: Boolean(activo) })) })
      });
      const data = await leerRespuesta(res);
      setCatalogos((actuales) => ({ ...actuales, [tipo]: Array.isArray(data) ? data : (data[tipo] || actuales[tipo]) }));
      setMensaje('Catálogo guardado.');
    } catch (err) { setError(err.message); }
    finally { setGuardando(''); }
  };

  const agregarValor = (tipo) => {
    const valor = (nuevoValor[tipo] || '').trim();
    if (!valor) return;
    if (catalogos[tipo].some((item) => item.valor.toLowerCase() === valor.toLowerCase())) {
      setError('Ese valor ya existe en el catálogo.'); return;
    }
    setCatalogos((actuales) => ({ ...actuales, [tipo]: [...actuales[tipo], { valor, activo: true }] }));
    setNuevoValor((actuales) => ({ ...actuales, [tipo]: '' }));
    setError('');
  };

  const crearParroquia = async (event) => {
    event.preventDefault(); setGuardando('parroquia'); setError(''); setMensaje('');
    try {
      const res = await apiFetch('/api/parroquias', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaParroquia)
      });
      const creada = await leerRespuesta(res);
      setParroquias((actuales) => [...actuales, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevaParroquia({ nombre: '', slug: '', passwordInicial: '' });
      setMensaje('Parroquia creada.');
    } catch (err) { setError(err.message); }
    finally { setGuardando(''); }
  };

  const actualizarParroquia = async (parroquia, cambios) => {
    setGuardando(`parroquia:${parroquia.slug}`); setError(''); setMensaje('');
    try {
      const res = await apiFetch(`/api/parroquias/${encodeURIComponent(parroquia.slug)}`, {
        method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios)
      });
      const actualizada = await leerRespuesta(res);
      setParroquias((actuales) => actuales.map((item) => item.slug === actualizada.slug ? actualizada : item));
      setMensaje('Parroquia actualizada.');
    } catch (err) { setError(err.message); }
    finally { setGuardando(''); }
  };

  if (cargando) return <div style={panelStyle} role="status">Cargando configuración…</div>;

  return (
    <section aria-labelledby="configuracion-titulo" style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 12px' }}>
      <h2 id="configuracion-titulo" style={{ color: '#5c1824', fontFamily: 'Georgia, serif', margin: '4px 0 16px' }}>Configuración</h2>
      <InvitacionServidores token={token} />
      {error && <div role="alert" style={{ ...panelStyle, borderColor: '#d98989', color: '#9c1a1c', padding: 12 }}>{error}</div>}
      {mensaje && <div role="status" style={{ ...panelStyle, borderColor: '#9fc9a4', color: '#286333', padding: 12 }}>{mensaje}</div>}

      <form onSubmit={nuevaEdicion} style={panelStyle}>
        <h3>Crear una edición</h3>
        <label>Nombre <input required maxLength={100} value={edicion.nombre} style={inputStyle}
          onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })} /></label>
        <label>Identificador <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={48}
          placeholder="viii" value={edicion.slug} style={inputStyle}
          onChange={(e) => setEdicion({ ...edicion, slug: e.target.value })} /></label>
        <button type="submit" className="btn btn-primary" disabled={Boolean(guardando)}>Crear edición</button>
      </form>
      <form onSubmit={guardarPlazas} style={panelStyle}>
        <h3 style={{ marginTop: 0, color: '#5c1824' }}>Plazas de caminantes</h3>
        {ocupacion && <p>Ocupación actual · {ocupacion.ninos} niños · {ocupacion.ninas} niñas · {ocupacion.total} en total</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {[
            ['max_ninos', 'Máximo de niños'], ['max_ninas', 'Máximo de niñas'], ['max_total', 'Máximo total']
          ].map(([campo, etiqueta]) => (
            <label key={campo} style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 }}>
              {etiqueta}
              <input required type="number" min="0" max="10000" value={plazas?.[campo] ?? ''} onChange={(e) => setPlazas((p) => ({ ...p, [campo]: e.target.value }))} style={inputStyle} />
            </label>
          ))}
        </div>
        <button type="submit" disabled={Boolean(guardando)} style={{ ...buttonStyle, marginTop: 14, opacity: guardando ? .65 : 1 }}> {guardando === 'plazas' ? 'Guardando…' : 'Guardar límites'}</button>
      </form>

      {CATALOGOS.map(({ tipo, titulo }) => (
        <article key={tipo} style={panelStyle}>
          <h3 style={{ marginTop: 0, color: '#5c1824' }}>{titulo}</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {catalogos[tipo].map((item, indice) => (
              <div key={`${item.valor}-${indice}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center' }}>
                <input aria-label={`Valor ${indice + 1} de ${titulo}`} value={item.valor} onChange={(e) => actualizarValor(tipo, indice, { valor: e.target.value })} style={inputStyle} />
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap', fontSize: 14 }}>
                  <input type="checkbox" checked={Boolean(item.activo)} onChange={(e) => actualizarValor(tipo, indice, { activo: e.target.checked })} /> Activo
                </label>
              </div>
            ))}
            {!catalogos[tipo].length && <p style={{ color: '#6e5c60' }}>No hay valores configurados.</p>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); agregarValor(tipo); }} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input aria-label={`Nuevo valor para ${titulo}`} value={nuevoValor[tipo] || ''} onChange={(e) => setNuevoValor((actuales) => ({ ...actuales, [tipo]: e.target.value }))} placeholder="Añadir valor" style={inputStyle} />
            <button type="submit" style={{ ...buttonStyle, flexShrink: 0 }}>Añadir</button>
          </form>
          <button type="button" disabled={Boolean(guardando)} onClick={() => guardarCatalogo(tipo)} style={{ ...buttonStyle, marginTop: 12, opacity: guardando ? .65 : 1 }}>{guardando === tipo ? 'Guardando…' : 'Guardar catálogo'}</button>
        </article>
      ))}

      {esAdministracionGeneral && (
        <section style={panelStyle} aria-labelledby="parroquias-titulo">
          <h3 id="parroquias-titulo" style={{ marginTop: 0, color: '#5c1824' }}>Parroquias</h3>
          <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
            {parroquias.map((parroquia) => (
              <ParroquiaFila key={parroquia.slug} parroquia={parroquia} guardando={guardando === `parroquia:${parroquia.slug}`} onGuardar={actualizarParroquia} />
            ))}
          </div>
          <form onSubmit={crearParroquia} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, alignItems: 'end', borderTop: '1px solid #eee4e5', paddingTop: 16 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 }}>Nombre<input required value={nuevaParroquia.nombre} onChange={(e) => setNuevaParroquia((p) => ({ ...p, nombre: e.target.value }))} style={inputStyle} /></label>
            <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 }}>Slug (URL)<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={nuevaParroquia.slug} onChange={(e) => setNuevaParroquia((p) => ({ ...p, slug: e.target.value.toLowerCase() }))} style={inputStyle} /></label>
            <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 }}>Contraseña inicial (mín. 12 caracteres)<input required minLength={12} type="password" autoComplete="new-password" value={nuevaParroquia.passwordInicial} onChange={(e) => setNuevaParroquia((p) => ({ ...p, passwordInicial: e.target.value }))} style={inputStyle} /></label>
            <button type="submit" disabled={Boolean(guardando)} style={{ ...buttonStyle, opacity: guardando ? .65 : 1 }}>{guardando === 'parroquia' ? 'Creando…' : 'Crear parroquia'}</button>
          </form>
        </section>
      )}
    </section>
  );
}

function ParroquiaFila({ parroquia, guardando, onGuardar }) {
  const [nombre, setNombre] = useState(parroquia.nombre);
  useEffect(() => setNombre(parroquia.nombre), [parroquia.nombre]);
  const activa = Boolean(parroquia.activa);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 8, alignItems: 'center' }}>
      <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#6e5c60' }}>
        {parroquia.slug}
        <input aria-label={`Nombre de ${parroquia.slug}`} value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
      </label>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap', fontSize: 14 }}>
        <input type="checkbox" checked={activa} disabled={parroquia.slug === 'cristorey' || guardando} onChange={(e) => onGuardar(parroquia, { activa: e.target.checked })} /> Activa
      </label>
      <button type="button" disabled={guardando || !nombre.trim() || nombre.trim() === parroquia.nombre} onClick={() => onGuardar(parroquia, { nombre: nombre.trim() })} style={{ ...buttonStyle, opacity: guardando ? .65 : 1 }}>Guardar</button>
    </div>
  );
}
