# chat/permissions.py

from rest_framework.permissions import BasePermission
from users.models import User # Предполагаем, что users.models.User существует

class IsPsychologistOrSelf(BasePermission):
    """
    Разрешает доступ, если пользователь является психологом или 
    если пользователь является учеником, участвующим в этом чате.
    """
    def has_permission(self, request, view):
        # Доступ разрешен аутентифицированным пользователям
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # 1. Проверка: Является ли пользователь психологом?
        # Используем разрешение, определенное в вашей модели User
        is_psychologist = user.has_perm('users.psych') 
        if is_psychologist:
            return True
        
        # 2. Проверка: Является ли пользователь учеником в этом чате?
        # Ученик может видеть только СВОЙ чат.
        if user == obj.student:
            return True
            
        return False