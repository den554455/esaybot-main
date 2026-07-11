import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { adminService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPanel.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { errorHandler } from '../utils/errorHandler';

const AdminMasters = () => {
  const { success, error: toastError } = useToast();
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { runIfMounted } = useSafeAsync();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaster, setNewMaster] = useState({
    first_name: '', last_name: '', district: '',
    phone: '', email: '', experience_years: 0, description: ''
  });

    useEffect(() => { loadMasters(); }, []);

  const loadMasters = async () => {
    try {
      runIfMounted(() => setLoading(true));
      const response = await adminService.getMasters();
      if (response.success) runIfMounted(() => setMasters(response.masters || []));
    } catch (error) {
      errorHandler.log(error, 'AdminPanel: Error loading masters');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  };

  const handleDeleteMaster = async (masterId, masterName) => {
    if (window.confirm(`Вы уверены, что хотите удалить мастера "${masterName}"?`)) {
      try {
        await adminService.deleteMaster(masterId);
        await loadMasters();
        success('Мастер удалён');
      } catch (error) {
        toastError('Ошибка при удалении мастера');
      }
    }
  };

  const handleAddMaster = async (e) => {
    e.preventDefault();
    try {
      await adminService.createMaster(newMaster);
      setShowAddForm(false);
      setNewMaster({ first_name: '', last_name: '', district: '', phone: '', email: '', experience_years: 0, description: '' });
      await loadMasters();
      success('Мастер добавлен');
    } catch (error) {
      toastError('Ошибка при добавлении мастера');
    }
  };

  if (loading) return <LoadingSpinner text="Загрузка мастеров..." />;

  return (
    <div className="admin-masters">
      <div className="section-header">
        <h3>👩‍🎨 Управление мастерами</h3>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>➕ Добавить мастера</button>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Добавление мастера</h3>
            <form onSubmit={handleAddMaster}>
              <input type="text" placeholder="Имя" value={newMaster.first_name} onChange={e => setNewMaster({...newMaster, first_name: e.target.value})} required />
              <input type="text" placeholder="Фамилия" value={newMaster.last_name} onChange={e => setNewMaster({...newMaster, last_name: e.target.value})} required />
              <input type="text" placeholder="Район/метро" value={newMaster.district} onChange={e => setNewMaster({...newMaster, district: e.target.value})} required />
              <input type="tel" placeholder="Телефон" value={newMaster.phone} onChange={e => setNewMaster({...newMaster, phone: e.target.value})} />
              <input type="email" placeholder="Email" value={newMaster.email} onChange={e => setNewMaster({...newMaster, email: e.target.value})} required />
              <input type="number" placeholder="Опыт (лет)" value={newMaster.experience_years} onChange={e => setNewMaster({...newMaster, experience_years: parseInt(e.target.value)})} />
              <textarea placeholder="Описание" value={newMaster.description} onChange={e => setNewMaster({...newMaster, description: e.target.value})} rows="3" />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>Отмена</button>
                <button type="submit">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="masters-table">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Имя</th><th>Район</th><th>Рейтинг</th><th>Записей</th><th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {masters.map(master => (
              <tr key={master.master_id}>
                <td>{master.master_id}</td>
                <td>{master.first_name} {master.last_name}</td>
                <td>{master.district}</td>
                <td><span className="rating">{'⭐'.repeat(Math.floor(master.rating))} {master.rating}</span></td>
                <td>{master.reviews_count}</td>
                <td>
                  <button className="action-btn delete" onClick={() => handleDeleteMaster(master.master_id, `${master.first_name} ${master.last_name}`)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminReviews = () => {
  const { success, error: toastError } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const { runIfMounted: runIfMountedReviews } = useSafeAsync();

  useEffect(() => { loadReviews(); }, [statusFilter]);

  const loadReviews = async () => {
    try {
      runIfMountedReviews(() => setLoading(true));
      const response = await adminService.getReviews(statusFilter);
      if (response.success) runIfMountedReviews(() => setReviews(response.reviews || []));
    } catch (error) {
      errorHandler.log(error, 'AdminPanel: Error loading reviews');
    } finally {
      runIfMountedReviews(() => setLoading(false));
    }
  };

  const handleUpdateStatus = async (reviewId, status) => {
    try {
      await adminService.updateReviewStatus(reviewId, status);
      await loadReviews();
      success(status === 'approved' ? 'Отзыв одобрен' : 'Отзыв отклонён');
    } catch (error) {
      toastError('Ошибка при обновлении отзыва');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Удалить этот отзыв?')) {
      try {
        await adminService.deleteReview(reviewId);
        await loadReviews();
        success('Отзыв удалён');
      } catch (error) {
        toastError('Ошибка при удалении отзыва');
      }
    }
  };

  if (loading) return <LoadingSpinner text="Загрузка отзывов..." />;

  return (
    <div className="admin-reviews">
      <div className="section-header">
        <h3>✍️ Управление отзывами</h3>
        <div className="filter-buttons">
          <button className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>⏳ На модерации</button>
          <button className={`filter-btn ${statusFilter === 'approved' ? 'active' : ''}`} onClick={() => setStatusFilter('approved')}>✅ Одобренные</button>
          <button className={`filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`} onClick={() => setStatusFilter('rejected')}>❌ Отклонённые</button>
        </div>
      </div>

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="empty-state">Нет отзывов для отображения</div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-user">
                  <strong>{review.first_name} {review.last_name}</strong>
                  <span className="review-rating">⭐ {review.rating}</span>
                </div>
                <div className="review-master">Мастер: {review.master_first_name} {review.master_last_name}</div>
              </div>
              <div className="review-text">{review.text}</div>
              <div className="review-date">{new Date(review.created_at).toLocaleDateString('ru-RU')}</div>
              <div className="review-actions">
                {statusFilter === 'pending' && (
                  <>
                    <button className="approve-btn" onClick={() => handleUpdateStatus(review.id, 'approved')}>✅ Одобрить</button>
                    <button className="reject-btn" onClick={() => handleUpdateStatus(review.id, 'rejected')}>❌ Отклонить</button>
                  </>
                )}
                <button className="delete-btn" onClick={() => handleDeleteReview(review.id)}>🗑️ Удалить</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminFeedback = () => {
  const { success, error: toastError } = useToast();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const { runIfMounted: runIfMountedFeedback } = useSafeAsync();

  useEffect(() => { loadFeedback(); }, []);

  const loadFeedback = async () => {
    try {
      runIfMountedFeedback(() => setLoading(true));
      const response = await adminService.getFeedback();
      if (response.success) runIfMountedFeedback(() => setFeedback(response.feedback || []));
    } catch (error) {
      errorHandler.log(error, 'AdminPanel: Error loading feedback');
    } finally {
      runIfMountedFeedback(() => setLoading(false));
    }
  };

  const handleMarkResponded = async (feedbackId) => {
    try {
      await adminService.markFeedbackResponded(feedbackId);
      await loadFeedback();
      success('Обращение отмечено как обработанное');
    } catch (error) {
      toastError('Ошибка при обновлении статуса');
    }
  };

  if (loading) return <LoadingSpinner text="Загрузка обращений..." />;

  return (
    <div className="admin-feedback">
      <div className="section-header"><h3>💬 Обратная связь</h3></div>
      <div className="feedback-list">
        {feedback.length === 0 ? (
          <div className="empty-state">Нет обращений</div>
        ) : (
          feedback.map(item => (
            <div key={item.id} className="feedback-card">
              <div className="feedback-header">
                <div className="feedback-user">
                  <strong>{item.user_name || 'Аноним'}</strong>
                  <span className={`feedback-status ${item.status}`}>{item.status === 'new' ? '🟡 Новое' : '✅ Обработано'}</span>
                </div>
                <div className="feedback-date">{new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
              <div className="feedback-type">Тип: {item.type === 'complaint' ? 'Жалоба' : 'Вопрос'}</div>
              <div className="feedback-message">{item.message}</div>
              {item.admin_response && (
                <div className="feedback-response">
                  <strong>Ответ администратора:</strong>
                  <p>{item.admin_response}</p>
                </div>
              )}
              {item.status === 'new' && (
                <div className="feedback-actions">
                  <button onClick={() => handleMarkResponded(item.id)}>✅ Отметить как обработанное</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { runIfMounted: runIfMountedStats } = useSafeAsync();

  useEffect(() => {
    if (user?.role === 'admin') {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const response = await adminService.getStats();
      if (response.success) runIfMountedStats(() => setStats(response.stats));
    } catch (error) {
      errorHandler.log(error, 'AdminPanel: Error loading stats');
    } finally {
      runIfMountedStats(() => setLoading(false));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <div className="access-icon">🚫</div>
          <h1>Доступ запрещён</h1>
          <p>У вас нет прав для просмотра этой страницы.</p>
          <button onClick={() => window.location.href = '/'}>Вернуться на главную</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>👑 Админ-панель</h1>
        <p>Добро пожаловать, {user?.first_name} {user?.last_name}</p>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Дашборд</button>
        <button className={`admin-tab ${activeTab === 'masters' ? 'active' : ''}`} onClick={() => setActiveTab('masters')}>👩‍🎨 Мастера</button>
        <button className={`admin-tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>✍️ Отзывы</button>
        <button className={`admin-tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>💬 Обратная связь</button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="dashboard">
          {loading ? <LoadingSpinner text="Загрузка статистики..." /> : (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{stats?.users || 0}</div><div className="stat-label">Пользователей</div></div>
                <div className="stat-card"><div className="stat-icon">👩‍🎨</div><div className="stat-value">{stats?.masters || 0}</div><div className="stat-label">Мастеров</div></div>
                <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-value">{stats?.appointments?.today || 0}</div><div className="stat-label">Записей сегодня</div></div>
                <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-value">{stats?.revenue?.toLocaleString() || 0} ₽</div><div className="stat-label">Выручка</div></div>
              </div>

              <div className="stats-details">
                <div className="detail-block">
                  <h3>Статусы записей</h3>
                  <div className="status-bars">
                    <div className="status-bar"><span>⏳ Ожидают</span><span>{stats?.appointments?.pending || 0}</span><div className="bar"><div className="fill" style={{width: `${Math.min((stats?.appointments?.pending / stats?.appointments?.total) * 100, 100) || 0}%`}}></div></div></div>
                    <div className="status-bar"><span>✅ Подтверждены</span><span>{stats?.appointments?.confirmed || 0}</span><div className="bar"><div className="fill confirmed" style={{width: `${Math.min((stats?.appointments?.confirmed / stats?.appointments?.total) * 100, 100) || 0}%`}}></div></div></div>
                    <div className="status-bar"><span>❌ Отменены</span><span>{stats?.appointments?.cancelled || 0}</span><div className="bar"><div className="fill cancelled" style={{width: `${Math.min((stats?.appointments?.cancelled / stats?.appointments?.total) * 100, 100) || 0}%`}}></div></div></div>
                  </div>
                </div>

                <div className="detail-block">
                  <h3>🔥 Популярные услуги</h3>
                  {stats?.popular_services?.map((service, idx) => (
                    <div key={idx} className="popular-item"><span>{service.name}</span><span className="count">{service.count} записей</span></div>
                  ))}
                  {(!stats?.popular_services || stats.popular_services.length === 0) && <div className="no-data">Нет данных</div>}
                </div>

                <div className="detail-block">
                  <h3>⭐ Лучшие мастера</h3>
                  {stats?.popular_masters?.map((master, idx) => (
                    <div key={idx} className="popular-item"><span>{master.name}</span><span className="count">{master.count} записей</span></div>
                  ))}
                  {(!stats?.popular_masters || stats.popular_masters.length === 0) && <div className="no-data">Нет данных</div>}
                </div>
              </div>

              <div className="alerts">
                {stats?.new_feedback > 0 && (
                  <div className="alert"><span className="alert-icon">📬</span><span>Новых обращений: {stats.new_feedback}</span><button onClick={() => setActiveTab('feedback')}>Перейти →</button></div>
                )}
                {stats?.pending_reviews > 0 && (
                  <div className="alert"><span className="alert-icon">✍️</span><span>Отзывов на модерации: {stats.pending_reviews}</span><button onClick={() => setActiveTab('reviews')}>Перейти →</button></div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'masters' && <AdminMasters />}
      {activeTab === 'reviews' && <AdminReviews />}
      {activeTab === 'feedback' && <AdminFeedback />}
    </div>
  );
};

export default AdminPanel;