from typing import Dict, List


class SafetyAdvisor:
    """Provides safety instructions based on hazard type and evacuation time."""

    def get_instructions(self, hazard_type: str, eta_seconds: int) -> Dict:
        """
        Get safety instructions for a specific hazard type and shelter ETA.

        Args:
            hazard_type: One of AIR_RAID, DRONE, MISSILE, FLOOD, FIRE, INDUSTRIAL
            eta_seconds: Time to reach shelter in seconds

        Returns:
            dict: {title, steps[], do_not[], eta_hint}
        """
        eta_minutes = eta_seconds // 60

        instructions = {
            'AIR_RAID': {
                'title': 'Air Raid Alert - Take Immediate Shelter',
                'steps': [
                    'Drop everything and move to shelter immediately',
                    'Stay low and avoid windows',
                    'Move to the lowest floor or basement if available',
                    'Stay away from exterior walls',
                    'Wait for all-clear signal before leaving shelter'
                ],
                'do_not': [
                    'Do not use elevators',
                    'Do not stop to gather belongings',
                    'Do not look up at aircraft',
                    'Do not leave shelter until official all-clear'
                ],
                'eta_hint': f'Move quickly - you have {eta_minutes} minutes to reach safety'
            },

            'DRONE': {
                'title': 'Hostile Drone Alert - Seek Cover',
                'steps': [
                    'Move indoors or under solid cover immediately',
                    'Stay away from windows and open areas',
                    'Avoid gathering in groups outside',
                    'Move to interior rooms if possible',
                    'Monitor official channels for updates'
                ],
                'do_not': [
                    'Do not point lasers or lights at drones',
                    'Do not gather outside to observe',
                    'Do not use flash photography',
                    'Do not ignore the alert even if drone seems distant'
                ],
                'eta_hint': f'Seek immediate cover - shelter in {eta_minutes} minutes'
            },

            'MISSILE': {
                'title': 'Incoming Missile - Take Shelter NOW',
                'steps': [
                    'Drop to ground and take cover immediately',
                    'Move to nearest solid building or shelter',
                    'Go to lowest floor, away from windows',
                    'Lie flat on ground if caught in open',
                    'Cover head and wait for impact/all-clear'
                ],
                'do_not': [
                    'Do not run in open areas',
                    'Do not waste time gathering items',
                    'Do not use vehicles unless already moving to shelter',
                    'Do not stand near windows or glass'
                ],
                'eta_hint': f'URGENT: Only {eta_minutes} minutes to reach shelter - RUN'
            },

            'FLOOD': {
                'title': 'Flood Warning - Evacuate to Higher Ground',
                'steps': [
                    'Move to higher ground immediately',
                    'Avoid walking in moving water',
                    'Stay away from storm drains and ditches',
                    'Move to upper floors if trapped in building',
                    'Signal for help if stranded'
                ],
                'do_not': [
                    'Do not drive through flooded roads',
                    'Do not walk in water over your ankles',
                    'Do not touch electrical equipment if wet',
                    'Do not ignore evacuation orders'
                ],
                'eta_hint': f'Move to high ground - {eta_minutes} minutes before conditions worsen'
            },

            'FIRE': {
                'title': 'Fire Emergency - Evacuate Safely',
                'steps': [
                    'Leave building immediately via safest exit',
                    'Stay low under smoke - crawl if necessary',
                    'Feel doors before opening - avoid hot surfaces',
                    'Use stairs, never elevators',
                    'Go to designated meeting point outside'
                ],
                'do_not': [
                    'Do not use elevators',
                    'Do not go back inside for belongings',
                    'Do not open hot doors',
                    'Do not break windows unless trapped'
                ],
                'eta_hint': f'Evacuate now - safe area {eta_minutes} minutes away'
            },

            'INDUSTRIAL': {
                'title': 'Industrial Hazard - Follow Evacuation Orders',
                'steps': [
                    'Follow official evacuation instructions',
                    'Move perpendicular to wind direction if toxic release',
                    'Stay indoors with windows/doors closed if ordered',
                    'Turn off ventilation systems',
                    'Monitor emergency broadcasts for updates'
                ],
                'do_not': [
                    'Do not approach the hazard area',
                    'Do not ignore evacuation orders',
                    'Do not use fans or air conditioning during chemical release',
                    'Do not go outside unless specifically instructed'
                ],
                'eta_hint': f'Follow evacuation plan - safe zone {eta_minutes} minutes away'
            }
        }

        return instructions.get(hazard_type, {
            'title': 'Emergency Alert - Seek Safety',
            'steps': [
                'Follow official emergency instructions',
                'Move to designated safe area',
                'Stay alert for further updates'
            ],
            'do_not': [
                'Do not ignore official warnings',
                'Do not panic'
            ],
            'eta_hint': f'Proceed to safety - {eta_minutes} minutes to shelter'
        })