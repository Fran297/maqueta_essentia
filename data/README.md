# Catálogo de Altiva Essentia

La fuente es `source/altiva_essentia_catalogo.xlsx`, adjuntada por la tienda. `catalog.json` es la versión normalizada compartida por Vite y Express. Para regenerarla desde la raíz del proyecto: `python3 -m pip install -r requirements-import.txt && python3 scripts/import_catalog.py`.

La planilla incluye 147 referencias (145 perfumes, 1 desodorante y 1 set), 16 registros de casa/línea, 14 valores originales de `Familia olfativa` y 16 productos destacados. En los datos fuente hay 13 precios no informados, 22 duraciones vacías o `Consultar`, 21 volúmenes sin dato y 28 años vacíos o `Consultar`; estos campos no deben completarse por inferencia. Las notas se importan como lista general, sin asignarles etapas de salida, corazón o fondo que la hoja no explicita.

La columna de fotos incluye 132 referencias y 15 filas sin nombre de archivo. El adjunto no contiene archivos de imagen y no existe una carpeta de fotos en `public/`; por eso se reutilizan el frasco Altiva y los fondos olfativos ya disponibles, evitando rutas rotas. El importador enlazará las fotos si los archivos referidos se incorporan después en `public/`.

## Fusión con "Perfiles desde PDF" (2026-10-19)

Se incorporó `Altiva_Essentia_Perfiles_desde_PDF.xlsx` (147 filas: perfil olfativo, notas por etapa, intensidad, estela, duración, perfumista y descripción).

- **Precios: no se tocaron.** `priceARS` y `priceLabel` de las 147 referencias originales quedaron exactamente iguales (verificado en el script). La planilla nueva no trae precios.
- **Coincidencias:** solo se fusionaron filas con el mismo nombre normalizado dentro de la misma casa (27 referencias). Las demás se consideran nuevas; los nombres parecidos quedaron marcados en `CAMBIOS_PERFILES.csv` como "posible equivalente".
- **Actualizado en las 27 coincidencias:** duración (`durationSource`), notas (lista general y `notasPiramide` por etapa), género (`gender`/`genderLabel`), año de lanzamiento cuando faltaba, y el bloque `perfil`. El nombre visible (`name`) se conservó; el oficial queda en `nombreOficial`.
- **Duplicados eliminados:** 7 casos donde la planilla nueva era el mismo perfume con otro nombre (ej. Aqua Dubai, Dubai Night, Mandarin Sky, Urban Elixir, Oud for Glory, Honor & Glory, Confidential Gold). El precio del registro viejo pasó al registro nuevo, y el viejo se eliminó. El detalle está en `CAMBIOS_PERFILES.csv`.
- **Nuevas sin precio:** las referencias nuevas sin precio tienen `priceARS: null` y `priceLabel: "Consultar"`. Su `family` se asignó por palabra clave a partir de la familia principal del PDF; el texto original queda en `familiaPerfil`.
- **Casas nuevas:** Paris Corner, Swiss Arabian, Orientica, Zimaya, Khadlaj, Ahmed Al Maghribi.
- **Sin cambios:** 120 referencias originales que no aparecen en el PDF (conservan precio y datos).
- `revisarPDF` conserva la columna "Revisar" de la planilla.

Archivos: `catalog.json` (fuente del sitio), `catalog.csv` (vista plana) y `CAMBIOS_PERFILES.csv` (detalle fila por fila para revisar).

**Atención:** `scripts/import_catalog.py` regenera `catalog.json` desde `data/source/altiva_essentia_catalogo.xlsx` y pisaría estos cambios. Hay que actualizar el importador antes de volver a correrlo.
