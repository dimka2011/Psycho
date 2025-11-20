from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Предполагаем, что views.py находится в вашем приложении 'articles'
from articles.views import ArticleViewSet 

# Инициализируем роутер
router = DefaultRouter()
# Регистрируем ViewSet. 'articles' — это префикс URL
router.register(r'articles', ArticleViewSet, basename='article')

urlpatterns = [
    # ... ваши другие пути, например, для аутентификации

    # Включаем пути, сгенерированные роутером, по префиксу 'v1/'
    path('v1/', include(router.urls)), 
    
    # В результате вы получите два пути:
    # 1. GET /api/v1/articles/ -> Список статей
    # 2. GET /api/v1/articles/{id}/ -> Детальный просмотр статьи
]