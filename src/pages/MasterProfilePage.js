import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { masterProfileService } from '../services';
import PortfolioGallery from '../components/PortfolioGallery';
import './MasterProfilePage.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { createSafeLinkProps, sanitizeImageSrc } from '../utils/sanitize';
import { errorHandler } from '../utils/errorHandler';

const MasterProfilePage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const { runIfMounted } = useSafeAsync();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await masterProfileService.getProfile();
      if (response.success) {
        runIfMounted(() => {
          setProfile(response.profile);
          setFormData(response.profile);
        });
      }
    } catch (error) {
      errorHandler.log(error, 'MasterProfilePage: Error loading profile');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSocialChange = (platform, value) => {
    setFormData({
      ...formData,
      social_links: { ...(formData.social_links || {}), [platform]: value }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await masterProfileService.updateProfile(formData);
      if (response.success) {
        setProfile(formData);
        setEditing(false);
        success('Профиль обновлён!');
      } else {
        throw new Error(response.error || 'Ошибка сохранения профиля');
      }
    } catch (error) {
      toastError('Ошибка: ' + (error.message || 'Не удалось сохранить профиль'));
    } finally {
      runIfMounted(() => setSaving(false));
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('Аватар должен быть не более 5 МБ');
      return;
    }

    const avatarFormData = new FormData();
    avatarFormData.append('photo', file);

    try {
      const data = await masterProfileService.uploadAvatar(avatarFormData);
      if (data.success) {
        runIfMounted(() => {
          setProfile({ ...profile, avatar_url: data.avatar_url });
          setFormData({ ...formData, avatar_url: data.avatar_url });
          success('Аватар обновлён!');
        });
      } else {
        throw new Error(data.error || 'Ошибка загрузки аватара');
      }
    } catch (error) {
      toastError('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div className="loading">Загрузка профиля...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-section">
          <img
            src={sanitizeImageSrc(profile?.avatar_url || '/default-avatar.svg') || '/default-avatar.svg'}
            alt="Аватар"
            className="avatar"
          />
          {editing && (
            <label className="upload-avatar-btn">
              📷 Загрузить фото
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
          )}
        </div>
        <div className="profile-info">
          <h1>
            {editing ? (
              <input
                value={formData.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Имя"
              />
            ) : (
              `${profile?.first_name} ${profile?.last_name || ''}`
            )}
          </h1>
          <div className="rating">
            {'⭐'.repeat(Math.floor(profile?.rating || 0))}
            <span>({profile?.reviews_count || 0} отзывов)</span>
          </div>
          <p className="district">📍 {profile?.district}</p>
        </div>
        {!editing ? (
          <button className="edit-btn" onClick={() => setEditing(true)}>✏️ Редактировать</button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
            <button className="cancel-btn" onClick={() => setEditing(false)}>Отмена</button>
          </div>
        )}
      </div>

      <div className="profile-details">
        <div className="detail-section">
          <h3>📝 О себе</h3>
          {editing ? (
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Расскажите о себе, опыте работе..."
              rows={4}
            />
          ) : (
            <p>{profile?.bio || 'Не заполнено'}</p>
          )}
        </div>

        <div className="detail-section">
          <h3>💼 Опыт</h3>
          {editing ? (
            <input
              type="number"
              value={formData.experience_years || 0}
              onChange={(e) => handleChange('experience_years', parseInt(e.target.value))}
            />
          ) : (
            <p>{profile?.experience_years || 0} лет</p>
          )}
        </div>

        <div className="detail-section">
          <h3>📞 Контакты</h3>
          {editing ? (
            <>
              <input type="tel" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Телефон" />
              <input type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" />
              <input type="text" value={formData.address || ''} onChange={(e) => handleChange('address', e.target.value)} placeholder="Адрес салона" />
            </>
          ) : (
            <>
              <p>📞 {profile?.phone || 'Не указан'}</p>
              <p>✉️ {profile?.email || 'Не указан'}</p>
              <p>📍 {profile?.address || 'Не указан'}</p>
            </>
          )}
        </div>

        <div className="detail-section">
          <h3>🌐 Социальные сети</h3>
          {editing ? (
            <>
              <input value={formData.social_links?.instagram || ''} onChange={(e) => handleSocialChange('instagram', e.target.value)} placeholder="Instagram" />
              <input value={formData.social_links?.telegram || ''} onChange={(e) => handleSocialChange('telegram', e.target.value)} placeholder="Telegram" />
              <input value={formData.social_links?.vk || ''} onChange={(e) => handleSocialChange('vk', e.target.value)} placeholder="VK" />
            </>
          ) : (
            <div className="social-links">
              {profile?.social_links?.instagram && <a {...createSafeLinkProps(profile.social_links.instagram)}>📸 Instagram</a>}
              {profile?.social_links?.telegram && <a {...createSafeLinkProps(profile.social_links.telegram)}>💬 Telegram</a>}
              {profile?.social_links?.vk && <a {...createSafeLinkProps(profile.social_links.vk)}>🌐 VK</a>}
            </div>
          )}
        </div>
      </div>

      <div className="portfolio-section">
        <h2>📸 Портфолио</h2>
        <PortfolioGallery masterId={profile?.id} editable={editing} />
      </div>
    </div>
  );
};

export default MasterProfilePage;