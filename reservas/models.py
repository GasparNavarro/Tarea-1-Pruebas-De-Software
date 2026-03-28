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
        if self.fecha < timezone.now().date():
            raise ValidationError({'fecha': "La fecha de la reserva no puede estar en el pasado."})

        ## Validar superposición de horarios para el mismo técnico
        superposicion = Reserva.objects.filter(
            tecnico=self.tecnico,
            fecha=self.fecha,
            bloque_horario=self.bloque_horario
        ).exclude(pk=self.pk) ## Excluimos la reserva actual por si la estamos editando

        ## Si hay una reserva en ese bloque y no está cancelada, levantamos un error
        if superposicion.exclude(estado='CANCELADA').exists():
            raise ValidationError("El técnico ya tiene una reserva activa en este bloque horario y fecha.")

    def save(self, *args, **kwargs):
        ## Forzamos la ejecución de clean() antes de guardar en la base de datos
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.cliente.nombre} - {self.tecnico.nombre} ({self.fecha} {self.bloque_horario})"