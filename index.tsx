import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '50px' }}>
          <h1 style={{ color: '#e74c3c' }}>⚠️ Đã xảy ra lỗi</h1>
          <p style={{ color: '#666' }}>Vui lòng tải lại trang hoặc kiểm tra console.</p>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', textAlign: 'left', overflow: 'auto', maxWidth: '600px', margin: '20px auto' }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
