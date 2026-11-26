import React from 'react';
import { User, Phone, Mail, Calendar, MapPin, School, Shirt, HelpCircle, Users } from 'lucide-react';

export default function PasoCaminanteDatos({ formData, updateField, errors = {}, catalogos = {}, plazas = null }) {
  const tallasConfiguradas = (catalogos.talla_caminante || []).map((x) => x.valor || x).filter(Boolean);
  const tallas = tallasConfiguradas;
  return (
    <div className="card">
      {/* Cabecera del paso */}
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
          <User size={20} />
        </div>
        <div>
          <h2 className="title-serif" style={{ fontSize: '1.25rem', color: '#5C1824', margin: 0 }}>
            Datos del Participante
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#6E5C60', margin: 0 }}>
            Información del chico o chica que vivirá el retiro
          </p>
        </div>
      </div>

      {/* Nombre y Apellidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="form-group">
          <label className="form-label">
            Nombre <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Álvaro"
            value={formData.nombre || ''}
            onChange={(e) => updateField('nombre', e.target.value)}
            style={{ borderColor: errors.nombre ? '#C62828' : undefined }}
          />
          {errors.nombre && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.nombre}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Apellidos <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Sánchez Romero"
            value={formData.apellidos || ''}
            onChange={(e) => updateField('apellidos', e.target.value)}
            style={{ borderColor: errors.apellidos ? '#C62828' : undefined }}
          />
          {errors.apellidos && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.apellidos}</div>}
        </div>
      </div>

      {/* Móvil y Email */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="form-group">
          <label className="form-label">
            Móvil del Participante <span className="req">*</span>
          </label>
          <input
            type="tel"
            className="input-field"
            placeholder="Ej: 611223344"
            value={formData.movil || ''}
            onChange={(e) => updateField('movil', e.target.value)}
            style={{ borderColor: errors.movil ? '#C62828' : undefined }}
          />
          {errors.movil && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.movil}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Email del Participante <span className="req">*</span>
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="alvaro@ejemplo.com"
            value={formData.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            style={{ borderColor: errors.email ? '#C62828' : undefined }}
          />
          {errors.email && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.email}</div>}
        </div>
      </div>

      {/* Colegio / Centro y Fecha de Nacimiento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="form-group">
          <label className="form-label">
            Colegio / Centro Educativo / Universidad <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Colegio Cristo Rey"
            value={formData.colegio || ''}
            onChange={(e) => updateField('colegio', e.target.value)}
            style={{ borderColor: errors.colegio ? '#C62828' : undefined }}
          />
          {errors.colegio && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.colegio}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="anioNacimiento">Año de nacimiento <span className="req">*</span></label>
          <input id="anioNacimiento" type="number" inputMode="numeric" min="1900" max={new Date().getFullYear()} className="input-field"
            placeholder="Ej.: 2010" value={formData.anioNacimiento || ''}
            onChange={(e) => updateField('anioNacimiento', e.target.value)}
            style={{ borderColor: errors.anioNacimiento ? '#C62828' : undefined }} />
          {errors.anioNacimiento && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.anioNacimiento}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">¿Niño o niña? <span className="req">*</span></label>
        <div className="choice-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[['nino', 'Niño', 'ninos'], ['nina', 'Niña', 'ninas']].map(([value, label, key]) => (
            <button key={value} type="button" className={`choice-card ${formData.genero === value ? 'selected' : ''}`}
              disabled={plazas && plazas.disponibles?.[key] <= 0 && formData.genero !== value}
              onClick={() => updateField('genero', value)}>
              {label}{plazas && <small style={{ display: 'block' }}>{plazas.disponibles?.[key] ?? '…'} plazas</small>}
            </button>
          ))}
        </div>
        {errors.genero && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.genero}</div>}
        {plazas?.disponibles?.total === 0 && <p role="status" style={{ color: '#C62828', fontWeight: 700 }}>No quedan plazas para este retiro.</p>}
      </div>

      <div className="form-group">
        <label className="form-label">¿Cuántas veces te has inscrito antes en Bartimeo? <span className="req">*</span></label>
        <input type="number" min="0" step="1" inputMode="numeric" className="input-field"
          value={formData.inscripcionesPrevias ?? ''} onChange={(e) => updateField('inscripcionesPrevias', e.target.value)} />
        <label className="form-label" style={{ marginTop: 12 }}>¿Es tu primera inscripción en el retiro de Cristo Rey? <span className="req">*</span></label>
        <div className="choice-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[['Sí', true], ['No', false]].map(([label, value]) => (
            <button key={label} type="button" className={`choice-card ${formData.primeraVezCristoRey === value ? 'selected' : ''}`}
              onClick={() => updateField('primeraVezCristoRey', value)}>{label}</button>
          ))}
        </div>
        {errors.experiencia && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.experiencia}</div>}
      </div>

      {/* Dirección, Código Postal y Localidad */}
      <div className="form-group">
        <label className="form-label">
          Dirección <span className="req">*</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Calle, número, piso..."
          value={formData.direccion || ''}
          onChange={(e) => updateField('direccion', e.target.value)}
          style={{ borderColor: errors.direccion ? '#C62828' : undefined }}
        />
        {errors.direccion && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.direccion}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
        <div className="form-group">
          <label className="form-label">
            Código Postal <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="14001"
            value={formData.codigoPostal || ''}
            onChange={(e) => updateField('codigoPostal', e.target.value)}
            style={{ borderColor: errors.codigoPostal ? '#C62828' : undefined }}
          />
          {errors.codigoPostal && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.codigoPostal}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Localidad <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Córdoba"
            value={formData.localidad || 'Córdoba'}
            onChange={(e) => updateField('localidad', e.target.value)}
            style={{ borderColor: errors.localidad ? '#C62828' : undefined }}
          />
          {errors.localidad && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.localidad}</div>}
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '12px' }}>
        <label className="form-label">Selecciona los sacramentos recibidos</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <label><input type="checkbox" checked={!!formData.bautismoRecibido} onChange={(e) => updateField('bautismoRecibido', e.target.checked)} /> Bautismo</label>
          <label><input type="checkbox" checked={!!formData.primeraComunionRecibida} onChange={(e) => updateField('primeraComunionRecibida', e.target.checked)} /> Primera Comunión</label>
        </div>
      </div>

      {/* Talla de Camiseta (Selector Píldora idéntico a Ropa de Servidores) */}
      <div className="form-group" style={{ marginTop: '16px' }}>
        <label className="form-label">
          Talla de Camiseta Oficial del Retiro <span className="req">*</span>
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
          {!tallas.length && <p role="status">No hay tallas disponibles. Consulta a coordinación.</p>}
          {tallas.map((talla) => {
            const seleccionada = formData.tallaCamiseta === talla;
            return (
              <button
                key={talla}
                type="button"
                onClick={() => updateField('tallaCamiseta', talla)}
                style={{
                  flex: '1 0 44px',
                  maxWidth: '64px',
                  padding: '10px 0',
                  borderRadius: '12px',
                  border: seleccionada ? '2px solid #5C1824' : '1.5px solid #E8DFDA',
                  background: seleccionada ? '#5C1824' : '#FAF6F3',
                  color: seleccionada ? '#FFFFFF' : '#2A1B1E',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {talla}
              </button>
            );
          })}
        </div>
        {errors.tallaCamiseta && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.tallaCamiseta}</div>}
      </div>

      {/* Quién le ha invitado y Teléfono */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '16px' }}>
        <div className="form-group">
          <label className="form-label">
            ¿Quién le ha invitado al retiro? <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Nombre de la persona"
            value={formData.quienInvita || ''}
            onChange={(e) => updateField('quienInvita', e.target.value)}
            style={{ borderColor: errors.quienInvita ? '#C62828' : undefined }}
          />
          {errors.quienInvita && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.quienInvita}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Indica su número de teléfono <span className="req">*</span>
          </label>
          <input
            type="tel"
            className="input-field"
            placeholder="Móvil de quien le invita"
            value={formData.quienInvitaTelefono || ''}
            onChange={(e) => updateField('quienInvitaTelefono', e.target.value)}
            style={{ borderColor: errors.quienInvitaTelefono ? '#C62828' : undefined }}
          />
          {errors.quienInvitaTelefono && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.quienInvitaTelefono}</div>}
        </div>
      </div>

      {/* Lista de espera previa */}
      <div className="form-group" style={{ marginTop: '16px' }}>
        <label className="form-label">
          ¿Te has quedado en lista de espera en algún retiro de Bartimeo Cristo Rey? <span className="req">*</span>
        </label>
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
          {['No', 'Sí'].map((opcion) => {
            const activa = (formData.listaEsperaPrevia || 'No') === opcion;
            return (
              <button
                key={opcion}
                type="button"
                onClick={() => updateField('listaEsperaPrevia', opcion)}
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

      {/* ¿Vienes al retiro con alguien? */}
      <div className="form-group" style={{ marginTop: '16px' }}>
        <label className="form-label">
          ¿Vienes al retiro con alguien? En caso afirmativo, nombre y apellidos
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Nombre y apellido de tu amigo/a (opcional)"
          value={formData.vieneConAlguien || ''}
          onChange={(e) => updateField('vieneConAlguien', e.target.value)}
        />
      </div>
    </div>
  );
}
