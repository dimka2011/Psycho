from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .models import Post

# Загружаем модель ОДИН РАЗ при запуске сервера (или первом импорте).
# 'all-MiniLM-L6-v2' - это очень быстрая и легкая модель (около 80Мб), идеальная для CPU.
# Она преобразует текст в вектор из 384 чисел.
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Ошибка загрузки модели ИИ: {e}")
    model = None

def search_articles_semantically(query, top_k=3, threshold=0.25):
    """
    Ищет статьи, описание (excerpt) которых по смыслу похоже на запрос (query).
    top_k: сколько статей вернуть максимум.
    threshold: порог похожести (0..1), ниже которого статьи отсеиваются.
    """
    if not model:
        return []

    # 1. Получаем все опубликованные статьи
    # В продакшене векторы статей лучше хранить в БД (pgvector), но для <1000 статей так быстрее.
    articles = list(Post.objects.all())
    if not articles:
        return []

    # 2. Собираем тексты для анализа (заголовки + описания для лучшей точности)
    article_texts = [f"{art.title}. {art.excerpt}" for art in articles]

    # 3. Превращаем запрос и статьи в векторы (embeddings)
    article_embeddings = model.encode(article_texts)
    query_embedding = model.encode([query])

    # 4. Считаем косинусное сходство (насколько векторы близки)
    # Результат - массив чисел от -1 до 1
    similarities = cosine_similarity(query_embedding, article_embeddings)[0]

    # 5. Сортируем результаты
    # Получаем индексы от самых похожих к менее похожим
    top_indices = np.argsort(similarities)[::-1]

    results = []
    for idx in top_indices:
        score = similarities[idx]
        
        # Если сходство ниже порога, перестаем искать
        if score < threshold:
            continue
        
        if len(results) >= top_k:
            break

        # Добавляем статью в результаты
        results.append(articles[idx])

    return results