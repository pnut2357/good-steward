/**
 * WebView Vision Service
 * 
 * Uses a hidden WebView to run Transformers.js for food recognition.
 * This approach works in both Expo Go and development builds!
 * 
 * Features:
 * - Uses BLIP model for image captioning
 * - Unlimited food categories
 * - Works offline after model download (~400MB cached)
 * - No API limits
 * 
 * How it works:
 * 1. Load a minimal HTML page with Transformers.js
 * 2. Pass base64 image data to the WebView
 * 3. WebView runs BLIP inference
 * 4. Returns caption and parsed food items
 */

import * as FileSystem from 'expo-file-system';
import { FOOD_LABELS, getBasicNutrition } from '../data/foodLabels';

// Service state
let isInitialized = false;
let webViewRef: any = null;
let pendingPromise: {
  resolve: (value: any) => void;
  reject: (error: any) => void;
} | null = null;

/**
 * The HTML content for the WebView that runs Transformers.js
 * This is loaded as a data URI
 */
export const VISION_WEBVIEW_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Food Vision</title>
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      font-family: system-ui; 
      background: #f5f5f5;
    }
    #status { color: #666; font-size: 14px; }
    #result { margin-top: 10px; }
    .loading { color: #2196F3; }
    .success { color: #4CAF50; }
    .error { color: #f44336; }
  </style>
</head>
<body>
  <div id="status">Initializing...</div>
  <div id="result"></div>

  <script type="module">
    // Import Transformers.js from CDN
    import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
    
    // Configure for browser
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    const status = document.getElementById('status');
    const result = document.getElementById('result');
    
    let captioner = null;
    let isReady = false;
    
    // Initialize the model
    async function initialize() {
      status.className = 'loading';
      status.textContent = 'Loading BLIP model (~400MB first time)...';
      
      try {
        captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
          progress_callback: (progress) => {
            if (progress.status === 'downloading') {
              const pct = Math.round((progress.loaded / progress.total) * 100);
              status.textContent = 'Downloading model: ' + pct + '%';
            }
          }
        });
        
        isReady = true;
        status.className = 'success';
        status.textContent = 'Ready! Model loaded.';
        
        // Notify React Native that we're ready
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'ready'
        }));
        
      } catch (error) {
        status.className = 'error';
        status.textContent = 'Error: ' + error.message;
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
    }
    
    // Analyze an image (called from React Native)
    async function analyzeImage(base64Data) {
      if (!isReady || !captioner) {
        return { error: 'Model not ready' };
      }
      
      status.className = 'loading';
      status.textContent = 'Analyzing image...';
      
      try {
        // Create data URL from base64
        const dataUrl = 'data:image/jpeg;base64,' + base64Data;
        
        // Run inference
        const startTime = Date.now();
        const output = await captioner(dataUrl);
        const elapsed = Date.now() - startTime;
        
        const caption = output[0]?.generated_text || 'Unknown';
        
        status.className = 'success';
        status.textContent = 'Done in ' + elapsed + 'ms: ' + caption;
        
        // Parse foods from caption
        const foods = parseFoodsFromCaption(caption);
        
        return {
          success: true,
          caption: caption,
          foods: foods,
          elapsed: elapsed
        };
        
      } catch (error) {
        status.className = 'error';
        status.textContent = 'Error: ' + error.message;
        return { error: error.message };
      }
    }
    
    // Parse food items from a caption
    function parseFoodsFromCaption(caption) {
      const foods = [];
      const lower = caption.toLowerCase();
      
      // Common food keywords to look for
      const foodKeywords = [
        'pizza', 'burger', 'hamburger', 'sandwich', 'salad', 'soup', 'steak',
        'chicken', 'fish', 'salmon', 'tuna', 'shrimp', 'lobster',
        'pasta', 'spaghetti', 'noodles', 'rice', 'sushi', 'ramen',
        'apple', 'banana', 'orange', 'strawberry', 'grape', 'watermelon',
        'broccoli', 'carrot', 'potato', 'tomato', 'lettuce', 'corn',
        'egg', 'bacon', 'sausage', 'toast', 'pancake', 'waffle',
        'cake', 'cookie', 'donut', 'ice cream', 'pie', 'brownie',
        'taco', 'burrito', 'nachos', 'fries', 'hot dog',
        'coffee', 'tea', 'smoothie', 'juice',
        'bread', 'cheese', 'butter', 'milk', 'yogurt',
        'fruit', 'vegetable', 'meat', 'seafood', 'dessert',
        'breakfast', 'lunch', 'dinner', 'snack', 'meal', 'food', 'plate'
      ];
      
      for (const keyword of foodKeywords) {
        if (lower.includes(keyword)) {
          foods.push(keyword);
        }
      }
      
      return foods;
    }
    
    // Handle messages from React Native
    window.handleMessage = async function(data) {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'analyze') {
          const resultData = await analyzeImage(message.base64);
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'result',
            requestId: message.requestId,
            ...resultData
          }));
        }
        
      } catch (error) {
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
    };
    
    // Expose for debugging
    window.analyzeImage = analyzeImage;
    
    // Start initialization
    initialize();
  </script>
</body>
</html>
`;

/**
 * Get the WebView HTML as a data URI
 */
export function getWebViewSource(): { html: string } {
  return { html: VISION_WEBVIEW_HTML };
}

/**
 * Set the WebView reference (call this from your component)
 */
export function setWebViewRef(ref: any): void {
  webViewRef = ref;
}

/**
 * Handle messages from the WebView
 */
export function handleWebViewMessage(event: any): void {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    
    if (data.type === 'ready') {
      isInitialized = true;
      console.log('✅ WebView Vision Service ready');
    }
    
    if (data.type === 'result' && pendingPromise) {
      if (data.error) {
        pendingPromise.reject(new Error(data.error));
      } else {
        pendingPromise.resolve(data);
      }
      pendingPromise = null;
    }
    
    if (data.type === 'error' && pendingPromise) {
      pendingPromise.reject(new Error(data.error));
      pendingPromise = null;
    }
    
  } catch (error) {
    console.error('WebView message error:', error);
  }
}

/**
 * Check if service is ready
 */
export function isWebViewVisionReady(): boolean {
  return isInitialized && webViewRef !== null;
}

/**
 * Analyze an image using the WebView
 */
export async function analyzeImageWithWebView(imageUri: string): Promise<{
  success: boolean;
  caption: string;
  foods: string[];
  label: string;
  confidence: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  elapsed?: number;
  error?: string;
}> {
  if (!isInitialized || !webViewRef) {
    return {
      success: false,
      caption: '',
      foods: [],
      label: 'Unknown',
      confidence: 0,
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: 'WebView not initialized',
    };
  }

  try {
    // Read image as base64
    let base64: string;
    if (FileSystem.File) {
      const file = new FileSystem.File(imageUri);
      base64 = await file.base64();
    } else {
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });
    }

    // Generate request ID
    const requestId = Date.now().toString();

    // Create promise for response
    const resultPromise = new Promise<any>((resolve, reject) => {
      pendingPromise = { resolve, reject };
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingPromise) {
          pendingPromise.reject(new Error('Timeout'));
          pendingPromise = null;
        }
      }, 30000);
    });

    // Send message to WebView
    webViewRef.injectJavaScript(`
      window.handleMessage('${JSON.stringify({
        type: 'analyze',
        base64: base64,
        requestId: requestId,
      })}');
      true;
    `);

    // Wait for result
    const result = await resultPromise;

    if (result.error) {
      return {
        success: false,
        caption: '',
        foods: [],
        label: 'Unknown',
        confidence: 0,
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        error: result.error,
      };
    }

    // Find best matching food label
    const mainFood = result.foods[0] || extractMainFood(result.caption);
    const nutrition = getBasicNutrition(mainFood);

    return {
      success: true,
      caption: result.caption,
      foods: result.foods,
      label: mainFood,
      confidence: result.foods.length > 0 ? 0.7 : 0.3,
      nutrition,
      elapsed: result.elapsed,
    };

  } catch (error: any) {
    return {
      success: false,
      caption: '',
      foods: [],
      label: 'Unknown',
      confidence: 0,
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: error.message,
    };
  }
}

/**
 * Extract main food from caption
 */
function extractMainFood(caption: string): string {
  const lower = caption.toLowerCase();
  
  // Try to find a matching food label
  for (const label of FOOD_LABELS) {
    if (lower.includes(label.toLowerCase())) {
      return label;
    }
  }
  
  // Fallback: extract first noun-like word
  const words = caption.split(' ');
  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 3) {
      return clean;
    }
  }
  
  return 'food';
}

