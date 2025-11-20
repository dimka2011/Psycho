import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api'; // Ваш настроенный axios-инстанс
import ReactQuill, { Quill } from 'react-quill'; // ⬅️ Используем ReactQuill
import 'react-quill/dist/quill.snow.css'; // Базовые стили Quill
import '../styles/ArticleCreate.css'; 
// Если вы хотите, чтобы кнопка 'emoji' работала, вам нужно установить:
// npm install quill-emoji react-quill-emoji --force
import 'quill-emoji/dist/quill-emoji.css'; 

// ⬅️ РЕГИСТРАЦИЯ МОДУЛЯ EMOJI
// Если вы установили quill-emoji, раскомментируйте эти строки:
import * as QuillEmoji from 'quill-emoji';
Quill.register('modules/emoji', QuillEmoji);


const ArticleForm = () => {
    const { id: articleId } = useParams(); 
    const navigate = useNavigate();
    const quillRef = useRef(null); // Ссылка на редактор
    
    // Состояния полей формы
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [text, setText] = useState(''); // Хранит HTML-контент
    const [readTime, setReadTime] = useState(5);
    const [tagsInput, setTagsInput] = useState('');
    
    // Состояния интерфейса
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const isEditing = !!articleId; 

    // --- 1. Загрузка данных статьи для редактирования ---
    useEffect(() => {
        if (!isEditing) return;

        const fetchArticle = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/v1/articles/${articleId}/`); 
                const data = response.data;
                
                setTitle(data.title);
                setExcerpt(data.excerpt);
                setText(data.text); 
                setReadTime(parseInt(data.read_time) || 5); 
                setTagsInput(data.tags.join(', ')); 
                
            } catch (err) {
                console.error("Ошибка загрузки данных статьи:", err);
                setError("Не удалось загрузить данные для редактирования.");
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [articleId, isEditing]);

    // --- 2. Логика загрузки изображений (Требует эндпоинта на бэкенде) ---
    // const imageHandler = () => {
    //     const input = document.createElement('input');
    //     input.setAttribute('type', 'file');
    //     input.setAttribute('accept', 'image/*');
    //     input.click();

    //     input.onchange = async () => {
    //         const file = input.files[0];
    //         if (!file) return;

    //         const formData = new FormData();
    //         formData.append('image', file);
            
    //         try {
    //             // ВАЖНО: Замените на ваш реальный эндпоинт для загрузки изображений
    //             const uploadResponse = await api.post('/v1/images/upload/', formData, {
    //                 headers: { 'Content-Type': 'multipart/form-data' },
    //             });

    //             const imageUrl = uploadResponse.data.url; 
                
    //             // Вставляем изображение в редактор
    //             const quill = quillRef.current.getEditor();
    //             const range = quill.getSelection(true);
    //             quill.insertEmbed(range.index, 'image', imageUrl);
    //             quill.setSelection(range.index + 1);

    //         } catch (err) {
    //             console.error('Ошибка загрузки изображения:', err);
    //             alert('Не удалось загрузить изображение.');
    //         }
    //     };
    // };

    // --- 3. Конфигурация Редактора (Используем useMemo для оптимизации) ---
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                // Форматирование текста
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'], 
                // Выравнивание, списки
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                // Медиа и другие элементы
                ['link', 'blockquote', 'code-block'],
                // ['image'], // Кнопка изображения
                ['emoji'], // ⬅️ Включить, если установлен quill-emoji
                ['clean'] 
            ],
            // Подключение обработчика изображений
            // handlers: {
            //     'image': imageHandler,
            // }
        },
        // ⬅️ Активация модулей эмодзи (Раскомментировать при установке quill-emoji)
        'emoji-toolbar': true,
        'emoji-textarea': false,
        'emoji-shortname': true,
    }), []);


    // --- 4. Обработка отправки формы (POST/PUT) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        // Проверка на пустой текст
        if (quillRef.current.getEditor().getText().trim() === '') {
            setError("Полный текст статьи не может быть пустым.");
            setLoading(false);
            return;
        }

        const method = isEditing ? 'put' : 'post'; 
        const url = isEditing ? `/v1/articles/${articleId}/` : "/v1/articles/"; 

        try {
            const response = await api[method](url, {
                title,
                excerpt,
                text: text, // HTML контент
                read_time: readTime,
                tags_input: tagsInput 
            });

            if (response.status === 200 || response.status === 201) {
                alert(`Статья успешно ${isEditing ? 'обновлена' : 'создана'}!`);
                navigate(`/articles/${response.data.id}`);
            }

        } catch (err) {
            console.error(`Ошибка при ${isEditing ? 'обновлении' : 'создании'} статьи:`, err.response || err);
            // ... (обработка ошибок остается прежней) ...
            if (err.response && err.response.status === 403) {
                setError("У вас нет прав для выполнения этой операции.");
            } else if (err.response && err.response.data) {
                const errorMessages = Object.entries(err.response.data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' ') : value}`)
                    .join('\n');
                setError("Ошибка валидации: " + errorMessages);
            } else {
                setError(`Ошибка сервера при ${isEditing ? 'обновлении' : 'создании'} статьи.`);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- 5. Рендеринг формы ---
    return (
        <div className="article-create-container">
            <h1 className="article-create-title">
                {isEditing ? `Редактирование статьи №${articleId}` : 'Создать новую статью'}
            </h1>
            
            <form onSubmit={handleSubmit} className="article-create-form">
                
                {/* Заголовок */}
                <div className="form-group"><label htmlFor="title">Заголовок</label><input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Краткий и понятный заголовок" required disabled={loading}/></div>

                {/* Краткое описание */}
                <div className="form-group"><label htmlFor="excerpt">Краткое описание (до 300 символов)</label><textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Краткое описание для карточки статьи" rows="3" maxLength="300" required disabled={loading}/></div>
                
                {/* Полный текст (ReactQuill Editor) */}
                <div className="form-group">
                    <label>Полный текст статьи (HTML-редактор)</label>
                    <ReactQuill 
                        ref={quillRef} 
                        theme="snow" 
                        value={text} 
                        onChange={setText} 
                        modules={modules} 
                        readOnly={loading}
                        className="quill-editor-dark" // Кастомный класс для темной темы
                    />
                </div>
                
                {/* Время чтения и Теги */}
                <div className="form-row">
                    <div className="form-group time-input">
                        <label htmlFor="readTime">Время чтения (мин)</label>
                        <input id="readTime" type="number" min="1" value={readTime} onChange={(e) => setReadTime(e.target.value)} required disabled={loading}/>
                    </div>
                    
                    <div className="form-group tags-input">
                        <label htmlFor="tagsInput">Теги (через запятую)</label>
                        <input id="tagsInput" type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Например: Стресс, Учёба, Семья" disabled={loading}/>
                    </div>
                </div>

                {error && <p className="error-message">{error}</p>}

                <button type="submit" className="submit-btn" disabled={loading || !title || !excerpt}>
                    {loading ? (isEditing ? 'Обновление...' : 'Публикация...') : (isEditing ? 'Сохранить изменения' : 'Опубликовать статью')}
                </button>
            </form>
        </div>
    );
};

export default ArticleForm;