oomap
=====

Mapnik 2.3.0-dev stylesheets for OOMap (as used at http://oomap.co.uk/ when zoomed in) and other raster tile layers (e.g. as used at http://bikes.oobrien.com/london/).


I use a version of https://github.com/openstreetmap/mapnik-stylesheets/blob/master/generate_tiles.py to generate sets of tiles from these stylesheets.


Note the futurecity.xml requires msttcorefonts - & you'll need to let it know where these live, e.g.:

custom_fonts_dir = '/usr/share/fonts/truetype/msttcorefonts/'

mapnik.register_fonts(custom_fonts_dir)

Examples
===

The example images come from http://tiler1.oobrien.com/[style_name]/[z]/16090/10213.png

