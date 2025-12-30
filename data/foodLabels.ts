/**
 * Comprehensive Food Labels for CLIP-based Classification
 * 
 * 500+ food items for zero-shot classification
 * Organized by category for better coverage
 */

export const FOOD_LABELS: string[] = [
  // === FRUITS ===
  'apple', 'red apple', 'green apple', 'banana', 'orange', 'lemon', 'lime',
  'grapefruit', 'tangerine', 'mandarin', 'clementine', 'peach', 'nectarine',
  'plum', 'apricot', 'cherry', 'cherries', 'grape', 'grapes', 'strawberry',
  'strawberries', 'blueberry', 'blueberries', 'raspberry', 'raspberries',
  'blackberry', 'blackberries', 'cranberry', 'cranberries', 'watermelon',
  'cantaloupe', 'honeydew melon', 'pineapple', 'mango', 'papaya', 'kiwi',
  'coconut', 'pomegranate', 'fig', 'date', 'passion fruit', 'dragon fruit',
  'lychee', 'guava', 'persimmon', 'starfruit', 'jackfruit', 'durian',
  'avocado', 'tomato', 'cherry tomato',

  // === VEGETABLES ===
  'carrot', 'broccoli', 'cauliflower', 'celery', 'cucumber', 'lettuce',
  'spinach', 'kale', 'cabbage', 'red cabbage', 'brussels sprouts',
  'asparagus', 'green beans', 'peas', 'corn', 'corn on the cob', 'potato',
  'baked potato', 'mashed potatoes', 'french fries', 'sweet potato',
  'yam', 'onion', 'red onion', 'green onion', 'scallion', 'leek', 'garlic',
  'ginger', 'bell pepper', 'red bell pepper', 'green bell pepper',
  'yellow bell pepper', 'jalapeno', 'chili pepper', 'mushroom', 'mushrooms',
  'zucchini', 'squash', 'butternut squash', 'acorn squash', 'pumpkin',
  'eggplant', 'artichoke', 'beet', 'radish', 'turnip', 'parsnip',
  'bok choy', 'bean sprouts', 'bamboo shoots', 'water chestnut',
  'edamame', 'okra', 'swiss chard', 'arugula', 'watercress',

  // === PIZZA ===
  'pizza', 'cheese pizza', 'pepperoni pizza', 'margherita pizza',
  'hawaiian pizza', 'meat lovers pizza', 'veggie pizza', 'supreme pizza',
  'buffalo chicken pizza', 'bbq chicken pizza', 'white pizza',
  'deep dish pizza', 'thin crust pizza', 'pizza slice', 'flatbread pizza',

  // === BURGERS & SANDWICHES ===
  'hamburger', 'cheeseburger', 'bacon cheeseburger', 'double cheeseburger',
  'veggie burger', 'turkey burger', 'chicken burger', 'fish sandwich',
  'hot dog', 'bratwurst', 'corn dog', 'sandwich', 'club sandwich',
  'blt sandwich', 'grilled cheese sandwich', 'tuna sandwich',
  'turkey sandwich', 'ham sandwich', 'roast beef sandwich', 'sub sandwich',
  'hoagie', 'hero sandwich', 'panini', 'wrap', 'burrito', 'breakfast burrito',
  'quesadilla', 'taco', 'tacos', 'soft taco', 'hard shell taco',
  'fish taco', 'carnitas taco', 'al pastor taco', 'gyro', 'shawarma',
  'falafel wrap', 'pulled pork sandwich', 'philly cheesesteak',
  'reuben sandwich', 'cuban sandwich', 'banh mi', 'po boy',

  // === PASTA & NOODLES ===
  'pasta', 'spaghetti', 'spaghetti bolognese', 'spaghetti carbonara',
  'spaghetti and meatballs', 'fettuccine alfredo', 'penne', 'penne arrabiata',
  'rigatoni', 'lasagna', 'ravioli', 'tortellini', 'gnocchi', 'linguine',
  'macaroni and cheese', 'mac and cheese', 'pesto pasta', 'pasta primavera',
  'pad thai', 'lo mein', 'chow mein', 'ramen', 'instant ramen', 'tonkotsu ramen',
  'miso ramen', 'pho', 'beef pho', 'chicken pho', 'udon', 'soba noodles',
  'rice noodles', 'glass noodles', 'egg noodles', 'ziti', 'baked ziti',
  'stuffed shells', 'manicotti', 'orzo', 'couscous',

  // === RICE DISHES ===
  'rice', 'white rice', 'brown rice', 'fried rice', 'chicken fried rice',
  'shrimp fried rice', 'vegetable fried rice', 'egg fried rice',
  'risotto', 'mushroom risotto', 'paella', 'biryani', 'chicken biryani',
  'pilaf', 'rice pilaf', 'jambalaya', 'gumbo', 'rice and beans',
  'burrito bowl', 'poke bowl', 'bibimbap', 'korean rice bowl',
  'chirashi bowl', 'donburi', 'katsudon', 'gyudon', 'oyakodon',
  'sushi rice', 'sticky rice', 'coconut rice', 'yellow rice',
  'spanish rice', 'mexican rice', 'cilantro lime rice',

  // === SUSHI & JAPANESE ===
  'sushi', 'sushi roll', 'california roll', 'spicy tuna roll',
  'salmon roll', 'dragon roll', 'rainbow roll', 'philadelphia roll',
  'spider roll', 'tempura roll', 'nigiri', 'salmon nigiri', 'tuna nigiri',
  'sashimi', 'salmon sashimi', 'tuna sashimi', 'maki', 'temaki',
  'hand roll', 'onigiri', 'rice ball', 'tempura', 'shrimp tempura',
  'vegetable tempura', 'teriyaki', 'chicken teriyaki', 'salmon teriyaki',
  'gyoza', 'dumplings', 'edamame', 'miso soup', 'seaweed salad',
  'takoyaki', 'okonomiyaki', 'yakitori', 'tonkatsu', 'katsu curry',
  'japanese curry', 'bento box',

  // === CHINESE ===
  'orange chicken', 'general tso chicken', 'kung pao chicken',
  'sweet and sour chicken', 'sweet and sour pork', 'mongolian beef',
  'beef and broccoli', 'cashew chicken', 'sesame chicken', 'lemon chicken',
  'moo shu pork', 'twice cooked pork', 'mapo tofu', 'hot pot',
  'dim sum', 'dumplings', 'potstickers', 'spring rolls', 'egg rolls',
  'wonton', 'wonton soup', 'hot and sour soup', 'egg drop soup',
  'congee', 'rice porridge', 'char siu', 'bbq pork', 'peking duck',
  'crispy duck', 'kung pao shrimp', 'shrimp with lobster sauce',

  // === KOREAN ===
  'bibimbap', 'bulgogi', 'korean bbq', 'galbi', 'korean fried chicken',
  'kimchi', 'kimchi fried rice', 'japchae', 'tteokbokki', 'rice cakes',
  'korean pancake', 'pajeon', 'samgyeopsal', 'pork belly', 'sundubu jjigae',
  'soft tofu stew', 'kimchi jjigae', 'kimchi stew', 'korean army stew',
  'budae jjigae', 'naengmyeon', 'cold noodles', 'kimbap', 'korean sushi roll',

  // === INDIAN ===
  'curry', 'chicken curry', 'lamb curry', 'vegetable curry', 'tikka masala',
  'chicken tikka masala', 'butter chicken', 'palak paneer', 'saag paneer',
  'dal', 'lentils', 'chana masala', 'chickpea curry', 'biryani',
  'samosa', 'pakora', 'naan', 'naan bread', 'roti', 'chapati',
  'paratha', 'dosa', 'idli', 'vada', 'tandoori chicken', 'vindaloo',
  'korma', 'lamb korma', 'aloo gobi', 'malai kofta', 'paneer tikka',
  'bhaji', 'onion bhaji', 'raita', 'mango lassi', 'chai',

  // === MEXICAN ===
  'taco', 'tacos', 'burrito', 'enchilada', 'enchiladas', 'quesadilla',
  'nachos', 'loaded nachos', 'guacamole', 'salsa', 'pico de gallo',
  'chips and salsa', 'tortilla chips', 'tamale', 'tamales', 'tostada',
  'chimichanga', 'fajitas', 'chicken fajitas', 'beef fajitas',
  'carnitas', 'al pastor', 'carne asada', 'barbacoa', 'chorizo',
  'mexican rice', 'refried beans', 'elote', 'mexican street corn',
  'churro', 'churros', 'sopapilla', 'tres leches cake', 'flan',

  // === THAI ===
  'pad thai', 'green curry', 'red curry', 'yellow curry', 'massaman curry',
  'panang curry', 'thai fried rice', 'basil chicken', 'pad kra pao',
  'tom yum soup', 'tom kha soup', 'thai spring rolls', 'satay',
  'chicken satay', 'peanut sauce', 'papaya salad', 'som tam',
  'larb', 'thai salad', 'mango sticky rice', 'thai iced tea',

  // === VIETNAMESE ===
  'pho', 'beef pho', 'chicken pho', 'banh mi', 'vietnamese sandwich',
  'spring rolls', 'fresh spring rolls', 'summer rolls', 'bun', 'vermicelli bowl',
  'bun cha', 'lemongrass chicken', 'vietnamese coffee', 'ca phe sua da',
  'banh xeo', 'vietnamese crepe', 'goi cuon',

  // === MIDDLE EASTERN ===
  'hummus', 'falafel', 'shawarma', 'kebab', 'shish kebab', 'doner kebab',
  'gyro', 'pita bread', 'pita sandwich', 'tabbouleh', 'baba ganoush',
  'fattoush', 'labneh', 'kibbeh', 'dolma', 'stuffed grape leaves',
  'baklava', 'halloumi', 'grilled halloumi', 'lamb kebab', 'kofta',

  // === MEAT & PROTEIN ===
  'steak', 'ribeye steak', 'sirloin steak', 'filet mignon', 't-bone steak',
  'new york strip', 'prime rib', 'roast beef', 'beef brisket', 'pot roast',
  'meatloaf', 'meatballs', 'beef stew', 'beef stroganoff',
  'pork chop', 'grilled pork chop', 'pork tenderloin', 'pork roast',
  'pulled pork', 'bbq ribs', 'spare ribs', 'baby back ribs', 'bacon',
  'ham', 'glazed ham', 'pork belly', 'carnitas',
  'lamb chop', 'rack of lamb', 'lamb shank', 'lamb leg',
  'chicken breast', 'grilled chicken', 'roasted chicken', 'rotisserie chicken',
  'fried chicken', 'chicken thigh', 'chicken wing', 'chicken wings',
  'buffalo wings', 'bbq wings', 'chicken drumstick', 'chicken leg',
  'chicken nuggets', 'chicken tenders', 'chicken strips',
  'turkey', 'roasted turkey', 'turkey breast', 'turkey leg',
  'duck', 'roasted duck', 'duck breast', 'duck confit',

  // === SEAFOOD ===
  'fish', 'grilled fish', 'baked fish', 'fried fish', 'fish and chips',
  'salmon', 'grilled salmon', 'baked salmon', 'smoked salmon', 'salmon fillet',
  'tuna', 'tuna steak', 'ahi tuna', 'canned tuna', 'tuna salad',
  'cod', 'baked cod', 'tilapia', 'halibut', 'sea bass', 'mahi mahi',
  'trout', 'catfish', 'fried catfish', 'sardines', 'anchovies',
  'shrimp', 'grilled shrimp', 'fried shrimp', 'shrimp cocktail',
  'shrimp scampi', 'coconut shrimp', 'popcorn shrimp',
  'lobster', 'lobster tail', 'lobster roll', 'lobster bisque',
  'crab', 'crab legs', 'crab cakes', 'crab meat', 'soft shell crab',
  'clam', 'clams', 'clam chowder', 'steamed clams', 'fried clams',
  'mussel', 'mussels', 'steamed mussels',
  'oyster', 'oysters', 'raw oysters', 'fried oysters',
  'scallop', 'scallops', 'seared scallops', 'bay scallops',
  'calamari', 'fried calamari', 'squid', 'octopus', 'grilled octopus',

  // === EGGS & BREAKFAST ===
  'egg', 'eggs', 'fried egg', 'sunny side up egg', 'scrambled eggs',
  'poached egg', 'hard boiled egg', 'soft boiled egg', 'deviled eggs',
  'omelette', 'omelet', 'cheese omelette', 'western omelette',
  'eggs benedict', 'huevos rancheros', 'shakshuka', 'egg sandwich',
  'breakfast sandwich', 'bacon and eggs', 'ham and eggs',
  'pancakes', 'pancake stack', 'blueberry pancakes', 'chocolate chip pancakes',
  'waffle', 'waffles', 'belgian waffle', 'chicken and waffles',
  'french toast', 'cinnamon french toast',
  'toast', 'buttered toast', 'avocado toast', 'toast with jam',
  'bagel', 'bagel with cream cheese', 'everything bagel',
  'croissant', 'almond croissant', 'chocolate croissant',
  'muffin', 'blueberry muffin', 'chocolate muffin', 'bran muffin',
  'danish', 'pastry', 'breakfast pastry',
  'cereal', 'cereal with milk', 'oatmeal', 'porridge', 'granola',
  'yogurt', 'yogurt parfait', 'fruit and yogurt',
  'hash browns', 'home fries', 'breakfast potatoes',
  'sausage', 'breakfast sausage', 'sausage links', 'sausage patty',
  'biscuits and gravy', 'english muffin',

  // === SALADS ===
  'salad', 'green salad', 'garden salad', 'mixed salad', 'house salad',
  'caesar salad', 'greek salad', 'cobb salad', 'chef salad',
  'chicken salad', 'grilled chicken salad', 'tuna salad', 'egg salad',
  'pasta salad', 'potato salad', 'coleslaw', 'macaroni salad',
  'caprese salad', 'nicoise salad', 'wedge salad', 'spinach salad',
  'kale salad', 'arugula salad', 'quinoa salad', 'grain bowl',
  'poke bowl', 'acai bowl', 'fruit salad', 'waldorf salad',

  // === SOUPS ===
  'soup', 'chicken soup', 'chicken noodle soup', 'vegetable soup',
  'tomato soup', 'cream of tomato soup', 'minestrone', 'lentil soup',
  'split pea soup', 'bean soup', 'black bean soup', 'tortilla soup',
  'french onion soup', 'onion soup', 'mushroom soup', 'cream of mushroom',
  'potato soup', 'loaded potato soup', 'clam chowder', 'new england clam chowder',
  'lobster bisque', 'corn chowder', 'broccoli cheese soup',
  'butternut squash soup', 'pumpkin soup', 'carrot soup', 'gazpacho',
  'miso soup', 'wonton soup', 'egg drop soup', 'hot and sour soup',
  'tom yum soup', 'pho', 'ramen', 'beef stew', 'chili', 'beef chili',
  'white chicken chili', 'vegetarian chili',

  // === BREAD & BAKERY ===
  'bread', 'white bread', 'wheat bread', 'sourdough', 'rye bread',
  'baguette', 'french bread', 'ciabatta', 'focaccia', 'brioche',
  'dinner roll', 'bread roll', 'pretzel', 'soft pretzel',
  'garlic bread', 'breadsticks', 'croutons', 'cornbread',
  'banana bread', 'zucchini bread', 'pumpkin bread',
  'scone', 'biscuit', 'buttermilk biscuit',

  // === DESSERTS ===
  'cake', 'chocolate cake', 'birthday cake', 'layer cake', 'pound cake',
  'cheesecake', 'strawberry cheesecake', 'new york cheesecake',
  'carrot cake', 'red velvet cake', 'tiramisu', 'tres leches',
  'pie', 'apple pie', 'cherry pie', 'pumpkin pie', 'pecan pie',
  'key lime pie', 'lemon meringue pie', 'banana cream pie',
  'chocolate pie', 'coconut cream pie', 'fruit pie',
  'brownie', 'chocolate brownie', 'blondie',
  'cookie', 'chocolate chip cookie', 'oatmeal cookie', 'sugar cookie',
  'peanut butter cookie', 'macaron', 'macarons',
  'cupcake', 'chocolate cupcake', 'vanilla cupcake', 'red velvet cupcake',
  'donut', 'doughnut', 'glazed donut', 'chocolate donut', 'jelly donut',
  'cruller', 'donut hole',
  'ice cream', 'vanilla ice cream', 'chocolate ice cream', 'strawberry ice cream',
  'ice cream cone', 'ice cream sundae', 'banana split', 'milkshake',
  'frozen yogurt', 'froyo', 'gelato', 'sorbet', 'popsicle',
  'pudding', 'chocolate pudding', 'rice pudding', 'bread pudding',
  'creme brulee', 'panna cotta', 'mousse', 'chocolate mousse',
  'flan', 'custard', 'eclair', 'cream puff', 'profiterole',
  'cannoli', 'baklava', 'churros', 'beignets', 'funnel cake',
  'crepe', 'crepes', 'chocolate crepe', 'fruit crepe',
  'waffle cone', 'sundae', 'parfait',

  // === SNACKS ===
  'chips', 'potato chips', 'tortilla chips', 'corn chips', 'pita chips',
  'pretzels', 'crackers', 'cheese crackers', 'goldfish crackers',
  'popcorn', 'buttered popcorn', 'caramel popcorn', 'kettle corn',
  'nuts', 'peanuts', 'almonds', 'cashews', 'walnuts', 'pistachios',
  'mixed nuts', 'trail mix',
  'cheese', 'cheese slices', 'cheese cubes', 'cheese plate', 'cheese board',
  'fruit and cheese', 'crackers and cheese',

  // === DRINKS (food context) ===
  'smoothie', 'fruit smoothie', 'green smoothie', 'protein shake',
  'milkshake', 'chocolate milkshake', 'vanilla milkshake', 'strawberry milkshake',
  'bubble tea', 'boba tea', 'iced coffee', 'frappuccino', 'latte',
  'hot chocolate', 'cocoa',

  // === MISC ===
  'food', 'meal', 'dish', 'plate of food', 'lunch', 'dinner', 'breakfast',
  'snack', 'appetizer', 'entree', 'main course', 'side dish',
  'leftovers', 'takeout', 'fast food', 'street food',
];

/**
 * Food categories for grouping
 */
export const FOOD_CATEGORIES: Record<string, string[]> = {
  fruits: FOOD_LABELS.slice(0, 52),
  vegetables: FOOD_LABELS.slice(52, 107),
  pizza: FOOD_LABELS.slice(107, 122),
  sandwiches: FOOD_LABELS.slice(122, 175),
  pasta: FOOD_LABELS.slice(175, 220),
  rice: FOOD_LABELS.slice(220, 255),
  japanese: FOOD_LABELS.slice(255, 300),
  chinese: FOOD_LABELS.slice(300, 335),
  korean: FOOD_LABELS.slice(335, 360),
  indian: FOOD_LABELS.slice(360, 400),
  mexican: FOOD_LABELS.slice(400, 435),
  thai: FOOD_LABELS.slice(435, 455),
  vietnamese: FOOD_LABELS.slice(455, 470),
  middle_eastern: FOOD_LABELS.slice(470, 490),
  meat: FOOD_LABELS.slice(490, 560),
  seafood: FOOD_LABELS.slice(560, 615),
  breakfast: FOOD_LABELS.slice(615, 680),
  salads: FOOD_LABELS.slice(680, 710),
  soups: FOOD_LABELS.slice(710, 755),
  bread: FOOD_LABELS.slice(755, 775),
  desserts: FOOD_LABELS.slice(775, 860),
  snacks: FOOD_LABELS.slice(860, 890),
};

/**
 * Get nutrition estimate for a food label
 * Returns basic nutrition per 100g
 */
export function getBasicNutrition(foodLabel: string): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  // Simple heuristics based on food type
  const label = foodLabel.toLowerCase();
  
  // Fruits (50-100 kcal/100g)
  if (label.includes('apple') || label.includes('orange') || label.includes('banana') ||
      label.includes('berry') || label.includes('melon') || label.includes('grape')) {
    return { calories: 60, protein: 1, carbs: 15, fat: 0 };
  }
  
  // Vegetables (20-50 kcal/100g)
  if (label.includes('lettuce') || label.includes('spinach') || label.includes('kale') ||
      label.includes('broccoli') || label.includes('carrot') || label.includes('celery')) {
    return { calories: 25, protein: 2, carbs: 5, fat: 0 };
  }
  
  // Pizza (250-300 kcal/100g)
  if (label.includes('pizza')) {
    return { calories: 270, protein: 11, carbs: 33, fat: 10 };
  }
  
  // Burger (250-350 kcal/100g)
  if (label.includes('burger') || label.includes('hamburger') || label.includes('cheeseburger')) {
    return { calories: 295, protein: 17, carbs: 24, fat: 14 };
  }
  
  // Pasta (150-200 kcal/100g cooked)
  if (label.includes('pasta') || label.includes('spaghetti') || label.includes('noodle') ||
      label.includes('lasagna') || label.includes('ravioli')) {
    return { calories: 160, protein: 6, carbs: 30, fat: 2 };
  }
  
  // Rice (130-180 kcal/100g cooked)
  if (label.includes('rice') || label.includes('risotto') || label.includes('biryani')) {
    return { calories: 150, protein: 3, carbs: 32, fat: 1 };
  }
  
  // Sushi (150-250 kcal/100g)
  if (label.includes('sushi') || label.includes('roll') || label.includes('nigiri')) {
    return { calories: 180, protein: 8, carbs: 25, fat: 4 };
  }
  
  // Fried foods (250-400 kcal/100g)
  if (label.includes('fried') || label.includes('fries') || label.includes('tempura') ||
      label.includes('nugget') || label.includes('crispy')) {
    return { calories: 300, protein: 10, carbs: 30, fat: 15 };
  }
  
  // Steak/meat (200-300 kcal/100g)
  if (label.includes('steak') || label.includes('beef') || label.includes('pork') ||
      label.includes('lamb') || label.includes('meat')) {
    return { calories: 250, protein: 26, carbs: 0, fat: 15 };
  }
  
  // Chicken (150-250 kcal/100g)
  if (label.includes('chicken') || label.includes('turkey')) {
    return { calories: 200, protein: 25, carbs: 5, fat: 8 };
  }
  
  // Fish (100-200 kcal/100g)
  if (label.includes('fish') || label.includes('salmon') || label.includes('tuna') ||
      label.includes('cod') || label.includes('seafood')) {
    return { calories: 150, protein: 22, carbs: 0, fat: 6 };
  }
  
  // Eggs (150 kcal/100g)
  if (label.includes('egg')) {
    return { calories: 155, protein: 13, carbs: 1, fat: 11 };
  }
  
  // Soup (30-100 kcal/100g)
  if (label.includes('soup') || label.includes('stew') || label.includes('chili')) {
    return { calories: 60, protein: 4, carbs: 8, fat: 2 };
  }
  
  // Salad (20-150 kcal/100g)
  if (label.includes('salad')) {
    return { calories: 80, protein: 4, carbs: 8, fat: 4 };
  }
  
  // Desserts (300-500 kcal/100g)
  if (label.includes('cake') || label.includes('cookie') || label.includes('pie') ||
      label.includes('donut') || label.includes('brownie') || label.includes('ice cream')) {
    return { calories: 380, protein: 4, carbs: 50, fat: 18 };
  }
  
  // Bread (250-300 kcal/100g)
  if (label.includes('bread') || label.includes('toast') || label.includes('bagel') ||
      label.includes('croissant') || label.includes('roll')) {
    return { calories: 265, protein: 9, carbs: 49, fat: 3 };
  }
  
  // Curry (150-250 kcal/100g)
  if (label.includes('curry') || label.includes('masala') || label.includes('tikka')) {
    return { calories: 180, protein: 12, carbs: 15, fat: 8 };
  }
  
  // Tacos/Mexican (200-300 kcal/100g)
  if (label.includes('taco') || label.includes('burrito') || label.includes('nachos') ||
      label.includes('enchilada') || label.includes('quesadilla')) {
    return { calories: 230, protein: 10, carbs: 25, fat: 10 };
  }
  
  // Default (moderate calories)
  return { calories: 180, protein: 8, carbs: 20, fat: 8 };
}

export default FOOD_LABELS;

