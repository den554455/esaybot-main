import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { masterScheduleService } from '../services';
import './MasterSchedulePage.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { errorHandler } from '../utils/errorHandler';

const DAYS = [
  { id: 0, name: 'Понедельник', short: 'ПН' },
  { id: 1, name: 'Вторник', short: 'ВТ' },
  { id: 2, name: 'Среда', short: 'СР' },
  { id: 3, name: 'Четверг', short: 'ЧТ' },
  { id: 4, name: 'Пятница', short: 'ПТ' },
  { id: 5, name: 'Суббота', short: 'СБ' },
  { id: 6, name: 'Воскресенье', short: 'ВС' }
];

const MasterSchedulePage = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [schedule, setSchedule] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newException, setNewException] = useState({ date: '', is_working: false, reason: '' });
  const { runIfMounted } = useSafeAsync();

  useEffect(() => {
    loadSchedule();
    loadExceptions();
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await masterScheduleService.getSchedule();
      if (response.success) {
        const existing = response.schedule || [];
        const fullSchedule = DAYS.map(day => {
          const existingDay = existing.find(s => s.day_of_week === day.id);
          return existingDay || {
            day_of_week: day.id,
            start_time: '09:00',
            end_time: '21:00',
            slot_duration: 60,
            break_start: '',
            break_end: '',
            is_working: day.id < 5
          };
        });
        runIfMounted(() => setSchedule(fullSchedule));
      }
    } catch (error) {
      errorHandler.log(error, 'MasterSchedulePage: Error loading schedule');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  };

  const loadExceptions = async () => {
    try {
      const response = await masterScheduleService.getExceptions();
      if (response.success) {
        runIfMounted(() => setExceptions(response.exceptions || []));
      }
    } catch (error) {
      errorHandler.log(error, 'MasterSchedulePage: Error loading exceptions');
    }
  };

  const handleScheduleChange = (dayIndex, field, value) => {
    const updated = [...schedule];
    updated[dayIndex][field] = value;
    setSchedule(updated);
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      await masterScheduleService.saveSchedule(schedule);
      success('Расписание сохранено!');
    } catch (error) {
      toastError('Ошибка сохранения: ' + error.message);
    } finally {
      runIfMounted(() => setSaving(false));
    }
  };

  const handleAddException = async () => {
    if (!newException.date) {
      info('Выберите дату');
      return;
    }
    try {
      await masterScheduleService.addException(newException);
      runIfMounted(() => setNewException({ date: '', is_working: false, reason: '' }));
      loadExceptions();
      success('Исключение добавлено');
    } catch (error) {
      toastError('Ошибка: ' + error.message);
    }
  };

  const handleRemoveException = async (date) => {
    try {
      await masterScheduleService.removeException(date);
      loadExceptions();
      success('Исключение удалено');
    } catch (error) {
      toastError('Ошибка: ' + error.message);
    }
  };

  if (loading) return <div className="loading">Загрузка расписания...</div>;

  return (
    <div className="schedule-page">
      <h1>Моё расписание</h1>

      <div className="schedule-table">
        <div className="schedule-header">
          <div>День</div>
          <div>Работает</div>
          <div>Начало</div>
          <div>Конец</div>
          <div>Перерыв</div>
          <div>Длительность слота</div>
        </div>

        {schedule.map((day, idx) => (
          <div key={day.day_of_week} className="schedule-row">
            <div className="day-name">{DAYS[day.day_of_week]?.name}</div>
            <div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={day.is_working}
                  onChange={(e) => handleScheduleChange(idx, 'is_working', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div>
              <input type="time" value={day.start_time} onChange={(e) => handleScheduleChange(idx, 'start_time', e.target.value)} disabled={!day.is_working} />
            </div>
            <div>
              <input type="time" value={day.end_time} onChange={(e) => handleScheduleChange(idx, 'end_time', e.target.value)} disabled={!day.is_working} />
            </div>
            <div className="break-inputs">
              <input type="time" placeholder="Начало" value={day.break_start || ''} onChange={(e) => handleScheduleChange(idx, 'break_start', e.target.value)} disabled={!day.is_working} />
              <span>-</span>
              <input type="time" placeholder="Конец" value={day.break_end || ''} onChange={(e) => handleScheduleChange(idx, 'break_end', e.target.value)} disabled={!day.is_working} />
            </div>
            <div>
              <select value={day.slot_duration} onChange={(e) => handleScheduleChange(idx, 'slot_duration', parseInt(e.target.value))} disabled={!day.is_working}>
                <option value="30">30 минут</option>
                <option value="45">45 минут</option>
                <option value="60">60 минут</option>
                <option value="90">90 минут</option>
                <option value="120">120 минут</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <button className="save-btn" onClick={handleSaveSchedule} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить расписание'}
      </button>

      <div className="exceptions-section">
        <h2>Исключения (отпуск, выходные)</h2>

        <div className="add-exception">
          <input
            type="date"
            value={newException.date}
            onChange={(e) => setNewException({ ...newException, date: e.target.value })}
          />
          <select
            value={newException.is_working ? 'working' : 'dayoff'}
            onChange={(e) => setNewException({ ...newException, is_working: e.target.value === 'working' })}
          >
            <option value="dayoff">Выходной / Отпуск</option>
            <option value="working">Особое расписание</option>
          </select>
          {newException.is_working && (
            <>
              <input type="time" placeholder="Начало" onChange={(e) => setNewException({ ...newException, start_time: e.target.value })} />
              <input type="time" placeholder="Конец" onChange={(e) => setNewException({ ...newException, end_time: e.target.value })} />
            </>
          )}
          <input
            type="text"
            placeholder="Причина (опционально)"
            value={newException.reason}
            onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
          />
          <button onClick={handleAddException}>Добавить</button>
        </div>

        <div className="exceptions-list">
          {exceptions.map(exp => (
            <div key={exp.exception_date} className="exception-item">
              <span>{exp.exception_date}</span>
              <span>{exp.is_working ? `Работает: ${exp.start_time}-${exp.end_time}` : 'Выходной'}</span>
              {exp.reason && <span>{exp.reason}</span>}
              <button onClick={() => handleRemoveException(exp.exception_date)}>❌</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MasterSchedulePage;