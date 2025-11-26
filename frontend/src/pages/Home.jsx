import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/Home.css'; 

const Home = () => {
    const [problemText, setProblemText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Состояние для результатов поиска
    const [foundArticles, setFoundArticles] = useState(null); 
    const navigate = useNavigate();

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!problemText.trim()) return;

        setIsAnalyzing(true);
        setFoundArticles(null); // Сбрасываем старые результаты

        try {
            // 1. Отправляем запрос к ИИ
            // Используем /v1/articles/ai-search/ (проверьте ваш префикс в api.js)
            const response = await api.post('/v1/articles/ai-search/', {
                query: problemText
            });

            // 2. Если статьи найдены
            if (response.data && response.data.length > 0) {
                setFoundArticles(response.data);
            } else {
                // 3. Если ничего не найдено - предлагаем чат (пустой массив)
                setFoundArticles([]); 
            }

        } catch (error) {
            console.error("Ошибка анализа:", error);
            // В случае ошибки можно показать пустой результат или сообщение
            setFoundArticles([]); 
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Функция для перехода к регистрации в чат
    const goToChatRegistration = () => {
        // Сюда можно передать текст проблемы через state, чтобы не вводить заново
        navigate('/register-student', { state: { initialProblem: problemText } });
    };

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
                                <button type="submit" className="action-btn primary" disabled={isAnalyzing}>
                                    {isAnalyzing ? 'Анализ...' : 'Разобраться'}
                                </button>
                            </div>
                        </form>

                        {/* БЛОК РЕЗУЛЬТАТОВ ИИ */}
                        {foundArticles !== null && (
                            <div className="ai-results-area">
                                {foundArticles.length > 0 ? (
                                    <>
                                        <h4 className="ai-results-title">Я нашел похожие ситуации в базе:</h4>
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
                                        <div className="ai-divider">или</div>
                                        <button onClick={goToChatRegistration} className="chat-suggest-btn">
                                            Ситуация сложнее? Написать психологу
                                        </button>
                                    </>
                                ) : (
                                    <div className="ai-no-results">
                                        <p>Похожих статей не найдено.</p>
                                        <button onClick={goToChatRegistration} className="chat-suggest-btn primary">
                                            Начать анонимный чат с психологом
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    <div className="interface-block library-block" onClick={() => navigate('/articles')}>
                        {/* ... (правая колонка без изменений) ... */}
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