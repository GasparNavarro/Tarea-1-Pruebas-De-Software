from django.urls import path
from .views import (
    ReservaListView,
    ReservaCreateView,
    ReservaSoftDeleteView,
    ClienteCreateView,
    TecnicoCreateView,
    TecnicoInactivarView,
    TecnicoReactivarView,
)

urlpatterns = [
    path('', ReservaListView.as_view(), name='lista_reservas'),
    path('nueva/', ReservaCreateView.as_view(), name='nueva_reserva'),
    path('clientes/nuevo/', ClienteCreateView.as_view(), name='nuevo_cliente'),
    path('tecnicos/nuevo/', TecnicoCreateView.as_view(), name='nuevo_tecnico'),
    path('tecnicos/<int:pk>/inactivar/', TecnicoInactivarView.as_view(), name='inactivar_tecnico'),
    path('tecnicos/<int:pk>/reactivar/', TecnicoReactivarView.as_view(), name='reactivar_tecnico'),
    path('cancelar/<int:pk>/', ReservaSoftDeleteView.as_view(), name='cancelar_reserva'),
]