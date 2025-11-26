import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { ACCESS_TOKEN } from '../constants';
import { useAuth } from '../context/AuthContext';
import '../styles/RegisterStudent.css';

const RegisterStudent = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [generatedToken, setGeneratedToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1); // 1: Ввод пароля, 2: Показ токена

    // Если проблемы нет (прямой заход), перенаправляем на главную?
    // Или позволяем просто зарегистрироваться.
    const initialProblem = state?.initialProblem || '';

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Пароли не совпадают.");
            return;
        }
        if (password.length < 6) {
            setError("Пароль должен быть не менее 6 символов.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Регистрация
            const regResponse = await api.post('/auth/register-student/', { password });
            const token = regResponse.data.token;
            setGeneratedToken(token);
            setStep(2); // Переход к показу токена
        } catch (err) {
            console.error(err);
            setError("Ошибка регистрации. Попробуйте позже.");
        } finally {
            setLoading(false);
        }
    };

    const handleLoginAndChat = async () => {
        setLoading(true);
        try {
            // 2. Автоматический вход
            const loginResponse = await api.post('/token/', { 
                email: generatedToken, // Входим по токену
                password: password 
            });

            localStorage.setItem(ACCESS_TOKEN, loginResponse.data.access);
            login(); // Обновляем состояние AuthContext

            // 3. Если была проблема, инициализируем чат
            if (initialProblem) {
                // Небольшая задержка, чтобы токен успел сохраниться
                await new Promise(r => setTimeout(r, 500)); 
                try {
                    await api.post('/v1/chats/initiate/', { content: initialProblem });
                } catch (chatErr) {
                    console.error("Не удалось создать чат автоматически:", chatErr);
                    // Не блокируем переход, чат можно создать вручную
                }
            }

            // 4. Редирект на дашборд (чат)
            navigate('/'); 

        } catch (err) {
            console.error(err);
            setError("Аккаунт создан, но не удалось войти автоматически. Попробуйте войти вручную.");
        } finally {
            setLoading(false);
        }
    };

    // --- РЕНДЕРИНГ: ШАГ 1 (ПАРОЛЬ) ---
    if (step === 1) {
        return (
            <div className="register-container">
                <div className="register-card">
                    <h2>Создание анонимного профиля</h2>
                    <p className="reg-desc">
                        Чтобы сохранить переписку и получить ответ от психолога, придумайте пароль. 
                        Мы выдадим вам уникальный код для входа.
                    </p>
                    
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>Придумайте пароль</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••"
                            />
                        </div>
                        <div className="form-group">
                            <label>Повторите пароль</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••"
                            />
                        </div>
                        
                        {error && <p className="error-message">{error}</p>}
                        
                        <button type="submit" className="reg-btn" disabled={loading}>
                            {loading ? 'Создание...' : 'Получить код доступа'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- РЕНДЕРИНГ: ШАГ 2 (ТОКЕН) ---
    return (
        <div className="register-container">
            <div className="register-card success-card">
                <div className="success-icon">✅</div>
                <h2>Ваш профиль создан!</h2>
                <p>Обязательно сохраните или запишите этот код. Он нужен для входа вместо логина.</p>
                
                <div className="token-display">
                    {generatedToken}
                </div>
                
                <p className="warning-text">
                    ⚠️ Если вы потеряете этот код, восстановить доступ к переписке будет невозможно.
                </p>

                <button onClick={handleLoginAndChat} className="reg-btn success-btn" disabled={loading}>
                    {loading ? 'Вход...' : 'Я записал(а), перейти в чат'}
                </button>
            </div>
        </div>
    );
};

export default RegisterStudent;