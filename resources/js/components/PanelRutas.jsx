import React from 'react';
import { ArrowUpRight, ClipboardList, Compass, ExternalLink, Home, Settings, ShieldCheck, Users, CalendarCheck } from 'lucide-react';
import { EDICION_SLUG, getClaveAccesoCoordinacion, rutaParroquia, conservarAccesoCoordinacion } from '../api';
import { INFO_RETIRO } from '../tema';

const enlace = (ruta) => rutaParroquia(ruta);
const enlaceCoordinacion = `${rutaParroquia('coordinacion')}?edicion=${encodeURIComponent(EDICION_SLUG || INFO_RETIRO.edicion.toLowerCase())}`;
const enlaceSeccionCoordinacion = (seccion) => `${enlaceCoordinacion}&seccion=${encodeURIComponent(seccion)}`;
const accesoCompartido = getClaveAccesoCoordinacion();

const panel = {
  background: '#fff', border: '1px solid #eadfe1', borderRadius: 14,
  padding: 18, boxShadow: '0 2px 8px rgba(42,27,30,.04)'
};

const rutasPublicas = [
  { titulo: 'Portada', detalle: 'Página principal de Bartimeo.', ruta: '', estado: 'Pública', icono: Home },
  { titulo: 'Inscripción de caminantes', detalle: 'Formulario de inscripción y datos del caminante.', ruta: 'caminantes', estado: 'Pública', icono: Compass },
  { titulo: 'Inscripción de servidores', detalle: 'Formulario accesible con una invitación de servidores activa.', ruta: 'servidores', estado: 'Requiere invitación', icono: Users }
];

const seccionesAdmin = [
  { titulo: 'Inscripciones de servidores', detalle: 'Listado, filtros, fichas y exportación.', tab: 'inscripciones', icono: ClipboardList },
  { titulo: 'Inscripciones de caminantes', detalle: 'Listado y gestión de las inscripciones.', tab: 'caminantes', icono: Compass },
  { titulo: 'Asistencias', detalle: 'Reuniones, asistencia y participación.', tab: 'asistencias', icono: CalendarCheck },
  { titulo: 'Configuración', detalle: 'Ediciones, plazas, catálogos, parroquias y enlaces.', tab: 'configuracion', icono: Settings }
];

function TarjetaRuta({ titulo, detalle, estado, icono: Icono, href, onClick }) {
  const contenido = <>
    <span style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', flex: '0 0 auto', background: '#FAF6F3', color: '#5C1824' }}>
      <Icono size={20} aria-hidden="true" />
    </span>
    <span style={{ minWidth: 0, flex: 1 }}>
      <strong style={{ display: 'block', color: '#2A1B1E', fontSize: '0.98rem' }}>{titulo}</strong>
      <span style={{ display: 'block', color: '#6E5C60', fontSize: '0.84rem', lineHeight: 1.45, marginTop: 4 }}>{detalle}</span>
      {estado && <span style={{ display: 'inline-block', marginTop: 9, borderRadius: 999, padding: '3px 8px', color: '#5C1824', background: '#F7ECEE', fontSize: '0.72rem', fontWeight: 700 }}>{estado}</span>}
    </span>
    {href ? <ArrowUpRight size={18} aria-hidden="true" style={{ color: '#8C7A7D', flex: '0 0 auto' }} /> : <ExternalLink size={16} aria-hidden="true" style={{ color: '#8C7A7D', flex: '0 0 auto' }} />}
  </>;
  const style = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 88, padding: 14, textAlign: 'left', color: 'inherit', textDecoration: 'none', background: '#fff', border: '1px solid #eadfe1', borderRadius: 12, cursor: 'pointer', boxSizing: 'border-box' };
  return href
    ? <a href={href} style={style}>{contenido}</a>
    : <button type="button" onClick={onClick} style={style}>{contenido}</button>;
}

export default function PanelRutas({ onAbrirSeccion }) {
  return <section style={{ maxWidth: 1050, margin: '0 auto', padding: '10px 0 26px' }} aria-labelledby="mapa-rutas-titulo">
    <div style={{ ...panel, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#5C1824', color: '#fff' }}>
          <ShieldCheck size={23} aria-hidden="true" />
        </span>
        <div>
          <h2 id="mapa-rutas-titulo" style={{ margin: 0, color: '#5C1824', fontFamily: 'Georgia, serif' }}>Mapa de pantallas</h2>
          <p style={{ margin: '4px 0 0', color: '#6E5C60', fontSize: '0.88rem' }}>Accesos a las rutas y secciones que ya existen en la aplicación.</p>
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: 16 }}>
      <section style={panel} aria-labelledby="rutas-publicas-titulo">
        <h3 id="rutas-publicas-titulo" style={{ color: '#5C1824', margin: '0 0 12px' }}>Rutas de la aplicación</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {rutasPublicas.map(({ titulo, detalle, ruta, estado, icono }) => (
            <TarjetaRuta key={titulo} titulo={titulo} detalle={detalle} estado={estado} icono={icono} href={enlace(ruta)} />
          ))}
          <TarjetaRuta titulo="Portal de coordinación" detalle="Gestión de inscripciones, caminantes, asistencias y configuración." estado={accesoCompartido ? 'Acceso por enlace privado' : 'Acceso de coordinación'} icono={ShieldCheck} href={conservarAccesoCoordinacion(enlaceCoordinacion)} />
        </div>
      </section>

      <section style={panel} aria-labelledby="secciones-admin-titulo">
        <h3 id="secciones-admin-titulo" style={{ color: '#5C1824', margin: '0 0 12px' }}>Secciones de coordinación</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {seccionesAdmin.map(({ titulo, detalle, tab, icono }) => (
            <TarjetaRuta key={tab} titulo={titulo} detalle={detalle} icono={icono}
              href={!onAbrirSeccion ? conservarAccesoCoordinacion(enlaceSeccionCoordinacion(tab)) : undefined}
              onClick={onAbrirSeccion ? () => onAbrirSeccion(tab) : undefined} />
          ))}
        </div>
      </section>
    </div>
  </section>;
}
