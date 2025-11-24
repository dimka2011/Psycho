import React from 'react';
import { useAuth } from '../context/AuthContext'; // Используем ваш контекст аутентификации
import StudentChat from '../components/StudentChat';
import PsychologistChatView from '../components/PsychologistChatView';
import '../styles/Chat.css';

const ChatView = () => {
    // Получаем флаг роли
    const { isPsychologist, user } = useAuth();
    
    if (!user) {
        // Если пользователь не аутентифицирован, но пытается попасть в чат
        return <div className="chat-container-page error-state">Для доступа к чату необходимо авторизоваться.</div>;
    }

    // Рендерим нужный интерфейс в зависимости от роли
    return (
        <div className="chat-container-page">
            <h1 className="chat-main-title">
                {isPsychologist ? 'Панель управления чатами' : 'Ваш анонимный чат'}
            </h1>
            
            {isPsychologist ? (
                <PsychologistChatView />
            ) : (
                <StudentChat />
            )}
        </div>
    );
};

export default ChatView;