# 🏁 Pit Wall — Fórmula 1 con OpenF1

# Como probarlo

- **Calendario por temporada** (2023 → actual) con buscador que ignora tildes y mayúsculas
  ("mexico" encuentra "México") y resumen de GP disputados y pendientes.
- **Sesiones del fin de semana** como pestañas; se abre sola la última sesión terminada.
- **Podio y tabla de tiempos**: posición, tiempo, gap, vueltas, mejor vuelta y ritmo medio.
  Abandonos (DNF), no salidas (DNS) y descalificados (DSQ) se muestran aparte.
- **Clasificación provisional**: si OpenF1 todavía no ha publicado el resultado oficial,
  la tabla se calcula ordenando a los pilotos por su mejor vuelta.
- **Estados de carga y error**: semáforo de salida animado mientras carga y "bandera roja"
  con botón de reintentar si algo falla.
- **Bonus — caché en localStorage**: cada respuesta se guarda con fecha de caducidad
  (12 h el calendario, 7 días los tiempos). Una etiqueta indica si los datos vienen
  "Desde caché" o "Recién descargado", y un botón permite vaciarla.


# Declaración de uso de IA
  Es una versión alternativa en la que he delegado todo en la IA salvo la elección de la API.

# Autopsia
  He pedido el proyecto a Claude y he borrado archivos residuales y algunas carpetas innecesarias.  
