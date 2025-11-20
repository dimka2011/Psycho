from django.contrib import admin
from articles.models import *
admin.site.register(Post)
admin.site.register(Tag)