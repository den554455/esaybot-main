import VKLinkButton from '../components/VKLinkButton';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { settingsService, authService } from '../services';
import './SettingsPage.css';
import { errorHandler } from '../utils/errorHandler';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    reminder_hours: 24
  });
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [vkStatus, setVkStatus] = useState('');
  const [vkLinked, setVkLinked] = useState(!!user?.vk_id);

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { setVkLinked(!!user?.vk_id); }, [user]);

  async function loadSettings() {
    try {
      const response = await settingsService.getSettings();
      if (response.success) setSettings(response.settings);
    } catch (e) {
      errorHandler.log(e, 'SettingsPage: Error loading settings');
    }
  }

  const saveSettings = async () => {
    setSaving(true);
    try {
      await settingsService.saveSettings(settings);
      success('Настройки сохранены');
    } catch (e) {
      toastError('Ошибка: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Новый пароль не совпадает с подтверждением');
      return;
    }
    if (passwordData.new.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      return;
    }
    try {
      await settingsService.changePassword({
        current: passwordData.current,
        new: passwordData.new
      });
      success('Пароль изменён. Выполняется выход...');
      setPasswordData({ current: '', new: '', confirm: '' });
      setPasswordError('');
      setTimeout(() => logout(), 1500);
    } catch (e) {
      setPasswordError(e.response?.data?.error || 'Ошибка смены пароля');
    }
  };

  return (
    <div className="settings-page">
      <h1>⚙️ Настройки</h1>

      <div className="settings-section">
        <h2>Уведомления</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.email_notifications}
              onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
            />
            Email уведомления
          </label>
          <p className="setting-description">Получать уведомления о подтверждении записи на email</p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.push_notifications}
              onChange={(e) => setSettings({...settings, push_notifications: e.target.checked})}
            />
            Push-уведомления
          </label>
          <p className="setting-description">Получать уведомления на телефон</p>
        </div>

        <div className="setting-item">
          <label>Напоминание за</label>
          <select
            value={settings.reminder_hours}
            onChange={(e) => setSettings({...settings, reminder_hours: parseInt(e.target.value)})}
          >
            <option value={1}>1 час</option>
            <option value={2}>2 часа</option>
            <option value={12}>12 часов</option>
            <option value={24}>24 часа</option>
            <option value={48}>48 часов</option>
          </select>
          <p className="setting-description">За сколько часов до записи отправлять напоминание</p>
        </div>

        <button className="save-btn" onClick={saveSettings} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>

      <div className="settings-section">
        <h2>Привязка аккаунтов</h2>
        <div className="setting-item">
          {vkLinked ? (
            <>
              <p style={{ color: '#06FFBF' }}>✅ VK аккаунт привязан</p>
              <button
                className="logout-btn"
                style={{ marginTop: '12px' }}
                onClick={async () => {
                  if (!window.confirm('Отвязать VK аккаунт?')) return;
                  try {
                    const resp = await settingsService.unlinkVk();
                    if (resp.success) {
                      setVkLinked(false);
                      setVkStatus('VK отвязан');
                    } else {
                      setVkStatus('Ошибка: ' + resp.error);
                    }
                  } catch (e) {
                    setVkStatus(e.response?.data?.error || 'Ошибка отвязки');
                  }
                }}
              >
                Отвязать VK
              </button>
            </>
          ) : (
            <>
              <p style={{ color: '#B0B0B0', marginBottom: '12px' }}>
                Привяжите VK чтобы входить через VK One Tap
              </p>
              <VKLinkButton
                onSuccess={() => { setVkLinked(true); setVkStatus('VK успешно привязан!'); }}
                onError={(msg) => setVkStatus(msg)}
              />
            </>
          )}
          {vkStatus && (
            <p style={{ marginTop: '8px', color: vkLinked ? '#06FFBF' : '#FF4D4D' }}>
              {vkStatus}
            </p>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h2>Безопасность</h2>
        <div className="password-form">
          <input
            type="password"
            placeholder="Текущий пароль"
            value={passwordData.current}
            onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
          />
          <input
            type="password"
            placeholder="Новый пароль"
            value={passwordData.new}
            onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
          />
          <input
            type="password"
            placeholder="Подтвердите новый пароль"
            value={passwordData.confirm}
            onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
          />
          {passwordError && <div className="error-message">{passwordError}</div>}
          <button className="change-password-btn" onClick={changePassword}>
            Сменить пароль
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2>Аккаунт</h2>
        <button className="logout-btn" onClick={logout}>
          Выйти из аккаунта
        </button>
        <button
          className="logout-btn"
          style={{ marginTop: '12px', background: '#8B0000' }}
          onClick={async () => {
            if (!window.confirm('Удалить аккаунт? Это действие необратимо.')) return;
            if (!window.confirm('Вы уверены? Все данные будут удалены.')) return;
            try {
              await authService.deleteAccount();
              logout();
            } catch (e) {
              toastError(e.response?.data?.error || 'Ошибка удаления аккаунта');
            }
          }}
        >
          Удалить аккаунт
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;