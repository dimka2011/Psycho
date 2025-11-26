from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Предполагаем, что views.py находится в вашем приложении 'articles'
from articles.views import ArticleViewSet, ai_search_view
from chat.views import *
from users.views import *

# Создаем маршрутизатор для ViewSet
router = DefaultRouter()
# Регистрируем ViewSet
router.register(r'chats', ChatViewSet, basename='chat')
# Регистрируем ViewSet. 'articles' — это префикс URL
router.register(r'articles', ArticleViewSet, basename='article')

urlpatterns = [
    path('v1/chats/initiate/', initiate_chat, name='chat-initiate'),
    path('v1/articles/ai-search/', ai_search_view, name='ai-search'),
    path('auth/register-student/', RegisterStudentView.as_view()),
    path('v1/', include(router.urls)), 
]