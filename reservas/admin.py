from django.contrib import admin
from .models import Cliente, Tecnico, Reserva

class ReservaAdmin(admin.ModelAdmin):
    # Campos que se muestran en el formulario
    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))
        if obj is None:  # Estamos en la página de creación (/add/)
            if 'estado' in fields:
                fields.remove('estado')
        return fields

    # Volvemos a hacer la fecha editable en la creación
    def get_readonly_fields(self, request, obj=None):
        return super().get_readonly_fields(request, obj)

    class Media:
        # Inyectamos JS para manejar el comportamiento dinámico del label
        js = ('admin/js/reserva_custom.js',)

admin.site.register(Cliente)
admin.site.register(Tecnico)
admin.site.register(Reserva, ReservaAdmin)
