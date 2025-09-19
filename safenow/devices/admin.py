from django.contrib import admin
from .models import Device, SafetyStatus


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['device_id', 'last_seen_at', 'push_token']
    search_fields = ['device_id']
    readonly_fields = ['device_id']
    fieldsets = (
        ('Device Information', {
            'fields': ('device_id', 'push_token')
        }),
        ('Location', {
            'fields': ('last_lat', 'last_lon', 'last_seen_at')
        }),
    )


@admin.register(SafetyStatus)
class SafetyStatusAdmin(admin.ModelAdmin):
    list_display = ['device', 'status', 'shelter', 'updated_at']
    list_filter = ['status', 'updated_at']
    search_fields = ['device__device_id']
    readonly_fields = ['updated_at']
    raw_id_fields = ['device', 'shelter']
    fieldsets = (
        ('Status Information', {
            'fields': ('device', 'status', 'shelter')
        }),
        ('Timestamp', {
            'fields': ('updated_at',)
        }),
    )
