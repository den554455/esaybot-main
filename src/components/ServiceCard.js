import React from 'react';
import './ServiceCard.css';

const ServiceCard = ({ service, onClick }) => {
  // Функция для получения эмодзи по категории услуги
  const getServiceEmoji = (category) => {
    const emojis = {
      'Маникюр': '💅',
      'Покрытие': '✨',
      'Брови': '👁️',
      'Ресницы': '👀',
      'Депиляция': '✨',
      'default': '💎'
    };
    return emojis[category] || emojis.default;
  };

  // Форматирование цены
  const formatPrice = (price) => {
    return price?.toLocaleString() || '0';
  };

  return (
    <div className="service-card" onClick={onClick}>
      <div className="service-icon">
        {getServiceEmoji(service.category)}
      </div>
      <h3>{service.name}</h3>
      <div className="service-price">
        {formatPrice(service.price)} ₽
      </div>
      {service.duration && (
        <div className="service-duration">
          ⏱️ {service.duration} мин
        </div>
      )}
      {service.description && (
        <div className="service-description">
          {service.description}
        </div>
      )}
    </div>
  );
};

export default ServiceCard;