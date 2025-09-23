from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an alert to edit it.
    Admins can edit any alert.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to the owner or admins
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is admin
        if hasattr(request.user, 'role') and request.user.role == 'ADMIN':
            return True
        
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user is the owner
        return obj.created_by == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    All authenticated users can read.
    """

    def has_permission(self, request, view):
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for admins
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is admin
        if hasattr(request.user, 'role') and request.user.role == 'ADMIN':
            return True
        
        return request.user.is_staff or request.user.is_superuser

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsAuthenticatedOrReadOnlyPublic(permissions.BasePermission):
    """
    Custom permission for alert listing - allows public read access to active alerts,
    but requires authentication for creating alerts.
    """

    def has_permission(self, request, view):
        # Allow public read access for active alerts
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Require authentication for creating alerts
        return request.user and request.user.is_authenticated


class CanVoteOnAlert(permissions.BasePermission):
    """
    Custom permission for voting on alerts.
    Users can vote on alerts they didn't create.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Users cannot vote on their own alerts
        if obj.created_by == request.user:
            return False
        
        # Users can only vote on pending, verified, or active alerts
        if obj.status not in ['PENDING', 'VERIFIED', 'ACTIVE']:
            return False
        
        return True
