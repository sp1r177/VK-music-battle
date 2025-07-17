import React from 'react';
import { Placeholder, Button } from '@vkontakte/vkui';
import { Icon28ErrorCircleOutline } from '@vkontakte/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <Icon28ErrorCircleOutline 
            style={{ 
              marginBottom: '16px',
              color: 'var(--vkui--color_text_secondary)' 
            }} 
          />
          <Placeholder
            header="Что-то пошло не так"
            style={{ margin: '0 0 16px 0' }}
          >
            Произошла ошибка в приложении. Попробуйте перезагрузить страницу.
          </Placeholder>
          <Button 
            size="m" 
            onClick={() => window.location.reload()}
          >
            Перезагрузить
          </Button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginTop: '20px', 
              textAlign: 'left',
              maxWidth: '100%',
              overflow: 'auto'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Детали ошибки (только в режиме разработки)
              </summary>
              <pre style={{ 
                background: 'var(--vkui--color_background_secondary)',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;