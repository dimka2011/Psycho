import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ACCESS_TOKEN } from '../constants'; 
import { useAuth } from '../context/AuthContext'; // ⬅️ Импорт useAuth
import '../styles/Login.css';

const Login = () => {
    // Внимание: для учеников здесь нужно вводить КОД, который на бэкенде преобразуется в email
    const [username, setUsername] = useState(''); 
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { login, user } = useAuth(); // ⬅️ Получаем login и user из контекста

    // Дополнительная проверка: Если пользователь уже залогинен, перенаправляем его
    useEffect(() => {
        if (user) {
            // Если user есть, переходим на корень, а AppRoutes сам решит, куда редиректить (Home или Dashboard)
            navigate('/', { replace: true }); 
        }
    }, [user, navigate]);
    
    // Функция для перенаправления на страницу регистрации ученика
    const goToChatRegistration = () => {
        navigate('/register-student');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            // Здесь мы предполагаем, что бэкенд обрабатывает ввод КОДА (для учеников) или EMAIL (для психологов)
            const response = await api.post("/token/", { 
                email: username, // Передаем то, что ввел пользователь. Бэкенд должен преобразовать КОД в email@student.asp
                password: password,
            }, { 
                headers: {
                    Authorization: ''
                }
            });

            const accessToken = response.data.access;
            if (accessToken) {
                localStorage.setItem(ACCESS_TOKEN, accessToken);
                login(); // Обновляет глобальное состояние AuthContext
                
                // Перенаправляем пользователя на корень, чтобы он попал в чат
                navigate('/', { replace: true }); 
                
            } else {
                setError("Не удалось получить токен доступа.");
            }

        } catch (err) {
            console.error("Ошибка входа:", err);
            if (err.response && err.response.status === 401) {
                setError("Неверные учетные данные. Проверьте ваш email/код и пароль.");
            } else {
                setError("Произошла ошибка при подключении к серверу.");
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Если user уже залогинен, мы ничего не рендерим (пока происходит редирект)
    if (user) {
        return null; 
    }
    
    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">Вход в систему ASP</h1>
                <p className="login-subtitle">Доступ для психологов (Email) и учеников (Код).</p>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Email или Код (токен):</label> 
                        <input
                            type="text" 
                            id="username"
                            placeholder="Введите email или уникальный код"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label htmlFor="password">Пароль:</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Введите пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}
                    
                    <button 
                        type="submit" 
                        className="login-btn primary"
                        disabled={loading}
                    >
                        {loading ? 'Проверка данных...' : 'Войти'}
                    </button>
                </form>
                
                {/* НОВЫЙ БЛОК ДЛЯ РЕГИСТРАЦИИ */}
                <div className="registration-prompt">
                    <p>Ты школьник и впервые здесь?</p>
                    <button 
                        onClick={goToChatRegistration} 
                        className="register-link-btn"
                        disabled={loading}
                    >
                        Получить анонимный код доступа
                    </button>
                </div>
                
            </div>
        </div>
    );
};

export default Login;