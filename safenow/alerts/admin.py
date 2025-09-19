from django.contrib import admin
from django.utils import timezone
from .models import Alert


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['hazard_type', 'severity', 'radius_m', 'valid_until', 'source', 'created_at']
    list_filter = ['hazard_type', 'severity']
    search_fields = ['source']
    readonly_fields = ['created_at']
    actions = ['expire_now']

    fieldsets = (
        ('Alert Details', {
            'fields': ('hazard_type', 'severity', 'source')
        }),
        ('Location & Area', {
            'fields': ('center_lat', 'center_lon', 'radius_m')
        }),
        ('Timing', {
            'fields': ('valid_until', 'created_at')
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
