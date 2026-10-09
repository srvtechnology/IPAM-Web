export interface LocationItem {
  country: string;
  states: {
    name: string;
    cities: string[];
  }[];
}

export const COUNTRIES_DATA: LocationItem[] = [
  {
    country: "Sierra Leone",
    states: [
      {
        name: "Western Area Urban",
        cities: ["Freetown", "Wilberforce", "Aberdeen", "Brookfields", "Lumley", "Kissy", "Murray Town", "Congo Cross"],
      },
      {
        name: "Western Area Rural",
        cities: ["Waterloo", "Regent", "Goderich", "Hastings", "York", "Adonkia", "Tombo"],
      },
      {
        name: "Northern Province",
        cities: ["Makeni", "Kabala", "Magburaka", "Kamakwie", "Binkolo"],
      },
      {
        name: "Southern Province",
        cities: ["Bo", "Moyamba", "Pujehun", "Bonthe", "Mattru Jong", "Gbangbatoke"],
      },
      {
        name: "Eastern Province",
        cities: ["Kenema", "Koidu", "Kailahun", "Segbwema", "Pendembu"],
      },
      {
        name: "North West Province",
        cities: ["Port Loko", "Kambia", "Lungi", "Lunsar", "Mange Bureh"],
      },
    ],
  },
  {
    country: "Ghana",
    states: [
      {
        name: "Greater Accra",
        cities: ["Accra", "Tema", "Madina", "Legon", "East Legon", "Spintex", "Osu"],
      },
      {
        name: "Ashanti",
        cities: ["Kumasi", "Obuasi", "Ejisu", "Tafo", "Mampong"],
      },
      {
        name: "Western",
        cities: ["Sekondi-Takoradi", "Tarkwa", "Axim"],
      },
      {
        name: "Central",
        cities: ["Cape Coast", "Winneba", "Elmina", "Kasoa"],
      },
      {
        name: "Eastern",
        cities: ["Koforidua", "Akosombo", "Nkawkaw"],
      },
    ],
  },
  {
    country: "Nigeria",
    states: [
      {
        name: "Lagos State",
        cities: ["Ikeja", "Victoria Island", "Lekki", "Yaba", "Surulere", "Ikoyi", "Marina"],
      },
      {
        name: "Federal Capital Territory (Abuja)",
        cities: ["Garki", "Wuse", "Maitama", "Asokoro", "Central Business District", "Gwarinpa"],
      },
      {
        name: "Rivers State",
        cities: ["Port Harcourt", "Obio-Akpor", "Bonny Island"],
      },
      {
        name: "Oyo State",
        cities: ["Ibadan", "Ogbomosho", "Oyo"],
      },
      {
        name: "Kano State",
        cities: ["Kano City", "Fagge", "Dala", "Nassarawa"],
      },
    ],
  },
  {
    country: "United Kingdom",
    states: [
      {
        name: "Greater London",
        cities: ["London", "Westminster", "Canary Wharf", "City of London", "Croydon", "Camden"],
      },
      {
        name: "West Midlands",
        cities: ["Birmingham", "Coventry", "Wolverhampton", "Solihull"],
      },
      {
        name: "Greater Manchester",
        cities: ["Manchester", "Salford", "Bolton", "Stockport"],
      },
      {
        name: "Scotland",
        cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"],
      },
      {
        name: "Wales",
        cities: ["Cardiff", "Swansea", "Newport"],
      },
    ],
  },
  {
    country: "United States",
    states: [
      {
        name: "California",
        cities: ["San Francisco", "Silicon Valley", "Los Angeles", "San Jose", "San Diego", "Oakland"],
      },
      {
        name: "New York",
        cities: ["New York City", "Manhattan", "Brooklyn", "Albany", "Buffalo"],
      },
      {
        name: "Washington DC / Metro",
        cities: ["Washington D.C.", "Arlington", "Alexandria", "Bethesda"],
      },
      {
        name: "Texas",
        cities: ["Austin", "Houston", "Dallas", "San Antonio"],
      },
      {
        name: "Washington",
        cities: ["Seattle", "Bellevue", "Redmond"],
      },
    ],
  },
  {
    country: "Canada",
    states: [
      {
        name: "Ontario",
        cities: ["Toronto", "Ottawa", "Mississauga", "Waterloo", "Hamilton"],
      },
      {
        name: "British Columbia",
        cities: ["Vancouver", "Victoria", "Burnaby", "Richmond"],
      },
      {
        name: "Quebec",
        cities: ["Montreal", "Quebec City", "Laval"],
      },
      {
        name: "Alberta",
        cities: ["Calgary", "Edmonton"],
      },
    ],
  },
  {
    country: "Liberia",
    states: [
      {
        name: "Montserrado",
        cities: ["Monrovia", "Paynesville", "Congo Town", "Careysburg"],
      },
      {
        name: "Nimba",
        cities: ["Ganta", "Sanniquellie"],
      },
      {
        name: "Margibi",
        cities: ["Kakata", "Harbel"],
      },
    ],
  },
  {
    country: "The Gambia",
    states: [
      {
        name: "Banjul / Greater Banjul",
        cities: ["Banjul City", "Serrekunda", "Bakau", "Fajara", "Kotu"],
      },
      {
        name: "West Coast",
        cities: ["Brikama", "Gunjur"],
      },
    ],
  },
  {
    country: "Kenya",
    states: [
      {
        name: "Nairobi County",
        cities: ["Nairobi Central", "Westlands", "Kilimani", "Upper Hill", "Karen"],
      },
      {
        name: "Mombasa County",
        cities: ["Mombasa Island", "Nyali"],
      },
    ],
  },
  {
    country: "South Africa",
    states: [
      {
        name: "Gauteng",
        cities: ["Johannesburg", "Pretoria", "Sandton", "Rosebank"],
      },
      {
        name: "Western Cape",
        cities: ["Cape Town", "Stellenbosch", "Bellville"],
      },
    ],
  },
];

export function getStatesForCountry(countryName: string): string[] {
  const c = COUNTRIES_DATA.find((item) => item.country.toLowerCase() === countryName.toLowerCase());
  return c ? c.states.map((s) => s.name) : [];
}

export function getCitiesForState(countryName: string, stateName: string): string[] {
  const c = COUNTRIES_DATA.find((item) => item.country.toLowerCase() === countryName.toLowerCase());
  if (!c) return [];
  const s = c.states.find((item) => item.name.toLowerCase() === stateName.toLowerCase());
  return s ? s.cities : [];
}

export function formatLocation(city?: string | null, state?: string | null, country?: string | null): string {
  const parts = [city, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Global / Remote";
}
