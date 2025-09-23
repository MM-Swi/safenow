from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    """
    Inline admin for UserProfile
    """
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = [
        'preferred_language',
        ('email_notifications', 'push_notifications', 'sms_notifications'),
        ('auto_location', 'alert_radius')
    ]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin with profile inline
    """
    inlines = [UserProfileInline]
    
    # Fields to display in the user list
    list_display = [
        'username',
        'email',
        'first_name',
        'last_name',
        'role',
        'is_verified',
        'is_active',
        'created_at'
    ]
    
    # Filters for the user list
    list_filter = [
        'role',
        'is_verified',
        'is_active',
        'is_staff',
        'is_superuser',
        'created_at'
    ]
    
    # Fields to search
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number']
    
    # Fields to order by
    ordering = ['-created_at']
    
    # Fieldsets for the user detail page
    fieldsets = BaseUserAdmin.fieldsets + (
        (_('SafeNow Information'), {
            'fields': ('role', 'phone_number', 'is_verified', 'created_at', 'updated_at')
        }),
    )
    
    # Fields for adding a new user
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (_('SafeNow Information'), {
            'fields': ('email', 'first_name', 'last_name', 'role', 'phone_number')
        }),
    )
    
    # Read-only fields
    readonly_fields = ['created_at', 'updated_at']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin for UserProfile model
    """
    list_display = [
        'user',
        'preferred_language',
        'email_notifications',
        'push_notifications',
        'sms_notifications',
        'auto_location',
        'alert_radius'
    ]
    
    list_filter = [
        'preferred_language',
        'email_notifications',
        'push_notifications',
        'sms_notifications',
        'auto_location'
    ]
    
    search_fields = ['user__username', 'user__email']
    
    fieldsets = [
        (_('User'), {
            'fields': ['user']
        }),
        (_('Language & Notifications'), {
            'fields': [
                'preferred_language',
                ('email_notifications', 'push_notifications', 'sms_notifications')
            ]
        }),
        (_('Location Settings'), {
            'fields': ['auto_location', 'alert_radius']
        }),
        (_('Timestamps'), {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    
    readonly_fields = ['created_at', 'updated_at']
