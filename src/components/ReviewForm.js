import React, { useState } from 'react';
import { useToast } from '../components/Toast';
import { reviewsService } from '../services';
import './ReviewForm.css';

const ReviewForm = ({ appointmentId, masterName, onSuccess, onCancel }) => {
  const { success, error: toastError, info } = useToast();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      info('Пожалуйста, поставьте оценку');
      return;
    }

    setLoading(true);
    try {
      await reviewsService.createReview({ appointmentId, rating, text });
      success('Спасибо за отзыв! Он будет опубликован после проверки.');
      if (onSuccess) onSuccess();
    } catch (error) {
      toastError('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form-modal">
      <div className="review-form-content">
        <h3>Оставить отзыв о {masterName}</h3>

        <form onSubmit={handleSubmit}>
          <div className="rating-section">
            <label>Ваша оценка</label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="text-section">
            <label>Ваш отзыв</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите о впечатлениях от визита..."
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Отмена</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;