import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const LoadingPlaceholder = ({ text }) => (
    <div className="chat-placeholder chat-loading-state">
        <div className="spinner"></div>
        <p>{text}</p>
    </div>
);

const PsychologistChatView = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [loadingChats, setLoadingChats] = useState(true); 
    const [loadingMessages, setLoadingMessages] = useState(false); 
    const messagesEndRef = useRef(null);

    // 1. Загрузка списка чатов психолога
    const fetchChats = async () => {
        setLoadingChats(true); 
        try {
            const response = await api.get('/v1/chats/');
            setChats(response.data);
            
            if (selectedChatId && !response.data.some(chat => chat.id === selectedChatId)) {
                setSelectedChatId(null);
            }
            
        } catch (err) {
            console.error("Ошибка загрузки списка чатов:", err);
        } finally {
            setLoadingChats(false); 
        }
    };
    
    useEffect(() => {
        fetchChats();
        const intervalId = setInterval(fetchChats, 60000); 
        return () => clearInterval(intervalId);
    }, [selectedChatId]); 

    // 2. Загрузка сообщений выбранного чата
    useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setLoadingMessages(true); 
            try {
                const response = await api.get(`/v1/chats/${selectedChatId}/messages/`);
                setMessages(response.data);
            } catch (err) {
                console.error("Ошибка загрузки сообщений:", err);
            } finally {
                setLoadingMessages(false); 
            }
        };

        fetchMessages();
        const intervalId = setInterval(fetchMessages, 60000); 

        return () => clearInterval(intervalId);
    }, [selectedChatId]);
    
    // Прокрутка вниз
    useEffect(() => {
        // ⬅️ ИСПРАВЛЕНИЕ ПРОКРУТКИ: Используем block: 'end', чтобы прокручивался только контейнер сообщений
        messagesEndRef.current?.scrollIntoView({ 
            behavior: "smooth",
            block: 'end' 
        });
    }, [messages]);


    // 3. Отправка сообщения
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!content.trim() || !selectedChatId) return;

        const messageContent = content;
        setContent(''); 

        const tempMessage = {
            id: Date.now(),
            sender_id: user.id,
            content: messageContent,
            timestamp: new Date().toISOString(),
            is_sending: true,
        };
        setMessages(prev => [...prev, tempMessage]);
        
        try {
            await api.post(`/v1/chats/${selectedChatId}/send_message/`, { content: messageContent });
        } catch (err) {
            alert("Не удалось отправить сообщение.");
            console.error(err);
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id)); 
        }
    };

    // --- РЕНДЕРИНГ ---
    return (
        <div className="psychologist-chat-view">
            <div className="chat-list-panel">
                <h2>Ваши диалоги ({chats.length})</h2>
                
                {loadingChats ? (
                    <LoadingPlaceholder text="Загрузка списка чатов..." />
                ) : chats.length === 0 ? (
                    <p className="chat-placeholder">Нет активных чатов.</p>
                ) : (
                    chats.map(chat => (
                        <div 
                            key={chat.id} 
                            className={`chat-list-item ${chat.id === selectedChatId ? 'active' : ''}`}
                            onClick={() => setSelectedChatId(chat.id)}
                        >
                            <h4>Чат #{chat.id} - Ученик ({chat.student_token})</h4>
                            <p className="last-message">
                                {chat.last_message ? `${new Date(chat.last_message.timestamp).toLocaleTimeString()}: ${chat.last_message.content}` : 'Нет сообщений'}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <div className="chat-detail-panel">
                {!selectedChatId ? (
                    <div className="chat-placeholder">Выберите чат слева, чтобы начать общение.</div>
                ) : (
                    <div className="chat-window">
                        <div className="messages-list">
                             {loadingMessages && messages.length === 0 && (
                                <LoadingPlaceholder text="Загрузка сообщений..." />
                            )}

                            {messages.map((msg) => (
                                <div 
                                    key={msg.id} 
                                    // ⬅️ Используем двойное равно для сравнения ID
                                    className={`message-bubble ${msg.sender_id == user.id ? 'sent' : 'received'}`}
                                >
                                    <span className="message-time">
                                        **{msg.sender_id == user.id ? 'Вы' : 'Ученик'}** - {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                    <p>{msg.content}</p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="message-input-form">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Напишите ответ ученику..."
                                rows="3" // Внешняя высота теперь задается через CSS min-height
                                required
                                disabled={loadingMessages}
                            />
                            <button type="submit" disabled={!content.trim() || loadingMessages}>
                                Ответить
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PsychologistChatView;