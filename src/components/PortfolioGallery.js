import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { portfolioService } from '../services';
import './PortfolioGallery.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { sanitizeImageSrc } from '../utils/sanitize';
import { errorHandler } from '../utils/errorHandler';

const PortfolioGallery = ({ masterId, editable = false }) => {
  const { success, error: toastError } = useToast();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState(null); // { file, previewUrl }
  const [uploadMeta, setUploadMeta] = useState({ title: '', description: '' });
  const fileInputRef = React.useRef(null);
  const { runIfMounted } = useSafeAsync();

  useEffect(() => {
    loadPortfolio();
  }, [masterId]);

  const loadPortfolio = async () => {
    try {
      runIfMounted(() => setLoading(true));
      const portfolio = await portfolioService.getPortfolio(masterId);
      runIfMounted(() => setPhotos(portfolio));
    } catch (error) {
      errorHandler.log(error, 'PortfolioGallery: Error loading portfolio');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError('Файл слишком большой. Максимальный размер 10MB');
      return;
    }

    setUploadForm({ file, previewUrl: URL.createObjectURL(file) });
    setUploadMeta({ title: '', description: '' });
    if (event.target) event.target.value = '';
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm?.file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', uploadForm.file);
    if (uploadMeta.title) formData.append('title', uploadMeta.title);
    if (uploadMeta.description) formData.append('description', uploadMeta.description);

    try {
      const response = await portfolioService.uploadPhoto({ formData });
      if (response.success) {
        await loadPortfolio();
        success('Фото добавлено в портфолио');
        setUploadForm(null);
        setUploadMeta({ title: '', description: '' });
      } else {
        toastError(response.data.error || 'Ошибка загрузки');
      }
    } catch (error) {
      toastError('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await portfolioService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      success('Фото удалено');
    } catch (error) {
      toastError('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      await portfolioService.setPrimaryPhoto(photoId);
      setPhotos(prev => prev.map(p => ({ ...p, is_primary: p.id === photoId ? 1 : 0 })));
      success('Главное фото обновлено');
    } catch (error) {
      toastError('Ошибка: ' + (error.message || 'Не удалось установить главное фото'));
    }
  };

  const confirmDelete = (photoId) => {
    if (window.confirm('Вы уверены, что хотите удалить это фото?')) {
      handleDelete(photoId);
    }
  };

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="spinner"></div>
        <p>Загрузка портфолио...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-gallery">
      {editable && (
        <div className="gallery-header">
          <label className={`upload-btn ${uploading ? 'uploading' : ''}`}>
            <span className="upload-icon">📸</span>
            {uploading ? 'Загрузка...' : 'Добавить фото'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              hidden
              disabled={uploading}
            />
          </label>
          <p className="upload-hint">Поддерживаются JPG, PNG, WebP, GIF до 10MB</p>
        </div>
      )}

      {/* Форма загрузки с превью */}
      {uploadForm && (
        <div className="modal-overlay" onClick={() => setUploadForm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Добавить фото</h3>
            <img src={sanitizeImageSrc(uploadForm.previewUrl) || '/default-avatar.svg'} alt="Превью" style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }} />
            <input
              type="text"
              placeholder="Название работы (опционально)"
              value={uploadMeta.title}
              onChange={e => setUploadMeta({ ...uploadMeta, title: e.target.value })}
              style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '8px', background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#fff' }}
            />
            <input
              type="text"
              placeholder="Описание (опционально)"
              value={uploadMeta.description}
              onChange={e => setUploadMeta({ ...uploadMeta, description: e.target.value })}
              style={{ width: '100%', marginBottom: '16px', padding: '8px', borderRadius: '8px', background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#fff' }}
            />
            <div className="modal-actions">
              <button onClick={() => setUploadForm(null)}>Отмена</button>
              <button onClick={handleUploadSubmit} disabled={uploading}>
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="empty-portfolio">
          <div className="empty-icon">📷</div>
          <h4>Портфолио пусто</h4>
          <p>{editable ? 'Добавьте фотографии своих работ, чтобы привлечь больше клиентов' : 'У мастера пока нет фотографий в портфолио'}</p>
          {editable && (
            <label className="empty-upload-btn">
              📸 Загрузить первое фото
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} hidden />
            </label>
          )}
        </div>
      ) : (
        <div className="gallery-grid">
          {photos.map(photo => (
            <div key={photo.id} className="gallery-item">
              <div className="gallery-image-wrapper">
                <img
                  src={sanitizeImageSrc(photo.photo_url) || '/default-avatar.svg'}
                  alt={photo.title || 'Работа мастера'}
                  loading="lazy"
                  onClick={() => {
                    const safeUrl = sanitizeImageSrc(photo.photo_url);
                    if (safeUrl) window.open(safeUrl, '_blank', 'noopener,noreferrer');
                  }}
                />
                {photo.is_primary === 1 && <div className="primary-badge" title="Главное фото">⭐</div>}
              </div>

              <div className="gallery-info">
                {photo.title && <div className="photo-title">{photo.title}</div>}
                {photo.description && <div className="photo-description">{photo.description}</div>}
                <div className="photo-date">{photo.created_at ? new Date(photo.created_at).toLocaleDateString('ru-RU') : ''}</div>
              </div>

              {editable && (
                <div className="gallery-actions">
                  {photo.is_primary !== 1 && (
                    <button className="action-btn set-primary" onClick={() => handleSetPrimary(photo.id)} title="Сделать главным">⭐ Главное</button>
                  )}
                  <button className="action-btn delete" onClick={() => confirmDelete(photo.id)} title="Удалить">🗑️ Удалить</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioGallery;