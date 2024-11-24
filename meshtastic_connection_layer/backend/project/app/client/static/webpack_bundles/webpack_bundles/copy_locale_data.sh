#!/bin/bash

# Define the source directory
source_dir="./locales/en/"

# Get a list of all language directories
language_dirs=$(find ./locales -mindepth 1 -maxdepth 1 -type d -name '*' -not -name 'en')

# Loop through the language directories and copy the files
for dir in $language_dirs; do
    cp "${source_dir}ui.json" "${dir}/ui.json"
    cp "${source_dir}index.js" "${dir}/index.js"
done

echo "Files copied successfully!"

