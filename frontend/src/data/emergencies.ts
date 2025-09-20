import { LearningContent } from '@/types/emergency';

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
  },
  {
    id: 'drone_attack_learn',
    emergencyType: 'drone_attack',
    title: 'Bezpieczeństwo podczas ataku dronów',
    description: 'Poznaj zasady postępowania podczas ataku bezzałogowych statków powietrznych',
    content: 'Ataki dronów mogą być nieprzewidywalne i ciche. Kluczowe jest szybkie schronienie się w budynku i unikanie okien.',
    tips: [
      'Drony mogą być bardzo ciche - reaguj na alarmy',
      'Unikaj używania światła w nocy',
      'Pozostań z dala od okien i balkonów',
      'Nie próbuj filmować ani fotografować dronów'
    ],
    preparationSteps: [
      'Zainstaluj aplikacje ostrzegawcze na telefonie',
      'Przygotuj ciemne zasłony lub rolety',
      'Sprawdź najbezpieczniejsze pomieszczenia w domu',
      'Przećwicz szybkie przemieszczanie się do bezpiecznego miejsca'
    ],
    warningSigns: [
      'Sygnały alarmowe',
      'Dziwne dźwięki z nieba',
      'Komunikaty w mediach',
      'Instrukcje służb ratunkowych'
    ]
  },
  {
    id: 'shooting_learn',
    emergencyType: 'shooting',
    title: 'Postępowanie podczas strzelaniny',
    description: 'Naucz się zasad "Uciekaj, Ukryj się, Walcz" w sytuacji zagrożenia bronią palną',
    content: 'W przypadku strzelaniny najważniejsze są trzy zasady: uciekaj jeśli możesz, ukryj się jeśli nie możesz uciec, walcz tylko w ostateczności.',
    tips: [
      'Zawsze szukaj wyjść ewakuacyjnych',
      'Wycisz telefon ale zostaw go włączony',
      'Nie próbuj być bohaterem - priorytetem jest przeżycie',
      'Słuchaj instrukcji służb ratunkowych'
    ],
    preparationSteps: [
      'Zapamiętaj lokalizację wyjść ewakuacyjnych w miejscach publicznych',
      'Przećwicz scenariusze z rodziną',
      'Naucz się podstaw pierwszej pomocy',
      'Zapisz numery alarmowe w telefonie'
    ],
    warningSigns: [
      'Dźwięki strzałów',
      'Krzyki i panika ludzi',
      'Ludzie uciekający w jednym kierunku',
      'Komunikaty przez megafony'
    ]
  },
  {
    id: 'earthquake_learn',
    emergencyType: 'earthquake',
    title: 'Przygotowanie na trzęsienie ziemi',
    description: 'Dowiedz się jak reagować przed, podczas i po trzęsieniu ziemi',
    content: 'Trzęsienia ziemi występują bez ostrzeżenia. Kluczowe jest przygotowanie domu i znajomość zasady "Schowaj się, Przykryj, Trzymaj się".',
    tips: [
      'Pamiętaj zasadę: Schowaj się, Przykryj, Trzymaj się',
      'Nie biegaj podczas trzęsienia',
      'Unikaj wind po trzęsieniu',
      'Spodziewaj się wstrząsów wtórnych'
    ],
    preparationSteps: [
      'Przymocuj ciężkie meble do ścian',
      'Przygotuj zestaw awaryjny na 72 godziny',
      'Określ bezpieczne miejsca w każdym pomieszczeniu',
      'Przećwicz procedury z całą rodziną'
    ],
    warningSigns: [
      'Dziwne zachowanie zwierząt',
      'Małe wstrząsy poprzedzające',
      'Drgania przedmiotów',
      'Ostrzeżenia sejsmologiczne (rzadkie)'
    ]
  },
  {
    id: 'chemical_emergency_learn',
    emergencyType: 'chemical_emergency',
    title: 'Ochrona przed zagrożeniami chemicznymi',
    description: 'Poznaj sposoby ochrony przed niebezpiecznymi substancjami chemicznymi',
    content: 'Zagrożenia chemiczne mogą pochodzić z wypadków przemysłowych, transportowych lub ataków. Kluczowe jest uszczelnienie pomieszczenia i unikanie kontaktu z substancją.',
    tips: [
      'Uszczelnij pomieszczenie taśmą i folią',
      'Nie próbuj samodzielnie czyścić substancji chemicznych',
      'Zdejmij skażoną odzież przed wejściem do domu',
      'Myj się dokładnie mydłem i wodą po ekspozycji'
    ],
    preparationSteps: [
      'Przygotuj taśmę klejącą i folię plastikową',
      'Sprawdź lokalizację zakładów chemicznych w okolicy',
      'Przygotuj maski przeciwpyłowe lub mokre ręczniki',
      'Zaplanuj pokój do uszczelnienia (najlepiej na wyższym piętrze)'
    ],
    warningSigns: [
      'Dziwne zapachy w powietrzu',
      'Mgła lub kolorowe opary',
      'Martwe zwierzęta lub ptaki',
      'Ostrzeżenia służb ratunkowych'
    ]
  },
  {
    id: 'biological_emergency_learn',
    emergencyType: 'biological_emergency',
    title: 'Ochrona przed zagrożeniami biologicznymi',
    description: 'Naucz się jak chronić się przed niebezpiecznymi patogenami i chorobami zakaźnymi',
    content: 'Zagrożenia biologiczne mogą obejmować pandemie, bioterroryzm lub wycieki z laboratoriów. Podstawą ochrony jest higiena i izolacja.',
    tips: [
      'Często myj ręce mydłem przez minimum 20 sekund',
      'Unikaj dotykania twarzy',
      'Noś maskę ochronną w miejscach publicznych',
      'Zachowaj dystans od innych osób'
    ],
    preparationSteps: [
      'Przygotuj zapas masek ochronnych i rękawiczek',
      'Zrób zapas środków dezynfekujących',
      'Przygotuj leki na podstawowe dolegliwości',
      'Zaplanuj izolację w domu na kilka tygodni'
    ],
    warningSigns: [
      'Nagły wzrost zachorowań w okolicy',
      'Ostrzeżenia służb zdrowia',
      'Zamykanie szkół i miejsc publicznych',
      'Komunikaty o kwarantannie'
    ]
  }
];
