from django import forms
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


class ReservaForm(forms.ModelForm):
    class Meta:
        model = Reserva
        fields = ['cliente', 'tecnico', 'fecha', 'bloque_horario', 'descripcion_falla']
        widgets = {
            'fecha': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d'),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['fecha'].input_formats = ['%Y-%m-%d']

class ReservaCreateView(LoginRequiredMixin, CreateView):
    model = Reserva
    template_name = 'reservas/form_reserva.html'
    ## Excluimos 'estado' para que el usuario no pueda crear una reserva ya cancelada
    form_class = ReservaForm
    success_url = reverse_lazy('lista_reservas')

class ReservaSoftDeleteView(LoginRequiredMixin, DeleteView):
    model = Reserva
    template_name = 'reservas/confirmas_cancelacion.html'
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