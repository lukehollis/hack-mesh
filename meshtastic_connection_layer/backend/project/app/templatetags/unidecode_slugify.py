from unidecode import unidecode
from django import template
from django.template.defaultfilters import slugify

register = template.Library()

@register.filter(name='unidecode_slugify')
def unidecode_slugify(value):
    return 'empty-title' if not value else slugify(unidecode(value))
