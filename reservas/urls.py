from django.urls import path
from .views import ReservaListView, ReservaCreateView, ReservaSoftDeleteView

urlpatterns = [
    path('', ReservaListView.as_view(), name='lista_reservas'),
    path('nueva/', ReservaCreateView.as_view(), name='nueva_reserva'),
    path('cancelar/<int:pk>/', ReservaSoftDeleteView.as_view(), name='cancelar_reserva'),
]