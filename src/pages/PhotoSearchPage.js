import React from 'react';
import PhotoSearch from '../components/PhotoSearch';
import './PhotoSearchPage.css';

const PhotoSearchPage = () => {
  return (
    <div className="photo-search-page">
      <div className="page-header">
        <h1>📸 Поиск по фото</h1>
        <p>Найдите мастера по фотографии желаемого дизайна ногтей</p>
      </div>
      <PhotoSearch />
    </div>
  );
};

export default PhotoSearchPage;