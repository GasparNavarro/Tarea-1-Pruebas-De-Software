# Sistema de Reservas Técnicas - INF331

Aplicación web para la gestión de reservas de atención técnica.

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
