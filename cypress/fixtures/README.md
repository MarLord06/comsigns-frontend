# Fixtures para Tests Cypress de Comsigns

Este directorio contiene los archivos de prueba necesarios para ejecutar los tests E2E.

## Archivos Requeridos

### Videos de prueba
Necesitas crear/obtener los siguientes archivos de video:

1. **sample-video.mp4** - Video corto de seña (recomendado: 2-5 segundos)
2. **sample-video-2.mp4** - Segundo video de prueba
3. **sample-video-3.mp4** - Tercer video de prueba

Puedes usar cualquier video MP4 corto. Para crear videos de prueba:
```bash
# Usando ffmpeg para crear un video de prueba de 3 segundos
ffmpeg -f lavfi -i testsrc=duration=3:size=640x480:rate=30 -pix_fmt yuv420p sample-video.mp4
ffmpeg -f lavfi -i testsrc=duration=3:size=640x480:rate=30 -pix_fmt yuv420p sample-video-2.mp4
ffmpeg -f lavfi -i testsrc=duration=3:size=640x480:rate=30 -pix_fmt yuv420p sample-video-3.mp4
```

### Archivos .pkl de prueba
1. **sample-features.pkl** - Archivo pickle con features
2. **sample-features-2.pkl** - Segundo archivo pickle
3. **sample-features-3.pkl** - Tercer archivo pickle

Puedes crear archivos pickle vacíos para testing:
```python
import pickle
with open('sample-features.pkl', 'wb') as f:
    pickle.dump({'features': [0.1] * 256}, f)
```

### Archivos inválidos
1. **invalid-file.txt** - Archivo de texto para pruebas de validación
2. **invalid-image.png** - Imagen para pruebas de validación

```bash
echo "Este es un archivo de texto inválido" > invalid-file.txt
# Para la imagen, cualquier PNG pequeño funciona
```

## Nota Importante
Los archivos de video y pickle deben ser archivos reales para que Cypress pueda subirlos correctamente. Los mocks solo funcionan para las respuestas del API, no para los archivos de entrada.
