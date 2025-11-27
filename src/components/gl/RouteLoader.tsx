import React from 'react';
import './RouteLoader.css';

export const RouteLoader: React.FC = () => {
  return (
    <div className="route-loader">
      <div className="loader-ring"></div>
      <div className="dots-container">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
};

