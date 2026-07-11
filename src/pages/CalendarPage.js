import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, addDays, isSameDay, startOfWeek, addWeeks, isPast, startOfDay, isToday, isTomorrow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { bookingService } from '../services';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './CalendarPage.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { errorHandler } from '../utils/errorHandler';

const CalendarPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { master, service } = location.state || {};

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { runIfMounted } = useSafeAsync();

  // Проверка авторизации
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/calendar', master, service } });
      return;
    }
  }, [isAuthenticated, navigate, master, service]);

  // Проверка наличия необходимых данных
  useEffect(() => {
    if (!master || !service) {
      navigate('/', { replace: true });
      return;
    }
    loadSlots(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [master, service]);

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadSlots = useCallback(async (date) => {
    if (!master?.id) return;
    
    runIfMounted(() => {
      setLoading(true);
      setSlots([]);
      setError('');
      setSelectedTime(null);
    });
    
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const availableSlots = await bookingService.getSlots(master.id, dateStr);
      
      // Фильтруем слоты, которые уже прошли
      const now = new Date();
      const filteredSlots = availableSlots.filter(slot => {
        const [hours, minutes] = slot.split(':');
        const slotDateTime = new Date(date);
        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
        return slotDateTime > now;
      });
      
      runIfMounted(() => {
        setSlots(filteredSlots);
        if (filteredSlots.length === 0 && availableSlots.length > 0) {
          setError('Все слоты на это время уже прошли');
        } else if (filteredSlots.length === 0) {
          setError('На эту дату нет свободных слотов');
        }
      });
    } catch (error) {
      errorHandler.log(error, 'CalendarPage: Ошибка загрузки слотов');
      runIfMounted(() => setError('Не удалось загрузить свободное время. Попробуйте позже.'));
    } finally {
      runIfMounted(() => setLoading(false));
    }
  }, [master?.id]);

  const handleDateSelect = useCallback((date) => {
    if (isPast(startOfDay(date))) return;
    setSelectedDate(date);
    setError('');
    loadSlots(date);
  }, [loadSlots]);

  const handlePrevWeek = useCallback(() => {
    if (weekOffset > 0) {
      setWeekOffset(prev => prev - 1);
    }
  }, [weekOffset]);

  const handleNextWeek = useCallback(() => {
    setWeekOffset(prev => prev + 1);
  }, []);

  const handleToday = useCallback(() => {
    setWeekOffset(0);
    setSelectedDate(new Date());
    loadSlots(new Date());
  }, [loadSlots]);

  const handleConfirm = useCallback(async () => {
    if (!selectedTime || booking) return;

    // Показываем модальное окно подтверждения
    setShowConfirmation(true);
  }, [selectedTime, booking]);

  const confirmBooking = async () => {
    setBooking(true);
    setError('');
    setShowConfirmation(false);

    try {
      const result = await bookingService.bookAppointment({
        masterId: master.id,
        serviceId: service.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        price: service.price,
        comment: '' // Можно добавить поле для комментария
      });

      if (result.success) {
        runIfMounted(() => setSuccessMessage('Запись успешно создана!'));
        setTimeout(() => {
          runIfMounted(() => navigate('/cabinet', { 
            state: { 
              bookingSuccess: true, 
              appointmentId: result.appointmentId,
              message: 'Вы успешно записаны! Ждём вас.'
            } 
          }));
        }, 1500);
      } else {
        runIfMounted(() => setError(result.error || 'Ошибка при записи'));
        // Прокручиваем к ошибке
        document.querySelector('.error-message')?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      errorHandler.log(error, 'CalendarPage: Booking error');
      let errorMessage = 'Не удалось создать запись. Попробуйте позже.';
      
      if (error.response?.data?.error === 'Time slot already booked') {
        errorMessage = 'Это время уже занято. Пожалуйста, выберите другое.';
        // Обновляем слоты
        loadSlots(selectedDate);
      } else if (error.response?.data?.error === 'You already have an appointment at this time') {
        errorMessage = 'У вас уже есть запись на это время.';
      }
      
      runIfMounted(() => setError(errorMessage));
    } finally {
      runIfMounted(() => setBooking(false));
    }
  };

  const cancelBooking = () => {
    setShowConfirmation(false);
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Сегодня';
    if (isTomorrow(date)) return 'Завтра';
    return format(date, 'd MMM', { locale: ru });
  };

  const getMinTimeForToday = () => {
    if (!isToday(selectedDate)) return null;
    const minTime = new Date(Date.now() + 15 * 60000);
    return `${String(minTime.getHours()).padStart(2, '0')}:${String(minTime.getMinutes()).padStart(2, '0')}`;
  };

  if (!master || !service) return null;

  return (
    <div className="calendar-page">
      {/* Успешное сообщение */}
      {successMessage && (
        <div className="success-toast">
          <span className="success-icon">✅</span>
          {successMessage}
        </div>
      )}

      <div className="master-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        <div className="master-info">
          <h2>{master.name}</h2>
          <p className="master-district">📍 {master.district || 'Район не указан'}</p>
          <div className="service-badge">
            <span className="service-icon">💅</span>
            {service.name} — {service.price?.toLocaleString()} ₽
          </div>
          {master.rating && (
            <div className="master-rating">
              {'⭐'.repeat(Math.floor(master.rating))}
              <span className="rating-value">{master.rating}</span>
            </div>
          )}
        </div>
      </div>

      <div className="week-navigation">
        <button
          onClick={handlePrevWeek}
          disabled={weekOffset === 0}
          className={weekOffset === 0 ? 'disabled' : ''}
          aria-label="Предыдущая неделя"
        >
          ←
        </button>
        <button onClick={handleToday} className="today-btn">
          Сегодня
        </button>
        <span className="week-range">
          {format(weekStart, 'd MMM', { locale: ru })} — {format(weekDays[6], 'd MMM', { locale: ru })}
        </span>
        <button onClick={handleNextWeek} aria-label="Следующая неделя">
          →
        </button>
      </div>

      <div className="week-days">
        {weekDays.map(day => {
          const past = isPast(startOfDay(day));
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          
          return (
            <button
              key={day.toISOString()}
              className={`day-cell ${isSelected ? 'active' : ''} ${past ? 'past' : ''} ${isTodayDate ? 'today' : ''}`}
              onClick={() => handleDateSelect(day)}
              disabled={past}
              aria-label={`Выбрать ${format(day, 'd MMMM', { locale: ru })}`}
            >
              <span className="day-name">{format(day, 'EEEEEE', { locale: ru })}</span>
              <span className="day-number">{format(day, 'd')}</span>
              {isTodayDate && <span className="today-badge">сегодня</span>}
            </button>
          );
        })}
      </div>

      <div className="time-slots-section">
        <h3>
          📅 {getDateLabel(selectedDate)}
          {isToday(selectedDate) && (
            <span className="today-hint">Доступно время с {getMinTimeForToday()}</span>
          )}
        </h3>

        {loading ? (
          <div className="loading-container">
            <LoadingSpinner size="medium" text="Загрузка доступного времени..." />
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{error}</p>
            <button onClick={() => loadSlots(selectedDate)} className="retry-btn">
              🔄 Попробовать снова
            </button>
          </div>
        ) : slots.length === 0 ? (
          <div className="no-slots-container">
            <div className="no-slots-icon">📅</div>
            <p className="no-slots">Нет доступных слотов на этот день</p>
            <button onClick={handleNextWeek} className="other-day-btn">
              Посмотреть другие дни →
            </button>
          </div>
        ) : (
          <>
            <div className="slots-grid">
              {slots.map(slot => {
                const isMinTime = isToday(selectedDate) && slot < getMinTimeForToday();
                return (
                  <button
                    key={slot}
                    className={`time-slot ${selectedTime === slot ? 'selected' : ''} ${isMinTime ? 'disabled' : ''}`}
                    onClick={() => !isMinTime && setSelectedTime(slot)}
                    disabled={isMinTime}
                  >
                    {slot}
                    {selectedTime === slot && <span className="checkmark">✓</span>}
                  </button>
                );
              })}
            </div>
            {selectedTime && (
              <div className="selected-info">
                <p>Вы выбрали: <strong>{selectedDate.toLocaleDateString('ru-RU')} в {selectedTime}</strong></p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="booking-footer">
        <div className="price-summary">
          <span>Итого:</span>
          <strong>{service.price?.toLocaleString()} ₽</strong>
        </div>
        <button
          className="confirm-btn"
          disabled={!selectedTime || booking || loading}
          onClick={handleConfirm}
        >
          {booking ? (
            <>
              <span className="spinner-small"></span>
              Записываем...
            </>
          ) : (
            '✅ Записаться'
          )}
        </button>
      </div>

      {/* Модальное окно подтверждения */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={cancelBooking}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">📅</div>
            <h3>Подтверждение записи</h3>
            <div className="booking-details">
              <div className="detail">
                <span className="detail-label">Мастер:</span>
                <span className="detail-value">{master.name}</span>
              </div>
              <div className="detail">
                <span className="detail-label">Услуга:</span>
                <span className="detail-value">{service.name}</span>
              </div>
              <div className="detail">
                <span className="detail-label">Дата:</span>
                <span className="detail-value">{format(selectedDate, 'd MMMM yyyy', { locale: ru })}</span>
              </div>
              <div className="detail">
                <span className="detail-label">Время:</span>
                <span className="detail-value">{selectedTime}</span>
              </div>
              <div className="detail">
                <span className="detail-label">Стоимость:</span>
                <span className="detail-value price">{service.price?.toLocaleString()} ₽</span>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={cancelBooking} className="cancel-btn">
                Отмена
              </button>
              <button onClick={confirmBooking} className="confirm-modal-btn">
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;