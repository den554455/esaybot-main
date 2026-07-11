import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, mastersService, reviewsService } from '../services';
import ReviewForm from '../components/ReviewForm';
import LoadingSpinner from '../components/LoadingSpinner';
import './CabinetPage.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { sanitizeImageSrc } from '../utils/sanitize';
import { errorHandler } from '../utils/errorHandler';

const CabinetPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [notification, setNotification] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const { runIfMounted } = useSafeAsync();

  // Проверка успешной записи из state
  useEffect(() => {
    const state = window.history.state?.usr;
    if (state?.bookingSuccess) {
      showNotification('✅ Запись успешно создана! Ждём вас.', 'success');
      // Очищаем state
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/login', { state: { from: '/cabinet' } });
      return;
    }
    if (isAuthenticated) {
      loadAppointments();
      loadMyReviews();
      loadFavorites();
    }
  }, [isAuthenticated, authLoading]);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => { runIfMounted(() => setNotification(null)); }, 3000);
  }, [runIfMounted]);

  const loadAppointments = async () => {
    try {
      runIfMounted(() => setLoading(true));
      const data = await bookingService.getAppointments();
      // Backend возвращает раздельные поля date ("YYYY-MM-DD") и time ("HH:MM"),
      // а компонент работает с объединённым date_time
      const normalized = data.map(a => ({
        ...a,
        date_time: a.date_time || `${a.date}T${a.time}:00`
      }));
      const now = new Date();
      
      // Разделяем на предстоящие и прошедшие
      const upcoming = normalized.filter(a => new Date(a.date_time) > now);
      const past = normalized.filter(a => new Date(a.date_time) <= now);
      
      // Сортируем предстоящие по дате (ближайшие первые)
      upcoming.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
      
      // Сортируем прошедшие по дате (новые первые)
      past.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
      
      runIfMounted(() => {
        setAppointments(upcoming);
        setPastAppointments(past);
      });
    } catch (error) {
      errorHandler.log(error, 'CabinetPage: Error loading appointments');
      showNotification('Не удалось загрузить записи', 'error');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  };

  const loadMyReviews = async () => {
    try {
      const response = await reviewsService.getMyReviews();
      if (response.success) {
        runIfMounted(() => setReviews(response.reviews || []));
      }
    } catch (error) {
      errorHandler.log(error, 'CabinetPage: Error loading reviews');
    }
  };

  const loadFavorites = async () => {
    try {
      const favorites = await mastersService.getFavorites();
      runIfMounted(() => setFavorites(favorites || []));
    } catch (error) {
      errorHandler.log(error, 'CabinetPage: Error loading favorites');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Вы уверены, что хотите отменить запись?')) return;
    
    setCancellingId(appointmentId);
    try {
      await bookingService.cancelAppointment(appointmentId);
      showNotification('Запись успешно отменена', 'success');
      await loadAppointments();
    } catch (error) {
      errorHandler.log(error, 'CabinetPage: Error cancelling appointment');
      showNotification(error.message || 'Ошибка при отмене записи', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReschedule = (appointment) => {
    navigate('/calendar', { 
      state: { 
        master: { 
          ...appointment.master, 
          id: appointment.master?.id || appointment.master_id 
        }, 
        service: { 
          ...appointment.service, 
          price: appointment.service?.price ?? appointment.price 
        },
        editAppointmentId: appointment.id 
      } 
    });
  };

  const handleMasterClick = (masterId) => {
    navigate('/masters', { state: { selectedMaster: masterId } });
  };

  const canReview = (appointment) => {
    if (appointment.status !== 'confirmed') return false;
    const appointmentDate = new Date(appointment.date_time);
    const now = new Date();
    const daysSince = (now - appointmentDate) / (1000 * 60 * 60 * 24);
    // Можно оставить отзыв в течение 30 дней после записи
    return appointmentDate < now && daysSince <= 30;
  };

  const hasReview = (appointmentId) => {
    return reviews.some(r => r.appointment_id === appointmentId);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Завтра, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === -1) {
      return `Вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: { text: '⏳ Ожидает подтверждения', class: 'pending' },
      confirmed: { text: '✅ Подтверждена', class: 'confirmed' },
      completed: { text: '✨ Завершена', class: 'completed' },
      cancelled: { text: '❌ Отменена', class: 'cancelled' }
    };
    return statusMap[status] || { text: status, class: 'pending' };
  };

  const upcomingCount = appointments.length;
  const pastCount = pastAppointments.length;
  const reviewsCount = reviews.length;

  if (authLoading || (loading && appointments.length === 0 && pastAppointments.length === 0)) {
    return (
      <div className="cabinet-page">
        <LoadingSpinner text="Загрузка личного кабинета..." />
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    return null;
  }

  return (
    <div className="cabinet-page">
      {/* Уведомление */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'info' && 'ℹ️'}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button className="notification-close" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Профиль */}
      <div className="profile-header">
        <div className="user-info">
          <div className="user-avatar">
            {user?.avatar_url ? (
              <img src={sanitizeImageSrc(user.avatar_url) || '/default-avatar.svg'} alt={`${user.first_name} ${user.last_name}`} />
            ) : (
              <div className="avatar-placeholder">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            )}
          </div>
          <div className="user-details">
            <h2>{user?.first_name} {user?.last_name}</h2>
            <p className="user-email">{user?.email}</p>
            <p className="user-role">
              {user?.role === 'master' && '👩‍🎨 Мастер'}
              {user?.role === 'admin' && '👑 Администратор'}
              {user?.role === 'client' && '💅 Клиент'}
            </p>
          </div>
          <button className="edit-profile-btn" onClick={() => navigate('/settings')}>
            ✏️
          </button>
        </div>
        
        {/* Статистика */}
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-value">{upcomingCount}</span>
            <span className="stat-label">Записей</span>
          </div>
          <div className="stat">
            <span className="stat-value">{reviewsCount}</span>
            <span className="stat-label">Отзывов</span>
          </div>
          <div className="stat">
            <span className="stat-value">{favorites.length}</span>
            <span className="stat-label">Избранное</span>
          </div>
        </div>
      </div>
      
      {/* Табы */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} 
          onClick={() => setActiveTab('upcoming')}
        >
          📅 Предстоящие {upcomingCount > 0 && `(${upcomingCount})`}
        </button>
        <button 
          className={`tab ${activeTab === 'past' ? 'active' : ''}`} 
          onClick={() => setActiveTab('past')}
        >
          📋 История {pastCount > 0 && `(${pastCount})`}
        </button>
        <button 
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reviews')}
        >
          ✍️ Мои отзывы {reviewsCount > 0 && `(${reviewsCount})`}
        </button>
      </div>
      
      {/* Предстоящие записи */}
      {activeTab === 'upcoming' && (
        <>
          {appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>Нет предстоящих записей</h3>
              <p>Запишитесь к мастеру, чтобы посетить салон красоты</p>
              <button className="book-now-btn" onClick={() => navigate('/')}>
                Записаться сейчас
              </button>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.map(appt => {
                const status = getStatusText(appt.status);
                return (
                  <div key={appt.id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="service-info">
                        <span className="service-icon">💅</span>
                        <span className="service-name">{appt.service?.name || 'Услуга не указана'}</span>
                      </div>
                      <span className={`status-badge ${status.class}`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="appointment-details">
                      <div className="detail-row">
                        <span className="detail-icon">👤</span>
                        <span 
                          className="master-name-link"
                          onClick={() => appt.master && handleMasterClick(appt.master.id)}
                        >
                          {appt.master?.name || 'Мастер не указан'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">📍</span>
                        <span>{appt.master?.district || '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">📅</span>
                        <span>{formatDate(appt.date_time)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">💰</span>
                        <span className="price">{(appt.price || 0).toLocaleString()} ₽</span>
                      </div>
                    </div>
                    {appt.status === 'pending' && (
                      <div className="appointment-actions">
                        <button 
                          className="cancel-btn" 
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancellingId === appt.id}
                        >
                          {cancellingId === appt.id ? 'Отмена...' : '❌ Отменить'}
                        </button>
                        <button 
                          className="reschedule-btn" 
                          onClick={() => handleReschedule(appt)}
                        >
                          📅 Перенести
                        </button>
                      </div>
                    )}
                    {appt.status === 'confirmed' && (
                      <div className="appointment-note">
                        <span className="note-icon">💡</span>
                        <span>Не забудьте взять с собой сменную обувь</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      
      {/* История записей */}
      {activeTab === 'past' && (
        <>
          {pastAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>История записей пуста</h3>
              <p>После посещения мастера здесь появится история</p>
            </div>
          ) : (
            <div className="appointments-list past">
              {pastAppointments.map(appt => {
                const status = getStatusText(appt.status);
                const canReviewAppointment = canReview(appt) && !hasReview(appt.id);
                
                return (
                  <div key={appt.id} className={`appointment-card past ${appt.status}`}>
                    <div className="appointment-header">
                      <div className="service-info">
                        <span className="service-icon">💅</span>
                        <span className="service-name">{appt.service?.name || 'Услуга не указана'}</span>
                      </div>
                      <span className={`status-badge ${status.class}`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="appointment-details">
                      <div className="detail-row">
                        <span className="detail-icon">👤</span>
                        <span 
                          className="master-name-link"
                          onClick={() => appt.master && handleMasterClick(appt.master.id)}
                        >
                          {appt.master?.name || 'Мастер не указан'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">📍</span>
                        <span>{appt.master?.district || '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">📅</span>
                        <span>{formatDate(appt.date_time)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">💰</span>
                        <span className="price">{(appt.price || 0).toLocaleString()} ₽</span>
                      </div>
                    </div>
                    {canReviewAppointment && (
                      <div className="appointment-actions">
                        <button 
                          className="review-btn" 
                          onClick={() => setShowReviewForm(appt)}
                        >
                          ✍️ Оставить отзыв
                        </button>
                      </div>
                    )}
                    {hasReview(appt.id) && (
                      <div className="review-given">
                        <span className="review-icon">⭐</span>
                        <span>Вы уже оставили отзыв</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      
      {/* Мои отзывы */}
      {activeTab === 'reviews' && (
        <div className="my-reviews">
          {reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✍️</div>
              <h3>Вы ещё не оставляли отзывы</h3>
              <p>После посещения мастера вы сможете оценить его работу</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-master">
                    <strong className="master-name">
                      {review.master_name}
                    </strong>
                    <div className="review-rating">
                      {'⭐'.repeat(Math.floor(review.rating))}
                      {review.rating % 1 >= 0.5 && '½'}
                      <span className="rating-number">{review.rating}</span>
                    </div>
                  </div>
                  <div className={`review-status ${review.status}`}>
                    {review.status === 'pending' ? '⏳ На проверке' : '✅ Опубликован'}
                  </div>
                </div>
                <div className="review-text">{review.text}</div>
                {review.photos && review.photos.length > 0 && (
                  <div className="review-photos">
                    {review.photos.map((photo, idx) => (
                      <img key={idx} src={sanitizeImageSrc(photo) || '/default-avatar.svg'} alt={`review ${idx}`} className="review-photo" />
                    ))}
                  </div>
                )}
                {review.master_response && (
                  <div className="master-response">
                    <div className="response-header">
                      <span className="response-icon">👩‍🎨</span>
                      <strong>Ответ мастера:</strong>
                    </div>
                    <p>{review.master_response}</p>
                  </div>
                )}
                <div className="review-date">
                  {new Date(review.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Модалка отзыва */}
      {showReviewForm && (
        <ReviewForm
          appointmentId={showReviewForm.id}
          masterName={showReviewForm.master?.name || ''}
          onSuccess={() => {
            setShowReviewForm(null);
            loadMyReviews();
            showNotification('Спасибо за отзыв! Он будет опубликован после проверки.', 'success');
          }}
          onCancel={() => setShowReviewForm(null)}
        />
      )}
    </div>
  );
};

export default CabinetPage;