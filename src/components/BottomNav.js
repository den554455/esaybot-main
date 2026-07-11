import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Конфигурация навигации
  const navigationConfig = {
    client: [
      { path: '/', icon: '🏠', label: 'Главная' },
      { path: '/cabinet', icon: '📋', label: 'Мои записи' },
      { path: '/favorites', icon: '❤️', label: 'Избранное' },
      { path: '/photo-search', icon: '📸', label: 'Поиск по фото' },
      { path: '/client-profile', icon: '👤', label: 'Профиль' },
      { path: '/settings', icon: '⚙️', label: 'Настройки' },
    ],
    master: [
      { path: '/', icon: '🏠', label: 'Главная' },
      { path: '/cabinet', icon: '📋', label: 'Записи' },
      { path: '/master-panel', icon: '👩‍🎨', label: 'Панель' },
      { path: '/schedule', icon: '📅', label: 'Расписание' },
      { path: '/profile', icon: '👤', label: 'Профиль' },
      { path: '/settings', icon: '⚙️', label: 'Настройки' },
    ],
    admin: [
      { path: '/', icon: '🏠', label: 'Главная' },
      { path: '/cabinet', icon: '📋', label: 'Записи' },
      { path: '/admin', icon: '👑', label: 'Админ' },
      { path: '/profile', icon: '👤', label: 'Профиль' },
      { path: '/settings', icon: '⚙️', label: 'Настройки' },
    ],
  };

  const navItems = navigationConfig[user?.role] || navigationConfig.client;

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;