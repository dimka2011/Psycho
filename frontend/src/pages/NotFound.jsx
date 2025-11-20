import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="error-content">
                <h1 className="error-code">404</h1>
                <div className="error-message">
                    <h2>Сигнал потерян</h2>
                    <p>Запрашиваемая страница не существует или доступ к ней ограничен системой.</p>
                </div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="return-btn"
                >
                    Вернуться назад
                </button>
            </div>
        </div>
    );
};

export default NotFound;