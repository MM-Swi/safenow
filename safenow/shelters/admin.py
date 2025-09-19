from django.contrib import admin
from .models import Shelter


@admin.register(Shelter)
class ShelterAdmin(admin.ModelAdmin):
    list_display = ['name', 'shelter_type', 'is_open_now', 'is_verified', 'capacity', 'last_verified_at']
    list_filter = ['shelter_type', 'is_verified', 'is_open_now', 'created_at']
    search_fields = ['name', 'address']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'shelter_type', 'address')
        }),
        ('Location', {
            'fields': ('lat', 'lon')
        }),
        ('Status', {
            'fields': ('is_verified', 'is_open_now', 'capacity', 'last_verified_at')
        }),
        ('Metadata', {
            'fields': ('source', 'created_at')
        }),
    )
