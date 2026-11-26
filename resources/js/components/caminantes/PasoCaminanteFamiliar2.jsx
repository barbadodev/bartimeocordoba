import React from 'react';
import { HeartPulse, AlertTriangle, Phone, Users, ShieldAlert, Plus, Trash2 } from 'lucide-react';

export default function PasoCaminanteFamiliar2({ formData, updateField, errors = {} }) {
  const tieneAlergia = formData.tieneAlergia === 'Sí';

  return (
    <div>
      {/* Tarjeta 1: Salud, Alergias y Medicación */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
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
            <HeartPulse size={20} />
          </div>
          <div>
            <h2 className="title-serif" style={{ fontSize: '1.25rem', color: '#5C1824', margin: 0 }}>
              Salud y Cuidados Médicos
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#6E5C60', margin: 0 }}>
              Información confidencial para la seguridad del participante
            </p>
          </div>
        </div>

        {/* ¿Tiene alergia? */}
        <div className="form-group">
          <label className="form-label">
            ¿Tiene alergia a algún alimento o medicamento? <span className="req">*</span>
          </label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            {['No', 'Sí'].map((opcion) => {
              const activa = (formData.tieneAlergia || 'No') === opcion;
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => updateField('tieneAlergia', opcion)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: activa ? '2px solid #5C1824' : '1.5px solid #E8DFDA',
                    background: activa ? '#5C1824' : '#FAF6F3',
                    color: activa ? '#FFFFFF' : '#2A1B1E',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  {opcion}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle de alergia si es Sí */}
        {tieneAlergia && (
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">
              En caso afirmativo, ¿qué alergia? <span className="req">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: Celíaco, frutos secos, penicilina..."
              value={formData.alergiaDetalle || ''}
              onChange={(e) => updateField('alergiaDetalle', e.target.value)}
              style={{ borderColor: errors.alergiaDetalle ? '#C62828' : undefined }}
            />
            {errors.alergiaDetalle && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.alergiaDetalle}</div>}
          </div>
        )}

        {/* Trastorno de salud */}
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">
            ¿Padece algún trastorno de salud de tipo físico o psíquico que debamos conocer?
          </label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Asma, diabetes, lesiones, ansiedad, etc. (Opcional)"
            value={formData.trastornoSalud || ''}
            onChange={(e) => updateField('trastornoSalud', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Medicación */}
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">
            ¿Qué medicación toma? Deje todos los detalles que crea que debamos saber
          </label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Nombre del medicamento, dosis y pauta de tomas..."
            value={formData.medicacion || ''}
            onChange={(e) => updateField('medicacion', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Tarjeta 2: FAMILIAR (2) DE CONTACTO */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
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
            <Users size={20} />
          </div>
          <div>
            <h2 className="title-serif" style={{ fontSize: '1.25rem', color: '#5C1824', margin: 0 }}>
              Familiar (2) de Contacto
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#6E5C60', margin: 0 }}>
              Datos de contacto de otro familiar o tutor alternativo
            </p>
          </div>
        </div>

        {/* Nombre Familiar 2 */}
        <div className="form-group">
          <label className="form-label">
            Nombre y Apellidos (2)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Rafael Sánchez Ruiz"
            value={formData.familiar2Nombre || ''}
            onChange={(e) => updateField('familiar2Nombre', e.target.value)}
          />
        </div>

        {/* Teléfono y Email Familiar 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">
              Teléfono (2)
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="Ej: 622334455"
              value={formData.familiar2Telefono || ''}
              onChange={(e) => updateField('familiar2Telefono', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email (2)
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="ejemplo@correo.com"
              value={formData.familiar2Email || ''}
              onChange={(e) => updateField('familiar2Email', e.target.value)}
            />
          </div>
        </div>
      </div>

      <section className="card" aria-labelledby="familiares-adicionales-title" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h3 id="familiares-adicionales-title" className="title-serif" style={{ color: '#5C1824', margin: 0 }}>Otros familiares (opcional)</h3>
            <p style={{ fontSize: '0.82rem', color: '#6E5C60', margin: '4px 0 0' }}>Puedes añadir hasta dos contactos adicionales.</p>
          </div>
          {(formData.familiaresAdicionales || []).length < 2 && <button type="button" className="btn btn-secondary"
            onClick={() => updateField('familiaresAdicionales', [...(formData.familiaresAdicionales || []), { nombre: '', telefono: '', parentesco: '' }])}>
            <Plus size={15} /> Añadir familiar
          </button>}
        </div>
        {(formData.familiaresAdicionales || []).map((familiar, index) => (
          <div key={index} style={{ borderTop: '1px solid #E8DFDA', marginTop: 14, paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Familiar adicional {index + 1}</strong>
              <button type="button" aria-label={`Eliminar familiar ${index + 1}`} onClick={() => updateField('familiaresAdicionales', formData.familiaresAdicionales.filter((_, i) => i !== index))}
                style={{ border: 0, background: 'transparent', color: '#8C3038', cursor: 'pointer' }}><Trash2 size={17} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10 }}>
              {[
                ['nombre', 'Nombre y apellidos'], ['telefono', 'Teléfono'], ['parentesco', 'Parentesco']
              ].map(([field, label]) => <label key={field} className="form-group" style={{ margin: 0 }}>
                <span className="form-label">{label}</span>
                <input className="input-field" value={familiar[field] || ''} onChange={(e) => {
                  const next = formData.familiaresAdicionales.map((item, i) => i === index ? { ...item, [field]: e.target.value } : item);
                  updateField('familiaresAdicionales', next);
                }} />
              </label>)}
            </div>
          </div>
        ))}
      </section>

      {/* Aviso Muy Importante de Teléfono de Emergencia */}
      <div style={{
        background: '#FFF4E5',
        border: '1.5px solid #FFB74D',
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <ShieldAlert size={24} color="#D87A00" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 800, color: '#B25000', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            MUY IMPORTANTE • CONTACTO DURANTE EL RETIRO
          </div>
          <p style={{ fontSize: '0.82rem', color: '#663C00', marginTop: '4px', lineHeight: 1.45 }}>
            Para contactar con los participantes durante las 48 horas del retiro, exclusivamente en caso de emergencia médica o familiar, se puede llamar al teléfono:
          </p>
          <div style={{ marginTop: '6px', fontSize: '0.95rem', fontWeight: 800, color: '#5C1824', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={15} /> 600 553 818 (Alejandro - Coordinador)
          </div>
        </div>
      </div>
    </div>
  );
}
