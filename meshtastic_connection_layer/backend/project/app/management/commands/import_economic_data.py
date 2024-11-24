import csv
from django.core.management.base import BaseCommand, CommandError
from payments.models import CountryEconomicIndicator


# usaage
# python manage.py import_economic_data path/to/your/economic_data.csv


class Command(BaseCommand):
    help = 'Imports country economic indicators from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='The CSV file path')

    def handle(self, *args, **options):
        file_path = options['csv_file']
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    country, created = CountryEconomicIndicator.objects.get_or_create(
                        country=row['country'],
                        defaults={
                            'ppp_int': row['PppINT'],
                            'ppp_gdp_per_capita': row['PppGDPPerCapita'],
                            'ppp_int_data_year': row['PppINTDataYear'],
                        }
                    )
                    if not created:
                        # Update existing records
                        country.ppp_int = row['PppINT']
                        country.ppp_gdp_per_capita = row['PppGDPPerCapita']
                        country.ppp_int_data_year = row['PppINTDataYear']
                        country.save()

                self.stdout.write(self.style.SUCCESS('Successfully imported economic data'))
        except FileNotFoundError:
            raise CommandError('File "%s" does not exist' % file_path)
