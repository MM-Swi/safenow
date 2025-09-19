import time
from django.core.management.base import BaseCommand
from shelters.models import Shelter
from backend.safenow.common.geo import haversine_km, eta_walk_seconds, bounding_box


class Command(BaseCommand):
    help = 'Benchmark the nearby shelters query performance'

    def add_arguments(self, parser):
        parser.add_argument('--lat', type=float, required=True,
                          help='Latitude for the benchmark query')
        parser.add_argument('--lon', type=float, required=True,
                          help='Longitude for the benchmark query')
        parser.add_argument('--n', type=int, default=1000,
                          help='Number of iterations to run (default: 1000)')

    def handle(self, *args, **options):
        user_lat = options['lat']
        user_lon = options['lon']
        iterations = options['n']
        limit = 3  # Default limit like the API

        self.stdout.write(f"Benchmarking nearby shelters query:")
        self.stdout.write(f"  Location: ({user_lat}, {user_lon})")
        self.stdout.write(f"  Iterations: {iterations}")
        self.stdout.write(f"  Limit: {limit}")
        self.stdout.write()

        # Count total shelters
        total_shelters = Shelter.objects.count()
        self.stdout.write(f"Total shelters in database: {total_shelters}")

        # Benchmark the optimized query
        total_time = 0
        results_count = 0

        for i in range(iterations):
            start_time = time.perf_counter()

            # This is the same logic as in NearbySheltersView
            min_lat, max_lat, min_lon, max_lon = bounding_box(user_lat, user_lon, 10.0)

            # Query shelters within bounding box first (uses indexes)
            shelters = Shelter.objects.filter(
                lat__gte=min_lat,
                lat__lte=max_lat,
                lon__gte=min_lon,
                lon__lte=max_lon
            )

            shelter_distances = []

            for shelter in shelters:
                distance_km = haversine_km(
                    user_lat, user_lon,
                    float(shelter.lat), float(shelter.lon)
                )
                eta_seconds = eta_walk_seconds(distance_km)

                # Add calculated fields to shelter object
                shelter.distance_km = round(distance_km, 3)
                shelter.eta_seconds = eta_seconds
                shelter_distances.append((distance_km, shelter))

            # Sort by distance and limit results
            shelter_distances.sort(key=lambda x: x[0])
            nearest_shelters = shelter_distances[:limit]

            end_time = time.perf_counter()
            query_time = (end_time - start_time) * 1000  # Convert to milliseconds
            total_time += query_time

            if i == 0:  # Store result count from first iteration
                results_count = len(nearest_shelters)
                bbox_shelters_count = len(shelter_distances)

        avg_time_ms = total_time / iterations

        self.stdout.write()
        self.stdout.write("Results:")
        self.stdout.write(f"  Shelters in bounding box: {bbox_shelters_count}")
        self.stdout.write(f"  Results returned: {results_count}")
        self.stdout.write(f"  Average query time: {avg_time_ms:.2f}ms")
        self.stdout.write(f"  Total benchmark time: {total_time:.2f}ms")

        if results_count > 0:
            # Show first result details
            first_result = nearest_shelters[0][1]
            self.stdout.write()
            self.stdout.write("Nearest shelter:")
            self.stdout.write(f"  Name: {first_result.name}")
            self.stdout.write(f"  Distance: {first_result.distance_km}km")
            self.stdout.write(f"  ETA: {first_result.eta_seconds}s")