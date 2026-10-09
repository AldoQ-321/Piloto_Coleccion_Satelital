
/************************************************************
 AUDITORÍA A - METADATOS LANDSAT 8
 Año: 2015
 Área: Provincia de Sandia, Puno
 Archivo: escenas_metadata_2015.csv
************************************************************/

// 1. CARGAR EL LÍMITE PROVINCIAL DE SANDIA
var provincias = ee.FeatureCollection('FAO/GAUL/2015/level2');

var sandia = provincias
  .filter(ee.Filter.eq('ADM0_NAME', 'Peru'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Puno'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Sandia'));

print('Límite de Sandia:', sandia);
print('Cantidad de límites encontrados:', sandia.size());

Map.centerObject(sandia, 9);
Map.addLayer(sandia, {color: 'yellow'}, 'Provincia de Sandia');

// 2. CONFIGURAR EL AÑO
var anio = 2015;
var umbralNubosidad = 20;

// 3. OBTENER LAS ESCENAS LANDSAT 8 DEL AÑO
var coleccion = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(sandia.geometry())
  .filterDate(
    ee.Date.fromYMD(anio, 1, 1),
    ee.Date.fromYMD(anio + 1, 1, 1)
  );

print('Año consultado:', anio);
print('Total de escenas:', coleccion.size());

// 4. GENERAR LOS REGISTROS DE AUDITORÍA
var escenasMetadata = ee.FeatureCollection(
  coleccion.map(function(imagen) {

    var sceneId = imagen.get('LANDSAT_PRODUCT_ID');
    var sensor = imagen.get('SPACECRAFT_ID');
    var fecha = ee.Date(
      imagen.get('system:time_start')
    ).format('YYYY-MM-dd');

    var nubosidad = ee.Number(
      imagen.get('CLOUD_COVER')
    );

    var incluida = nubosidad.lte(umbralNubosidad);

    var estado = ee.String(
      ee.Algorithms.If(incluida, 'incluida', 'excluida')
    );

    var motivo = ee.String(
      ee.Algorithms.If(
        incluida,
        '',
        'Nubosidad superior al 20%'
      )
    );

    return ee.Feature(null, {
      'scene_id': sceneId,
      'sensor': sensor,
      'date': fecha,
      'cloud_cover': nubosidad,
      'year_composite': anio,
      'status': estado,
      'reason': motivo
    });
  })
);

// 5. REVISAR LOS RESULTADOS
print('Tabla de metadatos:', escenasMetadata.limit(10));

print(
  'Escenas incluidas:',
  escenasMetadata.filter(
    ee.Filter.eq('status', 'incluida')
  ).size()
);

print(
  'Escenas excluidas:',
  escenasMetadata.filter(
    ee.Filter.eq('status', 'excluida')
  ).size()
);

// 6. EXPORTAR EL CSV DE 2015
Export.table.toDrive({
  collection: escenasMetadata,
  description: 'escenas_metadata_2015',
  folder: 'AUDITORIA_LANDSAT',
  fileNamePrefix: 'escenas_metadata_2015',
  fileFormat: 'CSV',
  selectors: [
    'scene_id',
    'sensor',
    'date',
    'cloud_cover',
    'year_composite',
    'status',
    'reason'
  ]
});
