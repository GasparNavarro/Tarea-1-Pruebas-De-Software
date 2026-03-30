from datetime import datetime
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)
    ## Decisión frente a ambigüedad: Asumimos servicio a domicilio, por lo que la dirección es obligatoria.
    direccion = models.TextField() 

    def __str__(self):
        return self.nombre

class Tecnico(models.Model):
    nombre = models.CharField(max_length=100)
    esta_activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class Reserva(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('REALIZADA', 'Realizada'),
        ('CANCELADA', 'Cancelada'),
    ]

    BLOQUES_HORARIOS = [
        ('09:00', '09:00 - 10:00'),
        ('10:00', '10:00 - 11:00'),
        ('11:00', '11:00 - 12:00'),
        ('12:00', '12:00 - 13:00'),
        ('14:00', '14:00 - 15:00'),
        ('15:00', '15:00 - 16:00'),
        ('16:00', '16:00 - 17:00'),
        ('17:00', '17:00 - 18:00'),
    ]

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    tecnico = models.ForeignKey(Tecnico, on_delete=models.CASCADE)
    fecha = models.DateField()
    bloque_horario = models.CharField(max_length=5, choices=BLOQUES_HORARIOS)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='PENDIENTE')
    descripcion_falla = models.TextField(help_text="Breve descripción del problema del electrodoméstico")

    def clean(self):
        """
        Aquí aplicamos la VERIFICACIÓN a nivel de modelo para asegurar la integridad de los datos
        y hacer cumplir nuestras reglas de negocio.
        """
        ## Validar que la reserva no sea en el pasado
        if self.fecha and self.fecha < timezone.now().date():
            raise ValidationError({'fecha': "La fecha de la reserva no puede estar en el pasado."})

        ## Si aún faltan datos requeridos, dejamos que la validación de campos los reporte.
        if not self.cliente_id or not self.tecnico_id or not self.fecha or not self.bloque_horario:
            return

        ## Validar que, si la reserva es para hoy, el bloque no haya comenzado ya.
        ahora_local = timezone.localtime()
        if self.fecha == ahora_local.date():
            hora_inicio_bloque = datetime.strptime(self.bloque_horario, '%H:%M').time()
            if hora_inicio_bloque <= ahora_local.time():
                raise ValidationError({'bloque_horario': "No se puede reservar un bloque horario que ya comenzó hoy."})

        ## Validar superposición de horarios para el mismo técnico
        superposicion_tecnico = Reserva.objects.filter(
            tecnico=self.tecnico,
            fecha=self.fecha,
            bloque_horario=self.bloque_horario
        ).exclude(pk=self.pk) ## Excluimos la reserva actual por si la estamos editando

        ## Si hay una reserva en ese bloque y no está cancelada, levantamos un error
        if superposicion_tecnico.exclude(estado='CANCELADA').exists():
            raise ValidationError({'tecnico': "El técnico ya tiene una reserva activa en este bloque horario y fecha."})

        ## Validar que un mismo cliente no tenga dos reservas simultáneas.
        superposicion_cliente = Reserva.objects.filter(
            cliente=self.cliente,
            fecha=self.fecha,
            bloque_horario=self.bloque_horario
        ).exclude(pk=self.pk)

        if superposicion_cliente.exclude(estado='CANCELADA').exists():
            raise ValidationError({'cliente': "El cliente ya tiene una reserva activa en este bloque horario y fecha."})

    def save(self, *args, **kwargs):
        ## full_clean valida campos requeridos y luego ejecuta clean().
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.cliente.nombre} - {self.tecnico.nombre} ({self.fecha} {self.bloque_horario})"