import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import BusinessPage from './BusinessPage.jsx';
import Dashboard from './Dashboard.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#06060e', color: '#e2e8f0',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16, fontFamily: 'Inter, sans-serif', padding: 24,
        }}>
          <div style={{ fontSize: 44 }}>⚡</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            Something went wrong.
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', maxWidth: 360, textAlign: 'center', lineHeight: 1.7 }}>
            We're on it. Try reloading — your data is safe.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const path = window.location.pathname;
const isHome      = path === '/' || path === '';
const isDashboard = path === '/dashboard';
const isSite      = path.startsWith('/site/');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isSite ? <BusinessPage /> : isDashboard ? <Dashboard /> : isHome ? <App /> : <App />}
    </ErrorBoundary>
  </StrictMode>
);
