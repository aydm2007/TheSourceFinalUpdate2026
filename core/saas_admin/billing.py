from django.db import models
from core.tenants.models import Client
from datetime import timedelta
from django.utils import timezone

class Invoice(models.Model):
    """
    Sovereign SaaS Billing Model.
    Strict Double-Entry compliance structure.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending Payment'),
        ('PAID', 'Paid Successfully'),
        ('OVERDUE', 'Payment Overdue'),
    )

    tenant = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='invoices')
    amount = models.DecimalField(max_digits=15, decimal_places=4)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    receipt_url = models.URLField(blank=True, null=True, help_text="Link to manual bank transfer receipt.")

    def __str__(self):
        return f"Invoice {self.id} - {self.tenant.name} - {self.status}"

def sovereign_billing_cron():
    """
    CRON TASK: Sovereign Enforcer
    Automatically suspends tenants whose invoices are OVERDUE by more than 30 days.
    """
    grace_period_date = timezone.now().date() - timedelta(days=30)
    
    overdue_invoices = Invoice.objects.filter(
        status='OVERDUE', 
        due_date__lte=grace_period_date
    )
    
    for invoice in overdue_invoices:
        tenant = invoice.tenant
        if tenant.is_active:
            tenant.is_active = False
            tenant.save()
            print(f"[SOVEREIGN-ALERT] Tenant {tenant.name} suspended automatically due to 30-day non-payment.")
