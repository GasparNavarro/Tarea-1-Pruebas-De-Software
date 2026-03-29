from django.shortcuts import render
from django.urls import reverse_lazy
from django.http import HttpResponseRedirect
from django.views.generic import ListView, CreateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Reserva

## LoginRequiredMixin asegura que un cliente anónimo no pueda entrar a estas URLs.
## Esto cumple decisión de diseño: el sistema es de uso exclusivamente interno.

class ReservaListView(LoginRequiredMixin, ListView):
    model = Reserva
    template_name = 'reservas/lista_reservas.html'
    context_object_name = 'reservas'
    
    def get_queryset(self):
        ## Mostramos las reservas ordenadas por fecha y bloque, excluyendo las canceladas de la vista principal
        return Reserva.objects.exclude(estado='CANCELADA').order_by('fecha', 'bloque_horario')

class ReservaCreateView(LoginRequiredMixin, CreateView):
    model = Reserva
    template_name = 'reservas/form_reserva.html'
    ## Excluimos 'estado' para que el usuario no pueda crear una reserva ya cancelada
    fields = ['cliente', 'tecnico', 'fecha', 'bloque_horario', 'descripcion_falla']
    success_url = reverse_lazy('lista_reservas')

class ReservaSoftDeleteView(LoginRequiredMixin, DeleteView):
    model = Reserva
    template_name = 'reservas/confirmar_cancelacion.html'
    success_url = reverse_lazy('lista_reservas')

    def form_valid(self, form):
        """
        Sobreescribimos el comportamiento por defecto de eliminación.
        En lugar de hacer un DROP en la base de datos, aplicamos la regla de negocio:
        Cambiar el estado a CANCELADA.
        """
        success_url = self.get_success_url()
        self.object.estado = 'CANCELADA'
        self.object.save()
        return HttpResponseRedirect(success_url)