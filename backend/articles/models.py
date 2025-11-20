from django.db import models

# Модель для Тегов (Учёба, Стресс, Семья и т.д.)
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="Название тега")
    
    class Meta:
        verbose_name = "Тег"
        verbose_name_plural = "Теги"

    def __str__(self):
        return self.name

# Обновленная модель Статьи
class Post(models.Model):
    title = models.CharField(max_length=200, verbose_name="Заголовок")
    # Добавлено для списка статей
    excerpt = models.CharField(max_length=300, verbose_name="Краткое описание") 
    text = models.TextField(verbose_name="Полный текст статьи")
    # Используем ManyToManyField для гибкости (одна статья -> много тегов)
    tags = models.ManyToManyField(Tag, related_name='posts', verbose_name="Теги") 
    # Время чтения для карточки на фронтенде (например, 5 минут)
    read_time = models.PositiveSmallIntegerField(default=5, verbose_name="Время чтения (мин)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Статья"
        verbose_name_plural = "Статьи"
        # Сортировка по умолчанию: новые сверху
        ordering = ['-created_at'] 
        permissions = [
            ("add_posts", "Can add and edit posts"),
        ]
        
    def __str__(self):
        return self.title