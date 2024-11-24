import json
from django.shortcuts import render
from django.shortcuts import get_object_or_404, render, redirect

import stripe
from .models import Product
from .utils import calculate_price

def index(request):

     return render(request, 'index.twig', {
          })



def create_payment(request, product_id):
    product = Product.objects.get(id=product_id)
    country_code = request.GET.get('country_code', product.default_country)  # Example: 'US'
    price = calculate_price(product_id, country_code)
    
    # Convert price to cents for Stripe
    price_in_cents = int(price * 100)
    
    # Create a Stripe PaymentIntent
    intent = stripe.PaymentIntent.create(
        amount=price_in_cents,
        currency='usd', # or your default currency
        metadata={'product_id': product_id}
    )
    
    # Render a page to complete the payment
    return render(request, 'payments/payment_form.html', {
        'client_secret': intent.client_secret,
        'stripe_publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
        'product': product,
        'country_code': country_code,
        'price': price,
    })