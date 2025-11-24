# chat/serializers.py

from rest_framework import serializers
from .models import Chat, Message
from users.serializers import UserSerializer # Ваш существующий UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    # Поле sender_id поможет фронтенду определить, кто отправил сообщение
    sender_id = serializers.ReadOnlyField(source='sender.id') 
    
    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender_id', 'content', 'timestamp', 'is_read']
        read_only_fields = ['id', 'chat', 'sender_id', 'timestamp', 'is_read']


class ChatListSerializer(serializers.ModelSerializer):
    # Поля, идентифицирующие пользователей в чате
    student_token = serializers.ReadOnlyField(source='student.token')
    psychologist_email = serializers.ReadOnlyField(source='psychologist.email')
    
    # Получение последнего сообщения для превью
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'student_token', 'psychologist_email', 'is_active', 'created_at', 'updated_at', 'last_message']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.all().order_by('-timestamp').first()
        if last_msg:
            # Возвращаем только содержание и время отправки
            return {'content': last_msg.content[:100], 'timestamp': last_msg.timestamp}
        return None