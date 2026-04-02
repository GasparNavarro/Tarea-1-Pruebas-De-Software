# Sistema de Reservas Técnicas - INF331

Aplicación web para la gestión de reservas de atención técnica.

Excel Docs Casos de Prueba: https://docs.google.com/spreadsheets/d/1eSTAMHM0fqXE0Xdm4dwN25U1enDkiTKU/edit?gid=364666220#gid=364666220  

Docs Casos de Prueba:https://docs.google.com/document/d/1kTZ7-nbdK8nkOWgnM8er-W39iFz4Dqp5hl83l5eZPHY/edit?tab=t.0

## Prerrequisitos

- Python 3.10 o superior.
- Git.

## Instalación y Ejecución Local

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/GasparNavarro/Tarea-1-Pruebas-De-Software
   ```

2. **Configurar el entorno virtual:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Instalar dependencias:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar base de datos (migraciones):**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Crear usuario administrador:**

   ```bash
   python manage.py createsuperuser
   ```

6. **Ejecutar servidor de desarrollo:**

   ```bash
   python manage.py runserver
   ```

7. **Acceso al sistema:**
   - Interfaz de operarios: http://127.0.0.1:8000/
   - Panel de administración: http://127.0.0.1:8000/admin/
