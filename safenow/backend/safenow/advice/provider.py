from typing import Dict, List


class SafetyAdvisor:
    """Provides safety instructions and educational content based on hazard type and evacuation time."""

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

    def get_education_data(self, hazard_type: str) -> Dict:
        """
        Get educational content for a specific hazard type.

        Args:
            hazard_type: One of the supported hazard types

        Returns:
            dict: {title, description, priority, icon, practical_tips[], warning_signs[], preparation_steps[]}
        """
        education_content = {
            'AIR_RAID': {
                'title': 'Nalot',
                'description': 'Atak z powietrza przy użyciu samolotów bojowych lub bombowców.',
                'priority': 'critical',
                'icon': '✈️',
                'practical_tips': [
                    'Know the location of nearest air raid shelters',
                    'Keep emergency supplies ready at all times',
                    'Practice shelter drills regularly',
                    'Install air raid warning apps on your phone',
                    'Identify strongest rooms in your building'
                ],
                'warning_signs': [
                    'Air raid sirens sounding',
                    'Official emergency broadcasts',
                    'Aircraft sounds overhead',
                    'Explosions in the distance',
                    'Emergency service activity'
                ],
                'preparation_steps': [
                    'Locate and inspect nearby air raid shelters',
                    'Prepare emergency kit with water, food, and medical supplies',
                    'Plan evacuation routes to shelters',
                    'Install emergency alert systems',
                    'Discuss emergency plans with family members'
                ]
            },

            'DRONE': {
                'title': 'Atak dronów',
                'description': 'Atak przy użyciu bezzałogowych statków powietrznych.',
                'priority': 'high',
                'icon': '🛸',
                'practical_tips': [
                    'Avoid gathering in open areas during alerts',
                    'Keep curtains closed during drone activity',
                    'Do not point lights or lasers at drones',
                    'Stay informed through official channels',
                    'Know indoor safe areas in your building'
                ],
                'warning_signs': [
                    'Buzzing or humming sounds overhead',
                    'Small aircraft-like objects in sky',
                    'Official drone alerts',
                    'Unusual surveillance activity',
                    'Emergency service warnings'
                ],
                'preparation_steps': [
                    'Identify interior rooms away from windows',
                    'Prepare blackout materials for windows',
                    'Install emergency communication apps',
                    'Create family communication plan',
                    'Keep emergency supplies accessible'
                ]
            },

            'MISSILE': {
                'title': 'Atak rakietowy',
                'description': 'Atak przy użyciu pocisków rakietowych dalekiego zasięgu.',
                'priority': 'critical',
                'icon': '🚀',
                'practical_tips': [
                    'Learn to recognize missile warning sounds',
                    'Practice immediate shelter response',
                    'Keep emergency supplies in shelter areas',
                    'Know multiple evacuation routes',
                    'Maintain emergency communication devices'
                ],
                'warning_signs': [
                    'Missile alert sirens',
                    'Sonic booms or loud explosions',
                    'Emergency broadcast warnings',
                    'Military activity increase',
                    'Evacuation orders from authorities'
                ],
                'preparation_steps': [
                    'Identify strongest shelter locations',
                    'Stock shelter with 72-hour supplies',
                    'Install missile alert applications',
                    'Practice rapid shelter procedures',
                    'Prepare emergency contact information'
                ]
            },

            'FLOOD': {
                'title': 'Powódź',
                'description': 'Zalanie terenu wodą z rzek, opadów lub awarii infrastruktury.',
                'priority': 'high',
                'icon': '🌊',
                'practical_tips': [
                    'Know your flood risk zone',
                    'Keep sandbags and waterproof materials ready',
                    'Elevate important items above potential flood levels',
                    'Maintain emergency evacuation kit',
                    'Know multiple evacuation routes to higher ground'
                ],
                'warning_signs': [
                    'Heavy rainfall for extended periods',
                    'Rising water levels in rivers or streams',
                    'Flood warnings from meteorological services',
                    'Water backing up in storm drains',
                    'Unusual water flow patterns'
                ],
                'preparation_steps': [
                    'Create flood emergency plan',
                    'Prepare waterproof emergency kit',
                    'Identify higher ground evacuation routes',
                    'Install flood monitoring apps',
                    'Prepare home flood barriers'
                ]
            },

            'FIRE': {
                'title': 'Pożar',
                'description': 'Pożar budynków, lasów lub instalacji przemysłowych.',
                'priority': 'high',
                'icon': '🔥',
                'practical_tips': [
                    'Install and maintain smoke detectors',
                    'Keep fire extinguishers accessible',
                    'Plan and practice evacuation routes',
                    'Keep emergency ladder for upper floors',
                    'Maintain defensible space around property'
                ],
                'warning_signs': [
                    'Smell of smoke',
                    'Visible flames or glow',
                    'Fire alarms sounding',
                    'Hot surfaces or doors',
                    'Ash falling from sky'
                ],
                'preparation_steps': [
                    'Install fire safety equipment',
                    'Create and practice fire escape plan',
                    'Prepare fire emergency kit',
                    'Clear vegetation around buildings',
                    'Identify multiple exit routes'
                ]
            },

            'INDUSTRIAL': {
                'title': 'Awaria przemysłowa',
                'description': 'Awaria w zakładach przemysłowych mogąca powodować skażenie.',
                'priority': 'high',
                'icon': '⚠️',
                'practical_tips': [
                    'Know locations of nearby industrial facilities',
                    'Understand shelter-in-place procedures',
                    'Keep plastic sheeting and duct tape ready',
                    'Monitor industrial facility safety reports',
                    'Prepare air filtration materials'
                ],
                'warning_signs': [
                    'Unusual odors or chemical smells',
                    'Visible chemical clouds or vapor',
                    'Industrial facility alarms',
                    'Dead vegetation or animals',
                    'Official evacuation notices'
                ],
                'preparation_steps': [
                    'Learn about nearby industrial hazards',
                    'Prepare shelter-in-place supplies',
                    'Install emergency alert systems',
                    'Create family communication plan',
                    'Identify evacuation routes away from facilities'
                ]
            },

            'SHOOTING': {
                'title': 'Strzelanina',
                'description': 'Aktywny strzelec w miejscu publicznym lub prywatnym.',
                'priority': 'critical',
                'icon': '🔫',
                'practical_tips': [
                    'Learn Run-Hide-Fight principles',
                    'Identify exits in public places',
                    'Know how to barricade doors effectively',
                    'Practice situational awareness',
                    'Keep emergency contacts readily available'
                ],
                'warning_signs': [
                    'Gunshots or loud popping sounds',
                    'People running or screaming',
                    'Police sirens and emergency response',
                    'Lockdown announcements',
                    'Unusual aggressive behavior'
                ],
                'preparation_steps': [
                    'Learn active shooter response training',
                    'Identify safe areas in frequent locations',
                    'Practice emergency communication',
                    'Prepare mental response plans',
                    'Stay informed about local security measures'
                ]
            },

            'STORM': {
                'title': 'Burza',
                'description': 'Gwałtowne zjawiska pogodowe z silnym wiatrem i opadami.',
                'priority': 'medium',
                'icon': '⛈️',
                'practical_tips': [
                    'Monitor weather forecasts regularly',
                    'Secure outdoor furniture and objects',
                    'Keep flashlights and batteries ready',
                    'Maintain emergency food and water supplies',
                    'Know how to shut off utilities'
                ],
                'warning_signs': [
                    'Severe weather warnings',
                    'Rapidly changing weather conditions',
                    'Strong winds and heavy rain',
                    'Hail or lightning activity',
                    'Tornado sirens or warnings'
                ],
                'preparation_steps': [
                    'Create severe weather emergency plan',
                    'Prepare emergency supply kit',
                    'Identify safe rooms in your home',
                    'Install weather alert systems',
                    'Secure property against wind damage'
                ]
            },

            'TSUNAMI': {
                'title': 'Tsunami',
                'description': 'Fale tsunami zagrażające obszarom przybrzeżnym.',
                'priority': 'critical',
                'icon': '🌊',
                'practical_tips': [
                    'Know tsunami evacuation zones and routes',
                    'Understand natural warning signs',
                    'Keep emergency supplies in evacuation kit',
                    'Practice evacuation procedures regularly',
                    'Know locations of high ground'
                ],
                'warning_signs': [
                    'Strong earthquake near coast',
                    'Ocean water receding unusually',
                    'Loud roaring sound from ocean',
                    'Official tsunami warnings',
                    'Animals behaving strangely'
                ],
                'preparation_steps': [
                    'Learn tsunami evacuation routes',
                    'Prepare portable emergency kit',
                    'Identify high ground locations',
                    'Install tsunami warning apps',
                    'Practice evacuation with family'
                ]
            },

            'CHEMICAL WEAPON': {
                'title': 'Broń chemiczna',
                'description': 'Atak przy użyciu substancji chemicznych.',
                'priority': 'critical',
                'icon': '☣️',
                'practical_tips': [
                    'Keep gas masks or protective equipment ready',
                    'Know shelter-in-place procedures',
                    'Understand decontamination basics',
                    'Keep plastic sheeting and tape available',
                    'Monitor official emergency channels'
                ],
                'warning_signs': [
                    'Unusual chemical odors',
                    'People showing symptoms of poisoning',
                    'Dead animals or vegetation',
                    'Visible chemical clouds',
                    'Official chemical attack warnings'
                ],
                'preparation_steps': [
                    'Prepare chemical protection equipment',
                    'Learn shelter-in-place procedures',
                    'Create sealed room supplies',
                    'Install emergency alert systems',
                    'Prepare decontamination materials'
                ]
            },

            'BIOHAZARD': {
                'title': 'Zagrożenie biologiczne',
                'description': 'Zagrożenie substancjami biologicznymi lub chorobotwórczymi.',
                'priority': 'high',
                'icon': '☣️',
                'practical_tips': [
                    'Maintain good hygiene practices',
                    'Keep disinfectants and protective equipment',
                    'Understand quarantine procedures',
                    'Monitor health authority communications',
                    'Prepare isolation supplies'
                ],
                'warning_signs': [
                    'Unusual illness outbreaks',
                    'Official health warnings',
                    'Suspicious biological materials',
                    'Mass casualties with similar symptoms',
                    'Quarantine announcements'
                ],
                'preparation_steps': [
                    'Prepare biological protection supplies',
                    'Learn proper hygiene protocols',
                    'Create isolation area in home',
                    'Stock medical and cleaning supplies',
                    'Prepare quarantine emergency kit'
                ]
            },

            'NUCLEAR': {
                'title': 'Zagrożenie nuklearne',
                'description': 'Zagrożenie promieniowaniem nuklearnym lub radioaktywnym.',
                'priority': 'critical',
                'icon': '☢️',
                'practical_tips': [
                    'Know radiation shelter locations',
                    'Keep potassium iodide if recommended',
                    'Understand shelter-in-place for radiation',
                    'Monitor radiation detection networks',
                    'Prepare sealed shelter supplies'
                ],
                'warning_signs': [
                    'Nuclear facility alarms',
                    'Official radiation warnings',
                    'Unusual military activity',
                    'Evacuation orders near nuclear facilities',
                    'Radiation detection alerts'
                ],
                'preparation_steps': [
                    'Identify radiation shelter locations',
                    'Prepare radiation emergency kit',
                    'Learn radiation protection principles',
                    'Install radiation monitoring apps',
                    'Create sealed room for shelter'
                ]
            },

            'UNMARKED SOLDIERS': {
                'title': 'Nieoznaczeni żołnierze',
                'description': 'Obecność nieoznaczonych sił zbrojnych na terytorium.',
                'priority': 'high',
                'icon': '🪖',
                'practical_tips': [
                    'Avoid confrontation with unknown military personnel',
                    'Document safely if possible',
                    'Know official reporting channels',
                    'Stay informed through official sources',
                    'Prepare for potential evacuation'
                ],
                'warning_signs': [
                    'Unidentified military vehicles',
                    'Armed personnel without clear identification',
                    'Unusual military activity',
                    'Blocked roads or checkpoints',
                    'Official warnings about military presence'
                ],
                'preparation_steps': [
                    'Learn official military identification',
                    'Prepare emergency evacuation plan',
                    'Install secure communication apps',
                    'Create family meeting points',
                    'Keep important documents ready'
                ]
            },

            'PANDEMIC': {
                'title': 'Pandemia',
                'description': 'Rozprzestrzenianie się choroby zakaźnej na szeroką skalę.',
                'priority': 'high',
                'icon': '🦠',
                'practical_tips': [
                    'Maintain good hygiene practices',
                    'Keep face masks and sanitizers ready',
                    'Understand social distancing guidelines',
                    'Monitor health authority updates',
                    'Prepare for extended isolation'
                ],
                'warning_signs': [
                    'Increasing illness reports',
                    'Official health emergency declarations',
                    'Travel restrictions being implemented',
                    'Healthcare system strain',
                    'Mass gathering cancellations'
                ],
                'preparation_steps': [
                    'Stock medical and hygiene supplies',
                    'Prepare for extended home isolation',
                    'Create pandemic emergency plan',
                    'Install health monitoring apps',
                    'Prepare remote work/school setup'
                ]
            },

            'TERRORIST ATTACK': {
                'title': 'Atak terrorystyczny',
                'description': 'Atak terrorystyczny wymierzony w ludność cywilną.',
                'priority': 'critical',
                'icon': '💣',
                'practical_tips': [
                    'Practice situational awareness in public',
                    'Know emergency exits in buildings',
                    'Report suspicious activities',
                    'Keep emergency contacts accessible',
                    'Learn basic first aid'
                ],
                'warning_signs': [
                    'Suspicious packages or vehicles',
                    'Unusual behavior in public spaces',
                    'Increased security measures',
                    'Official terror threat warnings',
                    'Explosions or attacks nearby'
                ],
                'preparation_steps': [
                    'Learn terrorism response procedures',
                    'Prepare emergency communication plan',
                    'Identify safe areas in frequent locations',
                    'Install emergency alert apps',
                    'Practice emergency response scenarios'
                ]
            },

            'MASS POISONING': {
                'title': 'Masowe zatrucie',
                'description': 'Zatrucie dużej liczby osób substancjami toksycznymi.',
                'priority': 'high',
                'icon': '☠️',
                'practical_tips': [
                    'Know signs of poisoning',
                    'Keep activated charcoal if recommended',
                    'Understand food and water safety',
                    'Monitor health authority alerts',
                    'Prepare alternative food and water sources'
                ],
                'warning_signs': [
                    'Multiple people showing similar symptoms',
                    'Contaminated food or water reports',
                    'Official poisoning warnings',
                    'Unusual taste or smell in food/water',
                    'Mass illness at events or locations'
                ],
                'preparation_steps': [
                    'Prepare emergency food and water supplies',
                    'Learn poisoning first aid',
                    'Install food safety monitoring apps',
                    'Create contamination response plan',
                    'Keep emergency medical supplies'
                ]
            },

            'CYBER ATTACK': {
                'title': 'Atak cybernetyczny',
                'description': 'Atak na systemy informatyczne i infrastrukturę cyfrową.',
                'priority': 'medium',
                'icon': '💻',
                'practical_tips': [
                    'Keep offline backups of important data',
                    'Use strong, unique passwords',
                    'Keep cash for emergencies',
                    'Maintain paper copies of important documents',
                    'Know manual alternatives to digital systems'
                ],
                'warning_signs': [
                    'Widespread internet outages',
                    'Banking or payment system failures',
                    'Government service disruptions',
                    'Official cyber attack warnings',
                    'Unusual computer or phone behavior'
                ],
                'preparation_steps': [
                    'Create offline data backups',
                    'Prepare cash emergency fund',
                    'Install cybersecurity software',
                    'Learn manual alternatives to digital services',
                    'Create paper-based emergency plans'
                ]
            },

            'EARTHQUAKE': {
                'title': 'Trzęsienie ziemi',
                'description': 'Trzęsienie ziemi powodujące uszkodzenia budynków i infrastruktury.',
                'priority': 'high',
                'icon': '🌍',
                'practical_tips': [
                    'Secure heavy furniture and objects',
                    'Know Drop-Cover-Hold On procedure',
                    'Keep emergency supplies accessible',
                    'Identify safe spots in each room',
                    'Practice earthquake drills regularly'
                ],
                'warning_signs': [
                    'Ground shaking or trembling',
                    'Animals behaving strangely',
                    'Small foreshocks before main quake',
                    'Unusual sounds from buildings',
                    'Official earthquake warnings'
                ],
                'preparation_steps': [
                    'Secure furniture and heavy objects',
                    'Prepare earthquake emergency kit',
                    'Identify safe spots in home and workplace',
                    'Install earthquake monitoring apps',
                    'Practice Drop-Cover-Hold On drills'
                ]
            }
        }

        return education_content.get(hazard_type, {
            'title': 'Unknown Emergency',
            'description': 'Emergency type information not available.',
            'priority': 'medium',
            'icon': '⚠️',
            'practical_tips': [
                'Follow official emergency instructions',
                'Stay informed through official channels',
                'Prepare basic emergency supplies'
            ],
            'warning_signs': [
                'Official emergency warnings',
                'Unusual emergency service activity'
            ],
            'preparation_steps': [
                'Create basic emergency plan',
                'Prepare emergency supply kit',
                'Install emergency alert systems'
            ]
        })