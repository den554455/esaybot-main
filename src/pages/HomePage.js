import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mastersService } from '../services';
import ServiceCard from '../components/ServiceCard';
import PhotoSearch from '../components/PhotoSearch';
import LoadingSpinner from '../components/LoadingSpinner';
import './HomePage.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { errorHandler } from '../utils/errorHandler';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const { runIfMounted } = useSafeAsync();

  const loadServices = useCallback(async () => {
    try {
      const data = await mastersService.getServices();
      runIfMounted(() => setServices(data));
    } catch (error) {
      errorHandler.log(error, 'HomePage: Error loading services');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  }, [runIfMounted]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    const userName = user?.first_name || user?.email || 'гость';
    if (isAuthenticated && user) {
      runIfMounted(() => setWelcomeMessage(`Добро пожаловать, ${userName}! 👋`));
    } else {
      runIfMounted(() => setWelcomeMessage('Добро пожаловать в Easy Bot! 👋'));
    }
  }, [isAuthenticated, user?.id, user?.email, user?.first_name, runIfMounted]);

  const handleServiceSelect = (service) => {
    navigate('/masters', { state: { selectedService: service } });
  };

  if (loading) {
    return (
      <div className="home-page">
        <LoadingSpinner text="Загрузка услуг..." />
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>💅 Easy Bot</h1>
        <p className="subtitle">Запись к бьюти-мастерам онлайн</p>
      </div>

      {welcomeMessage && (
        <div className="welcome-banner">
          <h2>{welcomeMessage}</h2>
          <p>Выберите услугу, чтобы начать</p>
        </div>
      )}

      <div className="services-section">
        <div className="section-title">
          <span className="emoji">💅</span>
          <span>Наши услуги</span>
        </div>
        <div className="services-grid">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={() => handleServiceSelect(service)}
            />
          ))}
        </div>
      </div>

      <div className="info-panel">
        <div className="info-row">
          <span className="info-label">📍 Работаем в Москве</span>
          <span className="info-value">Более 50 мастеров</span>
        </div>
        <div className="info-row">
          <span className="info-label">⏰ Работаем ежедневно</span>
          <span className="info-value">с 9:00 до 21:00</span>
        </div>
        <div className="info-row">
          <span className="info-label">💳 Оплата онлайн</span>
          <span className="info-value">Безопасно и удобно</span>
        </div>
      </div>

      <div className="recent-info">
        <div className="hint">
          💡 Совет: зарегистрируйтесь, чтобы отслеживать свои записи
        </div>
      </div>

      <button 
        className="quick-book-btn"
        onClick={() => navigate('/masters')}
        aria-label="Быстрая запись"
      >
        📅
      </button>
    </div>
  );
};

export default HomePage;