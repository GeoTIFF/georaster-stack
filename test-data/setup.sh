# download from https://github.com/GeoTIFF/test-data/
wget https://github.com/GeoTIFF/test-data/archive/refs/heads/main.zip -O geotiff-test-data.zip
unzip -j -o geotiff-test-data.zip "test-data-*/files/*" -d .
unzip spam2005v3r2_harvested-area_wheat_total.tiff.zip
rm geotiff-test-data.zip spam2005v3r2_harvested-area_wheat_total.tiff.zip

gdalwarp -t_srs EPSG:4326 gadas.tif gadas-4326.tif

gdal_translate -b 1 wildfires.tiff wildfires_red.tiff
gdal_translate -b 2 wildfires.tiff wildfires_green.tiff
gdal_translate -b 3 wildfires.tiff wildfires_blue.tiff

gdalwarp -t_srs EPSG:32610 wildfires_red.tiff wildfires_red_32610.tiff
gdalwarp -t_srs EPSG:3857 wildfires_green.tiff wildfires_green_3857.tiff
