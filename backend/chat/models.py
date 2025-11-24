# chat/models.py

from django.db import models
from django.conf import settings
from users.models import User # Импортируем вашу модель User

# Получаем модель пользователя, настроенную в settings.py
AUTH_USER_MODEL = settings.AUTH_USER_MODEL 

class Chat(models.Model):
    """Модель, представляющая собой разговор между учеником и психологом."""
    
    # Ученик (аутентифицированный пользователь)
    # Предполагаем, что школьник не является психологом
    student = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_chats',
        limit_choices_to={'is_staff': False, 'is_superuser': False}, # Ограничение для не-психологов
        verbose_name="Ученик"
    )

    # Психолог (только пользователи с соответствующим разрешением)
    psychologist = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Если психолог уволен/удален, чат сохраняется
        null=True,
        blank=True,
        related_name='psychologist_chats',
        # Здесь можно добавить limit_choices_to на основе вашего разрешения 'users.psych'
        verbose_name="Психолог"
    )

    # Статус чата (можно использовать для пометки "открыт", "закрыт", "в ожидании")
    is_active = models.BooleanField(default=True, verbose_name="Активный")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Чат"
        verbose_name_plural = "Чаты"
        # Убеждаемся, что у одного ученика не может быть двух активных чатов одновременно
        unique_together = ('student', 'is_active') 

    def __str__(self):
        psy_name = self.psychologist.email if self.psychologist else "Нет назначенного"
        return f"Чат {self.student.token} - {psy_name}"


class Message(models.Model):
    """Модель сообщения внутри конкретного чата."""
    
    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name="Чат"
    )
    
    sender = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name="Отправитель"
    )
    
    content = models.TextField(verbose_name="Содержание")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Время отправки")
    is_read = models.BooleanField(default=False, verbose_name="Прочитано")

    class Meta:
        verbose_name = "Сообщение"
        verbose_name_plural = "Сообщения"
        ordering = ['timestamp']
        
    def __str__(self):
        return f"Сообщение от {self.sender.get_username()} в чате {self.chat.id}"