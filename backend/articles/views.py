from rest_framework import viewsets, permissions
from .models import Post
from .serializers import PostListSerializer, PostDetailSerializer, PostCreateUpdateSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated

# КАСТОМНОЕ РАЗРЕШЕНИЕ: Чтение для всех, запись только для психологов
class IsPsychologistOrReadOnly(permissions.BasePermission):
    """
    Разрешает чтение всем. Разрешает запись (POST, PUT, DELETE) только психологам.
    """
    def has_permission(self, request, view):
        # Разрешить GET, HEAD, OPTIONS (безопасные методы) всем
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Для небезопасных методов (POST, PUT, DELETE)
        # Требуем аутентификации И наличие разрешения 'users.psych'
        # Проверка 'users.psych' берется из вашей модели пользователя
        return request.user and request.user.is_authenticated and request.user.has_perm('users.psych')


# ОБНОВЛЕННЫЙ VIEWSET
class ArticleViewSet(viewsets.ModelViewSet): # ⬅️ Меняем на ModelViewSet для включения POST/PUT/DELETE
    queryset = Post.objects.all()
    # Убираем 'authentication_classes = []' для работы JWT-аутентификации
    permission_classes = [IsPsychologistOrReadOnly] # ⬅️ Используем новое разрешение
    
    # perform_create не нужен, так как автора устанавливать не требуется
    
    def get_serializer_class(self):
        # Используем сериализатор для создания/обновления
        if self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
            
        # Используем существующие сериализаторы для чтения
        if self.action == 'list':
            return PostListSerializer
            
        return PostDetailSerializer