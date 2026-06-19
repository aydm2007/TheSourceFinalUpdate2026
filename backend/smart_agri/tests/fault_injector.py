from django.http import JsonResponse

def fault_view(request):
    raise RuntimeError('Controlled fault injection for self‑healing test')

# Register the view for testing only when DEBUG is True
if __debug__:
    from django.urls import path
    urlpatterns = [
        path('test/fault-inject/', fault_view),
    ]
