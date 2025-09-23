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
    
    # Alert management endpoints
    path('alerts/', views.AlertListCreateView.as_view(), name='alert-list-create'),
    path('alerts/<int:pk>/', views.AlertDetailView.as_view(), name='alert-detail'),
    path('alerts/<int:pk>/vote/', views.AlertVoteView.as_view(), name='alert-vote'),
    path('alerts/<int:pk>/votes/', views.AlertVoteSummaryView.as_view(), name='alert-vote-summary'),
    
    # Dashboard endpoints
    path('alerts/user/', views.UserAlertsView.as_view(), name='user-alerts'),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/votes/', views.VotingHistoryView.as_view(), name='voting-history'),
    path('dashboard/activity/', views.UserActivityView.as_view(), name='user-activity'),
    path('dashboard/notifications/', views.NotificationsView.as_view(), name='notifications'),
    path('dashboard/notifications/<int:notification_id>/read/', views.MarkNotificationReadView.as_view(), name='mark-notification-read'),
    
    # Admin endpoints
    path('admin/alerts/', views.AdminAlertManagementView.as_view(), name='admin-alert-management'),
]