import requests
import json
from django.core.management.base import BaseCommand
from app.models import Space

def check_node_images():
    spaces = Space.objects.all()
    inaccessible_images = []

    for space in spaces:
        space_data = space.space_data
        for node in space_data['nodes']:
            uuid = node['uuid']
            resolution = "1024"
            for faceI in range(6):  # Assuming there are 6 faces in the cubemap
                image_url = get_texture_url(uuid, faceI, resolution, space.version)
                print("Checking image: ", image_url)
                if not is_image_accessible(image_url):
                    print(" -- -- Inaccessible image: ", image_url)
                    inaccessible_images.append(image_url)

    with open('inaccessible_images.txt', 'w') as f:
        for image in inaccessible_images:
            f.write("%s\n" % image)

def get_texture_url(uuid, faceI, resolution="1024", version=None):
    _res = resolution
    if _res != "full":
        _res += ","
    versionPart = ''
    if version:
        versionPart = f'_{version}'
    return f'https://iiif.mused.org/spaceshare/{uuid}_face{faceI}{versionPart}.jpg/full/{_res}/0/default.jpg'

def is_image_accessible(url):
    response = requests.get(url)
    return response.status_code == 200 

def run(*args):
    check_node_images()