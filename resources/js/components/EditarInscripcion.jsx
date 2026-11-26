import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const comunes = [
  ['nombre', 'Nombre'], ['apellidos', 'Apellidos'], ['movil', 'Teléfono', 'tel'],
  ['email', 'Correo', 'email'], ['estado', 'Estado', ['Confirmado', 'Cancelado']]
];
const porTipo = {
  caminantes: [
    ['colegio', 'Colegio'], ['anioNacimiento', 'Año de nacimiento', 'number'],
    ['genero', 'Grupo', [['nino', 'Niño'], ['nina', 'Niña']]],
    ['inscripcionesPrevias', 'Inscripciones previas', 'number'],
    ['primeraVezCristoRey', 'Primera vez en Cristo Rey', 'boolean'],
    ['bautismoRecibido', 'Bautismo', 'boolean'], ['primeraComunionRecibida', 'Primera Comunión', 'boolean'],
    ['tallaCamiseta', 'Talla de camiseta']
  ],
  servidores: [
    ['bartimeoOrigen', 'Parroquia de procedencia'], ['haServido', 'Ha servido antes', ['Sí', 'No']],
    ['cuantasVeces', 'Veces que ha servido', 'number'], ['tallaCamisetaBlanca', 'Camiseta blanca'],
    ['tallaCamisetaGris', 'Camiseta gris'], ['tallaSudadera', 'Sudadera']
  ]
};

export default function EditarInscripcion({ tipo, ficha, token, onGuardado }) {
  const [catalogos, setCatalogos] = useState({});
  useEffect(() => {
    apiFetch('/api/catalogos').then((r) => r.ok ? r.json() : {}).then(setCatalogos).catch(() => {});
  }, []);
  const [cambios, setCambios] = useState({});
  const familiares = cambios.familiaresAdicionales ?? ficha.familiaresAdicionales ?? [];
  const cambiarFamiliares = (lista) => setCambios((prev) => ({ ...prev, familiaresAdicionales: lista }));
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje('');
    try {
      const res = await apiFetch(`/api/${tipo}/${encodeURIComponent(ficha.id)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar.');
      onGuardado();
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <details style={{ margin: '16px 0' }}>
      <summary>Editar inscripción</summary>
      <form onSubmit={guardar} style={{ marginTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))', gap: 10 }}>
          {[...comunes, ...porTipo[tipo]].map(([campo, etiqueta, tipoCampo = 'text']) => {
            const valor = cambios[campo] ?? ficha[campo] ?? '';
            const catalogo = ({ bartimeoOrigen: 'parroquia', tallaCamiseta: 'talla_caminante',
              tallaCamisetaBlanca: 'talla_ropa', tallaCamisetaGris: 'talla_ropa', tallaSudadera: 'talla_ropa' })[campo];
            const opciones = catalogo && catalogos[catalogo]?.map((item) => item.valor);
            const lista = opciones ? (catalogo === 'talla_ropa' ? [['', 'Sin talla'], ...opciones] : opciones) : tipoCampo === 'boolean' ? [['true', 'Sí'], ['false', 'No']] : tipoCampo;
            const onChange = (e) => {
              const texto = e.target.value;
              const nuevo = tipoCampo === 'boolean' ? texto === 'true' : tipoCampo === 'number' ? Number(texto) : texto;
              setCambios((prev) => ({ ...prev, [campo]: nuevo }));
            };
            return <label key={campo}>
              <span className="form-label">{etiqueta}</span>
              {Array.isArray(lista) ? <select className="select-field" value={String(valor)} onChange={onChange}>
                {!lista.some((item) => String(valor) === (Array.isArray(item) ? item[0] : item)) &&
                  <option value={String(valor)} disabled>{valor || 'Sin dato'}</option>}
                {lista.map((item) => {
                  const [value, label] = Array.isArray(item) ? item : [item, item];
                  return <option key={value} value={value}>{label}</option>;
                })}
              </select> : <input className="input-field" type={tipoCampo} value={valor} onChange={onChange} />}
            </label>;
          })}
        </div>
        {tipo === 'caminantes' && <fieldset style={{ marginTop: 12 }}>
          <legend>Familiares adicionales</legend>
          {familiares.map((familiar, i) => <div key={i} style={{ marginBottom: 10 }}>
            {[['nombre', 'Nombre y apellidos'], ['telefono', 'Teléfono'], ['parentesco', 'Parentesco']].map(([campo, etiqueta]) =>
              <label key={campo} style={{ display: 'block' }}>
                <span className="form-label">{etiqueta}</span>
                <input className="input-field" value={familiar[campo]} onChange={(e) => cambiarFamiliares(
                  familiares.map((item, indice) => i === indice ? { ...item, [campo]: e.target.value } : item)
                )} />
              </label>)}
            <button type="button" className="btn btn-secondary"
              onClick={() => cambiarFamiliares(familiares.filter((_, indice) => indice !== i))}>Quitar familiar {i + 1}</button>
          </div>)}
          {familiares.length < 2 && <button type="button" className="btn btn-secondary"
            onClick={() => cambiarFamiliares([...familiares, { nombre: '', telefono: '', parentesco: '' }])}>Añadir familiar</button>}
        </fieldset>}
        {tipo === 'servidores' && (cambios.haServido ?? ficha.haServido) === 'Sí' && catalogos.servicio?.length > 0 &&
          <fieldset style={{ marginTop: 12 }}>
            <legend>Servicios anteriores</legend>
            {[...new Set([...catalogos.servicio.map((item) => item.valor), ...(ficha.serviciosHechos || [])])].map((servicio) => {
              const elegidos = cambios.serviciosHechos ?? ficha.serviciosHechos ?? [];
              const disponible = catalogos.servicio.some((item) => item.valor === servicio);
              return <label key={servicio} style={{ display: 'block' }}>
                <input type="checkbox" checked={elegidos.includes(servicio)} disabled={!disponible}
                  onChange={(e) => {
                    const activos = elegidos.filter((valor) => catalogos.servicio.some((item) => item.valor === valor));
                    setCambios((prev) => ({ ...prev, serviciosHechos: e.target.checked
                      ? [...activos, servicio] : activos.filter((valor) => valor !== servicio) }));
                  }} /> {servicio}{disponible ? '' : ' (histórico)'}
              </label>;
            })}
          </fieldset>}
        {mensaje && <p role="alert">{mensaje}</p>}
        <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }}
          disabled={guardando || !Object.keys(cambios).length}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
      </form>
    </details>
  );
}
