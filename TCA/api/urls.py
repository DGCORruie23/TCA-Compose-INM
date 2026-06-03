from django.urls import path
from api import views

app_name = 'user_admin'

urlpatterns = [
    path('mapa-datos/', views.mapa_datos, name='mapa_datos'),
]