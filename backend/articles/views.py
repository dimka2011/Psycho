from rest_framework import viewsets, permissions
from .models import Post
from .serializers import PostListSerializer, PostDetailSerializer, PostCreateUpdateSerializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .ai_search import search_articles_semantically


@api_view(['POST'])
@authentication_classes([]) # Отключаем аутентификацию, чтобы искали все
@permission_classes([AllowAny]) # Разрешаем всем
def ai_search_view(request):
    """
    Принимает JSON {"query": "текст запроса"}
    Возвращает список подходящих статей.
    """
    query = request.data.get('query', '')
    
    if not query or len(query.strip()) < 3:
        return Response({"detail": "Запрос слишком короткий"}, status=400)

    # Вызываем наш локальный ИИ
    # Можно обернуть в try-except, чтобы не ронять сервер при ошибке модели
    try:
        found_articles = search_articles_semantically(query)
    except Exception as e:
        print(f"AI Search Error: {e}")
        return Response([], status=200) # Возвращаем пустой список при ошибке
    
    # Сериализуем результаты (превращаем объекты Django в JSON)
    serializer = PostListSerializer(found_articles, many=True)
    
    return Response(serializer.data)
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