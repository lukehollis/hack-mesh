import os
import uuid
import mimetypes
import urllib.request

from django.contrib.auth.models import AbstractUser
from django.db import models


PUBLIC = 'PUBLIC'
PRIVATE = 'PRIVATE'
PRIVACY_CHOICES = [
    (PUBLIC, 'Public'),
    (PRIVATE, 'Private'),
]




class CustomUser(AbstractUser):
    full_name = models.CharField(max_length=256, blank=True)
    title = models.CharField(max_length=1024, blank=True)
    biography = models.TextField(blank=True)
    profile_photo = models.ImageField(
        upload_to='profile_images', blank=True)
    email_verified = models.BooleanField(default=False, blank=True)
    membership = models.TextField(blank=True)

    profile_photo_google = models.TextField(blank=True)
    google_oauth_jwt = models.TextField(blank=True)

    spaces = models.ManyToManyField('Space', related_name='user_spaces', blank=True)

    def __str__(self):
        return self.username


class Tag(models.Model):
    name = models.CharField(max_length=50)
    def __str__(self):
        return self.name
        

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    default_price = models.DecimalField(max_digits=6, decimal_places=2)
    default_country = models.CharField(max_length=2, help_text="ISO 3166-1 alpha-2 country code")


class CountrySpecificPrice(models.Model):
    product = models.ForeignKey(Product, related_name='prices', on_delete=models.CASCADE)
    country_code = models.CharField(max_length=2, help_text="ISO 3166-1 alpha-2 country code")
    price = models.DecimalField(max_digits=6, decimal_places=2)

class CountryEconomicIndicator(models.Model):
    country = models.CharField(max_length=100, unique=True)
    ppp_int = models.DecimalField(max_digits=10, decimal_places=2)
    ppp_gdp_per_capita = models.DecimalField(max_digits=10, decimal_places=2)
    ppp_int_data_year = models.IntegerField()

    def __str__(self):
        return self.country
