from users.models import User
from users.serializers import UserSerializer # Убедитесь, что UserSerializer существует
from django.db.models import Q
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import exceptions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import User
from .serializers import UserSerializer # Убедитесь, что он есть
import uuid

class RegisterStudentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        password = request.data.get('password')
        
        if not password:
            return Response({"detail": "Пароль обязателен."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Генерируем уникальный токен (как в вашей модели: uuid hex укороченный)
            # Используем цикл для гарантии уникальности
            token = uuid.uuid4().hex[:10]
            while User.objects.filter(token=token).exists():
                token = uuid.uuid4().hex[:10]

            # Создаем пользователя
            # Email оставляем пустым или генерируем фейковый, если он обязателен в вашей БД
            # (В вашей модели email уникален, поэтому если он обязателен, придется генерировать уникальную заглушку)
            fake_email = f"{token}@student.asp" 
            
            user = User.objects.create_user(
                email=fake_email, 
                password=password,
                token=token
            )
            
            # Возвращаем токен, чтобы показать его ученику
            return Response({
                "token": token,
                "detail": "Аккаунт успешно создан."
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(e)
            return Response({"detail": "Ошибка при создании аккаунта."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Оставляем поле email, так как оно используется для унифицированного ввода
    email = serializers.CharField(required=True) 

    def validate(self, attrs):
        unified_input = attrs.get("email") 
        password = attrs.get("password")

        user = None

        # 1. Логика проверки: находим пользователя по email или токену
        if "@" in unified_input:
            # Email (для психолога)
            user = User.objects.filter(Q(email__iexact=unified_input)).first()
        else:
            # Токен (для школьника)
            user = User.objects.filter(Q(token__iexact=unified_input)).first()
            
        # 2. Проверка существования пользователя
        if user is None:
            raise exceptions.AuthenticationFailed(
                detail="Учетные данные не существуют!")
        
        # 3. Проверка пароля
        # NOTE: Убедитесь, что у пользователей, входящих по токену, также есть пароль.
        if not user.check_password(password):
             raise exceptions.AuthenticationFailed(
                 detail="Неверный пароль")

        # 4. ФИКС #1 (Ошибка с токеном): 
        # Вместо вызова super().validate(), который использует стандартный Django backend 
        # и не найдет пользователя по полю 'token', мы вручную генерируем токены.
        refresh = self.get_token(user)
        
        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        # 5. ФИКС #2 (Отсутствие поля isPsychologyst): 
        # Добавляем флаг is_psychologist напрямую в JSON-ответ.
        data['is_psychologist'] = user.has_perm('users.psych')
        
        # Опционально: можно добавить данные пользователя к ответу
        # data['user_data'] = UserSerializer(user).data
        
        return data
        
    @classmethod
    def get_token(cls, user):
        # Эта часть добавляет is_psychologist в payload самого JWT-токена.
        token = super().get_token(user)
        # Предполагаем, что users.psych — это правильный код разрешения
        token['is_psychologist'] = user.has_perm('users.psych') 
        return token
    

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer