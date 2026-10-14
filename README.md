# API F1



## Cómo probarlo


## Uso de IA
IA usada para encontrar una API pública sin registros de una temática de mi interés. Al desconocer la API le pedí después que con la rúbrica de la misión me diera las clases para gestionar dicha API, de esa manera todo el código es pedido a Gemini especificando el uso que quiero dar a los datos de la API (ver pilotos por sesión, mejor vuelta, ganador, ritmo medio). Además le he pedido el css para que me configure cada card según el equipo al que corresponde un piloto. Volver a pedir el cálculo del ganador para que solo se aplique en carrera que es cuando tiene sentido.


## Autopsia
Pedí a la IA el código TS sin ";" por lo que me devolvió también con ese formato el css y se lo tuve que pedir nuevamente de forma correcta esta vez. Control de que elegir ganador solo se utilice con una carrera.
En una de las primeras versiones del código se mostraban directamente pilotos con una sesión que ni se podía saber cuál era por lo que cambio a que la vista inicial solo sea parrilla de ese año.
