import json
import logging
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger(__name__)


def handler400(request, exception):
    """Handle 400 Bad Request errors with JSON response."""
    logger.warning(f"400 Bad Request: {request.path} - {exception}")

    response_data = {
        'error': {
            'code': 400,
            'message': 'The request could not be understood by the server.'
        }
    }

    if settings.DEBUG:
        response_data['debug_info'] = str(exception)

    return JsonResponse(response_data, status=400)


def handler404(request, exception):
    """Handle 404 Not Found errors with JSON response."""
    logger.warning(f"404 Not Found: {request.path}")

    response_data = {
        'error': {
            'code': 404,
            'message': f'The requested resource "{request.path}" was not found.'
        }
    }

    return JsonResponse(response_data, status=404)


def handler500(request):
    """Handle 500 Internal Server Error with JSON response."""
    logger.error(f"500 Internal Server Error: {request.path}")

    response_data = {
        'error': {
            'code': 500,
            'message': 'An unexpected error occurred. Please try again later.'
        }
    }

    if settings.DEBUG:
        import sys
        import traceback
        response_data['debug_info'] = traceback.format_exception(*sys.exc_info())

    return JsonResponse(response_data, status=500)