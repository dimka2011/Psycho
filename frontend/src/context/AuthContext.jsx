import { createContext, useState, useEffect, useContext } from 'react';
// ИСПРАВЛЕНО: Используем именованный импорт { jwtDecode } вместо дефолтного
import { jwtDecode } from 'jwt-decode'; 
import { ACCESS_TOKEN } from '../constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);

    const checkAuthStatus = () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            try {
                // Используем исправленную функцию импорта
                const decoded = jwtDecode(token);
                
                // Проверяем, что токен не истек
                const currentTime = Date.now() / 1000;
                if (decoded.exp > currentTime) {
                    // Устанавливаем пользователя и роль
                    setUser({
                        email: decoded.email, 
                        is_psychologist: decoded.is_psychologist || false,
                    });
                } else {
                    // Токен истек
                    logout(); 
                }
            } catch (error) {
                // Ошибка декодирования (неверный токен)
                console.error("Token decoding failed:", error);
                logout();
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    const login = () => {
        // Просто запускаем проверку статуса после успешного входа
        checkAuthStatus();
    };

    const logout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        setUser(null);
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isPsychologist: user?.is_psychologist }}>
            {/* Не рендерим детей, пока не проверен статус аутентификации */}
            {!loading && children} 
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);