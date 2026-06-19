import os
import django
from datetime import timedelta
from django.utils import timezone
import random

# Mock Django Seeding Script for SaaS GRP
def run_seeder():
    from core.tenants.models import Client, Domain
    from core.saas_admin.billing import Invoice
    
    print("🧹 Cleaning old SaaS testing data...")
    Client.objects.all().delete()
    
    print("🌱 Generating 10 Mock Ministries/Institutions...")
    ministries = [
        ("Ministry of Agriculture", "moa"),
        ("Ministry of Water", "mow"),
        ("AgriAsset Global", "global"),
        ("Regional Farming Auth", "rfa"),
        ("EcoFarms Ltd", "ecofarms"),
        ("Green Harvest Co", "greenharvest"),
        ("National Wheat Silos", "nws"),
        ("Desert Reclamation Auth", "dra"),
        ("BioAgri Tech", "bioagri"),
        ("Central Agro Bank", "agrobank"),
    ]
    
    for name, sub in ministries:
        # Create Tenant
        tenant = Client.objects.create(
            schema_name=sub,
            name=name,
            credit_limit=random.randint(50000, 500000),
            is_active=True
        )
        
        # Create Domain
        Domain.objects.create(
            domain=f"{sub}.agriasset.com",
            tenant=tenant,
            is_primary=True
        )
        
        # Generate 5 Mock Invoices per Tenant
        for i in range(5):
            status = random.choice(['PAID', 'PENDING', 'OVERDUE'])
            due_date = timezone.now().date() + timedelta(days=random.randint(-40, 30))
            
            Invoice.objects.create(
                tenant=tenant,
                amount=random.randint(1000, 10000),
                due_date=due_date,
                status=status
            )
            
    print("✅ Successfully seeded 10 Tenants and 50 Invoices.")

if __name__ == "__main__":
    # In a real environment, this would run after django.setup()
    # Mocking execution for Sovereign MCP
    print("Executing Sovereign Seed Protocol...")
    # run_seeder()
