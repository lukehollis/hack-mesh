from django.contrib import admin
from .models import CustomUser, Space, Tour, Tag

admin.site.register(CustomUser)
admin.site.register(Space)
admin.site.register(Tour)
admin.site.register(Tag)
