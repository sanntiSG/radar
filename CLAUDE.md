CONTEXTO, PRESENTACION DE IDEA, PROYECTO, PROS Y CONTRAS, Y LIBERTAD DE PREGUNTAR TODO LO NECESARIO PARA ENTENDER Y LIBERTAD PARA SUGERIR MEJORAS O CAMBIOS QUE ENGRANDESCAN.
RADAR:
Debemos usar las siguientes skills para el frontend: skillsgpt-tasteskill, emil-desing-eng, impeccable y animate. Siempre que termines una tarea, realiza el commit de todo lo realizado, para ver cómo quedaron los cambios, y luego sigamos con la siguiente tarea, algo importante, cuando estemos cerca de terminar con el límite de la sesión, debemos finalizar rápido la última tarea que se esté realizando y dejar todo listo para que la página funcione haciendo el commit y luego continuaremos en otra sesión.

Radar — Plataforma de Detección Temprana de Señales de Mercado para Ecommerce

Objetivo

Crear una plataforma SaaS llamada Radar que permita a emprendedores, dropshippers, marketers, creadores de contenido, vendedores online y agencias detectar señales tempranas de mercado antes de que se conviertan en tendencias ampliamente conocidas.

Radar NO debe prometer encontrar productos ganadores.

Radar NO debe prometer predecir el futuro.

Radar debe identificar señales tempranas, anomalías, aceleraciones y patrones emergentes dentro del mercado digital.

El objetivo es ayudar a responder:

* ¿Qué tema está creciendo actualmente?
* ¿Qué producto comienza a repetirse de forma inusual?
* ¿Qué hashtag está acelerando su crecimiento?
* ¿Qué nicho muestra señales tempranas de expansión?
* ¿Qué tendencias tienen alta probabilidad de seguir creciendo?
* ¿Qué oportunidades están siendo ignoradas por la mayoría del mercado?

⸻

Filosofía del Producto

Inspiración visual:

* Apple
* Linear
* Notion
* Arc Browser

Características:

* Diseño minimalista.
* Mucho espacio en blanco.
* Tipografía moderna.
* Animaciones suaves.
* Transiciones fluidas.
* Dashboard elegante.
* Dark Mode.
* Diseño centrado en datos.
* Experiencia premium.
* Micro animaciones con GSAP
* Web totalmente adaptada a todos los dispositivos (RESPONSIVE) 
* Fluidez total sin sobrecargar el sitio web 

La plataforma debe transmitir simplicidad, claridad y confianza.

El usuario debe sentir que está utilizando una herramienta profesional de inteligencia de mercado.

⸻

Propuesta de Valor

Radar no compite por tener más datos.

Radar compite por interpretar mejor las señales del mercado.

La ventaja competitiva estará en:

* Detección temprana de señales.
* Análisis matemático.
* Construcción de históricos.
* Detección de anomalías.
* Predicciones probabilísticas.
* Interpretación de tendencias.

⸻

MVP

Dashboard Principal

Mostrar:

Señales Detectadas

Cada señal debe incluir:

* Nombre.
* Categoría.
* Radar Score.
* Growth Score.
* Nivel de confianza.
* Fecha de detección.
* Estado.

Ejemplos:

* Mini impresoras portátiles.
* Organizadores magnéticos.
* Botellas térmicas inteligentes.
* Luces LED inteligentes.

⸻

Tendencias Emergentes

Mostrar:

* Tendencia.
* Variación porcentual.
* Frecuencia.
* Evolución histórica.
* Nivel de interés.

⸻

Hashtags en Crecimiento

Mostrar:

* Hashtag.
* Crecimiento.
* Frecuencia.
* Momentum.
* Nivel de interés.

Ejemplos:

* #amazonfinds
* #tiktokmademebuyit
* #viralproducts
* #musthave

⸻

Productos Detectados

Extraer automáticamente:

* Nombre.
* Frecuencia.
* Crecimiento.
* Categoría.
* Evolución temporal.
* Radar Score.

⸻

Insights Automáticos

Generar observaciones automáticas.

Ejemplo:

“Las mini impresoras portátiles aparecen en 18 publicaciones con crecimiento superior al promedio durante las últimas 48 horas.”

Ejemplo:

“La categoría Gadgets muestra una aceleración positiva por tercer día consecutivo.”

⸻

Arquitectura Conceptual

Radar NO es una plataforma de scraping.

Radar es una plataforma de detección de señales.

Arquitectura:

Fuentes de Datos
↓
Adaptadores
↓
Cache Inteligente
↓
MongoDB
↓
Histórico (Snapshots)
↓
Signal Engine
↓
Motor Matemático
↓
Predicciones
↓
Radar Score
↓
Dashboard

⸻

Fuentes de Datos

El sistema debe permitir múltiples fuentes.

Ejemplos:

* TikTok
* Instagram
* YouTube Shorts
* Google Trends
* Reddit
* Pinterest
* Amazon Best Sellers
* Mercado Libre
* Shopify Trends
* Blogs especializados
* Noticias de Ecommerce

Cada fuente debe implementarse mediante adaptadores independientes.

Si una fuente deja de funcionar, el sistema debe seguir operando.

⸻

Sistema de Cache Inteligente

Radar no debe volver a procesar datos innecesariamente.

Guardar:

* Fuente.
* ID original.
* Fecha de obtención.
* Última actualización.
* Estado de procesamiento.

Objetivos:

* Reducir costos.
* Reducir tráfico.
* Evitar bloqueos.
* Mejorar escalabilidad.

⸻

Snapshots Históricos

El histórico es el activo principal de Radar.

Guardar la evolución temporal de:

* Tendencias.
* Hashtags.
* Productos.
* Categorías.

Ejemplo:

Mini Impresora

Día 1 → 120 menciones

Día 2 → 180 menciones

Día 3 → 260 menciones

Día 4 → 410 menciones

Las predicciones se construyen sobre este histórico.

⸻

Signal Engine

Antes de detectar tendencias, Radar debe detectar señales.

Ejemplos:

* Hashtag creciendo 300%.
* Producto mencionado 40 veces más que la media.
* Categoría acelerando durante varios días.
* Crecimiento simultáneo en múltiples plataformas.

Las señales alimentan:

* Alertas.
* Radar Score.
* Predicciones.
* Watchlists.

⸻

Motor Matemático

Radar NO debe depender inicialmente de IA.

El núcleo debe ser matemático.

⸻

Growth Velocity

Growth Velocity = Interacciones / Tiempo

Permite detectar crecimiento rápido.

⸻

Growth Acceleration

Acceleration = Velocidad Actual - Velocidad Anterior

Detecta aceleraciones.

⸻

Outlier Detection

Utilizar:

* Z-Score
* IQR
* Percentiles

Detectar anomalías estadísticas.

⸻

Moving Averages

Implementar:

* SMA
* EMA

Reducir ruido y detectar tendencias reales.

⸻

Trend Momentum

Variables:

* Frecuencia
* Engagement
* Crecimiento
* Aceleración
* Recencia

⸻

Trend Prediction

Modelos iniciales:

* Regresión Lineal
* Moving Average Forecast
* Exponential Smoothing

Predicciones:

* 24 horas
* 72 horas
* 7 días

⸻

Confidence Score

Mostrar:

* Low
* Medium
* High

o

* 0-100%

Toda predicción debe incluir explicación.

⸻

Radar Score

Radar Score =

30% Growth Velocity

25% Growth Acceleration

20% Frequency

15% Engagement

10% Recency

Normalizado entre 0 y 100.

⸻

Machine Learning (Fase Futura)

No implementar en el MVP.

Una vez acumulados varios meses de datos:

* Random Forest
* XGBoost
* LightGBM

Objetivos:

* Predecir continuidad de tendencias.
* Detectar patrones complejos.
* Clasificar señales.

Redes neuronales:

* LSTM
* GRU
* Modelos temporales

Solo cuando exista suficiente histórico.

⸻

Categorías

* Gadgets
* Belleza
* Fitness
* Mascotas
* Cocina
* Hogar
* Tecnología
* Moda
* Automotor
* Salud y bienestar
* ETC…

⸻

Tecnologías

Frontend

* Next.js
* React
* TypeScript
* TailwindCSS
* GSAP

⸻

Backend

* Node.js
* Express.js
* TypeScript

⸻

Base de Datos

MongoDB Atlas Free

Colecciones:

* users
* trends
* signals
* hashtags
* products
* snapshots
* alerts
* watchlists

⸻

Autenticación

Google OAuth
⸻

Hosting

Frontend:

* Netlify

Backend:

* Render

Base de datos:

* MongoDB Atlas

⸻

Adquisición de Datos

Priorizar:

1. APIs públicas gratuitas.
2. Datos públicos.
3. Google Trends.
4. RSS.
5. Scraping moderado.

Utilizar:

* Playwright
* Puppeteer

No realizar scraping masivo.

⸻

Procesamiento

Utilizar:

* node-cron
* BullMQ

Futuro:

* Redis

Frecuencias:

* Cada 2 horas.
* Cada 6 horas.
* Diario.

⸻

Inteligencia Artificial

No utilizar APIs pagas por token en el MVP y modelos de IA de pago.

Usos:

* Agrupación semántica.
* Clasificación automática.
* Resúmenes.

La plataforma debe funcionar completamente sin IA.

⸻

Funciones:

Alertas

Notificar cuando:

* Radar Score supere un valor.
* Aparezca un nuevo Outlier.
* Una tendencia acelere significativamente.

⸻

Watchlists

Guardar:

* Productos.
* Hashtags.
* Tendencias.
* Categorías.

⸻

Radar Ads

Analizar anuncios activos.

Detectar:

* Persistencia.
* Duración.
* Frecuencia.

Hipótesis:

Si un anuncio permanece activo durante semanas, existe una probabilidad elevada de que esté funcionando.

⸻

Competitor Tracking

Seguir:

* Marcas.
* Cuentas.
* Creadores.

⸻

Exportaciones

* CSV
* Excel
* PDF

⸻

Modelo de Negocio

Free

* 5 señales diarias.
* Acceso limitado.
* Sin alertas.

⸻

Pro

* Señales ilimitadas.
* Alertas.
* Watchlists.
* Exportaciones.
* Predicciones.
* Competitor Tracking.

Precio objetivo:

USD 9 - USD 29 mensuales. (Por poner un ejemplo)

⸻

Objetivo Principal

Construir una plataforma SaaS capaz de detectar señales tempranas de mercado mediante históricos temporales, análisis estadístico, modelos matemáticos y monitoreo continuo de múltiples fuentes de datos.

Radar debe ayudar a descubrir oportunidades emergentes antes de que se conviertan en tendencias evidentes, utilizando tecnologías gratuitas, arquitectura escalable y un enfoque centrado en señales, no en promesas de productos ganadores.

El principal activo estratégico de la plataforma será la acumulación de históricos y señales propias, creando una base de conocimiento difícil de replicar por futuros competidores.
PUEDES PROPONER OTRA SOLUCIÓN O IDEA, ERES LIBRE DE ELEGIR Y CONSIDERAR LA MEJOR OPCIÓN AÚN ASÍ SI DEBES CAMBIAR ALGO.
DEBES DEJAR LOS .env con las credenciales listas para que yo pueda escribirlas.
Usaremos este repositorio de github: "https://github.com/sanntiSG/radar" para los git add . - git commit -m “” y git push, etc.

ANÁLISIS DE PROS Y CONTRAS PARA TENER EN CUENTA ANTES DE DESARROLLAR:

PROS (Lo que está GENIAL)

1. Posicionamiento inteligente: "No vendemos productos ganadores, vendemos señales" es un marketing brutalmente honesto. Te protege legalmente (no prometes resultados) y te diferencia de los gurús estafadores.
2. Núcleo matemático, no IA: Usar regresión lineal, Z-Score y medias móviles en el MVP es una jugada maestra. Es barato, rápido y no depende de APIs de pago (OpenAI te hubiera dejado en bancarrota).
3. Filosofía de diseño: Apuntar a Apple/Linear es justo lo que un e-commercer quiere ver. Si la UI es fea, asumen que los datos son malos. Vas por buen camino.
4. Arquitectura por adaptadores: Esa es la única forma de escalar. Si falla TikTok, que siga Instagram. Bien pensado.

---
 CONTRAS (La REALIDAD que duele)

1. El "Scraping moderado" no existe (Tu mayor enemigo)

· Dices "priorizar APIs públicas". TikTok e Instagram NO tienen APIs públicas para escuchar menciones de productos. Las cerraron hace años.
· Para extraer "Mini impresora portátil" cada 2 horas, necesitas Scraping con Puppeteer/Playwright. Meta y TikTok banean IPs en minutos, no en días. Para hacer eso necesitas rotar proxies residenciales (que cuestan desde $300/mes). Sin inversión, tu scraper dura 2 horas vivo y luego te bloquean.
· Solución real: Tendrías que empezar SOLO con Reddit, Google Trends y RSS de blogs. Si no, estás muerto antes de nacer.

2. El Problema del "Ruido Semántico" (El talón de Aquiles)

· Tu motor matemático cuenta "frecuencias". Pero, ¿cómo sabe que "Mini impresora", "Portable printer" y "Thermal sticker maker" son el MISMO producto? Tu motor matemático las contará como 3 tendencias separadas, diluyendo la señal.
· Sin NLP (Procesamiento de Lenguaje Natural) o embeddings (que dijiste que no usarás al inicio), tu Radar Score va a ser matemáticamente perfecto, pero comercialmente inútil, porque los datos estarán fragmentados.

3. La espera del histórico es una sentencia de muerte

· Dices que el activo principal es el histórico. Para tener un Confidence Score alto necesitas semanas de snapshots.
· Problema: Durante esas 3-4 semanas, tu plataforma no tiene datos que valgan la pena. ¿Qué le muestras al primer usuario que pague? Nada. Vas a tener que regalar cuentas gratis durante 2 meses mientras tu base de datos se llena, y durante esos 2 meses tú estás pagando el hosting de Render y MongoDB sin ver un dólar.

ALGUNAS RECOMENDACIONES (no son obligatorias implementar solo para considerar):

 ¿PUEDE VENDERSE BIEN O MAL? (El veredicto comercial)

Se puede vender, PERO no a quién crees ni por el precio que piensas.

· El mercado (Dropshippers/Marketers) SÍ paga por esto. Exploding Topics y Glimpse facturan millones. Hay hambre.
· El problema es la retención: Un dropshipper paga $29/mes. Si en el primer mes no encuentra un producto que le dé dinero, cancela al día 30 y pide reembolso. La tasa de cancelación en este nicho ronda el 40-50% mensual. Con tus datos fragmentados (por el problema semántico), tus señales van a llegar 48 horas tarde o van a ser ruido. Cuando el usuario vea el producto en Radar y ya tenga 500k visualizaciones en TikTok, te odiará y te pondrá un chargeback.
· Veredicto de ventas: Podrías captar 50-100 usuarios con marketing orgánico (publicando los hallazgos en X/Twitter), pero la mayoría se irá al segundo mes porque el 80% de las "señales" no se convertirán en ventas reales (porque el mercado es irracional).

---

RECETA DE SUPERVIVENCIA (Si quieres intentarlo, solo para considerarlo no obligatorio hacerlo tal y cual si no se ve viable)

Si ignoras todo lo anterior y quieres hacerlo igual, reduce el alcance un 90% para que sea viable para 1 tío con un PC:

1. Mata el scraper de TikTok/IG. Usa solo Reddit (API gratuita) y Google Trends. Reddit es donde realmente nacen las tendencias de producto 2 semanas antes de TikTok.

2. Reduce el histórico a 7 días. No esperes 3 meses. Con 7 días de datos y una regresión lineal simple, ya tienes algo vendible