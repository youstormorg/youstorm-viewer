#!/usr/bin/env bash
set -euo pipefail

# Start with a clean Pages staging directory.
rm -rf _site

# Create the site structure.
mkdir -p _site/data/gfs
mkdir -p _site/data/ecmwf
mkdir -p _site/data/coastline
mkdir -p _site/data/places

# Copy shared viewer files.
cp index.html _site/
cp -r css _site/
cp -r js _site/
cp -r images _site/

# Copy shared geographical data.
cp data/coastline/ne_50m_coastline.geojson \
  _site/data/coastline/

cp data/places/capitals.json \
  _site/data/places/