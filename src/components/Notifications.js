import React, { useState, useEffect } from 'react';
import { notificationsService } from '../services';
import './Notifications.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { errorHandler } from '../utils/errorHandler';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = React.useRef(null);
  const { runIfMounted } = useSafeAsync();

  useEffect(() => {
    loadNotifications();
    // Закрытие при клике вне компонента
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      runIfMounted(() => setLoading(true));
      const data = await notificationsService.getNotifications();
      if (data.success) {
        runIfMounted(() => {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        });
      }
    } catch (error) {
      errorHandler.log(error, 'Notifications: Error loading notifications');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  };
  

  async function markAsRead(ids) {
    try {
      await notificationsService.markAsRead(ids);
      runIfMounted(() => {
        setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: 1 } : n));
        setUnreadCount(prev => prev - ids.length);
      });
    } catch (error) {
      errorHandler.log(error, 'Notifications: Error marking as read');
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'appointment_confirmed': return '✅';
      case 'appointment_reminder': return '🔔';
      case 'appointment_cancelled': return '❌';
      case 'new_review': return '✍️';
      default: return '📬';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} д назад`;
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button 
        className={`notifications-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      
      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Уведомления</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Прочитать все
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {loading ? (
              <div className="notifications-loading">Загрузка...</div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">Нет уведомлений</div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => !notif.is_read && markAsRead([notif.id])}
                >
                  <div className="notification-icon">{getIcon(notif.type)}</div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">{formatDate(notif.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;