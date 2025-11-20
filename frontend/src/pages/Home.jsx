import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css'; 

const Home = () => {
    const [problemText, setProblemText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const navigate = useNavigate();

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!problemText.trim()) return;
        setIsAnalyzing(true);
        // ... логика ...
        setTimeout(() => { setIsAnalyzing(false); alert('Анализ...'); }, 1500);
    };

    return (
        // Убрали asp-container, так как layout теперь в App.jsx
        // Можно оставить просто div или фрагмент
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
                                placeholder="Напиши здесь, что случилось..."
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
            
            {/* FOOTER УДАЛЕН ОТСЮДА */}
        </>
    );
};

export default Home;