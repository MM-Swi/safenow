from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.HealthView.as_view(), name='health'),
    path('nearby-shelters/', views.NearbySheltersView.as_view(), name='nearby-shelters'),
    path('active-alerts/', views.ActiveAlertsView.as_view(), name='active-alerts'),
    path('devices/register/', views.DeviceRegisterView.as_view(), name='device-register'),
    path('status/', views.SafetyStatusView.as_view(), name='safety-status'),
    path('simulate-alert/', views.SimulateAlertView.as_view(), name='simulate-alert'),
    path('safety-instructions/', views.SafetyInstructionsView.as_view(), name='safety-instructions'),
    path('emergency-education/', views.EmergencyEducationView.as_view(), name='emergency-education'),
]