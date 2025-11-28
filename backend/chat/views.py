# chat/views.py

from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Chat, Message
from .serializers import ChatListSerializer, MessageSerializer
from .permissions import IsPsychologistOrSelf
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from users.models import User
from .custom_filters import censor
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_chat(request):
    """
    Инициализирует новый чат, если у ученика нет активного, 
    и отправляет первое сообщение.
    """
    user = request.user
    # Убеждаемся, что инициатор — ученик
    if user.has_perm('users.psych'):
        return Response({"detail": "Психологи не могут инициировать чат через этот endpoint."}, 
                        status=status.HTTP_403_FORBIDDEN)
    
    content = request.data.get('content')
    if not content:
        return Response({"content": "Обязательно поле 'content' (первое сообщение)."}, 
                        status=status.HTTP_400_BAD_REQUEST)
    if censor(content):
        return Response(status=status.HTTP_400_BAD_REQUEST)
    # 1. Проверяем, есть ли уже активный чат
    active_chat = Chat.objects.filter(student=user, is_active=True).first()
    if active_chat:
        return Response({"detail": "У вас уже есть активный чат."}, 
                        status=status.HTTP_409_CONFLICT)
                        
    # 2. Находим свободного психолога (логика назначения может быть сложной)
    # Для простоты: берем первого попавшегося или того, у кого меньше всего активных чатов
    available_psychologist = User.objects.filter(is_staff=True).first() # Измените это на вашу логику поиска
    
    if not available_psychologist:
        return Response({"detail": "В данный момент нет доступных психологов."}, 
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)
                        
    # 3. Создаем новый чат
    new_chat = Chat.objects.create(
        student=user,
        psychologist=available_psychologist,
        is_active=True
    )
    
    # 4. Создаем первое сообщение
    Message.objects.create(
        chat=new_chat,
        sender=user,
        content=content
    )
    
    # Возвращаем созданный чат
    serializer = ChatListSerializer(new_chat)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
class ChatViewSet(viewsets.GenericViewSet, 
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin):
    """
    ViewSet для управления чатами.
    - Психолог видит все назначенные чаты.
    - Ученик видит только свой активный чат.
    """
    serializer_class = ChatListSerializer
    permission_classes = [IsAuthenticated, IsPsychologistOrSelf]
    
    # Убедитесь, что у вас есть разрешение 'users.psych'
    def is_psychologist(self, user):
        return user.has_perm('users.psych')

    def get_queryset(self):
        user = self.request.user
        if self.is_psychologist(user):
            # Психолог видит все чаты, в которых он участвует
            return Chat.objects.filter(psychologist=user).order_by('-updated_at')
        else:
            # Ученик видит только свои активные чаты
            # В вашем случае, скорее всего, это будет один чат
            return Chat.objects.filter(student=user, is_active=True)

    # Эндпоинт для получения сообщений в конкретном чате:
    # GET /v1/chats/{chat_pk}/messages/
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        chat = get_object_or_404(Chat, pk=pk)
        
        # Проверяем разрешение перед возвратом сообщений
        self.check_object_permissions(request, chat)
        
        # Получаем все сообщения чата
        messages = chat.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    # Эндпоинт для отправки нового сообщения:
    # POST /v1/chats/{chat_pk}/send_message/
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        chat = get_object_or_404(Chat, pk=pk)
        
        # Проверяем разрешение
        self.check_object_permissions(request, chat)
        
        # Создаем новое сообщение
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            if censor(serializer.validated_data.get('content')):
                return Response(status=status.HTTP_400_BAD_REQUEST)
            # Важно: sender и chat устанавливаются из контекста запроса, а не из данных пользователя
            serializer.save(chat=chat, sender=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)