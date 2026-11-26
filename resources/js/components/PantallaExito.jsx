import React from 'react';
import { CheckCircle2, Calendar, Users, Sparkles } from 'lucide-react';
import { INFO_RETIRO } from '../tema';

export default function PantallaExito({ servidor, demo = false }) {
  const retiro = INFO_RETIRO.servidores;
  return (
    <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#E8F5E9',
        color: '#2E7D32',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '18px',
        boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)'
      }}>
        <CheckCircle2 size={46} />
      </div>

      <div className="badge badge-gold" style={{ marginBottom: '12px' }}>
        <Sparkles size={14} /> {demo ? 'Formulario completado' : '¡Inscripción Completada con Éxito!'}
      </div>

      <h2 className="title-serif" style={{ fontSize: '1.6rem', color: '#5C1824', marginBottom: '8px' }}>
        ¡Muchas gracias, {servidor?.nombre || 'Servidor'}!
      </h2>

      <p style={{ maxWidth: '480px', margin: '0 auto 20px auto', color: '#6E5C60', fontSize: '0.92rem' }}>
        {demo ? 'Has llegado al final del formulario de servidores.' :
          <>Tu solicitud para servir en el <strong>{retiro.titulo}</strong> ha quedado registrada correctamente.</>}
      </p>

      {/* Tarjeta resumen */}
      <div style={{
        background: '#FAF6F4',
        border: '1.5px solid #E8DFDA',
        borderRadius: '16px',
        padding: '18px',
        maxWidth: '440px',
        margin: '0 auto 24px auto',
        textAlign: 'left',
        fontSize: '0.88rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#5C1824', fontWeight: 700 }}>
          <Calendar size={16} /> {retiro.fechas}
        </div>
        <div style={{ color: '#2A1B1E', marginBottom: '6px' }}>
          <strong>Lugar:</strong> {retiro.lugar} · {retiro.direccion}
        </div>
        <div style={{ color: '#2A1B1E', marginBottom: '6px' }}>
          <strong>Montaje jueves:</strong> {servidor?.montajeJueves === 'Sí' ? 'Confirmado para subir el jueves por la tarde' : `Llegada el ${retiro.horarioComienzo}`}
        </div>
        <div style={{ color: '#2A1B1E' }}>
          <strong>Email de contacto:</strong> {servidor?.email || servidor?.emailRegistro}
        </div>
      </div>

      {!demo && <div style={{
        background: '#FAF0E6',
        borderRadius: '12px',
        padding: '14px 18px',
        maxWidth: '440px',
        margin: '0 auto',
        fontSize: '0.84rem',
        color: '#5C1824',
        lineHeight: 1.5
      }}>
        ✨ El equipo de coordinación revisará las inscripciones y se pondrá en contacto contigo para las reuniones previas y asignación de servicios. ¡Oramos por este retiro!
      </div>}
    </div>
  );
}
