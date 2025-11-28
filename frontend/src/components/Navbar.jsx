import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import { useAuth } from '../context/AuthContext';
const Navbar = () => {
    const { user, isPsychologist, logout } = useAuth();
    const navigate = useNavigate();

    // Функция, вызываемая при нажатии "Выход"
    const handleLogout = () => {
        logout(); // Удаляем токен и очищаем состояние user
        navigate('/login'); // Перенаправляем на страницу входа
    };

    return (
        <header className="asp-navbar">
            <div className="logo-wrapper" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
                <span className="logo-acronym">ASP</span>
                <span className="logo-full">Anonymous School Psychologist</span>
            </div>
            <div className="nav-links">
            {isPsychologist && (
                    <>
                        <Link to="/articles" className="nav-link">Статьи</Link>
                        <Link to="/dashboard" className="nav-link">Чаты</Link>
                        <Link to="/articles/new" className="nav-link">Создать статью</Link>

                    </>
                )}
            {!isPsychologist && (
                    <>
                        <Link to="/articles" className="nav-link">Статьи</Link>
                        <Link to="/chat" className="nav-link">Чат с психологом</Link>

                    </>
                )}
                
                {/* Условная кнопка входа/выхода */}
                {user ? (
                    // Если пользователь залогинен, показываем кнопку "Выход"
                    <button onClick={handleLogout} className="nav-btn logout-btn">
                        Выход
                    </button>
                ) : (
                    // Если не залогинен, показываем кнопку "Вход"
                    <Link to="/login" className="nav-btn login-btn">
                        Вход
                    </Link>
                )}
            </div>
        </header>
    );
};

export default Navbar;