from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='auth_register'),
    path('login/', views.LoginView.as_view(), name='auth_login'),
    path('logout/', views.LogoutView.as_view(), name='auth_logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile endpoints
    path('me/', views.UserProfileView.as_view(), name='user_profile'),
    path('preferences/', views.UserPreferencesView.as_view(), name='user_preferences'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
]
