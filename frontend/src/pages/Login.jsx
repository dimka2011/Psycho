import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ACCESS_TOKEN } from '../constants'; 
import { useAuth } from '../context/AuthContext'; // ⬅️ Импорт useAuth
import '../styles/Login.css';

const Login = () => {
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


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post("/token/", { 
                email: username, 
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
                
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ПЕРЕНАПРАВЛЯЕМ ПОЛЬЗОВАТЕЛЯ
                // После обновления состояния мы командуем браузеру перейти на корень.
                // Дальше AppRoutes подхватит user=true и перенаправит на Home или Dashboard.
                navigate('/', { replace: true }); 
                
            } else {
                setError("Не удалось получить токен доступа.");
            }

        } catch (err) {
            // ... (обработка ошибок) ...
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
                        {/* Название поля 'username' здесь - это просто метка, не ключ запроса */}
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
            </div>
        </div>
    );
};

export default Login;