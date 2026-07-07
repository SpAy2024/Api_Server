// frontend/src/components/ServidoresModal.jsx
import { useState } from 'react';

export function ServidoresModal({ isOpen, onClose, titulo, servidores, tipo = 'pelicula' }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Agrupar servidores por tipo
  const serversByType = {};
  (servidores || []).forEach(s => {
    if (!serversByType[s.server]) {
      serversByType[s.server] = [];
    }
    serversByType[s.server].push(s);
  });

  const serverIcons = {
    'StreamWish': '🌊',
    'FileMoon': '🌙',
    'VidHide': '👁️',
    'Voe': '🎵',
    'DoodStream': '🎬',
    'WaaW': '⭐',
    'Desconocido': '❓'
  };

  const serverClass = {
    'StreamWish': 'server-btn-streamwish',
    'FileMoon': 'server-btn-filemoon',
    'VidHide': 'server-btn-vidhide',
    'Voe': 'server-btn-voe',
    'DoodStream': 'server-btn-doodstream',
    'WaaW': 'server-btn-waaw',
    'Desconocido': 'server-btn-desconocido'
  };

  const totalServidores = (servidores || []).length;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <div>
              <h2>{titulo}</h2>
              <div className="modal-sub">
                {tipo === 'pelicula' ? '🎬 Película' : '📺 Serie'} • {totalServidores} servidores disponibles
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {totalServidores === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>😅</div>
                <p style={{ color: '#808080', fontSize: '18px' }}>No hay servidores disponibles</p>
                <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                  Este contenido no tiene enlaces activos
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {Object.keys(serversByType).map((serverName) => (
                  <div key={serverName} className="server-card">
                    <div className="server-name">
                      <span className="icon">{serverIcons[serverName] || '📁'}</span>
                      {serverName}
                      <span className="badge">{serversByType[serverName].length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {serversByType[serverName].map((server, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={server.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`server-btn ${serverClass[serverName] || 'server-btn-desconocido'}`}
                          >
                            ▶ Reproducir
                          </a>
                          <button
                            onClick={() => handleCopy(server.url)}
                            style={{
                              padding: '8px 12px',
                              background: '#2a2a2a',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#3a3a3a';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#2a2a2a';
                            }}
                            title="Copiar enlace"
                          >
                            📋
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <span className="count">{totalServidores} enlaces disponibles</span>
            <button className="btn-close" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>

      {/* Toast de copiado */}
      {copied && (
        <div className="toast">
          ✅ Enlace copiado al portapapeles
        </div>
      )}
    </>
  );
}