import React from 'react';
import { Mail, Phone, Clock, MapPin, Info, Calendar } from 'lucide-react';
import { INFO_RETIRO } from '../tema';

export default function PasoInfo() {
  return (
    <div>
      {/* Título Convocatoria */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 className="title-serif" style={{ fontSize: '1.25rem', color: '#5C1824', fontWeight: 800, lineHeight: 1.2 }}>
          {INFO_RETIRO.servidores.titulo}
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#6E5C60', marginTop: '2px' }}>
          {INFO_RETIRO.servidores.fechas} • {INFO_RETIRO.servidores.lugar}
        </p>
      </div>

      {/* Tarjeta de Detalles del Retiro */}
      <div className="card">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            background: '#FAF6F3',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #E8DFDA'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#5C1824', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} /> Horarios
            </div>
            <div style={{ fontSize: '0.88rem', color: '#2A1B1E', fontWeight: 600 }}>
              Inicio: {INFO_RETIRO.servidores.horarioComienzo}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6E5C60', marginTop: '2px' }}>
              Final: {INFO_RETIRO.servidores.horarioClausura}
            </div>
          </div>

          <div style={{
            background: '#FAF6F3',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #E8DFDA'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#5C1824', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={13} /> Lugar
            </div>
            <div style={{ fontSize: '0.88rem', color: '#2A1B1E', fontWeight: 600 }}>
              {INFO_RETIRO.servidores.lugar}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6E5C60', marginTop: '2px' }}>
              {INFO_RETIRO.servidores.direccion}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFF9E6',
          border: '1px solid #FFE082',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '0.82rem',
          color: '#795548',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          <span><strong>Precio y forma de pago:</strong> {INFO_RETIRO.servidores.precioPago}</span>
          <span style={{ color: '#C62828', fontWeight: 700 }}>
            Límite: {INFO_RETIRO.servidores.fechaLimite}
          </span>
        </div>

        {/* Contactos de Coordinación */}
        <div style={{ marginTop: '14px', borderTop: '1px dashed #E8DFDA', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.85rem', color: '#5C1824', fontWeight: 700, marginBottom: '8px' }}>
            Contacto de Coordinación:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', fontSize: '0.82rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E8DFDA', padding: '10px', borderRadius: '8px' }}>
              <strong style={{ color: '#2A1B1E', display: 'block', marginBottom: '4px' }}>Coordinadores Jóvenes:</strong>
              {INFO_RETIRO.coordinadoresJovenes.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>{c.nombre}</span>
                  <a href={`tel:${c.tel}`} style={{ color: '#5C1824', fontWeight: 600, textDecoration: 'none' }}>
                    {c.tel}
                  </a>
                </div>
              ))}
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E8DFDA', padding: '10px', borderRadius: '8px' }}>
              <strong style={{ color: '#2A1B1E', display: 'block', marginBottom: '4px' }}>Coordinadores Adultos:</strong>
              {INFO_RETIRO.coordinadoresAdultos.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>{c.nombre}</span>
                  <a href={`tel:${c.tel}`} style={{ color: '#5C1824', fontWeight: 600, textDecoration: 'none' }}>
                    {c.tel}
                  </a>
                </div>
              ))}
              <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #F0EAE6' }}>
                <a href={`mailto:${INFO_RETIRO.email}`} style={{ color: '#5C1824', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={12} /> {INFO_RETIRO.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
