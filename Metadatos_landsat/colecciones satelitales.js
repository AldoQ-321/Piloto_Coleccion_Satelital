
var anio = 2015;

// Límites administrativos de nivel 2.
// Verifica el nombre y la cobertura de esta fuente antes
// de utilizar el resultado como límite oficial de tu tesis.
var provincias = ee.FeatureCollection(
  'FAO/GAUL/2015/level2'
);

var sandia = provincias
  .filter(ee.Filter.eq('ADM0_NAME', 'Peru'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Puno'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Sandia'));

print('Límite encontrado para Sandia:', sandia);
print('Cantidad de polígonos:', sandia.size());

Map.centerObject(sandia, 9);
Map.addLayer(sandia, {color: 'yellow'}, 'Provincia de Sandia');

var coleccion = ee.ImageCollection(
  'LANDSAT/LC08/C02/T1_L2'
)
.filterBounds(sandia.geometry())
.filterDate(
  ee.Date.fromYMD(anio, 1, 1),
  ee.Date.fromYMD(anio + 1, 1, 1)
);

// Sin filtros de nubosidad ni procesamiento de imágenes.
print('Año:', anio);
print('Escenas que intersectan Sandia:', coleccion.size());

var lista = coleccion.toList(coleccion.size());
var indices = ee.List.sequence(0, coleccion.size().subtract(1));

var metadatos = ee.FeatureCollection(indices.map(function(i) {
  var imagen = ee.Image(lista.get(i));

  return ee.Feature(null, imagen.toDictionary())
    .set('anio_consulta', anio);
}));

Export.table.toDrive({
  collection: metadatos,
  description: 'colecciones_satelitales_' + anio,
  folder: 'METADATOS_LANDSAT8_SANDIA',
  fileNamePrefix: 'colecciones_satelitales_' + anio,
  fileFormat: 'CSV'
});
