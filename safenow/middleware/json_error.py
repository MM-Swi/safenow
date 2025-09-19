import json
import logging
from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class JSONErrorMiddleware(MiddlewareMixin):
    """Middleware to return JSON error responses for API endpoints."""

    def process_exception(self, request, exception):
        """Handle exceptions and return JSON responses for API endpoints."""
        # Only handle API requests
        if not request.path.startswith('/api/'):
            return None

        logger.error(f"Exception in {request.path}: {exception}")

        # Return JSON error response
        response_data = {
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred. Please try again later.',
            'status_code': 500
        }

        if settings.DEBUG:
            response_data['debug_info'] = str(exception)
            response_data['path'] = request.path

        return JsonResponse(response_data, status=500)

    def process_response(self, request, response):
        """Convert HTML error responses to JSON for API endpoints."""
        # Only handle API requests
        if not request.path.startswith('/api/'):
            return response

        # Handle 404 errors
        if response.status_code == 404 and 'text/html' in response.get('Content-Type', ''):
            logger.warning(f"404 Not Found: {request.path}")

            response_data = {
                'error': 'Not Found',
                'message': f'The requested resource "{request.path}" was not found.',
                'status_code': 404
            }

            return JsonResponse(response_data, status=404)

        # Handle 400 errors (though these are usually already JSON from DRF)
        if response.status_code == 400 and 'text/html' in response.get('Content-Type', ''):
            logger.warning(f"400 Bad Request: {request.path}")

            response_data = {
                'error': 'Bad Request',
                'message': 'The request could not be understood by the server.',
                'status_code': 400
            }

            return JsonResponse(response_data, status=400)

        return response