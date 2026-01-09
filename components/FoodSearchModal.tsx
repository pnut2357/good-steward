/**
 * Food Search Modal
 * 
 * Allows users to search for generic foods by name (pizza, banana, chicken)
 * and get nutrition estimates. Used as fallback when food photo recognition fails.
 * 
 * Features:
 * - Search 50+ common foods (offline-first)
 * - Recent foods for quick access
 * - Gram/oz weight input for accuracy
 * - Health warnings based on user profile (diabetes, pregnancy, allergies)
 * - High sugar/sodium tags in results
 */

import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { UserProfile } from '../models/UserProfile';
import { profileService } from '../services/ProfileService';
import { isUSDAAvailable, searchUSDAFoods, USDAFoodResult } from '../services/USDAFoodService';
import { hasKoreanCharacters, translateKoreanFood, getSearchTermsForKorean } from '../data/koreanFoodMap';

// Common foods with pre-defined nutrition (per 100g)
// Includes international foods for instant offline search
const COMMON_FOODS: FoodSearchResult[] = [
  // American
  { id: 'pizza', name: 'Pizza (cheese)', calories: 266, protein: 11, carbs: 33, fat: 10, sugar: 3.6, sodium: 598, serving: '1 slice (107g)', servingG: 107 },
  { id: 'pizza_pepperoni', name: 'Pizza (pepperoni)', calories: 298, protein: 13, carbs: 30, fat: 14, sugar: 3.2, sodium: 684, serving: '1 slice (113g)', servingG: 113 },
  { id: 'burger', name: 'Hamburger', calories: 254, protein: 17, carbs: 24, fat: 10, sugar: 5, sodium: 396, serving: '1 burger (110g)', servingG: 110 },
  { id: 'cheeseburger', name: 'Cheeseburger', calories: 303, protein: 17, carbs: 24, fat: 15, sugar: 5.2, sodium: 500, serving: '1 burger (118g)', servingG: 118 },
  { id: 'hot_dog', name: 'Hot Dog', calories: 290, protein: 10, carbs: 24, fat: 18, sugar: 4, sodium: 810, serving: '1 hot dog (98g)', servingG: 98 },
  { id: 'mac_cheese', name: 'Mac and Cheese', calories: 164, protein: 7, carbs: 18, fat: 7, sugar: 3, sodium: 456, serving: '1 cup (200g)', servingG: 200 },
  
  // Chicken
  { id: 'chicken_breast', name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbs: 0, fat: 4, sugar: 0, sodium: 74, serving: '1 breast (172g)', servingG: 172 },
  { id: 'chicken_thigh', name: 'Chicken Thigh', calories: 209, protein: 26, carbs: 0, fat: 11, sugar: 0, sodium: 84, serving: '1 thigh (116g)', servingG: 116 },
  { id: 'chicken_wings', name: 'Chicken Wings (fried)', calories: 290, protein: 27, carbs: 8, fat: 17, sugar: 0, sodium: 730, serving: '3 wings (96g)', servingG: 96 },
  
  // Steak & Meat
  { id: 'steak', name: 'Steak (ribeye)', calories: 291, protein: 24, carbs: 0, fat: 21, sugar: 0, sodium: 59, serving: '1 serving (170g)', servingG: 170 },
  { id: 'steak_sirloin', name: 'Steak (sirloin)', calories: 183, protein: 27, carbs: 0, fat: 8, sugar: 0, sodium: 56, serving: '1 serving (170g)', servingG: 170 },
  { id: 'pork_chop', name: 'Pork Chop', calories: 231, protein: 27, carbs: 0, fat: 13, sugar: 0, sodium: 62, serving: '1 chop (145g)', servingG: 145 },
  { id: 'lamb_chop', name: 'Lamb Chop', calories: 282, protein: 25, carbs: 0, fat: 20, sugar: 0, sodium: 72, serving: '1 chop (135g)', servingG: 135 },
  
  // Seafood
  { id: 'salmon', name: 'Salmon (baked)', calories: 208, protein: 28, carbs: 0, fat: 10, sugar: 0, sodium: 59, serving: '1 fillet (154g)', servingG: 154 },
  { id: 'shrimp', name: 'Shrimp (cooked)', calories: 99, protein: 24, carbs: 0, fat: 1, sugar: 0, sodium: 111, serving: '6 large (84g)', servingG: 84 },
  { id: 'tuna', name: 'Tuna (canned)', calories: 116, protein: 26, carbs: 0, fat: 1, sugar: 0, sodium: 320, serving: '1 can (142g)', servingG: 142 },
  
  // Rice & Grains
  { id: 'rice_white', name: 'Rice (white, cooked)', calories: 130, protein: 3, carbs: 28, fat: 0, sugar: 0, sodium: 1, serving: '1 cup (158g)', servingG: 158 },
  { id: 'rice_brown', name: 'Rice (brown, cooked)', calories: 112, protein: 3, carbs: 24, fat: 1, sugar: 0, sodium: 5, serving: '1 cup (195g)', servingG: 195 },
  { id: 'quinoa', name: 'Quinoa (cooked)', calories: 120, protein: 4, carbs: 21, fat: 2, sugar: 1, sodium: 7, serving: '1 cup (185g)', servingG: 185 },
  
  // Pasta & Bread
  { id: 'pasta', name: 'Pasta (cooked)', calories: 131, protein: 5, carbs: 25, fat: 1, sugar: 1, sodium: 1, serving: '1 cup (140g)', servingG: 140 },
  { id: 'spaghetti', name: 'Spaghetti with Meat Sauce', calories: 130, protein: 7, carbs: 17, fat: 4, sugar: 4, sodium: 340, serving: '1 cup (250g)', servingG: 250 },
  { id: 'bread', name: 'Bread (white)', calories: 265, protein: 9, carbs: 49, fat: 3, sugar: 5, sodium: 491, serving: '1 slice (25g)', servingG: 25 },
  { id: 'bread_wheat', name: 'Bread (whole wheat)', calories: 247, protein: 13, carbs: 41, fat: 4, sugar: 6, sodium: 472, serving: '1 slice (28g)', servingG: 28 },
  
  // Eggs
  { id: 'eggs_scrambled', name: 'Eggs (scrambled)', calories: 149, protein: 10, carbs: 2, fat: 11, sugar: 1, sodium: 145, serving: '2 eggs (122g)', servingG: 122 },
  { id: 'eggs_fried', name: 'Eggs (fried)', calories: 196, protein: 14, carbs: 1, fat: 15, sugar: 1, sodium: 207, serving: '2 eggs (92g)', servingG: 92 },
  { id: 'omelette', name: 'Omelette (cheese)', calories: 154, protein: 11, carbs: 1, fat: 12, sugar: 1, sodium: 303, serving: '1 omelette (130g)', servingG: 130 },
  
  // Breakfast
  { id: 'oatmeal', name: 'Oatmeal', calories: 68, protein: 2, carbs: 12, fat: 1, sugar: 0, sodium: 49, serving: '1 cup (234g)', servingG: 234 },
  { id: 'pancakes', name: 'Pancakes', calories: 227, protein: 6, carbs: 38, fat: 6, sugar: 9, sodium: 439, serving: '2 pancakes (152g)', servingG: 152 },
  { id: 'waffle', name: 'Waffle', calories: 291, protein: 8, carbs: 33, fat: 14, sugar: 6, sodium: 511, serving: '1 waffle (75g)', servingG: 75 },
  
  // Fruits
  { id: 'banana', name: 'Banana', calories: 89, protein: 1, carbs: 23, fat: 0, sugar: 12, sodium: 1, serving: '1 medium (118g)', servingG: 118 },
  { id: 'apple', name: 'Apple', calories: 52, protein: 0, carbs: 14, fat: 0, sugar: 10, sodium: 1, serving: '1 medium (182g)', servingG: 182 },
  { id: 'orange', name: 'Orange', calories: 47, protein: 1, carbs: 12, fat: 0, sugar: 9, sodium: 0, serving: '1 medium (131g)', servingG: 131 },
  { id: 'strawberries', name: 'Strawberries', calories: 32, protein: 1, carbs: 8, fat: 0, sugar: 5, sodium: 1, serving: '1 cup (144g)', servingG: 144 },
  { id: 'grapes', name: 'Grapes', calories: 69, protein: 1, carbs: 18, fat: 0, sugar: 16, sodium: 2, serving: '1 cup (151g)', servingG: 151 },
  { id: 'mango', name: 'Mango', calories: 60, protein: 1, carbs: 15, fat: 0, sugar: 14, sodium: 1, serving: '1 cup (165g)', servingG: 165 },
  { id: 'watermelon', name: 'Watermelon', calories: 30, protein: 1, carbs: 8, fat: 0, sugar: 6, sodium: 1, serving: '1 cup (152g)', servingG: 152 },
  
  // Vegetables
  { id: 'avocado', name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, sugar: 1, sodium: 7, serving: '1/2 avocado (100g)', servingG: 100 },
  { id: 'broccoli', name: 'Broccoli (cooked)', calories: 35, protein: 2, carbs: 7, fat: 0, sugar: 2, sodium: 41, serving: '1 cup (156g)', servingG: 156 },
  { id: 'carrots', name: 'Carrots', calories: 41, protein: 1, carbs: 10, fat: 0, sugar: 5, sodium: 69, serving: '1 cup (128g)', servingG: 128 },
  { id: 'corn', name: 'Corn', calories: 86, protein: 3, carbs: 19, fat: 1, sugar: 3, sodium: 15, serving: '1 ear (90g)', servingG: 90 },
  
  // Salads
  { id: 'salad_caesar', name: 'Caesar Salad', calories: 190, protein: 8, carbs: 8, fat: 15, sugar: 2, sodium: 470, serving: '1 bowl (267g)', servingG: 267 },
  { id: 'salad_garden', name: 'Garden Salad', calories: 35, protein: 2, carbs: 7, fat: 0, sugar: 4, sodium: 53, serving: '1 bowl (207g)', servingG: 207 },
  { id: 'salad_greek', name: 'Greek Salad', calories: 125, protein: 5, carbs: 8, fat: 9, sugar: 4, sodium: 356, serving: '1 bowl (250g)', servingG: 250 },
  
  // Potatoes
  { id: 'french_fries', name: 'French Fries', calories: 312, protein: 3, carbs: 41, fat: 15, sugar: 0, sodium: 246, serving: '1 medium (117g)', servingG: 117 },
  { id: 'potato_baked', name: 'Baked Potato', calories: 93, protein: 2, carbs: 21, fat: 0, sugar: 1, sodium: 10, serving: '1 medium (173g)', servingG: 173 },
  { id: 'mashed_potato', name: 'Mashed Potatoes', calories: 113, protein: 2, carbs: 16, fat: 5, sugar: 2, sodium: 344, serving: '1 cup (210g)', servingG: 210 },
  { id: 'hash_browns', name: 'Hash Browns', calories: 326, protein: 3, carbs: 35, fat: 20, sugar: 1, sodium: 342, serving: '1 cup (156g)', servingG: 156 },
  
  // Soups
  { id: 'soup_chicken', name: 'Chicken Soup', calories: 75, protein: 6, carbs: 8, fat: 2, sugar: 1, sodium: 343, serving: '1 cup (241g)', servingG: 241 },
  { id: 'soup_tomato', name: 'Tomato Soup', calories: 74, protein: 2, carbs: 16, fat: 1, sugar: 10, sodium: 480, serving: '1 cup (248g)', servingG: 248 },
  { id: 'soup_miso', name: 'Miso Soup', calories: 40, protein: 3, carbs: 5, fat: 1, sugar: 2, sodium: 550, serving: '1 cup (240g)', servingG: 240 },
  
  // Mexican
  { id: 'tacos', name: 'Tacos (beef)', calories: 226, protein: 11, carbs: 20, fat: 11, sugar: 2, sodium: 571, serving: '1 taco (102g)', servingG: 102 },
  { id: 'burrito', name: 'Burrito (bean & cheese)', calories: 206, protein: 8, carbs: 29, fat: 7, sugar: 2, sodium: 495, serving: '1 burrito (163g)', servingG: 163 },
  { id: 'quesadilla', name: 'Quesadilla (cheese)', calories: 304, protein: 13, carbs: 26, fat: 17, sugar: 2, sodium: 584, serving: '1 quesadilla (140g)', servingG: 140 },
  { id: 'nachos', name: 'Nachos with Cheese', calories: 346, protein: 9, carbs: 36, fat: 19, sugar: 2, sodium: 816, serving: '1 serving (113g)', servingG: 113 },
  { id: 'enchiladas', name: 'Enchiladas (chicken)', calories: 168, protein: 10, carbs: 16, fat: 8, sugar: 2, sodium: 520, serving: '1 enchilada (163g)', servingG: 163 },
  
  // Asian - Japanese
  { id: 'sushi_roll', name: 'Sushi Roll (California)', calories: 255, protein: 9, carbs: 38, fat: 7, sugar: 9, sodium: 362, serving: '6 pieces (180g)', servingG: 180 },
  { id: 'sashimi', name: 'Sashimi (salmon)', calories: 208, protein: 20, carbs: 0, fat: 13, sugar: 0, sodium: 50, serving: '6 pieces (150g)', servingG: 150 },
  { id: 'ramen', name: 'Ramen', calories: 188, protein: 5, carbs: 27, fat: 7, sugar: 1, sodium: 891, serving: '1 bowl (500g)', servingG: 500 },
  { id: 'udon', name: 'Udon Noodles', calories: 105, protein: 3, carbs: 22, fat: 0, sugar: 0, sodium: 160, serving: '1 bowl (400g)', servingG: 400 },
  { id: 'teriyaki_chicken', name: 'Teriyaki Chicken', calories: 175, protein: 20, carbs: 10, fat: 6, sugar: 7, sodium: 620, serving: '1 serving (170g)', servingG: 170 },
  { id: 'tempura', name: 'Tempura (shrimp)', calories: 242, protein: 8, carbs: 22, fat: 14, sugar: 1, sodium: 180, serving: '4 pieces (120g)', servingG: 120 },
  { id: 'gyoza', name: 'Gyoza (dumplings)', calories: 193, protein: 8, carbs: 23, fat: 8, sugar: 2, sodium: 420, serving: '6 pieces (138g)', servingG: 138 },
  
  // Asian - Chinese
  { id: 'fried_rice', name: 'Fried Rice', calories: 163, protein: 4, carbs: 20, fat: 7, sugar: 1, sodium: 487, serving: '1 cup (198g)', servingG: 198 },
  { id: 'lo_mein', name: 'Lo Mein', calories: 147, protein: 6, carbs: 18, fat: 6, sugar: 2, sodium: 474, serving: '1 cup (200g)', servingG: 200 },
  { id: 'kung_pao', name: 'Kung Pao Chicken', calories: 165, protein: 14, carbs: 10, fat: 8, sugar: 4, sodium: 720, serving: '1 cup (217g)', servingG: 217 },
  { id: 'orange_chicken', name: 'Orange Chicken', calories: 220, protein: 15, carbs: 25, fat: 8, sugar: 14, sodium: 540, serving: '1 cup (200g)', servingG: 200 },
  { id: 'general_tso', name: 'General Tso Chicken', calories: 253, protein: 14, carbs: 22, fat: 13, sugar: 10, sodium: 680, serving: '1 cup (225g)', servingG: 225 },
  { id: 'dim_sum', name: 'Dim Sum (mixed)', calories: 178, protein: 7, carbs: 18, fat: 9, sugar: 2, sodium: 450, serving: '4 pieces (120g)', servingG: 120 },
  { id: 'spring_roll', name: 'Spring Roll (fried)', calories: 272, protein: 6, carbs: 27, fat: 15, sugar: 3, sodium: 340, serving: '2 rolls (128g)', servingG: 128 },
  
  // Asian - Thai
  { id: 'pad_thai', name: 'Pad Thai', calories: 180, protein: 8, carbs: 23, fat: 7, sugar: 5, sodium: 520, serving: '1 cup (200g)', servingG: 200 },
  { id: 'thai_curry', name: 'Thai Green Curry', calories: 162, protein: 12, carbs: 8, fat: 10, sugar: 3, sodium: 580, serving: '1 cup (240g)', servingG: 240 },
  { id: 'tom_yum', name: 'Tom Yum Soup', calories: 94, protein: 7, carbs: 8, fat: 4, sugar: 2, sodium: 720, serving: '1 cup (240g)', servingG: 240 },
  
  // Asian - Vietnamese
  { id: 'pho', name: 'Pho (beef)', calories: 215, protein: 15, carbs: 25, fat: 6, sugar: 1, sodium: 750, serving: '1 bowl (500g)', servingG: 500 },
  { id: 'banh_mi', name: 'Banh Mi (Vietnamese Sandwich)', calories: 364, protein: 16, carbs: 44, fat: 14, sugar: 6, sodium: 920, serving: '1 sandwich (280g)', servingG: 280 },
  { id: 'spring_roll_fresh', name: 'Fresh Spring Rolls (Vietnamese)', calories: 89, protein: 4, carbs: 13, fat: 2, sugar: 2, sodium: 260, serving: '2 rolls (130g)', servingG: 130 },
  
  // Asian - Korean (한식)
  { id: 'tangsuyuk', name: 'Sweet and Sour Pork (탕수육)', calories: 265, protein: 15, carbs: 28, fat: 11, sugar: 18, sodium: 520, serving: '1 serving (250g)', servingG: 250 },
  { id: 'bibimbap', name: 'Bibimbap (비빔밥)', calories: 140, protein: 7, carbs: 22, fat: 3, sugar: 3, sodium: 420, serving: '1 bowl (420g)', servingG: 420 },
  { id: 'bulgogi', name: 'Bulgogi (불고기)', calories: 200, protein: 17, carbs: 10, fat: 11, sugar: 8, sodium: 580, serving: '1 serving (150g)', servingG: 150 },
  { id: 'kimchi', name: 'Kimchi (김치)', calories: 23, protein: 1, carbs: 4, fat: 0, sugar: 2, sodium: 670, serving: '1/2 cup (75g)', servingG: 75 },
  { id: 'korean_fried_chicken', name: 'Korean Fried Chicken (치킨)', calories: 285, protein: 22, carbs: 12, fat: 17, sugar: 5, sodium: 750, serving: '4 pieces (200g)', servingG: 200 },
  { id: 'japchae', name: 'Japchae (잡채)', calories: 144, protein: 4, carbs: 24, fat: 4, sugar: 6, sodium: 420, serving: '1 cup (200g)', servingG: 200 },
  { id: 'kimbap', name: 'Kimbap (김밥)', calories: 160, protein: 5, carbs: 28, fat: 3, sugar: 4, sodium: 380, serving: '4 pieces (140g)', servingG: 140 },
  { id: 'kimchi_jjigae', name: 'Kimchi Stew (김치찌개)', calories: 145, protein: 12, carbs: 9, fat: 7, sugar: 4, sodium: 950, serving: '1 bowl (450g)', servingG: 450 },
  { id: 'galbi', name: 'Korean Short Ribs (갈비)', calories: 325, protein: 26, carbs: 8, fat: 21, sugar: 6, sodium: 680, serving: '1 serving (200g)', servingG: 200 },
  { id: 'samgyeopsal', name: 'Pork Belly (삼겹살)', calories: 518, protein: 19, carbs: 0, fat: 48, sugar: 0, sodium: 62, serving: '1 serving (200g)', servingG: 200 },
  { id: 'tteokbokki', name: 'Spicy Rice Cakes (떡볶이)', calories: 147, protein: 2, carbs: 32, fat: 1, sugar: 8, sodium: 620, serving: '1 serving (250g)', servingG: 250 },
  { id: 'jjajangmyeon', name: 'Black Bean Noodles (짜장면)', calories: 540, protein: 16, carbs: 92, fat: 11, sugar: 12, sodium: 1200, serving: '1 bowl (700g)', servingG: 700 },
  { id: 'jjamppong', name: 'Spicy Seafood Noodles (짬뽕)', calories: 520, protein: 28, carbs: 78, fat: 12, sugar: 6, sodium: 1450, serving: '1 bowl (700g)', servingG: 700 },
  { id: 'samgyetang', name: 'Ginseng Chicken Soup (삼계탕)', calories: 380, protein: 42, carbs: 18, fat: 15, sugar: 2, sodium: 920, serving: '1 bowl (800g)', servingG: 800 },
  
  // Indian
  { id: 'curry_chicken', name: 'Chicken Curry', calories: 148, protein: 14, carbs: 6, fat: 8, sugar: 2, sodium: 480, serving: '1 cup (240g)', servingG: 240 },
  { id: 'tikka_masala', name: 'Tikka Masala', calories: 169, protein: 14, carbs: 9, fat: 9, sugar: 4, sodium: 520, serving: '1 cup (250g)', servingG: 250 },
  { id: 'naan', name: 'Naan Bread', calories: 262, protein: 9, carbs: 45, fat: 5, sugar: 3, sodium: 418, serving: '1 piece (90g)', servingG: 90 },
  { id: 'samosa', name: 'Samosa', calories: 308, protein: 6, carbs: 32, fat: 17, sugar: 2, sodium: 420, serving: '2 samosas (100g)', servingG: 100 },
  { id: 'biryani', name: 'Biryani', calories: 186, protein: 7, carbs: 26, fat: 6, sugar: 2, sodium: 380, serving: '1 cup (200g)', servingG: 200 },
  
  // Italian
  { id: 'lasagna', name: 'Lasagna', calories: 135, protein: 8, carbs: 15, fat: 5, sugar: 3, sodium: 380, serving: '1 piece (250g)', servingG: 250 },
  { id: 'risotto', name: 'Risotto', calories: 166, protein: 4, carbs: 25, fat: 5, sugar: 1, sodium: 360, serving: '1 cup (220g)', servingG: 220 },
  { id: 'carbonara', name: 'Pasta Carbonara', calories: 210, protein: 10, carbs: 23, fat: 9, sugar: 1, sodium: 580, serving: '1 cup (200g)', servingG: 200 },
  
  // Mediterranean
  { id: 'falafel', name: 'Falafel', calories: 333, protein: 13, carbs: 32, fat: 18, sugar: 3, sodium: 580, serving: '4 pieces (68g)', servingG: 68 },
  { id: 'hummus', name: 'Hummus', calories: 166, protein: 8, carbs: 14, fat: 10, sugar: 0, sodium: 379, serving: '1/4 cup (62g)', servingG: 62 },
  { id: 'shawarma', name: 'Shawarma (chicken)', calories: 196, protein: 18, carbs: 9, fat: 10, sugar: 2, sodium: 520, serving: '1 wrap (200g)', servingG: 200 },
  { id: 'gyro', name: 'Gyro', calories: 217, protein: 13, carbs: 20, fat: 10, sugar: 3, sodium: 560, serving: '1 gyro (170g)', servingG: 170 },
  { id: 'kebab', name: 'Kebab (lamb)', calories: 227, protein: 22, carbs: 6, fat: 13, sugar: 3, sodium: 480, serving: '1 skewer (150g)', servingG: 150 },
  
  // Desserts
  { id: 'ice_cream', name: 'Ice Cream (vanilla)', calories: 207, protein: 4, carbs: 24, fat: 11, sugar: 21, sodium: 80, serving: '1/2 cup (66g)', servingG: 66 },
  { id: 'chocolate_cake', name: 'Chocolate Cake', calories: 371, protein: 5, carbs: 51, fat: 17, sugar: 35, sodium: 299, serving: '1 slice (95g)', servingG: 95 },
  { id: 'donut', name: 'Donut (glazed)', calories: 421, protein: 5, carbs: 53, fat: 22, sugar: 25, sodium: 381, serving: '1 donut (60g)', servingG: 60 },
  { id: 'cookie_chocolate', name: 'Chocolate Chip Cookie', calories: 488, protein: 5, carbs: 64, fat: 24, sugar: 35, sodium: 315, serving: '1 cookie (30g)', servingG: 30 },
  { id: 'cheesecake', name: 'Cheesecake', calories: 321, protein: 6, carbs: 26, fat: 22, sugar: 18, sodium: 280, serving: '1 slice (125g)', servingG: 125 },
  { id: 'brownie', name: 'Brownie', calories: 466, protein: 6, carbs: 54, fat: 26, sugar: 34, sodium: 176, serving: '1 brownie (56g)', servingG: 56 },
  
  // Dairy
  { id: 'yogurt', name: 'Yogurt (plain)', calories: 59, protein: 10, carbs: 4, fat: 0, sugar: 4, sodium: 46, serving: '1 cup (245g)', servingG: 245 },
  { id: 'yogurt_greek', name: 'Greek Yogurt', calories: 97, protein: 17, carbs: 6, fat: 1, sugar: 4, sodium: 56, serving: '1 cup (245g)', servingG: 245 },
  { id: 'cheese', name: 'Cheese (cheddar)', calories: 403, protein: 25, carbs: 1, fat: 33, sugar: 0, sodium: 621, serving: '1 oz (28g)', servingG: 28 },
  { id: 'milk', name: 'Milk (whole)', calories: 61, protein: 3, carbs: 5, fat: 3, sugar: 5, sodium: 43, serving: '1 cup (244g)', servingG: 244 },
  
  // Drinks
  { id: 'coffee_latte', name: 'Latte', calories: 135, protein: 8, carbs: 13, fat: 5, sugar: 11, sodium: 150, serving: '1 grande (473ml)', servingG: 473 },
  { id: 'smoothie', name: 'Fruit Smoothie', calories: 135, protein: 2, carbs: 32, fat: 1, sugar: 24, sodium: 30, serving: '1 cup (245g)', servingG: 245 },
  { id: 'orange_juice', name: 'Orange Juice', calories: 45, protein: 1, carbs: 10, fat: 0, sugar: 8, sodium: 1, serving: '1 cup (248g)', servingG: 248 },
  { id: 'bubble_tea', name: 'Bubble Tea (milk tea)', calories: 278, protein: 1, carbs: 68, fat: 1, sugar: 50, sodium: 45, serving: '1 cup (500ml)', servingG: 500 },
  
  // Snacks
  { id: 'almonds', name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, sugar: 4, sodium: 1, serving: '1/4 cup (36g)', servingG: 36 },
  { id: 'peanut_butter', name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, sugar: 9, sodium: 426, serving: '2 tbsp (32g)', servingG: 32 },
  { id: 'chips', name: 'Potato Chips', calories: 536, protein: 7, carbs: 53, fat: 35, sugar: 2, sodium: 525, serving: '1 oz (28g)', servingG: 28 },
  { id: 'popcorn', name: 'Popcorn (buttered)', calories: 387, protein: 4, carbs: 78, fat: 5, sugar: 0, sodium: 580, serving: '1 cup (8g)', servingG: 8 },
];

const RECENT_FOODS_KEY = '@good_steward_recent_foods';
const MAX_RECENT_FOODS = 10;

export interface FoodSearchResult {
  id: string;
  name: string;
  calories: number;  // per 100g
  protein: number;   // per 100g
  carbs: number;     // per 100g
  fat: number;       // per 100g
  sugar: number;     // per 100g (for health warnings)
  sodium: number;    // mg per 100g (for health warnings)
  serving: string;   // e.g., "1 medium (118g)"
  servingG: number;  // serving size in grams
}

type Props = {
  visible: boolean;
  photoUri?: string;
  onClose: () => void;
  onSelect: (food: FoodSearchResult, servings: number) => void;
};

// Thresholds for health warnings (per 100g)
const SUGAR_THRESHOLD = 15; // g per 100g
const SODIUM_THRESHOLD = 500; // mg per 100g
const CARBS_THRESHOLD = 30; // g per 100g (for diabetes)

/**
 * Modal for searching generic foods by name
 */
export default function FoodSearchModal({ 
  visible, 
  photoUri,
  onClose, 
  onSelect,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [inputMode, setInputMode] = useState<'servings' | 'weight'>('servings');
  const [servings, setServings] = useState<string>('1');
  const [weightValue, setWeightValue] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<'g' | 'oz'>('g');
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);  // Loading state for USDA search
  const [activeTab, setActiveTab] = useState<'search' | 'recent'>('search');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [usdaAvailable] = useState(isUSDAAvailable());

  // Load user profile and recent foods on mount
  useEffect(() => {
    if (visible) {
      profileService.loadProfile().then(profile => {
        setUserProfile(profile);
      });
      loadRecentFoods();
    }
  }, [visible]);

  // Load recent foods from storage
  const loadRecentFoods = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_FOODS_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        const foods = ids.map(id => COMMON_FOODS.find(f => f.id === id)).filter(Boolean) as FoodSearchResult[];
        setRecentFoods(foods);
      }
    } catch (e) {
      console.warn('Failed to load recent foods');
    }
  };

  // Save to recent foods
  const saveToRecent = async (food: FoodSearchResult) => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_FOODS_KEY);
      let ids = stored ? JSON.parse(stored) : [];
      // Remove if exists, add to front
      ids = ids.filter((id: string) => id !== food.id);
      ids.unshift(food.id);
      // Keep only last N
      ids = ids.slice(0, MAX_RECENT_FOODS);
      await AsyncStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('Failed to save recent food');
    }
  };

  // Search foods by name
  // Convert USDA result to our format
  const convertUSDAResult = useCallback((usda: USDAFoodResult): FoodSearchResult => ({
    id: `usda_${usda.fdcId}`,
    name: usda.name,
    calories: usda.calories,
    protein: usda.protein,
    carbs: usda.carbs,
    fat: usda.fat,
    sugar: usda.sugar,
    sodium: usda.sodium,
    serving: `${usda.servingSize || 100}${usda.servingUnit || 'g'}`,
    servingG: usda.servingSize || 100,
  }), []);

  const handleSearch = useCallback(async () => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    
    setSearched(true);
    setActiveTab('search');
    
    // Check if query contains Korean characters
    const isKorean = hasKoreanCharacters(q);
    let searchTerms = [q];
    
    // Translate Korean to English search terms
    if (isKorean) {
      const translation = translateKoreanFood(q);
      if (translation.found && translation.searchTerms) {
        console.log(`🇰🇷 Korean food detected: ${q}`);
        console.log(`   Translated to: ${translation.english}`);
        console.log(`   Search terms: ${translation.searchTerms.join(', ')}`);
        searchTerms = [...translation.searchTerms, q]; // Include original too
      } else {
        console.log(`⚠️ Korean text detected but no translation available: ${q}`);
      }
    }
    
    // 1. Search local database first (instant) with all search terms
    const localMatches = COMMON_FOODS.filter(food => 
      searchTerms.some(term => 
        food.name.toLowerCase().includes(term.toLowerCase()) ||
        food.id.includes(term.replace(/\s+/g, '_'))
      )
    );
    
    // If we have enough local results, use them
    if (localMatches.length >= 3) {
      setResults(localMatches);
      return;
    }
    
    // 2. If local results are insufficient, search USDA API
    if (usdaAvailable) {
      setSearching(true);
      setResults(localMatches); // Show local results while searching
      
      try {
        // Search USDA with all search terms (prioritize English translation)
        const primaryTerm = searchTerms[0]; // English translation if Korean, otherwise original
        const usdaResults = await searchUSDAFoods(primaryTerm, 10);
        
        // Convert and merge results (local first, then USDA)
        const convertedUSDA = usdaResults.map(convertUSDAResult);
        
        // Deduplicate by similar names
        const existingNames = new Set(localMatches.map(f => f.name.toLowerCase()));
        const uniqueUSDA = convertedUSDA.filter(f => 
          !existingNames.has(f.name.toLowerCase())
        );
        
        setResults([...localMatches, ...uniqueUSDA]);
      } catch (error) {
        console.warn('USDA search failed, using local results');
        setResults(localMatches);
      } finally {
        setSearching(false);
      }
    } else {
      setResults(localMatches);
    }
  }, [query, usdaAvailable, convertUSDAResult]);

  // Get health warnings for a food based on user profile
  const getHealthWarnings = useCallback((food: FoodSearchResult): string[] => {
    const warnings: string[] = [];
    
    if (userProfile?.diabetesMode && food.carbs > CARBS_THRESHOLD) {
      warnings.push(`⚠️ High carbs (${food.carbs}g/100g)`);
    }
    
    if (userProfile?.diabetesMode && food.sugar > SUGAR_THRESHOLD) {
      warnings.push(`⚠️ High sugar (${food.sugar}g/100g)`);
    }
    
    // High sodium warning for everyone if > 600mg
    if (food.sodium > 600) {
      warnings.push(`🧂 High sodium (${food.sodium}mg/100g)`);
    }
    
    return warnings;
  }, [userProfile]);

  // Get health tags for search results (shown in list)
  const getHealthTags = useCallback((food: FoodSearchResult): { label: string; color: string }[] => {
    const tags: { label: string; color: string }[] = [];
    
    if (food.sugar > SUGAR_THRESHOLD) {
      tags.push({ label: '🍬 High Sugar', color: '#E65100' });
    }
    if (food.sodium > SODIUM_THRESHOLD) {
      tags.push({ label: '🧂 High Sodium', color: '#D32F2F' });
    }
    if (food.protein >= 20) {
      tags.push({ label: '💪 High Protein', color: '#2E7D32' });
    }
    
    return tags;
  }, []);

  // Calculate nutrition for weight
  const getWeightNutrition = useCallback((food: FoodSearchResult, grams: number) => {
    const multiplier = grams / 100;
    return {
      calories: Math.round(food.calories * multiplier),
      protein: Math.round(food.protein * multiplier * 10) / 10,
      carbs: Math.round(food.carbs * multiplier * 10) / 10,
      fat: Math.round(food.fat * multiplier * 10) / 10,
      sugar: Math.round(food.sugar * multiplier * 10) / 10,
    };
  }, []);

  // Calculate final grams based on input mode
  const getFinalGrams = useCallback((): number => {
    if (!selectedFood) return 0;
    
    if (inputMode === 'servings') {
      const numServings = parseFloat(servings) || 1;
      return selectedFood.servingG * numServings;
    } else {
      const value = parseFloat(weightValue) || 0;
      return weightUnit === 'oz' ? value * 28.35 : value;
    }
  }, [selectedFood, inputMode, servings, weightValue, weightUnit]);

  const finalGrams = getFinalGrams();
  const servingNutrition = selectedFood ? getWeightNutrition(selectedFood, finalGrams) : null;

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelectedFood(null);
    setServings('1');
    setWeightValue('');
    setInputMode('servings');
    setSearched(false);
    setActiveTab('search');
    onClose();
  }, [onClose]);

  const handleSelectFood = useCallback((food: FoodSearchResult) => {
    setSelectedFood(food);
    setServings('1');
    setWeightValue(food.servingG.toString());
    setInputMode('servings');
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedFood) {
      // Save to recent
      saveToRecent(selectedFood);
      
      // Calculate servings equivalent for the callback
      const grams = getFinalGrams();
      const servingsEquivalent = grams / selectedFood.servingG;
      
      onSelect(selectedFood, servingsEquivalent);
      handleClose();
    }
  }, [selectedFood, getFinalGrams, onSelect, handleClose]);

  const handleBack = useCallback(() => {
    setSelectedFood(null);
    setServings('1');
    setWeightValue('');
    setInputMode('servings');
  }, []);

  const warnings = selectedFood ? getHealthWarnings(selectedFood) : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modal}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            {selectedFood ? (
              <Pressable onPress={handleBack} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#333" />
              </Pressable>
            ) : (
              <View style={styles.titleContainer}>
                <MaterialIcons name="restaurant" size={24} color="#E65100" />
                <Text style={styles.title}>Find Food</Text>
              </View>
            )}
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {!selectedFood ? (
            /* Search View */
            <>
              {/* Photo preview if available */}
              {photoUri && (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
                  <Text style={styles.photoHint}>Find food similar to your photo</Text>
                </View>
              )}

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type food name... (pizza, chicken, etc.)"
                  placeholderTextColor="#999"
                  value={query}
                  onChangeText={(text) => {
                    setQuery(text);
                    setSearched(false);
                  }}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoFocus
                  autoCapitalize="none"
                />
                <Pressable 
                  style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
                  onPress={handleSearch}
                  disabled={!query.trim()}
                >
                  <MaterialIcons name="search" size={24} color="#fff" />
                </Pressable>
              </View>

              {/* Tabs: Search / Recent */}
              <View style={styles.tabs}>
                <Pressable 
                  style={[styles.tab, activeTab === 'search' && styles.tabActive]}
                  onPress={() => setActiveTab('search')}
                >
                  <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
                    Popular
                  </Text>
                </Pressable>
                <Pressable 
                  style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
                  onPress={() => setActiveTab('recent')}
                >
                  <MaterialIcons 
                    name="history" 
                    size={16} 
                    color={activeTab === 'recent' ? '#E65100' : '#666'} 
                  />
                  <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
                    Recent
                  </Text>
                </Pressable>
              </View>

              {/* Recent foods */}
              {activeTab === 'recent' && (
                recentFoods.length > 0 ? (
                  <FlatList
                    data={recentFoods}
                    keyExtractor={(item) => `recent_${item.id}`}
                    style={styles.resultsList}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <FoodResultItem 
                        food={item} 
                        onSelect={handleSelectFood}
                        tags={getHealthTags(item)}
                      />
                    )}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="history" size={48} color="#CCC" />
                    <Text style={styles.emptyText}>No recent foods yet</Text>
                    <Text style={styles.emptySubtext}>Foods you select will appear here</Text>
                  </View>
                )
              )}

              {/* Search results or popular foods */}
              {activeTab === 'search' && (
                <>
                  {/* Quick suggestions - only when not searched */}
                  {!searched && results.length === 0 && (
                    <View style={styles.suggestions}>
                      <View style={styles.suggestionChips}>
                        {['Pizza', 'Chicken', 'Rice', 'Salad', 'Burger', 'Pasta'].map(food => (
                          <Pressable 
                            key={food} 
                            style={styles.chip}
                            onPress={() => {
                              setQuery(food);
                              const matches = COMMON_FOODS.filter(f => 
                                f.name.toLowerCase().includes(food.toLowerCase())
                              );
                              setResults(matches);
                              setSearched(true);
                            }}
                          >
                            <Text style={styles.chipText}>{food}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Loading indicator for USDA search */}
                  {searching && (
                    <View style={styles.searchingContainer}>
                      <ActivityIndicator size="small" color="#E65100" />
                      <Text style={styles.searchingText}>Searching USDA database...</Text>
                    </View>
                  )}

                  {/* No results */}
                  {searched && !searching && results.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <MaterialIcons name="search-off" size={48} color="#CCC" />
                      <Text style={styles.emptyText}>No foods found for "{query}"</Text>
                      <Text style={styles.emptySubtext}>Try different keywords or spelling</Text>
                      {!usdaAvailable && (
                        <Text style={styles.emptyHint}>
                          💡 Add USDA API key to search 300,000+ foods
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Results */}
                  {(searched ? results : COMMON_FOODS.slice(0, 15)).length > 0 && (
                    <FlatList
                      data={searched ? results : COMMON_FOODS.slice(0, 15)}
                      keyExtractor={(item) => item.id}
                      style={styles.resultsList}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <FoodResultItem 
                          food={item} 
                          onSelect={handleSelectFood}
                          tags={getHealthTags(item)}
                        />
                      )}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            /* Selected Food Detail View */
            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.detailContainer}>
                <Text style={styles.detailFoodName}>{selectedFood.name}</Text>
                
                {/* Health Warnings */}
                {warnings.length > 0 && (
                  <View style={styles.warningsContainer}>
                    {warnings.map((warning, i) => (
                      <Text key={i} style={styles.warningText}>{warning}</Text>
                    ))}
                    {userProfile?.diabetesMode && (
                      <Text style={styles.warningNote}>
                        Based on your diabetes mode settings
                      </Text>
                    )}
                  </View>
                )}

                {/* Input Mode Toggle */}
                <View style={styles.inputModeToggle}>
                  <Pressable 
                    style={[styles.modeButton, inputMode === 'servings' && styles.modeButtonActive]}
                    onPress={() => setInputMode('servings')}
                  >
                    <Text style={[styles.modeButtonText, inputMode === 'servings' && styles.modeButtonTextActive]}>
                      Servings
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.modeButton, inputMode === 'weight' && styles.modeButtonActive]}
                    onPress={() => setInputMode('weight')}
                  >
                    <Text style={[styles.modeButtonText, inputMode === 'weight' && styles.modeButtonTextActive]}>
                      Weight (g/oz)
                    </Text>
                  </Pressable>
                </View>

                {/* Servings Input */}
                {inputMode === 'servings' && (
                  <View style={styles.servingSection}>
                    <Text style={styles.servingInfo}>1 serving = {selectedFood.serving}</Text>
                    
                    <View style={styles.servingSelector}>
                      <Pressable 
                        style={styles.servingButton}
                        onPress={() => {
                          const n = Math.max(0.5, (parseFloat(servings) || 1) - 0.5);
                          setServings(n.toString());
                        }}
                      >
                        <MaterialIcons name="remove" size={24} color="#333" />
                      </Pressable>
                      
                      <TextInput
                        style={styles.servingInput}
                        value={servings}
                        onChangeText={setServings}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                      />
                      
                      <Pressable 
                        style={styles.servingButton}
                        onPress={() => {
                          const n = (parseFloat(servings) || 1) + 0.5;
                          setServings(n.toString());
                        }}
                      >
                        <MaterialIcons name="add" size={24} color="#333" />
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Weight Input */}
                {inputMode === 'weight' && (
                  <View style={styles.weightSection}>
                    <Text style={styles.servingInfo}>Enter exact weight</Text>
                    
                    <View style={styles.weightInputRow}>
                      <TextInput
                        style={styles.weightInput}
                        value={weightValue}
                        onChangeText={setWeightValue}
                        keyboardType="decimal-pad"
                        placeholder="e.g., 150"
                        selectTextOnFocus
                      />
                      
                      <View style={styles.unitToggle}>
                        <Pressable
                          style={[styles.unitButton, weightUnit === 'g' && styles.unitButtonActive]}
                          onPress={() => setWeightUnit('g')}
                        >
                          <Text style={[styles.unitButtonText, weightUnit === 'g' && styles.unitButtonTextActive]}>g</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.unitButton, weightUnit === 'oz' && styles.unitButtonActive]}
                          onPress={() => setWeightUnit('oz')}
                        >
                          <Text style={[styles.unitButtonText, weightUnit === 'oz' && styles.unitButtonTextActive]}>oz</Text>
                        </Pressable>
                      </View>
                    </View>
                    
                    <Text style={styles.weightHint}>
                      = {Math.round(finalGrams)}g total
                    </Text>
                  </View>
                )}

                {/* Nutrition preview */}
                {servingNutrition && (
                  <View style={styles.nutritionPreview}>
                    <Text style={styles.nutritionTitle}>
                      Nutrition ({Math.round(finalGrams)}g)
                    </Text>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionEmoji}>🔥</Text>
                        <Text style={styles.nutritionValue}>{servingNutrition.calories}</Text>
                        <Text style={styles.nutritionLabel}>kcal</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionEmoji}>💪</Text>
                        <Text style={styles.nutritionValue}>{servingNutrition.protein}g</Text>
                        <Text style={styles.nutritionLabel}>protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionEmoji}>🍞</Text>
                        <Text style={styles.nutritionValue}>{servingNutrition.carbs}g</Text>
                        <Text style={styles.nutritionLabel}>carbs</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionEmoji}>🧈</Text>
                        <Text style={styles.nutritionValue}>{servingNutrition.fat}g</Text>
                        <Text style={styles.nutritionLabel}>fat</Text>
                      </View>
                    </View>
                    {userProfile?.diabetesMode && (
                      <Text style={styles.sugarInfo}>
                        🍬 Sugar: {servingNutrition.sugar}g
                      </Text>
                    )}
                  </View>
                )}

                {/* Confirm button */}
                <Pressable 
                  style={[styles.confirmButton, warnings.length > 0 && styles.confirmButtonWarning]} 
                  onPress={handleConfirm}
                >
                  <MaterialIcons name="add" size={24} color="#fff" />
                  <Text style={styles.confirmButtonText}>
                    Add to Log ({servingNutrition?.calories} kcal)
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Food result item component
 */
function FoodResultItem({ 
  food, 
  onSelect,
  tags,
}: { 
  food: FoodSearchResult; 
  onSelect: (food: FoodSearchResult) => void;
  tags: { label: string; color: string }[];
}) {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.resultItem,
        pressed && styles.resultItemPressed
      ]}
      onPress={() => onSelect(food)}
    >
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{food.name}</Text>
        <Text style={styles.resultServing}>{food.serving}</Text>
        <Text style={styles.resultNutrition}>
          {Math.round(food.calories * food.servingG / 100)} kcal • {Math.round(food.protein * food.servingG / 100)}g protein
        </Text>
        {/* Health tags */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: `${tag.color}15` }]}>
                <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#2E7D32" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: 40,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  photoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  photoHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#E65100',
    width: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#CCC',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#E65100',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#E65100',
  },
  suggestions: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  emptyHint: {
    fontSize: 12,
    color: '#E65100',
    marginTop: 12,
    textAlign: 'center',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  searchingText: {
    fontSize: 14,
    color: '#666',
  },
  resultsList: {
    paddingHorizontal: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 10,
  },
  resultItemPressed: {
    backgroundColor: '#E8F5E9',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultServing: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  resultNutrition: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailScroll: {
    flex: 1,
  },
  detailContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailFoodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningsContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E65100',
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    marginBottom: 4,
  },
  warningNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  inputModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#333',
  },
  servingSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  servingInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  servingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  servingButton: {
    width: 44,
    height: 44,
    backgroundColor: '#E0E0E0',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingInput: {
    width: 80,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  weightSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightInput: {
    width: 100,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  unitButtonActive: {
    backgroundColor: '#2E7D32',
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  weightHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
  },
  nutritionPreview: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  nutritionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  sugarInfo: {
    textAlign: 'center',
    fontSize: 13,
    color: '#E65100',
    marginTop: 12,
    fontWeight: '500',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonWarning: {
    backgroundColor: '#E65100',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
