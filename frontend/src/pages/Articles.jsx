import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // API-клиент для взаимодействия с бэкендом
import '../styles/Articles.css';

const Articles = () => {
    // Состояния для хранения данных и управления интерфейсом
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTag, setActiveTag] = useState('Все');
    const navigate = useNavigate();

    // 1. Загрузка данных с бэкенда при монтировании компонента
    useEffect(() => {
        const fetchArticles = async () => {
            try {
                // Запрос к DRF: GET /api/v1/articles/
                const response = await api.get('/v1/articles/');
                
                let receivedData = response.data;

                // Защита №1: Обработка стандартной пагинации Django Rest Framework
                // Если DRF возвращает paginated response, список статей находится в 'results'.
                if (receivedData && receivedData.results && Array.isArray(receivedData.results)) {
                    receivedData = receivedData.results;
                }
                
                // Защита №2: Гарантируем, что полученные данные - это массив.
                if (!Array.isArray(receivedData)) {
                    console.error("API вернул данные в неверном формате:", receivedData);
                    // Устанавливаем пустой массив, чтобы избежать ошибки filter
                    receivedData = []; 
                }

                setArticles(receivedData);
                setError(null);
            } catch (err) {
                console.error("Ошибка при получении статей:", err);
                setError("Не удалось загрузить статьи. Проверьте подключение к API или наличие данных.");
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []); 

    // 2. Логика фильтрации и поиска
    // Используем (articles || []) для гарантированной работы метода .filter()
    const filteredArticles = (articles || []).filter(article => { 
        // Поиск по заголовку и краткому описанию
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Фильтрация по тегам (теги приходят как массив строк)
        // Проверяем, содержит ли массив тегов статьи активный тег
        const matchesTag = activeTag === 'Все' || article.tags.includes(activeTag);
        
        return matchesSearch && matchesTag;
    });

    // Список всех уникальных тегов для кнопок фильтра
    // Если articles еще не загрузился, используем пустой массив (|| [])
    const allTags = ['Все', ...new Set((articles || []).flatMap(a => a.tags))];
    
    // --- Условный рендеринг состояний ---

    if (loading) {
        return (
            <div className="articles-page loading-state">
                <h1 className="page-title">Загрузка...</h1>
                <p className="page-subtitle">Ищем полезные материалы в базе знаний ASP.</p>
            </div>
        );
    }

    if (error) {
         return (
            <div className="articles-page error-state">
                <h1 className="page-title">Ошибка загрузки</h1>
                <p className="page-subtitle">{error}</p>
                <button onClick={() => window.location.reload()} className="return-btn">
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="articles-page">
            {/* Блок поиска и фильтров */}
            <section className="articles-header">
                <h1 className="page-title">База знаний</h1>
                <p className="page-subtitle">
                    Материалы, проверенные специалистами. Найди ответ на свой вопрос.
                </p>
                
                <div className="search-container">
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Поиск по статьям (например: тревога)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                </div>

                {/* Рендерим теги только если они есть (больше одного, т.к. "Все" всегда присутствует) */}
                {allTags.length > 1 && (
                    <div className="tags-filter">
                        {allTags.map(tag => (
                            <button 
                                key={tag} 
                                className={`filter-tag ${activeTag === tag ? 'active' : ''}`}
                                onClick={() => setActiveTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Сетка статей */}
            <section className="articles-grid">
                {filteredArticles.length > 0 ? (
                    filteredArticles.map(article => (
                        <article 
                            key={article.id} 
                            className="article-card"
                            // Временно ведем на заглушку, в будущем здесь будет компонент ArticleDetail
                            onClick={() => navigate(`/articles/${article.id}`)} 
                        >
                            {/* Используем общий класс для верхней полоски */}
                            <div className="card-top-line category-default"></div> 
                            <div className="card-body">
                                <div className="card-meta">
                                    {/* read_time приходит уже форматированным с бэкенда */}
                                    <span className="read-time">⏱ {article.read_time}</span> 
                                    <div className="card-tags">
                                        {article.tags.map(tag => <span key={tag}>#{tag}</span>)}
                                    </div>
                                </div>
                                <h2 className="card-title">{article.title}</h2>
                                <p className="card-excerpt">{article.excerpt}</p>
                                <button className="read-more-link">Читать далее &rarr;</button>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="no-results">
                        <h3>{articles.length === 0 ? "Статьи еще не добавлены в базу" : "Ничего не найдено по вашему запросу"}</h3>
                        {articles.length > 0 && <p>Попробуйте изменить запрос или сбросить фильтр тегов.</p>}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Articles;