import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { clientProfileService } from '../services';
import './ClientProfilePage.css';
import { sanitizeImageSrc } from '../utils/sanitize';

const ClientProfilePage = () => {
  const { user, loginWithToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
  });
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    try {
      const response = await clientProfileService.updateProfile(formData);
      if (response.success) {
        loginWithToken(
          localStorage.getItem('access_token'),
          localStorage.getItem('refresh_token'),
          { ...user, ...formData }
        );
        setEditing(false);
        setStatus('Профиль обновлён');
      } else {
        setStatus('Ошибка: ' + response.error);
      }
    } catch (e) {
      setStatus(e.response?.data?.error || 'Ошибка сохранения');
    }
  };

  return (
    <div className="client-profile-page">
      <h1>👤 Профиль</h1>

      <div className="profile-card">
        {user?.avatar_url && (
          <img
            src={sanitizeImageSrc(user.avatar_url) || '/default-avatar.svg'}
            alt="Аватар"
            className="profile-avatar"
          />
        )}
        {!user?.avatar_url && (
          <div className="profile-avatar-placeholder">
            {(user?.first_name || '?')[0].toUpperCase()}
          </div>
        )}

        <div className="profile-info">
          <p className="profile-role">{user?.role === 'client' ? 'Клиент' : user?.role}</p>
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-section-header">
          <h2>Личные данные</h2>
          {!editing && (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              Редактировать
            </button>
          )}
        </div>

        {editing ? (
          <div className="profile-form">
            <input
              type="text"
              placeholder="Имя"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Фамилия"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Телефон"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <div className="profile-form-buttons">
              <button className="save-btn" onClick={handleSave}>Сохранить</button>
              <button className="cancel-btn" onClick={() => setEditing(false)}>Отмена</button>
            </div>
          </div>
        ) : (
          <div className="profile-data">
            <div className="profile-row">
              <span className="profile-label">Имя</span>
              <span className="profile-value">{user?.first_name || '—'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Фамилия</span>
              <span className="profile-value">{user?.last_name || '—'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Телефон</span>
              <span className="profile-value">{user?.phone || '—'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">VK</span>
              <span className="profile-value">{user?.vk_id ? '✅ Привязан' : '—'}</span>
            </div>
          </div>
        )}

        {status && (
          <p className="profile-status">{status}</p>
        )}
      </div>
    </div>
  );
};

export default ClientProfilePage;