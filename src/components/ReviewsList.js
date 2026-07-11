import React, { useState, useEffect, useRef } from 'react';
import { reviewsService } from '../services';
import './ReviewsList.css';
import useSafeAsync from '../hooks/useSafeAsync';
import { sanitizeImageSrc } from '../utils/sanitize';
import { errorHandler } from '../utils/errorHandler';

const ReviewsList = ({ masterId, compact = false }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = compact ? 3 : 10;
  const { runIfMounted } = useSafeAsync();
  const reviewPhotosCache = useRef(new Map());

  useEffect(() => {
    loadReviews();
  }, [masterId, offset]);

  const loadReviews = async () => {
    runIfMounted(() => setLoading(true));
    try {
      const data = await reviewsService.getReviews({ masterId, limit, offset });
      if (data.success) {
        if (offset === 0) {
          runIfMounted(() => setReviews(data.reviews));
        } else {
          runIfMounted(() => setReviews(prev => [...prev, ...data.reviews]));
        }
        runIfMounted(() => setTotal(data.total));
      }
    } catch (error) {
      errorHandler.log(error, 'ReviewsList: Error loading reviews');
    } finally {
      runIfMounted(() => setLoading(false));
    }
  };

  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading && reviews.length === 0) {
    return <div className="reviews-loading">Загрузка отзывов...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-empty">
        <p>Пока нет отзывов</p>
        <p className="hint">Будьте первым, кто оставит отзыв!</p>
      </div>
    );
  }

  return (
    <div className="reviews-list">
      <div className="reviews-header">
        <h3>Отзывы клиентов</h3>
        <span className="reviews-count">{total} {getDeclension(total, 'отзыв', 'отзыва', 'отзывов')}</span>
      </div>
      
      {reviews.map(review => (
        <div key={review.id} className="review-card">
          <div className="review-header">
            <div className="reviewer-info">
              <div className="reviewer-avatar">
                {review.avatar_url ? (
                  <img src={sanitizeImageSrc(review.avatar_url) || '/default-avatar.svg'} alt={review.first_name} />
                ) : (
                  <div className="avatar-placeholder">
                    {review.first_name?.[0]}{review.last_name?.[0]}
                  </div>
                )}
              </div>
              <div className="reviewer-details">
                <div className="reviewer-name">
                  {review.first_name} {review.last_name}
                </div>
                <div className="review-rating">
                  {'⭐'.repeat(Math.max(0, Math.floor(review.rating || 0)))}
                  <span className="rating-value">{review.rating}.0</span>
                </div>
                <div className="review-date">{formatDate(review.created_at)}</div>
              </div>
            </div>
          </div>
          
          {review.text && (
            <div className="review-text">{review.text}</div>
          )}
          
          {review.photos && (() => {
            if (!reviewPhotosCache.current.has(review.id)) {
              try {
                reviewPhotosCache.current.set(review.id, JSON.parse(review.photos));
              } catch {
                reviewPhotosCache.current.set(review.id, []);
              }
            }
            const reviewPhotos = reviewPhotosCache.current.get(review.id) || [];
            return reviewPhotos.length > 0 && (
              <div className="review-photos">
                {reviewPhotos.map((photo, idx) => (
                  <img key={idx} src={sanitizeImageSrc(photo) || '/default-avatar.svg'} alt="Фото к отзыву" />
                ))}
              </div>
            );
          })()}
          
          {review.master_response && (
            <div className="master-response">
              <div className="response-header">
                <span>👩‍🎨 Ответ мастера</span>
              </div>
              <div className="response-text">{review.master_response}</div>
              <div className="response-date">
                {formatDate(review.responded_at)}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {!compact && reviews.length < total && (
        <button className="load-more-btn" onClick={loadMore} disabled={loading}>
          {loading ? 'Загрузка...' : 'Загрузить ещё'}
        </button>
      )}
    </div>
  );
};

const getDeclension = (number, one, two, five) => {
  const n = Math.abs(number) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return five;
  if (n1 > 1 && n1 < 5) return two;
  if (n1 === 1) return one;
  return five;
};

export default ReviewsList;