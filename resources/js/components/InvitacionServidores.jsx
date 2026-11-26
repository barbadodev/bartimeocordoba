import React, { useEffect, useState } from 'react';
import { apiFetch, rutaParroquia } from '../api';

const endpoint = '/api/coordinacion/invitacion-servidores';

async function solicitar(token, method = 'GET', body) {
  const res = await apiFetch(endpoint, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const datos = await res.json();
  if (!res.ok) throw new Error(datos.error || 'No se pudo consultar la invitación.');
  return datos;
}

export default function InvitacionServidores({ token }) {
  const [venceEn, setVenceEn] = useState(null);
  const [enlace, setEnlace] = useState('');
  const [dias, setDias] = useState('7');
  const [ocupado, setOcupado] = useState(true);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let abierto = true;
    solicitar(token).then((datos) => {
      if (abierto) setVenceEn(datos.venceEn);
    }).catch((fallo) => {
      if (abierto) setError(fallo.message);
    }).finally(() => {
      if (abierto) setOcupado(false);
    });
    return () => { abierto = false; };
  }, [token]);

  async function cambiar(method) {
    setOcupado(true);
    setError('');
    setCopiado(false);
    try {
      const datos = await solicitar(token, method, method === 'POST' ? { dias: Number(dias) } : undefined);
      setVenceEn(datos.venceEn);
      setEnlace(datos.clave
        ? new URL(`${rutaParroquia('servidores')}#invitacion=${datos.clave}`, window.location.origin).href : '');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  return <section className="card">
    <h3>Enlace de inscripción de servidores</h3>
    <p>{venceEn ? `Invitación activa hasta ${new Date(venceEn).toLocaleString('es-ES')}.` : 'Puedes generar un enlace para compartir con el grupo.'}</p>
    {venceEn && <p>Generar otro enlace invalida el anterior.</p>}
    <form onSubmit={(evento) => { evento.preventDefault(); cambiar('POST'); }}>
      <label>
        Días de validez
        <input required type="number" min="1" max="30" className="input-field" value={dias}
          onChange={(evento) => setDias(evento.target.value)} />
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={ocupado}>{venceEn ? 'Generar otro enlace' : 'Generar enlace'}</button>
        {venceEn && <button type="button" className="btn btn-secondary" disabled={ocupado}
          onClick={() => cambiar('DELETE')}>Desactivar enlace</button>}
      </div>
    </form>
    {enlace && <div style={{ marginTop: 12 }}>
      <input aria-label="Enlace de invitación" className="input-field" readOnly value={enlace}
        onFocus={(evento) => evento.target.select()} />
      <button type="button" className="btn btn-secondary" onClick={async () => {
        try { await navigator.clipboard.writeText(enlace); setCopiado(true); }
        catch { setError('Selecciona el enlace y cópialo manualmente.'); }
      }}>{copiado ? 'Enlace copiado' : 'Copiar enlace'}</button>
    </div>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
