import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api'; 
import { useAuth } from '../context/AuthContext';
import '../styles/ArticleDetail.css';

const ArticleDetail = () => {
    const { articleId } = useParams();
    const navigate = useNavigate();
    const { isPsychologist } = useAuth(); 

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!articleId) {
            setLoading(false);
            setError("Неверный ID статьи.");
            return;
        }

        const fetchArticle = async () => {
            try {
                const response = await api.get(`/v1/articles/${articleId}/`); 
                
                if (response.data) {
                    setArticle(response.data);
                } else {
                    setError("Статья не найдена.");
                }
            } catch (err) {
                console.error("Ошибка при получении статьи:", err);
                if (err.response && err.response.status === 404) {
                    setError("Статья с таким ID не найдена.");
                } else {
                    setError("Не удалось загрузить статью. Проверьте соединение.");
                }
            } finally {
                setLoading(false);
            }
        };
        console.log(error)
        fetchArticle();
    }, [articleId]); 

    // Функция для перехода в режим редактирования
    const handleEditClick = () => {
        navigate(`/articles/${articleId}/edit`);
    };

    // 🗑️ НОВАЯ ФУНКЦИЯ: Удаление статьи
    const handleDeleteClick = async () => {
        // Обязательное подтверждение от пользователя
        if (!window.confirm('Вы уверены, что хотите безвозвратно удалить эту статью?')) {
            return;
        }

        try {
            // Отправка DELETE-запроса на бэкенд
            await api.delete(`/v1/articles/${articleId}/`);
            
            alert('Статья успешно удалена.');
            
            // Перенаправление на список статей или главную страницу
            navigate('/articles'); 

        } catch (err) {
            console.error("Ошибка при удалении статьи:", err);
            // Обработка ошибок, например, нет прав
            alert('Не удалось удалить статью. Проверьте права доступа.');
        }
    };


    if (loading) {
        return (
            <div className="article-detail-page loading-state">
                <p>Загружаем полный текст статьи...</p>
            </div>
        );
    }
    if (error || !article) {
        return (
            <div className="article-detail-page error-state">
                <h1>{error ? 'Ошибка' : 'Статья не найдена'}</h1>
                <p>{error || 'Запрашиваемый материал отсутствует в базе.'}</p>
                <button onClick={() => navigate('/articles')} className="back-to-list-btn">
                    К списку статей
                </button>
            </div>
        );
    }

    // --- Основной рендеринг ---
    return (
        <div className="article-detail-page">
            <main className="article-content-wrapper">
                
                <div className="article-actions">
                    <button onClick={() => navigate(-1)} className="back-btn">&larr; Назад</button>
                    
                    {/* Кнопки "Редактировать" и "Удалить" ТОЛЬКО для психолога */}
                    {isPsychologist && (
                        <div className="admin-actions">
                            <button onClick={handleEditClick} className="edit-article-btn">
                                📝 Редактировать
                            </button>
                            {/* ⬅️ КНОПКА УДАЛЕНИЯ */}
                            <button onClick={handleDeleteClick} className="delete-article-btn">
                                🗑️ Удалить
                            </button>
                        </div>
                    )}
                </div>
                <h1 className="article-title">{article.title}</h1>
                <p className="article-excerpt">{article.excerpt}</p>
                
                <div className="article-meta-bar">
                    <span className="meta-time">⏱ Время чтения: {article.read_time}</span>
                    <div className="meta-tags">
                        {article.tags.map(tag => (
                            <span key={tag} className="meta-tag">#{tag}</span>
                        ))}
                    </div>
                </div>

                <div className="article-separator"></div>

                {/* Отображение форматированного HTML */}
                <div 
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: article.text }}
                />
                
            </main>
        </div>
    );
};

export default ArticleDetail;