from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from core.tenants.models import Client, Domain

class SovereignTenantViewSet(viewsets.ModelViewSet):
    """
    SaaS Super-Admin Controller for managing GRP tenants (Ministries/Institutions).
    Strictly protected: Only Super-Admins can access this endpoint.
    """
    queryset = Client.objects.all()
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        """
        Creates a new tenant and dynamically provisions their isolated Schema.
        """
        tenant_name = request.data.get('name')
        schema_name = request.data.get('schema_name')
        subdomain = request.data.get('subdomain')
        credit_limit = request.data.get('credit_limit', 0)

        # 1. Create Tenant (automatically provisions schema via django-tenants)
        tenant = Client(
            schema_name=schema_name,
            name=tenant_name,
            credit_limit=credit_limit,
            is_active=True
        )
        tenant.save()

        # 2. Attach Domain (Routing)
        domain = Domain(
            domain=f"{subdomain}.agriasset.com", 
            tenant=tenant, 
            is_primary=True
        )
        domain.save()

        return Response({
            "message": f"Tenant {tenant_name} provisioned successfully.",
            "schema": schema_name,
            "url": domain.domain
        }, status=status.HTTP_201_CREATED)

    def suspend_tenant(self, request, pk=None):
        """
        Emergency Sovereign Action: Suspend an active tenant (e.g., unpaid bills).
        """
        tenant = self.get_object()
        tenant.is_active = False
        tenant.save()
        return Response({"message": f"Tenant {tenant.name} suspended."})
