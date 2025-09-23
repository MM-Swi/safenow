from django.contrib import admin
from django.utils import timezone
from .models import Alert, AlertVote


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['hazard_type', 'severity', 'status', 'verification_score', 'created_by', 'is_official', 'valid_until', 'created_at']
    list_filter = ['hazard_type', 'severity', 'status', 'is_official', 'created_by']
    search_fields = ['source', 'created_by__username', 'created_by__email']
    readonly_fields = ['created_at', 'verification_score']
    actions = ['expire_now', 'mark_as_verified', 'mark_as_rejected', 'mark_as_official']

    fieldsets = (
        ('Alert Details', {
            'fields': ('hazard_type', 'severity', 'source', 'status', 'is_official')
        }),
        ('Location & Area', {
            'fields': ('center_lat', 'center_lon', 'radius_m')
        }),
        ('Timing', {
            'fields': ('valid_until', 'created_at')
        }),
        ('User & Verification', {
            'fields': ('created_by', 'verification_score'),
            'classes': ['collapse']
        }),
    )

    def expire_now(self, request, queryset):
        """Set valid_until to now() for selected alerts."""
        updated_count = queryset.update(valid_until=timezone.now())
        self.message_user(
            request,
            f'Successfully expired {updated_count} alert(s).'
        )
    expire_now.short_description = "Expire now"
    
    def mark_as_verified(self, request, queryset):
        """Mark selected alerts as verified."""
        updated_count = queryset.update(status='VERIFIED')
        self.message_user(
            request,
            f'Successfully marked {updated_count} alert(s) as verified.'
        )
    mark_as_verified.short_description = "Mark as verified"
    
    def mark_as_rejected(self, request, queryset):
        """Mark selected alerts as rejected."""
        updated_count = queryset.update(status='REJECTED')
        self.message_user(
            request,
            f'Successfully marked {updated_count} alert(s) as rejected.'
        )
    mark_as_rejected.short_description = "Mark as rejected"
    
    def mark_as_official(self, request, queryset):
        """Mark selected alerts as official."""
        updated_count = queryset.update(is_official=True, status='VERIFIED')
        self.message_user(
            request,
            f'Successfully marked {updated_count} alert(s) as official.'
        )
    mark_as_official.short_description = "Mark as official"


@admin.register(AlertVote)
class AlertVoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'alert', 'vote_type', 'created_at']
    list_filter = ['vote_type', 'created_at', 'alert__hazard_type']
    search_fields = ['user__username', 'user__email', 'alert__hazard_type']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Vote Details', {
            'fields': ('user', 'alert', 'vote_type')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )
