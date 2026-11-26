import React from 'react';
import logoBartimeo from '../assets/logo-bartimeo.jpg';

export default function Header() {
  return (
    <header style={{ marginBottom: '16px', textAlign: 'center' }}>
      {/* Logo de Bartimeo centrado en tamaño reducido sin nada más */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 6px auto'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#5C1824',
          border: '2px solid rgba(92, 24, 36, 0.15)',
          boxShadow: '0 4px 12px rgba(92, 24, 36, 0.12)'
        }}>
          <img
            src={logoBartimeo}
            alt="Bartimeo Córdoba"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>
    </header>
  );
}
