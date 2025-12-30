/**
 * Food-101 Label Mappings
 * 
 * These labels correspond to the output indices of the Food-101 TFLite model.
 * The model outputs 101 class probabilities, and this array maps indices to food names.
 * 
 * Source: https://www.vision.ee.ethz.ch/datasets_extra/food-101/
 */

export const FOOD_101_LABELS: string[] = [
  'apple_pie',
  'baby_back_ribs',
  'baklava',
  'beef_carpaccio',
  'beef_tartare',
  'beet_salad',
  'beignets',
  'bibimbap',
  'bread_pudding',
  'breakfast_burrito',
  'bruschetta',
  'caesar_salad',
  'cannoli',
  'caprese_salad',
  'carrot_cake',
  'ceviche',
  'cheese_plate',
  'cheesecake',
  'chicken_curry',
  'chicken_quesadilla',
  'chicken_wings',
  'chocolate_cake',
  'chocolate_mousse',
  'churros',
  'clam_chowder',
  'club_sandwich',
  'crab_cakes',
  'creme_brulee',
  'croque_madame',
  'cup_cakes',
  'deviled_eggs',
  'donuts',
  'dumplings',
  'edamame',
  'eggs_benedict',
  'escargots',
  'falafel',
  'filet_mignon',
  'fish_and_chips',
  'foie_gras',
  'french_fries',
  'french_onion_soup',
  'french_toast',
  'fried_calamari',
  'fried_rice',
  'frozen_yogurt',
  'garlic_bread',
  'gnocchi',
  'greek_salad',
  'grilled_cheese_sandwich',
  'grilled_salmon',
  'guacamole',
  'gyoza',
  'hamburger',
  'hot_and_sour_soup',
  'hot_dog',
  'huevos_rancheros',
  'hummus',
  'ice_cream',
  'lasagna',
  'lobster_bisque',
  'lobster_roll_sandwich',
  'macaroni_and_cheese',
  'macarons',
  'miso_soup',
  'mussels',
  'nachos',
  'omelette',
  'onion_rings',
  'oysters',
  'pad_thai',
  'paella',
  'pancakes',
  'panna_cotta',
  'peking_duck',
  'pho',
  'pizza',
  'pork_chop',
  'poutine',
  'prime_rib',
  'pulled_pork_sandwich',
  'ramen',
  'ravioli',
  'red_velvet_cake',
  'risotto',
  'samosa',
  'sashimi',
  'scallops',
  'seaweed_salad',
  'shrimp_and_grits',
  'spaghetti_bolognese',
  'spaghetti_carbonara',
  'spring_rolls',
  'steak',
  'strawberry_shortcake',
  'sushi',
  'tacos',
  'takoyaki',
  'tiramisu',
  'tuna_tartare',
  'waffles',
];

/**
 * Get display name from label ID
 * Converts snake_case to Title Case
 */
export function getDisplayName(labelId: string): string {
  return labelId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get label ID from index
 */
export function getLabelFromIndex(index: number): string | undefined {
  return FOOD_101_LABELS[index];
}




