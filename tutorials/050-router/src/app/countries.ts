/** A row of the table: a country, its capital, its continent, roughly how many people live there and its area in km². */
export interface Country {
  code: string;
  country: string;
  capital: string;
  continent: string;
  population: number;
  area: number;
}

/** The populations are rounded estimates of the last years: data of a demo, not a source. */
// prettier-ignore
export const COUNTRIES: Country[] = [
  { code: 'CZ', country: 'Czechia', capital: 'Prague', continent: 'Europe', population: 10_900_000, area: 78_871 },
  { code: 'SK', country: 'Slovakia', capital: 'Bratislava', continent: 'Europe', population: 5_420_000, area: 49_035 },
  { code: 'DE', country: 'Germany', capital: 'Berlin', continent: 'Europe', population: 84_500_000, area: 357_596 },
  { code: 'AT', country: 'Austria', capital: 'Vienna', continent: 'Europe', population: 9_160_000, area: 83_879 },
  { code: 'PL', country: 'Poland', capital: 'Warsaw', continent: 'Europe', population: 36_600_000, area: 312_696 },
  { code: 'FR', country: 'France', capital: 'Paris', continent: 'Europe', population: 68_400_000, area: 551_695 },
  { code: 'IT', country: 'Italy', capital: 'Rome', continent: 'Europe', population: 59_000_000, area: 302_068 },
  { code: 'ES', country: 'Spain', capital: 'Madrid', continent: 'Europe', population: 48_600_000, area: 505_990 },
  { code: 'GB', country: 'United Kingdom', capital: 'London', continent: 'Europe', population: 68_300_000, area: 243_610 },
  { code: 'JP', country: 'Japan', capital: 'Tokyo', continent: 'Asia', population: 124_000_000, area: 377_975 },
  { code: 'IN', country: 'India', capital: 'New Delhi', continent: 'Asia', population: 1_440_000_000, area: 3_287_263 },
  { code: 'EG', country: 'Egypt', capital: 'Cairo', continent: 'Africa', population: 107_000_000, area: 1_001_450 },
  { code: 'US', country: 'United States', capital: 'Washington, D.C.', continent: 'North America', population: 335_000_000, area: 9_833_520 },
  { code: 'CA', country: 'Canada', capital: 'Ottawa', continent: 'North America', population: 41_000_000, area: 9_984_670 },
  { code: 'BR', country: 'Brazil', capital: 'Brasília', continent: 'South America', population: 212_000_000, area: 8_515_767 },
  { code: 'AU', country: 'Australia', capital: 'Canberra', continent: 'Oceania', population: 27_200_000, area: 7_688_287 },
];
