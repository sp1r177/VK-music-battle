import React from 'react';
import { Spinner, Placeholder } from '@vkontakte/vkui';

const LoadingScreen = ({ message = 'Загрузка...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center',
      background: 'var(--vkui--color_background)'
    }}>
      <Spinner size="large" style={{ marginBottom: '16px' }} />
      <Placeholder
        style={{ margin: 0 }}
      >
        {message}
      </Placeholder>
    </div>
  );
};

export default LoadingScreen;