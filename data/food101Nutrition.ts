/**
 * Nutrition Database for Food-101 Categories
 * 
 * All values are per 100g unless otherwise noted.
 * Sources: USDA FoodData Central, OpenFoodFacts averages
 * 
 * Note: These are ESTIMATES for generic food types.
 * Actual nutrition will vary based on preparation and ingredients.
 */

export interface FoodNutrition {
  id: string;
  name: string;
  serving_g: number;      // Typical serving size in grams
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  sugar_100g?: number;
  fiber_100g?: number;
  sodium_mg?: number;
  source: string;
}

/**
 * Nutrition data for all 101 Food-101 categories
 */
export const FOOD_101_NUTRITION: Record<string, FoodNutrition> = {
  'apple_pie': {
    id: 'apple_pie',
    name: 'Apple Pie',
    serving_g: 125,
    calories_100g: 237,
    protein_100g: 2,
    carbs_100g: 34,
    fat_100g: 11,
    sugar_100g: 15,
    source: 'USDA'
  },
  'baby_back_ribs': {
    id: 'baby_back_ribs',
    name: 'Baby Back Ribs',
    serving_g: 150,
    calories_100g: 292,
    protein_100g: 24,
    carbs_100g: 0,
    fat_100g: 21,
    source: 'USDA'
  },
  'baklava': {
    id: 'baklava',
    name: 'Baklava',
    serving_g: 78,
    calories_100g: 428,
    protein_100g: 6,
    carbs_100g: 43,
    fat_100g: 26,
    sugar_100g: 28,
    source: 'USDA'
  },
  'beef_carpaccio': {
    id: 'beef_carpaccio',
    name: 'Beef Carpaccio',
    serving_g: 100,
    calories_100g: 143,
    protein_100g: 22,
    carbs_100g: 0,
    fat_100g: 6,
    source: 'Estimated'
  },
  'beef_tartare': {
    id: 'beef_tartare',
    name: 'Beef Tartare',
    serving_g: 150,
    calories_100g: 170,
    protein_100g: 21,
    carbs_100g: 2,
    fat_100g: 9,
    source: 'Estimated'
  },
  'beet_salad': {
    id: 'beet_salad',
    name: 'Beet Salad',
    serving_g: 150,
    calories_100g: 74,
    protein_100g: 2,
    carbs_100g: 10,
    fat_100g: 3,
    fiber_100g: 2,
    source: 'Estimated'
  },
  'beignets': {
    id: 'beignets',
    name: 'Beignets',
    serving_g: 85,
    calories_100g: 353,
    protein_100g: 6,
    carbs_100g: 44,
    fat_100g: 17,
    sugar_100g: 12,
    source: 'USDA'
  },
  'bibimbap': {
    id: 'bibimbap',
    name: 'Bibimbap',
    serving_g: 400,
    calories_100g: 130,
    protein_100g: 7,
    carbs_100g: 17,
    fat_100g: 4,
    source: 'Estimated'
  },
  'bread_pudding': {
    id: 'bread_pudding',
    name: 'Bread Pudding',
    serving_g: 135,
    calories_100g: 187,
    protein_100g: 5,
    carbs_100g: 27,
    fat_100g: 7,
    sugar_100g: 15,
    source: 'USDA'
  },
  'breakfast_burrito': {
    id: 'breakfast_burrito',
    name: 'Breakfast Burrito',
    serving_g: 200,
    calories_100g: 189,
    protein_100g: 9,
    carbs_100g: 18,
    fat_100g: 9,
    source: 'USDA'
  },
  'bruschetta': {
    id: 'bruschetta',
    name: 'Bruschetta',
    serving_g: 100,
    calories_100g: 186,
    protein_100g: 4,
    carbs_100g: 24,
    fat_100g: 8,
    source: 'Estimated'
  },
  'caesar_salad': {
    id: 'caesar_salad',
    name: 'Caesar Salad',
    serving_g: 200,
    calories_100g: 127,
    protein_100g: 4,
    carbs_100g: 7,
    fat_100g: 10,
    source: 'USDA'
  },
  'cannoli': {
    id: 'cannoli',
    name: 'Cannoli',
    serving_g: 100,
    calories_100g: 369,
    protein_100g: 8,
    carbs_100g: 40,
    fat_100g: 20,
    sugar_100g: 25,
    source: 'Estimated'
  },
  'caprese_salad': {
    id: 'caprese_salad',
    name: 'Caprese Salad',
    serving_g: 200,
    calories_100g: 150,
    protein_100g: 9,
    carbs_100g: 4,
    fat_100g: 11,
    source: 'Estimated'
  },
  'carrot_cake': {
    id: 'carrot_cake',
    name: 'Carrot Cake',
    serving_g: 100,
    calories_100g: 408,
    protein_100g: 4,
    carbs_100g: 48,
    fat_100g: 23,
    sugar_100g: 32,
    source: 'USDA'
  },
  'ceviche': {
    id: 'ceviche',
    name: 'Ceviche',
    serving_g: 150,
    calories_100g: 84,
    protein_100g: 14,
    carbs_100g: 4,
    fat_100g: 1,
    source: 'Estimated'
  },
  'cheese_plate': {
    id: 'cheese_plate',
    name: 'Cheese Plate',
    serving_g: 100,
    calories_100g: 350,
    protein_100g: 22,
    carbs_100g: 2,
    fat_100g: 28,
    source: 'USDA avg'
  },
  'cheesecake': {
    id: 'cheesecake',
    name: 'Cheesecake',
    serving_g: 125,
    calories_100g: 321,
    protein_100g: 6,
    carbs_100g: 26,
    fat_100g: 22,
    sugar_100g: 18,
    source: 'USDA'
  },
  'chicken_curry': {
    id: 'chicken_curry',
    name: 'Chicken Curry',
    serving_g: 250,
    calories_100g: 150,
    protein_100g: 12,
    carbs_100g: 8,
    fat_100g: 8,
    source: 'USDA'
  },
  'chicken_quesadilla': {
    id: 'chicken_quesadilla',
    name: 'Chicken Quesadilla',
    serving_g: 180,
    calories_100g: 236,
    protein_100g: 14,
    carbs_100g: 18,
    fat_100g: 12,
    source: 'USDA'
  },
  'chicken_wings': {
    id: 'chicken_wings',
    name: 'Chicken Wings',
    serving_g: 100,
    calories_100g: 290,
    protein_100g: 27,
    carbs_100g: 0,
    fat_100g: 19,
    source: 'USDA'
  },
  'chocolate_cake': {
    id: 'chocolate_cake',
    name: 'Chocolate Cake',
    serving_g: 100,
    calories_100g: 389,
    protein_100g: 5,
    carbs_100g: 51,
    fat_100g: 19,
    sugar_100g: 35,
    source: 'USDA'
  },
  'chocolate_mousse': {
    id: 'chocolate_mousse',
    name: 'Chocolate Mousse',
    serving_g: 100,
    calories_100g: 267,
    protein_100g: 4,
    carbs_100g: 26,
    fat_100g: 16,
    sugar_100g: 22,
    source: 'USDA'
  },
  'churros': {
    id: 'churros',
    name: 'Churros',
    serving_g: 100,
    calories_100g: 363,
    protein_100g: 4,
    carbs_100g: 44,
    fat_100g: 19,
    sugar_100g: 15,
    source: 'Estimated'
  },
  'clam_chowder': {
    id: 'clam_chowder',
    name: 'Clam Chowder',
    serving_g: 250,
    calories_100g: 76,
    protein_100g: 3,
    carbs_100g: 8,
    fat_100g: 4,
    source: 'USDA'
  },
  'club_sandwich': {
    id: 'club_sandwich',
    name: 'Club Sandwich',
    serving_g: 280,
    calories_100g: 223,
    protein_100g: 14,
    carbs_100g: 17,
    fat_100g: 11,
    source: 'USDA'
  },
  'crab_cakes': {
    id: 'crab_cakes',
    name: 'Crab Cakes',
    serving_g: 100,
    calories_100g: 193,
    protein_100g: 17,
    carbs_100g: 10,
    fat_100g: 9,
    source: 'USDA'
  },
  'creme_brulee': {
    id: 'creme_brulee',
    name: 'Crème Brûlée',
    serving_g: 120,
    calories_100g: 263,
    protein_100g: 4,
    carbs_100g: 24,
    fat_100g: 17,
    sugar_100g: 20,
    source: 'Estimated'
  },
  'croque_madame': {
    id: 'croque_madame',
    name: 'Croque Madame',
    serving_g: 200,
    calories_100g: 267,
    protein_100g: 15,
    carbs_100g: 16,
    fat_100g: 16,
    source: 'Estimated'
  },
  'cup_cakes': {
    id: 'cup_cakes',
    name: 'Cupcakes',
    serving_g: 65,
    calories_100g: 389,
    protein_100g: 4,
    carbs_100g: 58,
    fat_100g: 16,
    sugar_100g: 38,
    source: 'USDA'
  },
  'deviled_eggs': {
    id: 'deviled_eggs',
    name: 'Deviled Eggs',
    serving_g: 62,
    calories_100g: 210,
    protein_100g: 11,
    carbs_100g: 1,
    fat_100g: 18,
    source: 'USDA'
  },
  'donuts': {
    id: 'donuts',
    name: 'Donuts',
    serving_g: 60,
    calories_100g: 421,
    protein_100g: 5,
    carbs_100g: 49,
    fat_100g: 23,
    sugar_100g: 22,
    source: 'USDA'
  },
  'dumplings': {
    id: 'dumplings',
    name: 'Dumplings',
    serving_g: 100,
    calories_100g: 211,
    protein_100g: 7,
    carbs_100g: 27,
    fat_100g: 8,
    source: 'USDA'
  },
  'edamame': {
    id: 'edamame',
    name: 'Edamame',
    serving_g: 100,
    calories_100g: 121,
    protein_100g: 12,
    carbs_100g: 9,
    fat_100g: 5,
    fiber_100g: 5,
    source: 'USDA'
  },
  'eggs_benedict': {
    id: 'eggs_benedict',
    name: 'Eggs Benedict',
    serving_g: 250,
    calories_100g: 196,
    protein_100g: 10,
    carbs_100g: 11,
    fat_100g: 12,
    source: 'Estimated'
  },
  'escargots': {
    id: 'escargots',
    name: 'Escargots',
    serving_g: 100,
    calories_100g: 173,
    protein_100g: 16,
    carbs_100g: 2,
    fat_100g: 11,
    source: 'USDA'
  },
  'falafel': {
    id: 'falafel',
    name: 'Falafel',
    serving_g: 100,
    calories_100g: 333,
    protein_100g: 13,
    carbs_100g: 32,
    fat_100g: 18,
    fiber_100g: 5,
    source: 'USDA'
  },
  'filet_mignon': {
    id: 'filet_mignon',
    name: 'Filet Mignon',
    serving_g: 170,
    calories_100g: 267,
    protein_100g: 26,
    carbs_100g: 0,
    fat_100g: 17,
    source: 'USDA'
  },
  'fish_and_chips': {
    id: 'fish_and_chips',
    name: 'Fish and Chips',
    serving_g: 300,
    calories_100g: 236,
    protein_100g: 12,
    carbs_100g: 24,
    fat_100g: 11,
    source: 'USDA'
  },
  'foie_gras': {
    id: 'foie_gras',
    name: 'Foie Gras',
    serving_g: 50,
    calories_100g: 462,
    protein_100g: 11,
    carbs_100g: 4,
    fat_100g: 44,
    source: 'USDA'
  },
  'french_fries': {
    id: 'french_fries',
    name: 'French Fries',
    serving_g: 100,
    calories_100g: 312,
    protein_100g: 3,
    carbs_100g: 41,
    fat_100g: 15,
    source: 'USDA'
  },
  'french_onion_soup': {
    id: 'french_onion_soup',
    name: 'French Onion Soup',
    serving_g: 250,
    calories_100g: 55,
    protein_100g: 3,
    carbs_100g: 5,
    fat_100g: 3,
    source: 'USDA'
  },
  'french_toast': {
    id: 'french_toast',
    name: 'French Toast',
    serving_g: 125,
    calories_100g: 229,
    protein_100g: 8,
    carbs_100g: 26,
    fat_100g: 10,
    sugar_100g: 8,
    source: 'USDA'
  },
  'fried_calamari': {
    id: 'fried_calamari',
    name: 'Fried Calamari',
    serving_g: 100,
    calories_100g: 175,
    protein_100g: 18,
    carbs_100g: 8,
    fat_100g: 8,
    source: 'USDA'
  },
  'fried_rice': {
    id: 'fried_rice',
    name: 'Fried Rice',
    serving_g: 200,
    calories_100g: 163,
    protein_100g: 4,
    carbs_100g: 25,
    fat_100g: 5,
    source: 'USDA'
  },
  'frozen_yogurt': {
    id: 'frozen_yogurt',
    name: 'Frozen Yogurt',
    serving_g: 100,
    calories_100g: 127,
    protein_100g: 3,
    carbs_100g: 24,
    fat_100g: 2,
    sugar_100g: 21,
    source: 'USDA'
  },
  'garlic_bread': {
    id: 'garlic_bread',
    name: 'Garlic Bread',
    serving_g: 50,
    calories_100g: 350,
    protein_100g: 8,
    carbs_100g: 40,
    fat_100g: 17,
    source: 'Estimated'
  },
  'gnocchi': {
    id: 'gnocchi',
    name: 'Gnocchi',
    serving_g: 150,
    calories_100g: 133,
    protein_100g: 3,
    carbs_100g: 27,
    fat_100g: 1,
    source: 'USDA'
  },
  'greek_salad': {
    id: 'greek_salad',
    name: 'Greek Salad',
    serving_g: 200,
    calories_100g: 105,
    protein_100g: 4,
    carbs_100g: 6,
    fat_100g: 8,
    fiber_100g: 2,
    source: 'USDA'
  },
  'grilled_cheese_sandwich': {
    id: 'grilled_cheese_sandwich',
    name: 'Grilled Cheese Sandwich',
    serving_g: 120,
    calories_100g: 312,
    protein_100g: 12,
    carbs_100g: 26,
    fat_100g: 18,
    source: 'USDA'
  },
  'grilled_salmon': {
    id: 'grilled_salmon',
    name: 'Grilled Salmon',
    serving_g: 150,
    calories_100g: 208,
    protein_100g: 25,
    carbs_100g: 0,
    fat_100g: 12,
    source: 'USDA'
  },
  'guacamole': {
    id: 'guacamole',
    name: 'Guacamole',
    serving_g: 30,
    calories_100g: 157,
    protein_100g: 2,
    carbs_100g: 9,
    fat_100g: 14,
    fiber_100g: 7,
    source: 'USDA'
  },
  'gyoza': {
    id: 'gyoza',
    name: 'Gyoza',
    serving_g: 100,
    calories_100g: 211,
    protein_100g: 7,
    carbs_100g: 27,
    fat_100g: 8,
    source: 'USDA'
  },
  'hamburger': {
    id: 'hamburger',
    name: 'Hamburger',
    serving_g: 226,
    calories_100g: 295,
    protein_100g: 17,
    carbs_100g: 24,
    fat_100g: 14,
    sugar_100g: 5,
    source: 'USDA'
  },
  'hot_and_sour_soup': {
    id: 'hot_and_sour_soup',
    name: 'Hot and Sour Soup',
    serving_g: 250,
    calories_100g: 34,
    protein_100g: 2,
    carbs_100g: 4,
    fat_100g: 1,
    source: 'USDA'
  },
  'hot_dog': {
    id: 'hot_dog',
    name: 'Hot Dog',
    serving_g: 150,
    calories_100g: 247,
    protein_100g: 10,
    carbs_100g: 18,
    fat_100g: 15,
    source: 'USDA'
  },
  'huevos_rancheros': {
    id: 'huevos_rancheros',
    name: 'Huevos Rancheros',
    serving_g: 300,
    calories_100g: 143,
    protein_100g: 8,
    carbs_100g: 12,
    fat_100g: 7,
    source: 'Estimated'
  },
  'hummus': {
    id: 'hummus',
    name: 'Hummus',
    serving_g: 30,
    calories_100g: 166,
    protein_100g: 8,
    carbs_100g: 14,
    fat_100g: 10,
    fiber_100g: 6,
    source: 'USDA'
  },
  'ice_cream': {
    id: 'ice_cream',
    name: 'Ice Cream',
    serving_g: 100,
    calories_100g: 207,
    protein_100g: 4,
    carbs_100g: 24,
    fat_100g: 11,
    sugar_100g: 21,
    source: 'USDA'
  },
  'lasagna': {
    id: 'lasagna',
    name: 'Lasagna',
    serving_g: 250,
    calories_100g: 135,
    protein_100g: 8,
    carbs_100g: 14,
    fat_100g: 5,
    source: 'USDA'
  },
  'lobster_bisque': {
    id: 'lobster_bisque',
    name: 'Lobster Bisque',
    serving_g: 250,
    calories_100g: 82,
    protein_100g: 4,
    carbs_100g: 6,
    fat_100g: 5,
    source: 'Estimated'
  },
  'lobster_roll_sandwich': {
    id: 'lobster_roll_sandwich',
    name: 'Lobster Roll',
    serving_g: 200,
    calories_100g: 193,
    protein_100g: 15,
    carbs_100g: 17,
    fat_100g: 7,
    source: 'Estimated'
  },
  'macaroni_and_cheese': {
    id: 'macaroni_and_cheese',
    name: 'Macaroni and Cheese',
    serving_g: 200,
    calories_100g: 164,
    protein_100g: 7,
    carbs_100g: 18,
    fat_100g: 7,
    source: 'USDA'
  },
  'macarons': {
    id: 'macarons',
    name: 'Macarons',
    serving_g: 40,
    calories_100g: 400,
    protein_100g: 5,
    carbs_100g: 65,
    fat_100g: 14,
    sugar_100g: 55,
    source: 'Estimated'
  },
  'miso_soup': {
    id: 'miso_soup',
    name: 'Miso Soup',
    serving_g: 250,
    calories_100g: 16,
    protein_100g: 1,
    carbs_100g: 2,
    fat_100g: 0.5,
    source: 'USDA'
  },
  'mussels': {
    id: 'mussels',
    name: 'Mussels',
    serving_g: 150,
    calories_100g: 86,
    protein_100g: 12,
    carbs_100g: 4,
    fat_100g: 2,
    source: 'USDA'
  },
  'nachos': {
    id: 'nachos',
    name: 'Nachos',
    serving_g: 200,
    calories_100g: 306,
    protein_100g: 9,
    carbs_100g: 32,
    fat_100g: 16,
    source: 'USDA'
  },
  'omelette': {
    id: 'omelette',
    name: 'Omelette',
    serving_g: 150,
    calories_100g: 154,
    protein_100g: 11,
    carbs_100g: 1,
    fat_100g: 12,
    source: 'USDA'
  },
  'onion_rings': {
    id: 'onion_rings',
    name: 'Onion Rings',
    serving_g: 100,
    calories_100g: 332,
    protein_100g: 4,
    carbs_100g: 38,
    fat_100g: 18,
    source: 'USDA'
  },
  'oysters': {
    id: 'oysters',
    name: 'Oysters',
    serving_g: 100,
    calories_100g: 81,
    protein_100g: 9,
    carbs_100g: 5,
    fat_100g: 2,
    source: 'USDA'
  },
  'pad_thai': {
    id: 'pad_thai',
    name: 'Pad Thai',
    serving_g: 250,
    calories_100g: 165,
    protein_100g: 7,
    carbs_100g: 23,
    fat_100g: 5,
    source: 'USDA'
  },
  'paella': {
    id: 'paella',
    name: 'Paella',
    serving_g: 300,
    calories_100g: 130,
    protein_100g: 8,
    carbs_100g: 16,
    fat_100g: 4,
    source: 'Estimated'
  },
  'pancakes': {
    id: 'pancakes',
    name: 'Pancakes',
    serving_g: 150,
    calories_100g: 227,
    protein_100g: 6,
    carbs_100g: 35,
    fat_100g: 7,
    sugar_100g: 10,
    source: 'USDA'
  },
  'panna_cotta': {
    id: 'panna_cotta',
    name: 'Panna Cotta',
    serving_g: 120,
    calories_100g: 240,
    protein_100g: 3,
    carbs_100g: 20,
    fat_100g: 17,
    sugar_100g: 18,
    source: 'Estimated'
  },
  'peking_duck': {
    id: 'peking_duck',
    name: 'Peking Duck',
    serving_g: 150,
    calories_100g: 337,
    protein_100g: 19,
    carbs_100g: 2,
    fat_100g: 28,
    source: 'USDA'
  },
  'pho': {
    id: 'pho',
    name: 'Pho',
    serving_g: 400,
    calories_100g: 48,
    protein_100g: 4,
    carbs_100g: 6,
    fat_100g: 1,
    source: 'USDA'
  },
  'pizza': {
    id: 'pizza',
    name: 'Pizza (Cheese)',
    serving_g: 107,
    calories_100g: 266,
    protein_100g: 11,
    carbs_100g: 33,
    fat_100g: 10,
    sugar_100g: 3.6,
    source: 'USDA'
  },
  'pork_chop': {
    id: 'pork_chop',
    name: 'Pork Chop',
    serving_g: 150,
    calories_100g: 231,
    protein_100g: 25,
    carbs_100g: 0,
    fat_100g: 14,
    source: 'USDA'
  },
  'poutine': {
    id: 'poutine',
    name: 'Poutine',
    serving_g: 300,
    calories_100g: 180,
    protein_100g: 6,
    carbs_100g: 20,
    fat_100g: 9,
    source: 'Estimated'
  },
  'prime_rib': {
    id: 'prime_rib',
    name: 'Prime Rib',
    serving_g: 200,
    calories_100g: 291,
    protein_100g: 23,
    carbs_100g: 0,
    fat_100g: 22,
    source: 'USDA'
  },
  'pulled_pork_sandwich': {
    id: 'pulled_pork_sandwich',
    name: 'Pulled Pork Sandwich',
    serving_g: 200,
    calories_100g: 215,
    protein_100g: 16,
    carbs_100g: 18,
    fat_100g: 9,
    source: 'USDA'
  },
  'ramen': {
    id: 'ramen',
    name: 'Ramen',
    serving_g: 450,
    calories_100g: 73,
    protein_100g: 5,
    carbs_100g: 10,
    fat_100g: 2,
    source: 'Estimated'
  },
  'ravioli': {
    id: 'ravioli',
    name: 'Ravioli',
    serving_g: 200,
    calories_100g: 165,
    protein_100g: 7,
    carbs_100g: 24,
    fat_100g: 4,
    source: 'USDA'
  },
  'red_velvet_cake': {
    id: 'red_velvet_cake',
    name: 'Red Velvet Cake',
    serving_g: 100,
    calories_100g: 367,
    protein_100g: 4,
    carbs_100g: 50,
    fat_100g: 17,
    sugar_100g: 34,
    source: 'Estimated'
  },
  'risotto': {
    id: 'risotto',
    name: 'Risotto',
    serving_g: 200,
    calories_100g: 130,
    protein_100g: 3,
    carbs_100g: 21,
    fat_100g: 4,
    source: 'USDA'
  },
  'samosa': {
    id: 'samosa',
    name: 'Samosa',
    serving_g: 100,
    calories_100g: 308,
    protein_100g: 5,
    carbs_100g: 33,
    fat_100g: 17,
    source: 'USDA'
  },
  'sashimi': {
    id: 'sashimi',
    name: 'Sashimi',
    serving_g: 100,
    calories_100g: 127,
    protein_100g: 26,
    carbs_100g: 0,
    fat_100g: 2,
    source: 'USDA'
  },
  'scallops': {
    id: 'scallops',
    name: 'Scallops',
    serving_g: 100,
    calories_100g: 111,
    protein_100g: 21,
    carbs_100g: 3,
    fat_100g: 1,
    source: 'USDA'
  },
  'seaweed_salad': {
    id: 'seaweed_salad',
    name: 'Seaweed Salad',
    serving_g: 100,
    calories_100g: 70,
    protein_100g: 2,
    carbs_100g: 9,
    fat_100g: 3,
    fiber_100g: 3,
    source: 'Estimated'
  },
  'shrimp_and_grits': {
    id: 'shrimp_and_grits',
    name: 'Shrimp and Grits',
    serving_g: 250,
    calories_100g: 115,
    protein_100g: 8,
    carbs_100g: 10,
    fat_100g: 5,
    source: 'Estimated'
  },
  'spaghetti_bolognese': {
    id: 'spaghetti_bolognese',
    name: 'Spaghetti Bolognese',
    serving_g: 300,
    calories_100g: 132,
    protein_100g: 6,
    carbs_100g: 17,
    fat_100g: 4,
    source: 'USDA'
  },
  'spaghetti_carbonara': {
    id: 'spaghetti_carbonara',
    name: 'Spaghetti Carbonara',
    serving_g: 300,
    calories_100g: 189,
    protein_100g: 9,
    carbs_100g: 20,
    fat_100g: 8,
    source: 'Estimated'
  },
  'spring_rolls': {
    id: 'spring_rolls',
    name: 'Spring Rolls',
    serving_g: 100,
    calories_100g: 231,
    protein_100g: 5,
    carbs_100g: 26,
    fat_100g: 12,
    source: 'USDA'
  },
  'steak': {
    id: 'steak',
    name: 'Steak',
    serving_g: 200,
    calories_100g: 271,
    protein_100g: 26,
    carbs_100g: 0,
    fat_100g: 18,
    source: 'USDA'
  },
  'strawberry_shortcake': {
    id: 'strawberry_shortcake',
    name: 'Strawberry Shortcake',
    serving_g: 150,
    calories_100g: 243,
    protein_100g: 3,
    carbs_100g: 35,
    fat_100g: 10,
    sugar_100g: 20,
    source: 'Estimated'
  },
  'sushi': {
    id: 'sushi',
    name: 'Sushi',
    serving_g: 150,
    calories_100g: 150,
    protein_100g: 6,
    carbs_100g: 27,
    fat_100g: 2,
    source: 'USDA'
  },
  'tacos': {
    id: 'tacos',
    name: 'Tacos',
    serving_g: 150,
    calories_100g: 226,
    protein_100g: 11,
    carbs_100g: 20,
    fat_100g: 11,
    source: 'USDA'
  },
  'takoyaki': {
    id: 'takoyaki',
    name: 'Takoyaki',
    serving_g: 100,
    calories_100g: 175,
    protein_100g: 5,
    carbs_100g: 22,
    fat_100g: 7,
    source: 'Estimated'
  },
  'tiramisu': {
    id: 'tiramisu',
    name: 'Tiramisu',
    serving_g: 150,
    calories_100g: 283,
    protein_100g: 5,
    carbs_100g: 30,
    fat_100g: 16,
    sugar_100g: 22,
    source: 'USDA'
  },
  'tuna_tartare': {
    id: 'tuna_tartare',
    name: 'Tuna Tartare',
    serving_g: 150,
    calories_100g: 130,
    protein_100g: 24,
    carbs_100g: 1,
    fat_100g: 3,
    source: 'Estimated'
  },
  'waffles': {
    id: 'waffles',
    name: 'Waffles',
    serving_g: 100,
    calories_100g: 291,
    protein_100g: 7,
    carbs_100g: 33,
    fat_100g: 15,
    sugar_100g: 5,
    source: 'USDA'
  },
};

/**
 * Get nutrition data by food ID
 */
export function getNutritionById(id: string): FoodNutrition | undefined {
  return FOOD_101_NUTRITION[id];
}

/**
 * Get all food names for search/display
 */
export function getAllFoodNames(): { id: string; name: string }[] {
  return Object.values(FOOD_101_NUTRITION).map(food => ({
    id: food.id,
    name: food.name,
  }));
}

/**
 * Calculate nutrition for a specific portion
 */
export function calculatePortionNutrition(
  food: FoodNutrition,
  portionGrams: number
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
} {
  const multiplier = portionGrams / 100;
  return {
    calories: Math.round(food.calories_100g * multiplier),
    protein: Math.round(food.protein_100g * multiplier * 10) / 10,
    carbs: Math.round(food.carbs_100g * multiplier * 10) / 10,
    fat: Math.round(food.fat_100g * multiplier * 10) / 10,
    sugar: food.sugar_100g ? Math.round(food.sugar_100g * multiplier * 10) / 10 : undefined,
  };
}




