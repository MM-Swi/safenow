import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    """Log HTTP request method, path, status code, and duration."""

    def process_request(self, request):
        """Start timing the request."""
        request.start_time = time.time()

    def process_response(self, request, response):
        """Log the completed request."""
        if hasattr(request, 'start_time'):
            duration_ms = int((time.time() - request.start_time) * 1000)

            logger.info(
                f"{request.method} {request.path} - {response.status_code} ({duration_ms}ms)"
            )

        return response