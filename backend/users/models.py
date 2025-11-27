from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _
import uuid

class CustomUserManager(BaseUserManager):
    def create_user(self,  password, email=None, **extra_fields):
        if not password: return ValueError(_('The given password must be set'))
        if email:
            email = self.normalize_email(email)
            token = uuid.uuid4().hex[::10]
            user = self.model(token=token, email=email, **extra_fields)
            user.set_password(password)
            user.save()
            return user
        
        token = uuid.uuid4().hex[::10]
        user = self.model(token=token, password=password, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(email, password, **extra_fields)
class User(AbstractUser):
    username = None
    token = models.CharField(max_length=200, unique=True)
    email = models.EmailField('email', unique=True, null=True, blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()
    class Meta:
        permissions = [
            ("psych", "Psychologist, can message with users"),
        ]
    def __str__(self):
        return self.email