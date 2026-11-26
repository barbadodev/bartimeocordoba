import React from 'react';
import { ShieldAlert, User, Phone, Users, Mail, CheckCircle2 } from 'lucide-react';

export default function PasoEmergencia({ formData, updateField, errors }) {
  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(198, 40, 40, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C62828'
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="title-serif" style={{ fontSize: '1.25rem' }}>Contacto en Caso de Emergencia</h2>
            <p style={{ fontSize: '0.85rem', color: '#6E5C60' }}>
              Datos de tu Padre, Madre o Tutor Legal para cualquier imprevisto durante el retiro
            </p>
          </div>
        </div>

        {/* Nombres y Apellidos del Tutor */}
        <div className="form-group">
          <label className="form-label">
            Nombre y Apellidos del Contacto <span className="req">*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: Rafael Gómez Santos"
              value={formData.emergenciaNombre || ''}
              onChange={(e) => updateField('emergenciaNombre', e.target.value)}
              style={{
                borderColor: errors.emergenciaNombre ? '#C62828' : undefined,
                paddingLeft: '38px'
              }}
            />
            <User size={17} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6E5C60' }} />
          </div>
          {errors.emergenciaNombre && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.emergenciaNombre}</div>}
        </div>

        {/* Teléfono y Relación */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              Teléfono de Emergencia <span className="req">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                className="input-field"
                placeholder="Ej: 600 123 456"
                value={formData.emergenciaTelefono || ''}
                onChange={(e) => updateField('emergenciaTelefono', e.target.value)}
                style={{
                  borderColor: errors.emergenciaTelefono ? '#C62828' : undefined,
                  paddingLeft: '38px'
                }}
              />
              <Phone size={17} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6E5C60' }} />
            </div>
            {errors.emergenciaTelefono && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.emergenciaTelefono}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Relación / Parentesco <span className="req">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Ej: Padre, Madre, Hermano, Tutor..."
                value={formData.emergenciaRelacion || ''}
                onChange={(e) => updateField('emergenciaRelacion', e.target.value)}
                style={{
                  borderColor: errors.emergenciaRelacion ? '#C62828' : undefined,
                  paddingLeft: '38px'
                }}
              />
              <Users size={17} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6E5C60' }} />
            </div>
            {errors.emergenciaRelacion && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.emergenciaRelacion}</div>}
          </div>
        </div>

        {/* Email del Tutor */}
        <div className="form-group">
          <label className="form-label">Email del Contacto de Emergencia</label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              className="input-field"
              placeholder="tutor@ejemplo.com (opcional)"
              value={formData.emergenciaEmail || ''}
              onChange={(e) => updateField('emergenciaEmail', e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
            <Mail size={17} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6E5C60' }} />
          </div>
        </div>
      </div>

      {/* Resumen de Confirmación */}
      <div className="card" style={{ background: '#FAF6F4', border: '1.5px solid #E2D5CF' }}>
        <h3 className="title-serif" style={{ fontSize: '1.05rem', color: '#5C1824', marginBottom: '10px' }}>
          Resumen previo al envío
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#6E5C60', marginBottom: '14px' }}>
          Por favor comprueba que tus datos son correctos. Al pulsar el botón de envío, tu inscripción como servidor quedará registrada.
        </p>

        <div style={{ fontSize: '0.86rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', color: '#2A1B1E' }}>
          <div><strong>Servidor:</strong> {formData.nombre} {formData.apellidos}</div>
          <div><strong>Móvil:</strong> {formData.movil}</div>
          <div><strong>Subida Jueves:</strong> {formData.montajeJueves || 'No especificado'}</div>
          <div><strong>Alergias:</strong> {formData.alergias || 'Ninguna'}</div>
        </div>
      </div>
    </div>
  );
}
