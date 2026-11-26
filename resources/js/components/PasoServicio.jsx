import React, { useEffect, useState } from 'react';
import { HeartHandshake, Truck, Shirt, AlertCircle, FileSpreadsheet, Check } from 'lucide-react';
import { apiFetch } from '../api';

export default function PasoServicio({ formData, updateField, errors }) {
  const [serviciosConfigurados, setServiciosConfigurados] = useState([]);
  const [tallas, setTallas] = useState([]);
  useEffect(() => {
    apiFetch('/api/catalogos').then((r) => r.ok ? r.json() : null)
            .then((data) => {
        if (!data) return;
        setServiciosConfigurados(data.servicio.map((x) => x.valor));
        setTallas(data.talla_ropa.map((x) => x.valor));
      })
      .catch(() => {});
  }, []);
  const toggleServicio = (servicio) => {
    const actuales = formData.serviciosHechos || [];
    if (actuales.includes(servicio)) {
      updateField('serviciosHechos', actuales.filter(s => s !== servicio));
    } else {
      updateField('serviciosHechos', [...actuales, servicio]);
    }
  };

  return (
    <div>
      {/* Experiencia previa en Bartimeo */}
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
            <HeartHandshake size={20} />
          </div>
          <div>
            <h2 className="title-serif" style={{ fontSize: '1.25rem' }}>Experiencia en el Retiro</h2>
            <p style={{ fontSize: '0.85rem', color: '#6E5C60' }}>Tu trayectoria de servicio previa</p>
          </div>
        </div>

        {/* ¿Has servido? */}
        <div className="form-group">
          <label className="form-label">
            ¿Has servido en Bartimeo antes? <span className="req">*</span>
          </label>
          <div className="choice-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className={`choice-card ${formData.haServido === 'Sí' ? 'selected' : ''}`}
              onClick={() => updateField('haServido', 'Sí')}
            >
              Sí, ya he servido
            </div>
            <div
              className={`choice-card ${formData.haServido === 'No' ? 'selected' : ''}`}
              onClick={() => {
                updateField('haServido', 'No');
                updateField('cuantasVeces', '');
                updateField('serviciosHechos', []);
                updateField('serviciosOtro', '');
              }}
            >
              No, sería mi primera vez
            </div>
          </div>
          {errors.haServido && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.haServido}</div>}
        </div>

        {formData.haServido === 'Sí' && (
          <>
            <div className="form-group">
              <label className="form-label">¿Cuántas veces has servido?</label>
              <input
                type="number"
                min="1"
                step="1"
                className="input-field"
                placeholder="Ej.: 2"
                value={formData.cuantasVeces || ''}
                onChange={(e) => updateField('cuantasVeces', e.target.value)}
              />
              {errors.cuantasVeces && <p role="alert">{errors.cuantasVeces}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">¿Qué servicios has hecho anteriormente?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                {serviciosConfigurados.map((serv) => {
                  const seleccionado = (formData.serviciosHechos || []).includes(serv);
                  return (
                    <div
                      key={serv}
                      onClick={() => toggleServicio(serv)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: seleccionado ? '1.5px solid #5C1824' : '1px solid #E8DFDA',
                        backgroundColor: seleccionado ? 'rgba(92, 24, 36, 0.05)' : '#FFFFFF',
                        color: seleccionado ? '#5C1824' : '#2A1B1E',
                        fontWeight: seleccionado ? 600 : 400,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.88rem'
                      }}
                    >
                      <span>{serv}</span>
                      {seleccionado && <Check size={16} />}
                    </div>
                  );
                })}
              </div>

              <input
                type="text"
                className="input-field"
                placeholder="Otros servicios realizados (si aplica)"
                value={formData.serviciosOtro || ''}
                onChange={(e) => updateField('serviciosOtro', e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Montaje de la casa y logística */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
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
            <Truck size={20} />
          </div>
          <div>
            <h2 className="title-serif" style={{ fontSize: '1.25rem' }}>Montaje de la Casa de Retiro</h2>
            <p style={{ fontSize: '0.85rem', color: '#6E5C60' }}>Preparación previa del lugar</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            ¿Puedes subir el jueves 4 de febrero de 2027, por la tarde, a montar la casa? <span className="req">*</span>
          </label>
          <div className="choice-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className={`choice-card ${formData.montajeJueves === 'Sí' ? 'selected' : ''}`}
              onClick={() => updateField('montajeJueves', 'Sí')}
            >
              Sí, puedo subir el jueves
            </div>
            <div
              className={`choice-card ${formData.montajeJueves === 'No' ? 'selected' : ''}`}
              onClick={() => updateField('montajeJueves', 'No')}
            >
              No, llego el viernes 5 de febrero a las 14:00h
            </div>
          </div>
          {errors.montajeJueves && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.montajeJueves}</div>}
        </div>
      </div>

      {/* Ropa de servidores y Tallas */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
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
            <Shirt size={20} />
          </div>
          <div>
            <h2 className="title-serif" style={{ fontSize: '1.25rem' }}>Ropa</h2>
            <p style={{ fontSize: '0.85rem', color: '#6E5C60' }}>Si ya tienes de retiros anteriores, indícalo o déjalo sin marcar</p>
          </div>
        </div>

        {/* Camiseta Blanca */}
        <div className="form-group">
          <label className="form-label">
            Camiseta BLANCA
          </label>
          <div className="form-hint" style={{ marginBottom: '8px' }}>Si necesitas camiseta blanca, marca tu talla:</div>
          <div className="choice-grid">
            {tallas.map(t => (
              <div
                key={`blanca-${t}`}
                className={`choice-card ${formData.tallaCamisetaBlanca === t ? 'selected' : ''}`}
                onClick={() => updateField('tallaCamisetaBlanca', formData.tallaCamisetaBlanca === t ? '' : t)}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Camiseta Gris */}
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">
            Camiseta GRIS
          </label>
          <div className="form-hint" style={{ marginBottom: '8px' }}>Si necesitas camiseta gris, marca tu talla:</div>
          <div className="choice-grid">
            {tallas.map(t => (
              <div
                key={`gris-${t}`}
                className={`choice-card ${formData.tallaCamisetaGris === t ? 'selected' : ''}`}
                onClick={() => updateField('tallaCamisetaGris', formData.tallaCamisetaGris === t ? '' : t)}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Sudadera */}
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">
            Sudadera
          </label>
          <div className="form-hint" style={{ marginBottom: '8px' }}>Si necesitas sudadera, marca tu talla:</div>
          <div className="choice-grid">
            {tallas.map(t => (
              <div
                key={`sudadera-${t}`}
                className={`choice-card ${formData.tallaSudadera === t ? 'selected' : ''}`}
                onClick={() => updateField('tallaSudadera', formData.tallaSudadera === t ? '' : t)}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salud y Habilidades */}
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
            <AlertCircle size={20} />
          </div>
          <div>
            <h2 className="title-serif" style={{ fontSize: '1.25rem' }}>Salud y Alimentación</h2>
            <p style={{ fontSize: '0.85rem', color: '#6E5C60' }}>Vital para la organización de la cocina y el menú</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            ¿Tienes alergia a algún alimento o medicamento? <span className="req">*</span>
          </label>
          <div className="form-hint" style={{ marginBottom: '8px' }}>
            En caso afirmativo, especifica claramente a qué eres alérgico/a o celíaco/a. Si no tienes, pon "Ninguna".
          </div>
          <textarea
            className="textarea-field"
            placeholder="Ej: Celíaco, intolerancia a la lactosa, alergia a la penicilina, frutos secos, o Ninguna..."
            value={formData.alergias || ''}
            onChange={(e) => updateField('alergias', e.target.value)}
            style={{ borderColor: errors.alergias ? '#C62828' : undefined }}
          />
          {errors.alergias && <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: '4px' }}>{errors.alergias}</div>}
        </div>

        {/* ¿Sabes manejar Excel? */}
        <div className="form-group" style={{ marginTop: '20px', borderTop: '1px dashed #E8DFDA', paddingTop: '16px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={18} style={{ color: '#2E7D32' }} />
            ¿Sabes manejar Excel?
          </label>
          <div className="choice-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {['Sí (Avanzado)', 'Básico', 'No'].map(op => (
              <div
                key={op}
                className={`choice-card ${formData.manejaExcel === op ? 'selected' : ''}`}
                onClick={() => updateField('manejaExcel', op)}
              >
                {op}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
