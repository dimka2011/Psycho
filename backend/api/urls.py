from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Предполагаем, что views.py находится в вашем приложении 'articles'
from articles.views import ArticleViewSet 
from chat.views import *

# Создаем маршрутизатор для ViewSet
router = DefaultRouter()
# Регистрируем ViewSet
router.register(r'chats', ChatViewSet, basename='chat')
# Регистрируем ViewSet. 'articles' — это префикс URL
router.register(r'articles', ArticleViewSet, basename='article')

urlpatterns = [
    path('v1/chats/initiate/', initiate_chat, name='chat-initiate'),
    path('v1/', include(router.urls)), 
]