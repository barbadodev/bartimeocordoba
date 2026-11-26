import React from 'react';
import { Clock, MapPin, Euro, Calendar, Mail, Phone, AlertCircle, HeartHandshake, ShieldCheck } from 'lucide-react';
import { INFO_RETIRO } from '../../tema';

export default function PasoCaminanteInfo({ formData, updateField, errors = {} }) {
  const retiro = INFO_RETIRO.caminantes;
  return (
    <div>
      {/* Título Convocatoria */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 className="title-serif" style={{ fontSize: '1.25rem', color: '#5C1824', fontWeight: 800, lineHeight: 1.2 }}>
          CAMINANTES - {INFO_RETIRO.edicion} BARTIMEO CÓRDOBA
        </h1>
      </div>

      {/* Tarjeta 1: Detalles del Retiro */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '0.86rem', color: '#3E2A2E', lineHeight: 1.5, marginBottom: '14px' }}>
          Bienvenidos al formulario de inscripción para el <strong>{retiro.titulo}</strong>.
          Los datos solicitados son necesarios para gestionar la participación. Cumplimos rigurosamente con las normativas de protección de datos (RGPD). No compartiremos tu información con terceros y se eliminará tras finalizar el evento.
        </p>

        {/* Grilla de Detalles Clave */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          marginBottom: '14px'
        }}>
          {/* Horarios */}
          <div style={{ background: '#FAF6F3', padding: '10px 12px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#5C1824', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={12} /> Horarios
            </div>
            <div style={{ fontSize: '0.86rem', color: '#2A1B1E', fontWeight: 700 }}>
              {retiro.fechas}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6E5C60', marginTop: '2px' }}>
              Inicio: {retiro.horarioComienzo} • Fin: {retiro.horarioClausura}
            </div>
          </div>

          {/* Lugar */}
          <div style={{ background: '#FAF6F3', padding: '10px 12px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#5C1824', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={12} /> Lugar
            </div>
            <div style={{ fontSize: '0.86rem', color: '#2A1B1E', fontWeight: 700 }}>
              {retiro.lugar}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6E5C60', marginTop: '2px' }}>
              {retiro.direccion}
            </div>
          </div>

          {/* Coste y Pago */}
          <div style={{ background: '#FAF6F3', padding: '10px 12px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#5C1824', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Euro size={12} /> Coste del Retiro
            </div>
            <div style={{ fontSize: '0.86rem', color: '#5C1824', fontWeight: 800 }}>
              {retiro.precio}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6E5C60', marginTop: '2px' }}>
              {retiro.formaPago}
            </div>
          </div>

          {/* Plazo */}
          <div style={{ background: '#FAF6F3', padding: '10px 12px', borderRadius: '12px', border: '1px solid #E8DFDA' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#5C1824', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={12} /> Fecha Límite
            </div>
            <div style={{ fontSize: '0.86rem', color: '#9C1A1C', fontWeight: 700 }}>
              {retiro.fechaLimite}
            </div>
          </div>
        </div>

        {/* Contactos */}
        <div style={{ borderTop: '1px solid #F0EAE6', paddingTop: '10px', fontSize: '0.78rem', color: '#6E5C60' }}>
          <div style={{ fontWeight: 700, color: '#5C1824', marginBottom: '4px' }}>
            Dudas o consultas:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a href="mailto:bartimeocristorey@gmail.com" style={{ color: '#5C1824', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Mail size={12} /> bartimeocristorey@gmail.com
            </a>
            <span>• Jóvenes: {INFO_RETIRO.coordinadoresJovenes.map((c) => `${c.nombre} (${c.tel})`).join(', ')}</span>
            <span>• Adultos: {INFO_RETIRO.coordinadoresAdultos.map((c) => `${c.nombre} (${c.tel})`).join(' y ')}</span>
          </div>
        </div>
      </div>

      {/* Aviso Importante para Padres */}
      <div style={{
        background: '#FFF9E6',
        border: '1px solid #FFE082',
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <AlertCircle size={22} color="#8D6E18" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 800, color: '#6D4C00', fontSize: '0.86rem', textTransform: 'uppercase' }}>
            ESTA INSCRIPCIÓN LA DEBEN RELLENAR LOS PADRES
          </div>
          <div style={{ fontSize: '0.78rem', color: '#7A5800', marginTop: '2px' }}>
            Por favor, introduce a continuación los datos de uno de los progenitores o tutores legales del participante.
          </div>
        </div>
      </div>

      {/* Tarjeta 2: FAMILIAR (1) QUE RELLENA LA INSCRIPCIÓN */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(92, 24, 36, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5C1824'
          }}>
            <HeartHandshake size={20} />
          </div>
          <div>
            <h2 className="title-serif" style={{ fontSize: '1.2rem', color: '#5C1824', margin: 0 }}>
              Familiar (1) que Rellena
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#6E5C60', margin: 0 }}>
              Datos del padre, madre o tutor legal
            </p>
          </div>
        </div>

        {/* Nombre y Apellidos (1) */}
        <div className="form-group">
          <label className="form-label">
            Nombre y Apellidos (1) <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Carmen Gómez Navarro"
            value={formData.familiar1Nombre || ''}
            onChange={(e) => updateField('familiar1Nombre', e.target.value)}
            style={{ borderColor: errors.familiar1Nombre ? '#C62828' : undefined }}
          />
          {errors.familiar1Nombre && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.familiar1Nombre}</div>}
        </div>

        {/* DNI (1) y Teléfono (1) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">
              DNI (1) <span className="req">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: 12345678A"
              value={formData.familiar1Dni || ''}
              onChange={(e) => updateField('familiar1Dni', e.target.value)}
              style={{ borderColor: errors.familiar1Dni ? '#C62828' : undefined }}
            />
            {errors.familiar1Dni && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.familiar1Dni}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Teléfono (1) <span className="req">*</span>
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="Ej: 600123456"
              value={formData.familiar1Telefono || ''}
              onChange={(e) => updateField('familiar1Telefono', e.target.value)}
              style={{ borderColor: errors.familiar1Telefono ? '#C62828' : undefined }}
            />
            {errors.familiar1Telefono && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.familiar1Telefono}</div>}
          </div>
        </div>

        {/* Email (1) */}
        <div className="form-group">
          <label className="form-label">
            Email de Contacto (1) <span className="req">*</span>
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="ejemplo@correo.com"
            value={formData.familiar1Email || ''}
            onChange={(e) => updateField('familiar1Email', e.target.value)}
            style={{ borderColor: errors.familiar1Email ? '#C62828' : undefined }}
          />
          {errors.familiar1Email && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.familiar1Email}</div>}
        </div>

        {/* Consentimiento RGPD */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#FAF6F4',
          border: '1px solid #E8DFDA',
          borderRadius: '12px',
          fontSize: '0.8rem',
          color: '#57484B',
          lineHeight: 1.45
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontWeight: 500, color: '#2A1B1E' }}>
            <input
              type="checkbox"
              checked={formData.aceptaRgpd === true}
              onChange={(e) => updateField('aceptaRgpd', e.target.checked)}
              style={{ accentColor: '#5C1824', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
            />
            <span>
              <strong>Protección de datos (RGPD):</strong> De acuerdo con el Reglamento UE 2016/679 y la Ley Orgánica 3/2018, los datos facilitados serán utilizados exclusivamente para gestionar la inscripción y participación en el Retiro Bartimeo de la Parroquia Cristo Rey (Córdoba). Para continuar debes aceptar estas condiciones. <span className="req">*</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
