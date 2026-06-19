from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
from decimal import Decimal

class Client(TenantMixin):
    """
    Sovereign Tenant Model (Schema-per-Tenant).
    Each client gets a strictly isolated schema, fulfilling 100/100 Data Isolation.
    """
    name = models.CharField(max_length=100)
    created_on = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    # Financial/Billing Limits
    credit_limit = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    
    # default true, schema will be automatically created and synced when it is saved
    auto_create_schema = True

class Domain(DomainMixin):
    """
    Subdomain Routing Model.
    Routes requests (e.g., ministry1.agriasset.com) to the isolated schema.
    """
    pass
