import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; 
// !!! ВАЖНО: Добавьте импорт useAuth из вашего контекста !!!
import { useAuth } from '../context/AuthContext'; 
import '../styles/Home.css'; 

const Home = () => {
    const [problemText, setProblemText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [foundArticles, setFoundArticles] = useState(null); 
    const navigate = useNavigate();
    
    // Получаем состояние аутентификации
    const { user } = useAuth(); 

    // --- ЛОГИКА РЕДИРЕКТА ПРИ ВХОДЕ ---
    useEffect(() => {
        if (user) {
            navigate('/chat', { replace: true });
        }
    }, [user, navigate]);
    // ----------------------------------

    const goToChatRegistration = () => {
        // Передаем текст проблемы в state, чтобы автоматически создать первое сообщение в чате
        navigate('/register-student', { state: { initialProblem: problemText } });
    };

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!problemText.trim()) return;

        setIsAnalyzing(true);
        setFoundArticles(null);

        try {
            // Запрос к Django EndPoint для семантического поиска
            const response = await api.post('/v1/articles/ai-search/', {
                query: problemText
            });

            setFoundArticles(response.data || []); 

        } catch (error) {
            console.error("Ошибка анализа или связи с бэкендом:", error);
            setFoundArticles([]); 
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Если пользователь аутентифицирован, не рендерим остальную часть, 
    // useEffect уже отправит его на чат. Но на всякий случай, если редирект не успел:
    if (user) {
        return <div className="loading-screen">Перенаправление в чат...</div>;
    }


    return (
        <> 
            <main className="asp-content">
                <div className="intro-section">
                    <h1 className="main-title">Анонимный Школьный Психолог</h1>
                    <p className="sub-title">
                        Твоя проблема останется между нами. <br/>
                        Искусственный интеллект поможет найти ответ в статьях 
                        или соединит с живым специалистом.
                    </p>
                </div>

                <div className="interface-grid">
                    <div className="interface-block input-block">
                        <div className="block-header">
                            <h3>⚡ Опиши ситуацию</h3>
                            <p>Если статьи не помогут, мы подключим психолога.</p>
                        </div>
                        
                        <form onSubmit={handleSearchSubmit} className="asp-form">
                            <textarea 
                                placeholder="Напиши здесь, что случилось (например: 'Я очень устал от учебы')..."
                                value={problemText}
                                onChange={(e) => setProblemText(e.target.value)}
                                disabled={isAnalyzing}
                            />
                            <div className="form-controls">
                                <div className="status-indicator">
                                    <span className="dot"></span> Анонимное соединение
                                </div>
                                <button type="submit" className="action-btn primary" disabled={isAnalyzing || !problemText.trim()}>
                                    {isAnalyzing ? 'Анализ...' : 'Разобраться'}
                                </button>
                            </div>
                        </form>

                        {/* БЛОК РЕЗУЛЬТАТОВ ИИ */}
                        {(isAnalyzing || foundArticles !== null) && (
                            <div className="ai-results-area">
                                {isAnalyzing ? (
                                    <div className="loading-message">
                                        <div className="spinner"></div>
                                        <p>ИИ ищет похожие ситуации...</p>
                                    </div>
                                ) : foundArticles && foundArticles.length > 0 ? (
                                    <>
                                        <h4 className="ai-results-title">Я нашел похожие статьи в базе:</h4>
                                        <div className="found-articles-list">
                                            {foundArticles.map(article => (
                                                <div 
                                                    key={article.id} 
                                                    className="found-article-item"
                                                    onClick={() => navigate(`/articles/${article.id}`)}
                                                >
                                                    <h5>{article.title}</h5>
                                                    <p>{article.excerpt}</p>
                                                    <span>Читать &rarr;</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="ai-divider">Или</div>
                                        {/* КНОПКА 1: Переход на регистрацию с текстом проблемы */}
                                        <button onClick={goToChatRegistration} className="chat-suggest-btn">
                                            Ситуация сложнее? Начать чат с психологом
                                        </button>
                                    </>
                                ) : foundArticles !== null && (
                                    <div className="ai-no-results">
                                        <p>Похожих статей не найдено. Твоя ситуация уникальна.</p>
                                        {/* КНОПКА 2: Переход на регистрацию с текстом проблемы */}
                                        <button onClick={goToChatRegistration} className="chat-suggest-btn primary">
                                            Начать анонимный чат с психологом
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="interface-block library-block" onClick={() => navigate('/articles')}>
                        <div className="block-header">
                            <h3>📖 База знаний</h3>
                            <p>Почитать статьи о том, как справляться с трудностями.</p>
                        </div>
                        
                        <div className="tags-cloud">
                            <span className="tag">Учёба</span>
                            <span className="tag">Стресс</span>
                            <span className="tag">Отношения</span>
                            <span className="tag">Самооценка</span>
                        </div>

                        <button className="action-btn secondary">
                            Открыть все статьи
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Home;