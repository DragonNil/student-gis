// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>
          <h2>⚠️ Произошла ошибка загрузки модуля</h2>
          <pre style={{ background: '#f8f9fa', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '8px 16px' }}>
            🔄 Перезагрузить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}