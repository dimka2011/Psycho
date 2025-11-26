import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const LoadingPlaceholder = ({ text }) => (
    <div className="chat-placeholder chat-loading-state">
        <div className="spinner"></div>
        <p>{text}</p>
    </div>
);

const StudentChat = () => {
    const { user } = useAuth();
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true); 
    const [messagesLoading, setMessagesLoading] = useState(false); 
    const [isInitiating, setIsInitiating] = useState(false);
    const messagesEndRef = useRef(null);

    // 1. Загрузка активного чата ученика
    useEffect(() => {
        const fetchActiveChat = async () => {
            setLoading(true); 
            try {
                const response = await api.get('/v1/chats/');
                if (response.data && response.data.length > 0) {
                    setChatId(response.data[0].id);
                }
            } catch (err) {
                console.error("Ошибка загрузки активного чата:", err);
            } finally {
                setLoading(false); 
            }
        };
        fetchActiveChat();
    }, []);

    // 2. Загрузка сообщений (при наличии chatId)
    useEffect(() => {
        if (!chatId) return;

        const fetchMessages = async () => {
            setMessagesLoading(true); 
            try {
                const response = await api.get(`/v1/chats/${chatId}/messages/`);
                setMessages(response.data);
            } catch (err) {
                console.error("Ошибка загрузки сообщений:", err);
            } finally {
                setMessagesLoading(false); 
            }
        };

        fetchMessages();
        // Устанавливаем опрос (polling) для обновления сообщений на 60 секунд
        const intervalId = setInterval(fetchMessages, 60000); 

        return () => clearInterval(intervalId);
    }, [chatId]);
    
    // Прокрутка вниз при получении новых сообщений
    useEffect(() => {
        // ⬅️ ИСПРАВЛЕНИЕ ПРОКРУТКИ: Используем block: 'end', чтобы прокручивался только контейнер сообщений
        messagesEndRef.current?.scrollIntoView({ 
            behavior: "smooth", 
            block: 'end' 
        });
    }, [messages]);


    // 3. Отправка первого сообщения (Инициализация чата)
    const handleInitiateChat = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsInitiating(true);
        try {
            const response = await api.post('/v1/chats/initiate/', { content });
            
            setChatId(response.data.id);
            
            setMessages([{ 
                id: 1, 
                chat: response.data.id, 
                sender_id: user.id,
                content: content, 
                timestamp: new Date().toISOString()
            }]);
            setContent('');
        } catch (err) {
            alert(err.response?.data?.detail || "Ошибка при инициализации чата.");
            console.error(err);
        } finally {
            setIsInitiating(false);
        }
    };
    
    // 4. Отправка последующих сообщений
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!content.trim() || !chatId) return;

        const messageContent = content;
        setContent(''); 

        // Оптимистичное обновление
        const tempMessage = {
            id: Date.now(),
            sender_id: user.id,
            content: messageContent,
            timestamp: new Date().toISOString(),
            is_sending: true,
        };
        setMessages(prev => [...prev, tempMessage]);
        
        try {
            await api.post(`/v1/chats/${chatId}/send_message/`, { content: messageContent });
        } catch (err) {
            alert("Не удалось отправить сообщение.");
            console.error(err);
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id)); 
        }
    };


    // --- РЕНДЕРИНГ: ЗАГРУЗКА ---
    if (loading) {
        return <LoadingPlaceholder text="Проверка наличия активного чата..." />;
    }

    // --- РЕНДЕРИНГ: ИНИЦИАЛИЗАЦИЯ ---
    if (!chatId) {
        return (
            <div className="initiate-chat-form">
                <h2>Напишите свою проблему анонимно</h2>
                <p>Мы найдем для вас психолога, который ответит в ближайшее время. Ваша проблема будет первым сообщением в чате.</p>
                
                <form onSubmit={handleInitiateChat}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Опишите вашу проблему..."
                        rows="8" 
                        required
                        disabled={isInitiating}
                    />
                    <button type="submit" disabled={!content.trim() || isInitiating}>
                        {isInitiating ? 'Инициализация...' : 'Отправить и начать чат'}
                    </button>
                </form>
            </div>
        );
    }

    // --- РЕНДЕРИНГ: АКТИВНЫЙ ЧАТ ---
    return (
        <div className="chat-window">
            <div className="chat-header">
                <h3>Диалог с психологом</h3>
                <p>Чат #{chatId}. Ответы приходят не мгновенно. Мы заботимся о вашей анонимности.</p>
            </div>

            <div className="messages-list">
                {messagesLoading && messages.length === 0 && (
                    <LoadingPlaceholder text="Загрузка сообщений..." />
                )}
                
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        // ⬅️ Используем двойное равно для сравнения ID
                        className={`message-bubble ${msg.sender_id == user.id ? 'sent' : 'received'}`}
                    >
                        <span className="message-time">
                            **{msg.sender_id == user.id ? 'Вы' : 'Психолог'}** - {new Date(msg.timestamp).toLocaleTimeString()}
                            {msg.is_sending && ' (отправка...)'}
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
                    placeholder="Напишите ответ..."
                    rows="2" // Внешняя высота теперь задается через CSS min-height
                    required
                />
                <button type="submit" disabled={!content.trim()}>
                    Отправить
                </button>
            </form>
        </div>
    );
};

export default StudentChat;