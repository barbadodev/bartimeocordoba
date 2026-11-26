import React, { useEffect, useState } from 'react';
import { User, Phone, Mail, Calendar, MapPin, Compass } from 'lucide-react';
import { apiFetch } from '../api';

export default function PasoPersonales({ formData, updateField, errors }) {
  const [parroquias, setParroquias] = useState([{ valor: 'Cristo Rey' }]);
  useEffect(() => {
    apiFetch('/api/catalogos').then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.parroquia?.length) setParroquias(data.parroquia); })
      .catch(() => {});
  }, []);
  return (
    <div className="card">
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
          <h2 className="title-serif" style={{ fontSize: '1.25rem' }}>Datos Personales</h2>
          <p style={{ fontSize: '0.85rem', color: '#6E5C60' }}>Rellena tu información de contacto</p>
        </div>
      </div>

      {/* Nombre y Apellidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">
            Nombre <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Pablo"
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
            placeholder="Ej: Gómez Navarro"
            value={formData.apellidos || ''}
            onChange={(e) => updateField('apellidos', e.target.value)}
            style={{ borderColor: errors.apellidos ? '#C62828' : undefined }}
          />
          {errors.apellidos && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.apellidos}</div>}
        </div>
      </div>

      {/* Móvil y Email */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">
            Móvil <span className="req">*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="tel"
              className="input-field"
              placeholder="Ej: 612 345 678"
              value={formData.movil || ''}
              onChange={(e) => updateField('movil', e.target.value)}
              style={{
                borderColor: errors.movil ? '#C62828' : undefined,
                paddingLeft: '38px'
              }}
            />
            <Phone size={17} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6E5C60' }} />
          </div>
          {errors.movil && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.movil}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Email de Contacto <span className="req">*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              className="input-field"
              placeholder="tu.email@ejemplo.com"
              value={formData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              style={{
                borderColor: errors.email ? '#C62828' : undefined,
                paddingLeft: '38px'
              }}
            />
            <Mail size={17} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6E5C60' }} />
          </div>
          {errors.email && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.email}</div>}
        </div>
      </div>

      {/* Fecha de nacimiento */}
      <div className="form-group">
        <label className="form-label">
          Fecha de Nacimiento <span className="req">*</span>
        </label>
        <div style={{ position: 'relative', maxWidth: '280px' }}>
          <input
            type="date"
            className="input-field"
            value={formData.fechaNacimiento || ''}
            onChange={(e) => updateField('fechaNacimiento', e.target.value)}
            style={{
              borderColor: errors.fechaNacimiento ? '#C62828' : undefined,
              paddingLeft: '38px'
            }}
          />
          <Calendar size={17} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6E5C60' }} />
        </div>
        {errors.fechaNacimiento && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.fechaNacimiento}</div>}
      </div>

      {/* Dirección, Código Postal y Localidad */}
      <div className="form-group">
        <label className="form-label">
          Dirección Completa <span className="req">*</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Calle, número, piso y puerta"
          value={formData.direccion || ''}
          onChange={(e) => updateField('direccion', e.target.value)}
          style={{ borderColor: errors.direccion ? '#C62828' : undefined }}
        />
        {errors.direccion && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.direccion}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Código Postal</label>
          <input
            type="text"
            className="input-field"
            placeholder="14006"
            maxLength={5}
            value={formData.codigoPostal || ''}
            onChange={(e) => updateField('codigoPostal', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Localidad <span className="req">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Córdoba"
            value={formData.localidad || 'Córdoba'}
            onChange={(e) => updateField('localidad', e.target.value)}
            style={{ borderColor: errors.localidad ? '#C62828' : undefined }}
          />
          {errors.localidad && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.localidad}</div>}
        </div>
      </div>

      {/* Parroquia de procedencia */}
      <div className="form-group" style={{ marginTop: '8px' }}>
        <label className="form-label">
          Parroquia de procedencia <span className="req">*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <select className="select-field" value={formData.bartimeoOrigen || ''}
            onChange={(e) => updateField('bartimeoOrigen', e.target.value)}
            style={{ borderColor: errors.bartimeoOrigen ? '#C62828' : undefined, paddingLeft: '38px' }}>
            <option value="">Selecciona tu parroquia</option>
            {parroquias.map((p) => <option key={p.valor || p} value={p.valor || p}>{p.valor || p}</option>)}
          </select>
          <Compass size={17} style={{ position: 'absolute', left: '12px', top: '14px', color: '#6E5C60' }} />
        </div>
        {errors.bartimeoOrigen && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.bartimeoOrigen}</div>}
      </div>
    </div>
  );
}
