// Country name mapping from Cyrillic/Russian to English with ISO country codes for flags
export const countryMapping: Record<string, { name: string; code: string }> = {
  // Russia foreign fighters countries
  'Непал': { name: 'Nepal', code: 'NP' },
  'Узбекистан': { name: 'Uzbekistan', code: 'UZ' },
  'Таджикистан': { name: 'Tajikistan', code: 'TJ' },
  'Кыргызстан': { name: 'Kyrgyzstan', code: 'KG' },
  'Казахстан': { name: 'Kazakhstan', code: 'KZ' },
  'Азербайджан': { name: 'Azerbaijan', code: 'AZ' },
  'Армения': { name: 'Armenia', code: 'AM' },
  'Грузия': { name: 'Georgia', code: 'GE' },
  'Беларусь': { name: 'Belarus', code: 'BY' },
  'Молдова': { name: 'Moldova', code: 'MD' },
  'Украина': { name: 'Ukraine', code: 'UA' },
  'Польша': { name: 'Poland', code: 'PL' },
  'Сербия': { name: 'Serbia', code: 'RS' },
  'США': { name: 'United States', code: 'US' },
  'Индия': { name: 'India', code: 'IN' },
  'Китай': { name: 'China', code: 'CN' },
  'Вьетнам': { name: 'Vietnam', code: 'VN' },
  'Египет': { name: 'Egypt', code: 'EG' },
  'Ирак': { name: 'Iraq', code: 'IQ' },
  'Йемен': { name: 'Yemen', code: 'YE' },
  'Куба': { name: 'Cuba', code: 'CU' },
  'Шри-Ланка': { name: 'Sri Lanka', code: 'LK' },
  'Абхазия': { name: 'Abkhazia', code: 'GE' }, // Using Georgia code as fallback
  'Южная Осетия': { name: 'South Ossetia', code: 'GE' }, // Using Georgia code as fallback
  'Приднестровье': { name: 'Transnistria', code: 'MD' }, // Using Moldova code as fallback
  'Африка': { name: 'Africa', code: 'UN' }, // Using UN code as fallback
  'Запорожская область': { name: 'Zaporizhzhia Oblast', code: 'UA' },
  'Херсонская область': { name: 'Kherson Oblast', code: 'UA' },
  
  // Ukraine mercenaries countries
  'Колумбия': { name: 'Colombia', code: 'CO' },
  'Перу': { name: 'Peru', code: 'PE' },
  'Великобритания': { name: 'United Kingdom', code: 'GB' },
  'Германия': { name: 'Germany', code: 'DE' },
  'Франция': { name: 'France', code: 'FR' },
  'Италия': { name: 'Italy', code: 'IT' },
  'Испания': { name: 'Spain', code: 'ES' },
  'Канада': { name: 'Canada', code: 'CA' },
  'Австралия': { name: 'Australia', code: 'AU' },
  'Бразилия': { name: 'Brazil', code: 'BR' },
  'Аргентина': { name: 'Argentina', code: 'AR' },
  'Чили': { name: 'Chile', code: 'CL' },
  'Мексика': { name: 'Mexico', code: 'MX' },
  'Венесуэла': { name: 'Venezuela', code: 'VE' },
  'Коста-Рика': { name: 'Costa Rica', code: 'CR' },
  'Австрия': { name: 'Austria', code: 'AT' },
  'Бельгия': { name: 'Belgium', code: 'BE' },
  'Болгария': { name: 'Bulgaria', code: 'BG' },
  'Венгрия': { name: 'Hungary', code: 'HU' },
  'Греция': { name: 'Greece', code: 'GR' },
  'Дания': { name: 'Denmark', code: 'DK' },
  'Ирландия': { name: 'Ireland', code: 'IE' },
  'Латвия': { name: 'Latvia', code: 'LV' },
  'Литва': { name: 'Lithuania', code: 'LT' },
  'Нидерланды': { name: 'Netherlands', code: 'NL' },
  'Норвегия': { name: 'Norway', code: 'NO' },
  'Португалия': { name: 'Portugal', code: 'PT' },
  'Румыния': { name: 'Romania', code: 'RO' },
  'Словакия': { name: 'Slovakia', code: 'SK' },
  'Финляндия': { name: 'Finland', code: 'FI' },
  'Хорватия': { name: 'Croatia', code: 'HR' },
  'Чехия': { name: 'Czech Republic', code: 'CZ' },
  'Швейцария': { name: 'Switzerland', code: 'CH' },
  'Швеция': { name: 'Sweden', code: 'SE' },
  'Эстония': { name: 'Estonia', code: 'EE' },
  'Албания': { name: 'Albania', code: 'AL' },
  'Израиль': { name: 'Israel', code: 'IL' },
  'Ливан': { name: 'Lebanon', code: 'LB' },
  'Сирия': { name: 'Syria', code: 'SY' },
  'Турция': { name: 'Turkey', code: 'TR' },
  'КНР': { name: 'China', code: 'CN' },
  'Тайвань (Китай)': { name: 'Taiwan', code: 'TW' },
  'Япония': { name: 'Japan', code: 'JP' },
  'Южная Корея': { name: 'South Korea', code: 'KR' },
  'Филиппины': { name: 'Philippines', code: 'PH' },
  'Южная Африка': { name: 'South Africa', code: 'ZA' },
  'Новая Зеландия': { name: 'New Zealand', code: 'NZ' },
  'Барбадос': { name: 'Barbados', code: 'BB' },
  'Россия': { name: 'Russia', code: 'RU' },
  'Французский Легион': { name: 'French Foreign Legion', code: 'FR' },
  'Неопределенно': { name: 'Unknown', code: 'UN' },
  'Unknown': { name: 'Unknown', code: 'UN' },
};

/**
 * Translates a country name from Cyrillic/Russian to English with ISO country code
 * @param countryName - The country name in Cyrillic/Russian
 * @returns Object with English name and ISO country code
 */
export function translateCountry(countryName: string | null | undefined): { name: string; code: string } {
  if (!countryName) {
    return { name: 'Unknown', code: 'UN' };
  }
  
  const mapping = countryMapping[countryName];
  if (mapping) {
    return mapping;
  }
  
  // If not found, return original with a generic code
  return { name: countryName, code: 'UN' };
}
