import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import * as Sentry from '@sentry/react';

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

// Инициализируем Sentry только в production и только если DSN задан явно через env.
// Без хардкод-фолбэка: локальная разработка не должна слать события в прод-проект.
if (SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Временно отключаем Service Worker
serviceWorkerRegistration.unregister();