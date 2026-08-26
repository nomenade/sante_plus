import React from 'react';

/**
 * Garde-fou global : attrape toute erreur de rendu React, affiche un message
 * clair ET le détail de l'erreur (message + trace) pour faciliter le diagnostic.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '', detail: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error && error.message ? String(error.message) : 'Erreur inconnue' };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
    const stack = error && error.stack ? String(error.stack) : String(error || '');
    const comp = info && info.componentStack ? String(info.componentStack) : '';
    this.setState({ detail: (stack + '\n\n' + comp).trim() });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #059669 0%, #047857 40%, #065f46 100%)',
            fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '40px 32px',
              maxWidth: 560,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>🩺</div>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, color: '#1a2233' }}>
              Oups, une erreur est survenue
            </h1>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
              Un problème inattendu a interrompu l'affichage de la page.
              Rechargez la page pour continuer.
            </p>
            {this.state.message && (
              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7f1d1d',
                  fontFamily: 'monospace',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '10px 12px',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.message}
              </p>
            )}
            {this.state.detail && (
              <pre
                style={{
                  textAlign: 'left',
                  background: '#f4f6fb',
                  border: '1px solid #e7ebf1',
                  borderRadius: 10,
                  padding: '12px',
                  fontSize: 11,
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 180,
                  overflow: 'auto',
                  margin: '0 0 20px',
                  fontFamily: 'monospace',
                }}
              >
                {this.state.detail}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(5,150,105,0.35)',
              }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;