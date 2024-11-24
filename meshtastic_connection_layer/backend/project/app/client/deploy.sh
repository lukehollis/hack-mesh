#!/bin/bash

# Read environment variables
TOUR_SLUG=${TOUR_SLUG:-"default_slug"}
VERSION=${VERSION:-"default_version"}
LANG=${LANG:-"default_lang"}

# Construct the destination path
DEST_PATH="gs://mused-em/${TOUR_SLUG}${VERSION}-${LANG}"

# Copy files to the destination
npm run build
gcloud storage cp -r dist/* "$DEST_PATH"
