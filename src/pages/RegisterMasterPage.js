import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';
import { errorHandler } from '../utils/errorHandler';

const RegisterMasterPage = () => {
  const navigate = useNavigate();
  const { registerMaster } = useAuth();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    district: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerMaster(
        form.first_name,
        form.last_name,
        form.email,
        form.phone,
        form.district,
        form.password
      );

      if (result.success) {
        navigate('/master-panel');
      } else {
        setError(result.error || 'Ошибка регистрации');
      }
    } catch (err) {
      errorHandler.log(err, 'RegisterMasterPage: registerMaster error');
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <h2>Регистрация мастера</h2>

        {error && (
          <div className="auth-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <input
            name="first_name"
            placeholder="Имя"
            onChange={handleChange}
          />

          <input
            name="last_name"
            placeholder="Фамилия"
            onChange={handleChange}
          />

          <input
            name="phone"
            placeholder="Телефон"
            onChange={handleChange}
          />

          <input
            name="district"
            placeholder="Район"
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Пароль"
            onChange={handleChange}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Повторите пароль"
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Создание...'
              : 'Стать мастером'}
          </button>

        </form>

        <p className="auth-link">
          <Link to="/login">
            Назад ко входу
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterMasterPage;