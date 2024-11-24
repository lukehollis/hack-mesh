from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path('spaces/<int:id>-<slug:slug>/', views.space, name='space'),
    path('spaces/edit/<str:id>/', views.space_set_space_json, name='space_set_space_json'),
    path('tours/<int:id>-<slug:slug>/', views.tour, name='tour'),
    path('tours/edit/<int:id>/', views.tour_set_tour_json, name='tour_set_tour_json'),
]
