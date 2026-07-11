import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';
import VKLoginButton from '../components/VKLoginButton';
import { errorHandler } from '../utils/errorHandler';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user, error: authError, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);

      if (result.success) {
        if (result.user.role === 'master') {
          navigate('/master-panel');
        } else if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(result.error || 'Ошибка входа');
      }
    } catch (err) {
      errorHandler.log(err, 'LoginPage: Login error');
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Easy Bot</h1>
        <h2>Вход</h2>
        
        {(error || authError) && (
          <div className="auth-message">
            ⚠️ {error || authError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || authLoading}
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || authLoading}
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" disabled={loading || authLoading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>или</p>
        <VKLoginButton />
        </div>

        <div className="auth-link">
          <p>
            Нет аккаунта?
            <Link to="/register">
              Регистрация клиента
            </Link>
          </p>

          <p>
            <Link to="/register-master">
              Стать мастером
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;