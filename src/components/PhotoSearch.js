import React, { useState, useRef } from 'react';
import { useToast } from '../components/Toast';
import { photoSearchService } from '../services';
import './PhotoSearch.css';
import { sanitizeImageSrc } from '../utils/sanitize';

const PhotoSearch = ({ onSearchComplete }) => {
  const { error: toastError } = useToast();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('Файл слишком большой. Максимум 5 МБ');
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setTags([]);
    setResults(null);
  };

  const handleSearch = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('photo', selectedImage);

    try {
      const data = await photoSearchService.searchByPhoto(formData);

      if (data.success) {
        setTags(data.tags || []);
        setResults(data.masters || []);
        if (onSearchComplete) onSearchComplete(data);
      } else {
        toastError(data.error || 'Ошибка поиска');
      }
    } catch (error) {
      toastError('Ошибка соединения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSelectedImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setTags([]);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getTagEmoji = (tag) => {
    const emojis = {
      french: '🤍', ombre: '🌈', glitter: '✨', cat_eye: '🐱',
      matte: '⚫', gel: '💅', acrylic: '💪', stamping: '🎨',
      foil: '📀', chrome: '🪞', velvet: '🧸', marble: '🪨',
      flower: '🌸', geometry: '📐', animal: '🐆', minimal: '⚪',
      classic: '💎', neon: '💚', pearl: '🦪', gradient: '🎨'
    };
    return emojis[tag] || '🏷️';
  };

  const getTagName = (tag) => {
    const names = {
      french: 'Френч', ombre: 'Омбре', glitter: 'Глиттер/Стразы',
      cat_eye: 'Кошачий глаз', matte: 'Матовый', gel: 'Гель-лак',
      acrylic: 'Акрил', stamping: 'Штамповка', foil: 'Фольга',
      chrome: 'Хром', velvet: 'Вельвет', marble: 'Мрамор',
      flower: 'Цветы', geometry: 'Геометрия', animal: 'Принт',
      minimal: 'Минимализм', classic: 'Классика', neon: 'Неон',
      pearl: 'Жемчуг', gradient: 'Градиент'
    };
    return names[tag] || tag;
  };

  return (
    <div className="photo-search">
      <div className="photo-search-header">
        <h3>🔍 Поиск по фото дизайна</h3>
        <p>Загрузите фото желаемого дизайна ногтей, и мы найдём мастеров, которые делают такие работы</p>
      </div>

      {!previewUrl ? (
        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          <div className="upload-icon">📸</div>
          <p>Нажмите для выбора фото</p>
          <p className="upload-hint">JPG, PNG до 5 МБ</p>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} hidden />
        </div>
      ) : (
        <div className="preview-area">
          <div className="preview-image">
            <img src={sanitizeImageSrc(previewUrl) || '/default-avatar.svg'} alt="Выбранный дизайн" />
            <button className="remove-btn" onClick={resetSearch} aria-label="Удалить">✕</button>
          </div>
          <div className="search-actions">
            <button className="search-btn" onClick={handleSearch} disabled={loading}>
              {loading ? '🔍 Распознавание...' : '🔍 Найти мастеров'}
            </button>
            <button className="cancel-btn" onClick={resetSearch}>Отмена</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Анализируем фото...</p>
        </div>
      )}

      {tags.length > 0 && (
        <div className="detected-tags">
          <h4>Распознанные теги:</h4>
          <div className="tags-list">
            {tags.map(tag => (
              <span key={tag} className="tag">{getTagEmoji(tag)} {getTagName(tag)}</span>
            ))}
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="search-results">
          <h4>Найдено мастеров: {results.length}</h4>
          <div className="masters-grid">
            {results.map(master => (
              <div key={master.id} className="master-card" onClick={() => window.location.href = `/calendar?master=${master.id}`}>
                <div className="master-avatar">
                  {master.avatar_url ? <img src={sanitizeImageSrc(master.avatar_url) || '/default-avatar.svg'} alt={master.name} /> : <div className="avatar-placeholder">👩‍🎨</div>}
                </div>
                <div className="master-info">
                  <div className="master-name">{master.name}</div>
                  <div className="master-district">📍 {master.district || 'Район не указан'}</div>
                  <div className="master-rating">{'⭐'.repeat(Math.floor(master.rating || 0))} {master.rating || 'Нов'}</div>
                  {master.tag_match_count > 0 && <div className="match-badge">Совпадений: {master.tag_match_count}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h4>Ничего не найдено</h4>
          <p>Попробуйте загрузить другое фото или измените параметры поиска</p>
          <button onClick={resetSearch} className="try-again-btn">Попробовать снова</button>
        </div>
      )}
    </div>
  );
};

export default PhotoSearch;