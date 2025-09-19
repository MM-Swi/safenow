import { EmergencyData, LearningContent } from '@/types/emergency';

export const emergencyData: Record<string, EmergencyData> = {
  missile_attack: {
    type: 'missile_attack',
    title: 'Atak rakietowy',
    description: 'Wykryto nadlatujące pociski. Natychmiast udaj się do schronu.',
    instructions: [
      'Natychmiast udaj się do najbliższego schronu przeciwlotniczego',
      'Jeśli nie ma schronu, znajdź najniższe piętro budynku',
      'Unikaj okien i zewnętrznych ścian',
      'Zabierz ze sobą wodę, leki i dokumenty',
      'Pozostań w schronie do odwołania alarmu'
    ],
    shouldEvacuate: true,
    shelterType: 'missile_shelter',
    priority: 'critical',
    icon: '🚀'
  },
  drone_attack: {
    type: 'drone_attack',
    title: 'Atak dronów',
    description: 'Wykryto wrogie drony w okolicy. Znajdź bezpieczne schronienie.',
    instructions: [
      'Udaj się do wnętrza budynku',
      'Zamknij okna i zasłony',
      'Unikaj przebywania na zewnątrz',
      'Nie używaj latarki ani innych źródeł światła',
      'Słuchaj komunikatów służb ratunkowych'
    ],
    shouldEvacuate: false,
    shelterType: 'indoor_safe_room',
    priority: 'high',
    icon: '🛸'
  },
  flood: {
    type: 'flood',
    title: 'Powódź',
    description: 'Ostrzeżenie przed powodzią. Przygotuj się do ewakuacji.',
    instructions: [
      'Wyłącz prąd i gaz w domu',
      'Przenieś się na wyższe piętro',
      'Zabierz dokumenty i niezbędne rzeczy',
      'Nie wchodź do wody powyżej kolan',
      'Słuchaj instrukcji służb ratunkowych'
    ],
    shouldEvacuate: true,
    shelterType: 'high_ground',
    priority: 'high',
    icon: '🌊'
  },
  wildfire: {
    type: 'wildfire',
    title: 'Pożar lasu',
    description: 'Pożar rozprzestrzenia się w okolicy. Przygotuj się do ewakuacji.',
    instructions: [
      'Zamknij wszystkie okna i drzwi',
      'Wyłącz klimatyzację',
      'Usuń łatwopalne materiały wokół domu',
      'Przygotuj się do szybkiej ewakuacji',
      'Śledź komunikaty służb ratunkowych'
    ],
    shouldEvacuate: true,
    shelterType: 'evacuation_center',
    priority: 'high',
    icon: '🔥'
  },
  shooting: {
    type: 'shooting',
    title: 'Strzelanina',
    description: 'Zgłoszono strzelanie w okolicy. Znajdź bezpieczne miejsce.',
    instructions: [
      'Ukryj się w bezpiecznym pomieszczeniu',
      'Zablokuj drzwi',
      'Wycisz telefon',
      'Nie wychodź dopóki nie otrzymasz potwierdzenia bezpieczeństwa',
      'Zadzwoń na 112 gdy będzie bezpiecznie'
    ],
    shouldEvacuate: false,
    shelterType: 'indoor_safe_room',
    priority: 'critical',
    icon: '🔫'
  },
  earthquake: {
    type: 'earthquake',
    title: 'Trzęsienie ziemi',
    description: 'Wykryto aktywność sejsmiczną. Znajdź bezpieczne miejsce.',
    instructions: [
      'Schowaj się pod mocnym stołem lub w progu drzwi',
      'Trzymaj się z dala od okien i ciężkich przedmiotów',
      'Jeśli jesteś na zewnątrz, odejdź od budynków',
      'Po trzęsieniu sprawdź czy nie ma uszkodzeń',
      'Bądź gotowy na wstrząsy wtórne'
    ],
    shouldEvacuate: false,
    shelterType: 'indoor_safe_room',
    priority: 'high',
    icon: '🏗️'
  },
  chemical_emergency: {
    type: 'chemical_emergency',
    title: 'Zagrożenie chemiczne',
    description: 'Wykryto niebezpieczne substancje chemiczne w powietrzu.',
    instructions: [
      'Zamknij wszystkie okna i drzwi',
      'Wyłącz wentylację i klimatyzację',
      'Uszczelnij pomieszczenie taśmą',
      'Słuchaj komunikatów służb ratunkowych',
      'Nie wychodź bez maski przeciwgazowej'
    ],
    shouldEvacuate: false,
    shelterType: 'indoor_safe_room',
    priority: 'critical',
    icon: '☣️'
  },
  biological_emergency: {
    type: 'biological_emergency',
    title: 'Zagrożenie biologiczne',
    description: 'Wykryto potencjalne zagrożenie biologiczne.',
    instructions: [
      'Pozostań w domu',
      'Unikaj kontaktu z innymi osobami',
      'Często myj ręce',
      'Noś maskę ochronną',
      'Śledź komunikaty służb zdrowia'
    ],
    shouldEvacuate: false,
    shelterType: 'indoor_safe_room',
    priority: 'high',
    icon: '🦠'
  }
};

export const learningContent: LearningContent[] = [
  {
    id: 'missile_attack_learn',
    emergencyType: 'missile_attack',
    title: 'Jak przygotować się na atak rakietowy',
    description: 'Poznaj podstawowe zasady bezpieczeństwa podczas ataku rakietowego',
    content: 'Atak rakietowy to sytuacja wymagająca natychmiastowej reakcji. Najważniejsze to szybko dotrzeć do schronu i pozostać tam do odwołania alarmu.',
    tips: [
      'Zawsze miej przygotowaną torbę awaryjną',
      'Zapamiętaj lokalizację najbliższych schronów',
      'Pobierz aplikacje ostrzegawcze',
      'Przećwicz procedury z rodziną'
    ],
    preparationSteps: [
      'Przygotuj torbę awaryjną z wodą, jedzeniem i lekami',
      'Zainstaluj aplikacje ostrzegawcze',
      'Sprawdź lokalizację schronów w okolicy',
      'Przećwicz procedury ewakuacji'
    ],
    warningSigns: [
      'Sygnały alarmowe',
      'Komunikaty w mediach',
      'Powiadomienia na telefon',
      'Instrukcje służb ratunkowych'
    ]
  },
  {
    id: 'flood_learn',
    emergencyType: 'flood',
    title: 'Bezpieczeństwo podczas powodzi',
    description: 'Dowiedz się jak postępować przed, podczas i po powodzi',
    content: 'Powódź może wystąpić nagle. Kluczowe jest wczesne przygotowanie i znajomość procedur ewakuacji.',
    tips: [
      'Monitoruj prognozy pogody',
      'Przygotuj plan ewakuacji',
      'Zabezpiecz dokumenty w wodoszczelnych opakowaniach',
      'Nie próbuj przechodzić przez płynącą wodę'
    ],
    preparationSteps: [
      'Sprawdź czy mieszkasz w strefie zagrożenia powodziowego',
      'Przygotuj zestaw awaryjny',
      'Zaplanuj trasę ewakuacji',
      'Zabezpiecz dom przed zalaniem'
    ],
    warningSigns: [
      'Intensywne opady deszczu',
      'Podnoszący się poziom wody',
      'Ostrzeżenia meteorologiczne',
      'Komunikaty służb ratunkowych'
    ]
  },
  {
    id: 'wildfire_learn',
    emergencyType: 'wildfire',
    title: 'Ochrona przed pożarami lasów',
    description: 'Naucz się jak chronić siebie i swój dom przed pożarem lasu',
    content: 'Pożary lasów mogą rozprzestrzeniać się bardzo szybko. Przygotowanie i szybka reakcja mogą uratować życie.',
    tips: [
      'Stwórz strefę obronną wokół domu',
      'Usuń łatwopalne materiały',
      'Przygotuj plan ewakuacji',
      'Monitoruj komunikaty służb'
    ],
    preparationSteps: [
      'Oczyść teren wokół domu z suchej roślinności',
      'Zainstaluj system zraszaczy',
      'Przygotuj sprzęt przeciwpożarowy',
      'Zaplanuj alternatywne trasy ewakuacji'
    ],
    warningSigns: [
      'Zapach dymu',
      'Widoczne płomienie',
      'Spadający popiół',
      'Ostrzeżenia służb'
    ]
  }
];
