from typing import Dict, List


class SafetyAdvisor:
    """Provides safety instructions based on hazard type and evacuation time."""

    def get_instructions(self, hazard_type: str, eta_seconds: int) -> Dict:
        """
        Get safety instructions for a specific hazard type and shelter ETA.

        Args:
            hazard_type: One of AIR_RAID, DRONE, MISSILE, FLOOD, FIRE, INDUSTRIAL, SHOOTING, STORM, TSUNAMI, CHEMICAL WEAPON, BIOHAZARD, NUCLEAR, UNMARKED SOLDIERS, PANDEMIC, TERRORIST ATTACK, MASS POISONING, CYBER ATTACK, EARTHQUAKE
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
            },

            'SHOOTING': {
                'title': 'Active Shooter - Run, Hide, Fight',
                'steps': [
                    'RUN: Evacuate immediately if safe path exists',
                    'HIDE: Barricade yourself if escape impossible',
                    'Lock doors, turn off lights, silence phones',
                    'Stay quiet and out of sight',
                    'FIGHT: As last resort, work together to stop threat'
                ],
                'do_not': [
                    'Do not use elevators',
                    'Do not hide in groups in open areas',
                    'Do not make noise or use phone unless safe',
                    'Do not leave hiding place until police give all-clear'
                ],
                'eta_hint': f'Immediate action required - safe zone {eta_minutes} minutes away'
            },

            'STORM': {
                'title': 'Severe Storm - Seek Sturdy Shelter',
                'steps': [
                    'Move to interior room on lowest floor',
                    'Stay away from windows and glass doors',
                    'Avoid electrical equipment and plumbing',
                    'Listen to weather radio for updates',
                    'Prepare for power outages'
                ],
                'do_not': [
                    'Do not stay in mobile homes or vehicles',
                    'Do not use electrical appliances',
                    'Do not go outside during the storm',
                    'Do not drive unless absolutely necessary'
                ],
                'eta_hint': f'Seek shelter now - storm intensifying, safe building {eta_minutes} minutes away'
            },

            'TSUNAMI': {
                'title': 'Tsunami Warning - Move to High Ground NOW',
                'steps': [
                    'Move to high ground immediately (at least 100 feet above sea level)',
                    'Move inland at least 2 miles if possible',
                    'Use stairs, not elevators in tall buildings',
                    'Stay on high ground until all-clear given',
                    'Help others who need assistance'
                ],
                'do_not': [
                    'Do not go to the beach to watch waves',
                    'Do not wait for official warning if you feel earthquake',
                    'Do not drive unless moving to higher ground',
                    'Do not return to low areas until all-clear'
                ],
                'eta_hint': f'CRITICAL: Move to high ground - waves may arrive soon, evacuation point {eta_minutes} minutes away'
            },

            'CHEMICAL WEAPON': {
                'title': 'Chemical Weapon Attack - Protect Airways',
                'steps': [
                    'Cover nose and mouth immediately',
                    'Move to higher ground (chemicals sink)',
                    'Get indoors and seal windows/doors',
                    'Turn off ventilation systems',
                    'Remove contaminated clothing if safe'
                ],
                'do_not': [
                    'Do not touch suspicious substances',
                    'Do not use fans or air conditioning',
                    'Do not eat or drink anything potentially contaminated',
                    'Do not leave shelter until decontamination complete'
                ],
                'eta_hint': f'Immediate protection needed - decontamination facility {eta_minutes} minutes away'
            },

            'BIOHAZARD': {
                'title': 'Biological Hazard - Avoid Contamination',
                'steps': [
                    'Avoid contact with suspicious substances',
                    'Wash hands frequently with soap',
                    'Cover coughs and sneezes',
                    'Seek medical attention if symptoms develop',
                    'Follow quarantine instructions if given'
                ],
                'do_not': [
                    'Do not touch unknown substances',
                    'Do not share food, drinks, or personal items',
                    'Do not ignore symptoms (fever, breathing problems)',
                    'Do not leave quarantine area if instructed to stay'
                ],
                'eta_hint': f'Minimize exposure - medical facility {eta_minutes} minutes away'
            },

            'NUCLEAR': {
                'title': 'Nuclear Emergency - Shelter and Protect',
                'steps': [
                    'Get inside immediately and stay inside',
                    'Go to basement or center of building',
                    'Close windows and doors, turn off ventilation',
                    'Stay tuned to emergency broadcasts',
                    'Take potassium iodide if instructed by authorities'
                ],
                'do_not': [
                    'Do not go outside unless instructed by authorities',
                    'Do not use phones unless emergency',
                    'Do not eat or drink anything from outside',
                    'Do not leave shelter for at least 24 hours'
                ],
                'eta_hint': f'Shelter in place - radiation protection facility {eta_minutes} minutes away'
            },

            'UNMARKED SOLDIERS': {
                'title': 'Unmarked Military Personnel - Avoid and Report',
                'steps': [
                    'Avoid contact and leave area immediately',
                    'Document what you see if safe to do so',
                    'Report to authorities immediately',
                    'Stay indoors and away from windows',
                    'Follow official evacuation orders'
                ],
                'do_not': [
                    'Do not approach or confront personnel',
                    'Do not take photos if it puts you at risk',
                    'Do not spread unverified information',
                    'Do not ignore evacuation orders'
                ],
                'eta_hint': f'Avoid area - safe zone {eta_minutes} minutes away'
            },

            'PANDEMIC': {
                'title': 'Pandemic Alert - Protect Yourself and Others',
                'steps': [
                    'Maintain social distancing (6+ feet apart)',
                    'Wear face covering in public',
                    'Wash hands frequently for 20+ seconds',
                    'Avoid large gatherings',
                    'Stay home if feeling unwell'
                ],
                'do_not': [
                    'Do not touch face with unwashed hands',
                    'Do not attend large gatherings',
                    'Do not ignore symptoms',
                    'Do not spread misinformation'
                ],
                'eta_hint': f'Follow health protocols - medical facility {eta_minutes} minutes away if needed'
            },

            'TERRORIST ATTACK': {
                'title': 'Terrorist Attack - Run, Hide, Fight',
                'steps': [
                    'RUN: Leave area immediately if safe route exists',
                    'HIDE: Find secure location if escape impossible',
                    'Turn off lights, lock doors, silence devices',
                    'FIGHT: As last resort, work together to stop threat',
                    'Call emergency services when safe'
                ],
                'do_not': [
                    'Do not use elevators',
                    'Do not gather in open areas',
                    'Do not leave hiding place until authorities arrive',
                    'Do not approach suspicious packages or people'
                ],
                'eta_hint': f'Immediate action required - safe area {eta_minutes} minutes away'
            },

            'MASS POISONING': {
                'title': 'Mass Poisoning Event - Avoid Contamination',
                'steps': [
                    'Do not consume food or water from affected area',
                    'Seek medical attention if experiencing symptoms',
                    'Follow decontamination procedures if exposed',
                    'Report suspicious activities to authorities',
                    'Help others seek medical care'
                ],
                'do_not': [
                    'Do not eat or drink anything suspicious',
                    'Do not ignore symptoms (nausea, vomiting, dizziness)',
                    'Do not share potentially contaminated items',
                    'Do not delay seeking medical help'
                ],
                'eta_hint': f'Seek medical attention - hospital {eta_minutes} minutes away'
            },

            'CYBER ATTACK': {
                'title': 'Cyber Attack - Protect Digital Assets',
                'steps': [
                    'Disconnect from internet if systems compromised',
                    'Do not click suspicious links or attachments',
                    'Change passwords on critical accounts',
                    'Back up important data if possible',
                    'Report incident to IT security'
                ],
                'do_not': [
                    'Do not use compromised systems',
                    'Do not provide personal information to unknown sources',
                    'Do not ignore security warnings',
                    'Do not connect infected devices to networks'
                ],
                'eta_hint': f'Secure systems immediately - IT support center {eta_minutes} minutes away'
            },

            'EARTHQUAKE': {
                'title': 'Earthquake - Drop, Cover, and Hold On',
                'steps': [
                    'DROP to hands and knees immediately',
                    'COVER your head and neck under sturdy desk/table',
                    'HOLD ON to your shelter and protect yourself',
                    'Stay where you are until shaking stops completely',
                    'Exit building carefully after shaking stops if safe'
                ],
                'do_not': [
                    'Do not run outside during shaking',
                    'Do not stand in doorways (not safer than other locations)',
                    'Do not use elevators',
                    'Do not light matches or candles if you smell gas'
                ],
                'eta_hint': f'Take immediate cover - aftershocks possible, safe assembly area {eta_minutes} minutes away'
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