from django import forms
from django.urls import reverse_lazy
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.views import View
from django.views.generic import ListView, CreateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Reserva, Cliente, Tecnico

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
        self.fields['tecnico'].queryset = Tecnico.objects.filter(esta_activo=True).order_by('nombre')
        self.fields['cliente'].queryset = Cliente.objects.order_by('nombre')


class ClienteForm(forms.ModelForm):
    class Meta:
        model = Cliente
        fields = ['nombre', 'telefono', 'direccion']


class TecnicoForm(forms.ModelForm):
    class Meta:
        model = Tecnico
        fields = ['nombre']

class ReservaCreateView(LoginRequiredMixin, CreateView):
    model = Reserva
    template_name = 'reservas/form_reserva.html'
    ## Excluimos 'estado' para que el usuario no pueda crear una reserva ya cancelada
    form_class = ReservaForm
    success_url = reverse_lazy('lista_reservas')


class ClienteCreateView(LoginRequiredMixin, CreateView):
    model = Cliente
    template_name = 'reservas/form_cliente.html'
    form_class = ClienteForm
    success_url = reverse_lazy('nuevo_cliente')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['clientes'] = Cliente.objects.order_by('nombre')
        return context


class TecnicoCreateView(LoginRequiredMixin, CreateView):
    model = Tecnico
    template_name = 'reservas/form_tecnico.html'
    form_class = TecnicoForm
    success_url = reverse_lazy('nuevo_tecnico')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['tecnicos'] = Tecnico.objects.order_by('-esta_activo', 'nombre')
        return context


class TecnicoInactivarView(LoginRequiredMixin, View):
    def post(self, request, pk):
        tecnico = get_object_or_404(Tecnico, pk=pk)
        if tecnico.esta_activo:
            tecnico.esta_activo = False
            tecnico.save(update_fields=['esta_activo'])
        return HttpResponseRedirect(reverse_lazy('nuevo_tecnico'))


class TecnicoReactivarView(LoginRequiredMixin, View):
    def post(self, request, pk):
        tecnico = get_object_or_404(Tecnico, pk=pk)
        if not tecnico.esta_activo:
            tecnico.esta_activo = True
            tecnico.save(update_fields=['esta_activo'])
        return HttpResponseRedirect(reverse_lazy('nuevo_tecnico'))

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