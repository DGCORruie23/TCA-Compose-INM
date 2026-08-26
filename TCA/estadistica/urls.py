from django.urls import path
from . import views
from django.urls import path, include

urlpatterns = [
    path('generales/', views.general, name="estadistica_p"),
    path('pendientes/', views.pendientes, name="acuerdos_p"),
    path('todos/', views.acuerdosAll, name="acuerdos_t"),
    path('inicio/', views.opc_periodo, name="periodos_opc"),
]