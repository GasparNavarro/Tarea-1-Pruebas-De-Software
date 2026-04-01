# Sistema de Reservas Técnicas
# Tarea-1-Pruebas-De-Software
Aplicación web web para la gestión de reservas de atención técnica. Proyecto para INF331.

## Prerrequisitos
- Python 3.10 o superior.
- Git.

### Instalación local
1. Crear entorno virtual: `python3 -m venv venv`
2. Activar entorno virtual: `source venv/bin/activate`
3. Instalar dependencias: `pip install -r requirements.txt`


## Instrucciones de Instalación y Ejecución Local

1. **Clonar el repositorio:**
```bash
git clone [https://github.com/tu-usuario/sistema-reservas-tecnicas.git](https://github.com/tu-usuario/sistema-reservas-tecnicas.git)
cd sistema-reservas-tecnicas
```

2. **Crear y activar entorno virtual**
```bash
python3 -m venv venv
source venv/bin/activate
```

3.**Instalación dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar base de datos (migraciones)**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Crear usuario administrador**
```bash
python manage.py createsuperuser
```

6. **Ejecutar servidor de desarrollo**
```bash
python manage.py runserver
```

7. **Acceso al sistema**
- Interfaz de operarios: http://127.0.0.1:8000/
- Panel de administración: http://127.0.0.1:8000/admin/
