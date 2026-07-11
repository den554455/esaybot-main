import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mastersService } from '../services';
import './FavoritesPage.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { sanitizeImageSrc } from '../utils/sanitize';
import { errorHandler } from '../utils/errorHandler';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { runIfMounted } = useSafeAsync();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    try {
      const favorites = await mastersService.getFavorites();
      runIfMounted(() => setFavorites(favorites || []));
    } catch (error) {
      errorHandler.log(error, 'FavoritesPage: Error loading favorites');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  };

  const removeFavorite = async (masterId) => {
    try {
      await mastersService.removeFavorite(masterId);
      setFavorites(prev => prev.filter(f => f.id !== masterId));
    } catch (error) {
      errorHandler.log(error, 'FavoritesPage: Error removing favorite');
    }
  };
  

  if (loading) {
    return <div className="favorites-loading">Загрузка...</div>;
  }

  return (
    <div className="favorites-page">
      <h1>❤️ Избранное</h1>
      
      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <p>У вас пока нет избранных мастеров</p>
          <button onClick={() => navigate('/')}>Найти мастера</button>
        </div>
      ) : (
        <div className="favorites-list">
          {favorites.map(master => (
            <div key={master.id} className="favorite-card">
              <div className="favorite-avatar">
                {master.avatar_url ? (
                  <img src={sanitizeImageSrc(master.avatar_url) || '/default-avatar.svg'} alt={master.name} />
                ) : (
                  <div className="avatar-placeholder">👩‍🎨</div>
                )}
              </div>
              <div className="favorite-info">
                <h3>{master.name}</h3>
                <p>📍 {master.district}</p>
                <div className="rating">
                  {'⭐'.repeat(Math.floor(master.rating || 0))}
                  <span>({master.reviews || 0})</span>
                </div>
              </div>
              <div className="favorite-actions">
                <button className="book-btn" onClick={() => navigate('/masters', { state: { selectedMaster: master.id } })}>
                  Записаться
                </button>
                <button className="remove-btn" onClick={() => removeFavorite(master.id)}>
                  ❌ Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;