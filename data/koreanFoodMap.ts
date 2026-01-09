/**
 * Korean Food Translation Map
 * 
 * Maps Korean food names (Hangul) to English equivalents for USDA search
 * and provides common Korean dishes with nutritional estimates
 */

export interface KoreanFoodMapping {
  korean: string;          // Korean name (Hangul)
  romanized: string;       // Romanized name
  english: string;         // English translation
  searchTerms: string[];   // Alternative English search terms
  description?: string;    // Brief description
}

/**
 * Common Korean foods with English translations
 * Used to translate Korean search queries to English for USDA lookup
 */
export const KOREAN_FOOD_MAP: KoreanFoodMapping[] = [
  // Main Dishes (밥/Bap - Rice dishes)
  {
    korean: '비빔밥',
    romanized: 'bibimbap',
    english: 'Mixed Rice Bowl',
    searchTerms: ['bibimbap', 'mixed rice', 'rice bowl', 'korean rice'],
    description: 'Rice with vegetables, meat, and gochujang sauce'
  },
  {
    korean: '볶음밥',
    romanized: 'bokkeumbap',
    english: 'Fried Rice',
    searchTerms: ['fried rice', 'korean fried rice'],
  },
  {
    korean: '김밥',
    romanized: 'gimbap',
    english: 'Seaweed Rice Roll',
    searchTerms: ['gimbap', 'kimbap', 'rice roll', 'korean sushi'],
  },

  // Soups & Stews (찌개/Jjigae, 국/Guk, 탕/Tang)
  {
    korean: '김치찌개',
    romanized: 'kimchi jjigae',
    english: 'Kimchi Stew',
    searchTerms: ['kimchi stew', 'kimchi soup', 'kimchi jjigae'],
  },
  {
    korean: '된장찌개',
    romanized: 'doenjang jjigae',
    english: 'Soybean Paste Stew',
    searchTerms: ['doenjang stew', 'soybean paste stew', 'miso stew'],
  },
  {
    korean: '순두부찌개',
    romanized: 'sundubu jjigae',
    english: 'Soft Tofu Stew',
    searchTerms: ['soft tofu stew', 'sundubu', 'tofu soup'],
  },
  {
    korean: '삼계탕',
    romanized: 'samgyetang',
    english: 'Ginseng Chicken Soup',
    searchTerms: ['ginseng chicken soup', 'samgyetang', 'chicken soup'],
  },
  {
    korean: '갈비탕',
    romanized: 'galbitang',
    english: 'Beef Short Rib Soup',
    searchTerms: ['beef short rib soup', 'galbitang', 'rib soup'],
  },
  {
    korean: '설렁탕',
    romanized: 'seolleongtang',
    english: 'Ox Bone Soup',
    searchTerms: ['ox bone soup', 'seolleongtang', 'beef soup'],
  },

  // Meat Dishes (고기/Gogi)
  {
    korean: '불고기',
    romanized: 'bulgogi',
    english: 'Marinated Beef',
    searchTerms: ['bulgogi', 'korean bbq', 'marinated beef', 'beef bulgogi'],
  },
  {
    korean: '갈비',
    romanized: 'galbi',
    english: 'Grilled Short Ribs',
    searchTerms: ['galbi', 'kalbi', 'korean short ribs', 'grilled ribs'],
  },
  {
    korean: '삼겹살',
    romanized: 'samgyeopsal',
    english: 'Pork Belly',
    searchTerms: ['pork belly', 'samgyeopsal', 'korean pork'],
  },
  {
    korean: '족발',
    romanized: 'jokbal',
    english: 'Braised Pork Feet',
    searchTerms: ['jokbal', 'braised pork', 'pork feet'],
  },
  {
    korean: '보쌈',
    romanized: 'bossam',
    english: 'Boiled Pork Wraps',
    searchTerms: ['bossam', 'boiled pork', 'pork wraps'],
  },

  // Chicken Dishes (닭/Dak)
  {
    korean: '치킨',
    romanized: 'chikin',
    english: 'Korean Fried Chicken',
    searchTerms: ['korean fried chicken', 'chikin', 'fried chicken'],
  },
  {
    korean: '양념치킨',
    romanized: 'yangnyeom chikin',
    english: 'Spicy Soy Fried Chicken',
    searchTerms: ['yangnyeom chicken', 'spicy chicken', 'korean spicy chicken'],
  },
  {
    korean: '닭갈비',
    romanized: 'dakgalbi',
    english: 'Spicy Stir-Fried Chicken',
    searchTerms: ['dakgalbi', 'spicy chicken', 'stir fried chicken'],
  },

  // Chinese-Korean Dishes (중국음식/Jung-guk eumsik)
  {
    korean: '탕수육',
    romanized: 'tangsuyuk',
    english: 'Sweet and Sour Pork',
    searchTerms: ['sweet and sour pork', 'tangsuyuk', 'fried pork'],
    description: 'Korean-style sweet and sour pork with crispy batter'
  },
  {
    korean: '짜장면',
    romanized: 'jajangmyeon',
    english: 'Black Bean Noodles',
    searchTerms: ['black bean noodles', 'jajangmyeon', 'korean noodles'],
  },
  {
    korean: '짬뽕',
    romanized: 'jjamppong',
    english: 'Spicy Seafood Noodle Soup',
    searchTerms: ['jjamppong', 'spicy seafood noodles', 'spicy noodle soup'],
  },

  // Noodles (면/Myeon)
  {
    korean: '냉면',
    romanized: 'naengmyeon',
    english: 'Cold Buckwheat Noodles',
    searchTerms: ['naengmyeon', 'cold noodles', 'buckwheat noodles'],
  },
  {
    korean: '비빔냉면',
    romanized: 'bibim naengmyeon',
    english: 'Spicy Cold Noodles',
    searchTerms: ['bibim naengmyeon', 'spicy cold noodles'],
  },
  {
    korean: '칼국수',
    romanized: 'kalguksu',
    english: 'Hand-Cut Noodle Soup',
    searchTerms: ['kalguksu', 'knife noodles', 'noodle soup'],
  },
  {
    korean: '잔치국수',
    romanized: 'janchi guksu',
    english: 'Celebration Noodles',
    searchTerms: ['janchi guksu', 'thin noodles', 'noodle soup'],
  },

  // Side Dishes (반찬/Banchan)
  {
    korean: '김치',
    romanized: 'kimchi',
    english: 'Fermented Cabbage',
    searchTerms: ['kimchi', 'kimchee', 'fermented cabbage', 'korean pickle'],
  },
  {
    korean: '깍두기',
    romanized: 'kkakdugi',
    english: 'Cubed Radish Kimchi',
    searchTerms: ['kkakdugi', 'radish kimchi', 'diced kimchi'],
  },
  {
    korean: '나물',
    romanized: 'namul',
    english: 'Seasoned Vegetables',
    searchTerms: ['namul', 'seasoned vegetables', 'korean vegetables'],
  },
  {
    korean: '계란말이',
    romanized: 'gyeran mari',
    english: 'Rolled Omelette',
    searchTerms: ['korean omelette', 'gyeran mari', 'egg roll'],
  },

  // Snacks & Street Food (간식/Gansik)
  {
    korean: '떡볶이',
    romanized: 'tteokbokki',
    english: 'Spicy Rice Cakes',
    searchTerms: ['tteokbokki', 'spicy rice cakes', 'rice cake'],
  },
  {
    korean: '순대',
    romanized: 'sundae',
    english: 'Blood Sausage',
    searchTerms: ['sundae', 'korean blood sausage', 'sausage'],
  },
  {
    korean: '튀김',
    romanized: 'twigim',
    english: 'Korean Tempura',
    searchTerms: ['twigim', 'korean tempura', 'fried food'],
  },
  {
    korean: '호떡',
    romanized: 'hotteok',
    english: 'Sweet Pancake',
    searchTerms: ['hotteok', 'korean pancake', 'sweet pancake'],
  },
  {
    korean: '붕어빵',
    romanized: 'bungeoppang',
    english: 'Fish-Shaped Pastry',
    searchTerms: ['bungeoppang', 'fish bread', 'red bean pastry'],
  },

  // Seafood (해산물/Haesanmul)
  {
    korean: '생선구이',
    romanized: 'saengseon gui',
    english: 'Grilled Fish',
    searchTerms: ['grilled fish', 'korean grilled fish'],
  },
  {
    korean: '오징어볶음',
    romanized: 'ojingeo bokkeum',
    english: 'Spicy Stir-Fried Squid',
    searchTerms: ['stir fried squid', 'spicy squid', 'ojingeo'],
  },
  {
    korean: '낙지볶음',
    romanized: 'nakji bokkeum',
    english: 'Spicy Stir-Fried Octopus',
    searchTerms: ['stir fried octopus', 'spicy octopus', 'nakji'],
  },

  // Desserts (디저트/Dijeoteu)
  {
    korean: '빙수',
    romanized: 'bingsu',
    english: 'Shaved Ice Dessert',
    searchTerms: ['bingsu', 'shaved ice', 'korean shaved ice'],
  },
  {
    korean: '팥빙수',
    romanized: 'patbingsu',
    english: 'Red Bean Shaved Ice',
    searchTerms: ['patbingsu', 'red bean ice', 'shaved ice'],
  },
  {
    korean: '호박죽',
    romanized: 'hobakjuk',
    english: 'Pumpkin Porridge',
    searchTerms: ['pumpkin porridge', 'hobakjuk', 'sweet pumpkin'],
  },

  // Common Ingredients
  {
    korean: '밥',
    romanized: 'bap',
    english: 'Cooked Rice',
    searchTerms: ['rice', 'cooked rice', 'white rice'],
  },
  {
    korean: '떡',
    romanized: 'tteok',
    english: 'Rice Cake',
    searchTerms: ['rice cake', 'tteok', 'korean rice cake'],
  },
  {
    korean: '두부',
    romanized: 'dubu',
    english: 'Tofu',
    searchTerms: ['tofu', 'soybean curd'],
  },
  {
    korean: '계란',
    romanized: 'gyeran',
    english: 'Egg',
    searchTerms: ['egg', 'eggs'],
  },
];

/**
 * Translate Korean food name to English
 * Returns English translation and search terms for USDA lookup
 */
export function translateKoreanFood(koreanText: string): {
  found: boolean;
  english?: string;
  searchTerms?: string[];
  romanized?: string;
  description?: string;
} {
  const normalized = koreanText.trim().toLowerCase();
  
  // Exact match
  const exact = KOREAN_FOOD_MAP.find(
    item => item.korean.toLowerCase() === normalized ||
            item.romanized.toLowerCase() === normalized
  );
  
  if (exact) {
    return {
      found: true,
      english: exact.english,
      searchTerms: exact.searchTerms,
      romanized: exact.romanized,
      description: exact.description,
    };
  }
  
  // Partial match
  const partial = KOREAN_FOOD_MAP.find(
    item => item.korean.includes(normalized) ||
            normalized.includes(item.korean) ||
            item.romanized.toLowerCase().includes(normalized)
  );
  
  if (partial) {
    return {
      found: true,
      english: partial.english,
      searchTerms: partial.searchTerms,
      romanized: partial.romanized,
      description: partial.description,
    };
  }
  
  return { found: false };
}

/**
 * Get all search terms for a Korean food (for better USDA matching)
 */
export function getSearchTermsForKorean(koreanText: string): string[] {
  const translation = translateKoreanFood(koreanText);
  if (translation.found && translation.searchTerms) {
    return translation.searchTerms;
  }
  return [koreanText]; // Return original if no translation
}

/**
 * Check if text contains Korean characters
 */
export function hasKoreanCharacters(text: string): boolean {
  // Korean Unicode range: AC00–D7AF (Hangul Syllables)
  const koreanRegex = /[\uAC00-\uD7AF]/;
  return koreanRegex.test(text);
}

