from rest_framework import serializers
from .models import Post, Tag
from django.db import transaction
class TagSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Тега.
    """
    class Meta:
        model = Tag
        fields = ['name']

class PostListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка статей (используется на /articles).
    """
    # Преобразуем теги в список строк, как ожидает фронтенд
    tags = serializers.SerializerMethodField()
    # Форматируем время чтения
    read_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        # Поля, нужные для карточки
        fields = ['id', 'title', 'excerpt', 'tags', 'read_time'] 

    def get_tags(self, obj):
        # Возвращает ['Учёба', 'Стресс'] вместо объектов
        return [tag.name for tag in obj.tags.all()]

    def get_read_time(self, obj):
        # Возвращает "5 мин"
        return f"{obj.read_time} мин"

class PostDetailSerializer(PostListSerializer):
    """
    Сериализатор для детального просмотра статьи (используется на /articles/1/).
    """
    class Meta:
        model = Post
        # Добавляем полное поле 'text' к полям списка
        fields = PostListSerializer.Meta.fields + ['text']
        # Поля в итоге: ['id', 'title', 'excerpt', 'tags', 'read_time', 'text']

class PostCreateUpdateSerializer(serializers.ModelSerializer):
    # Поле для ввода тегов с фронтенда (как строка через запятую)
    tags_input = serializers.CharField(
        write_only=True, 
        required=False,
        label="Теги (через запятую)"
    )
    
    class Meta:
        model = Post
        # Включаем все поля, которые приходят с фронтенда
        fields = ['id', 'title', 'excerpt', 'text', 'read_time', 'tags_input'] 
        
    def _handle_tags(self, post, tags_string):
        """Создает или находит теги из строки и привязывает их к посту."""
        tag_names = [name.strip() for name in tags_string.split(',') if name.strip()]
        
        with transaction.atomic():
            tags_to_set = []
            for name in tag_names:
                # Получаем существующий или создаем новый тег
                tag, created = Tag.objects.get_or_create(name=name.capitalize())
                tags_to_set.append(tag)
            
            # Привязываем теги к посту
            post.tags.set(tags_to_set)

    def create(self, validated_data):
        tags_data = validated_data.pop('tags_input', None)
        
        # Создаем пост. Автор не требуется.
        post = Post.objects.create(**validated_data)
        
        if tags_data:
            self._handle_tags(post, tags_data)

        return post