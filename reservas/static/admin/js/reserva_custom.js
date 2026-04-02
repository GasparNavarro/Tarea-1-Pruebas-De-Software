(function($) {
    $(document).ready(function() {
        var $input = $('#id_fecha');
        
        if ($input.length > 0) {
            // Ocultamos el input original completamente para que no sea seleccionable ni editable
            $input.hide();

            // Creamos un label real (span) que mostrará el valor del input
            var $displayLabel = $('<span id="fecha_actual_label" style="font-weight: bold; color: #447e9b; margin-right: 15px; font-size: 14px;"></span>');
            $input.before($displayLabel);

            // Función para actualizar el label basándose en el input (que el widget de Django cambia)
            function updateLabel() {
                var value = $input.val();
                $displayLabel.text(value ? value : "(Sin fecha)");
            }

            // Detectar cambios realizados por el widget (Today/Calendario)
            // Django Admin usa una función propia para asignar fechas, así que observamos cambios.
            $input.on('change', updateLabel);

            // Intervalo corto de seguridad para sincronizar cambios externos inmediatos (ej:Today)
            setInterval(updateLabel, 500);

            // Inicializamos
            updateLabel();
        }
    });

})(django.jQuery);
