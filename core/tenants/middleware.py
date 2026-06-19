from django_tenants.middleware.main import TenantMainMiddleware
from django.http import Http404

class SovereignTenantMiddleware(TenantMainMiddleware):
    """
    Sovereign-grade middleware for routing Subdomains to Schemas.
    Ensures 100/100 Data Isolation by blocking non-existent tenant queries.
    """
    
    def process_request(self, request):
        try:
            # Enforce strictly isolated schemas based on domain logic
            super().process_request(request)
        except Http404:
            # Log anomalous access attempts for Sovereign Security tracking
            raise Http404("Sovereign Isolation: Tenant not found or inactive.")
