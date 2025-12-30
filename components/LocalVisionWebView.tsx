/**
 * LocalVisionWebView Component
 * 
 * A hidden WebView that runs BLIP model for local food recognition.
 * This allows local AI inference in Expo Go without native modules!
 * 
 * Usage:
 * 1. Mount this component somewhere in your app (it's invisible)
 * 2. Use localVisionService.analyzeImage() to recognize food
 * 
 * The model (~400MB) is cached in the browser's IndexedDB after first load.
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { FOOD_LABELS, getBasicNutrition } from '../data/foodLabels';

// Service state
let webViewRef: WebView | null = null;
let isReady = false;
let pendingRequests: Map<string, {
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = new Map();

/**
 * The HTML content for the WebView
 */
const WEBVIEW_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Food Vision AI</title>
  <style>
    body { 
      margin: 0; 
      padding: 10px; 
      font-family: -apple-system, system-ui, sans-serif;
      font-size: 12px;
      background: #1a1a2e;
      color: #eee;
    }
    #status { margin-bottom: 8px; }
    .loading { color: #ffd93d; }
    .ready { color: #6bcb77; }
    .error { color: #ff6b6b; }
    .progress { 
      background: #333;
      border-radius: 4px;
      height: 6px;
      margin-top: 4px;
      overflow: hidden;
    }
    .progress-bar {
      background: linear-gradient(90deg, #6bcb77, #4d96ff);
      height: 100%;
      width: 0%;
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <div id="status" class="loading">Loading AI model...</div>
  <div class="progress"><div id="progress-bar" class="progress-bar"></div></div>

  <script type="module">
    import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
    
    // Configure for Expo Go WebView environment
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.useBrowserCache = false;  // Disabled - Expo Go WebView doesn't support IndexedDB
    env.useCustomCache = false;   // Don't try to use custom cache
    
    const status = document.getElementById('status');
    const progressBar = document.getElementById('progress-bar');
    
    let captioner = null;
    
    async function initialize() {
      try {
        status.textContent = 'Downloading AI model (~50MB)...';
        
        captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
          quantized: true,  // Use quantized model (smaller, faster)
          progress_callback: (progress) => {
            if (progress.status === 'downloading' || progress.status === 'progress') {
              const pct = progress.progress ? Math.round(progress.progress) : 
                         (progress.loaded && progress.total) ? Math.round((progress.loaded / progress.total) * 100) : 0;
              progressBar.style.width = pct + '%';
              status.textContent = 'Downloading: ' + pct + '%';
            } else if (progress.status === 'loading' || progress.status === 'ready') {
              status.textContent = 'Loading model...';
            }
          }
        });
        
        status.className = 'ready';
        status.textContent = '✓ AI Ready';
        progressBar.style.width = '100%';
        
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        
      } catch (error) {
        console.error('BLIP init error:', error);
        status.className = 'error';
        status.textContent = 'Error: ' + error.message;
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'error', 
          error: error.message 
        }));
      }
    }
    
    async function analyzeImage(base64, requestId) {
      if (!captioner) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          requestId,
          error: 'Model not loaded'
        }));
        return;
      }
      
      status.textContent = 'Analyzing...';
      
      try {
        const dataUrl = 'data:image/jpeg;base64,' + base64;
        const startTime = Date.now();
        const output = await captioner(dataUrl);
        const elapsed = Date.now() - startTime;
        
        const caption = output[0]?.generated_text || 'Unknown food';
        
        status.className = 'ready';
        status.textContent = '✓ ' + caption;
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          requestId,
          success: true,
          caption,
          elapsed
        }));
        
      } catch (error) {
        status.className = 'error';
        status.textContent = 'Error: ' + error.message;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          requestId,
          error: error.message
        }));
      }
    }
    
    // Handle messages from React Native
    window.handleRNMessage = function(data) {
      const msg = JSON.parse(data);
      if (msg.type === 'analyze') {
        analyzeImage(msg.base64, msg.requestId);
      }
    };
    
    initialize();
  </script>
</body>
</html>
`;

export interface LocalVisionResult {
  success: boolean;
  caption: string;
  foodName: string;
  confidence: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  elapsed?: number;
  error?: string;
}

interface Props {
  onReady?: () => void;
  onError?: (error: string) => void;
  visible?: boolean;
}

/**
 * LocalVisionWebView Component
 */
export function LocalVisionWebView({ onReady, onError, visible = false }: Props) {
  const webView = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading AI model...');

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'ready') {
        isReady = true;
        setLoading(false);
        setStatus('AI Ready');
        onReady?.();
      }
      
      if (data.type === 'error') {
        setStatus('Error: ' + data.error);
        onError?.(data.error);
      }
      
      if (data.type === 'result') {
        const pending = pendingRequests.get(data.requestId);
        if (pending) {
          pendingRequests.delete(data.requestId);
          
          if (data.error) {
            pending.reject(new Error(data.error));
          } else {
            // Parse food from caption
            const foodName = extractFoodFromCaption(data.caption);
            const nutrition = getBasicNutrition(foodName);
            
            pending.resolve({
              success: true,
              caption: data.caption,
              foodName,
              confidence: 0.7,
              nutrition,
              elapsed: data.elapsed,
            });
          }
        }
      }
      
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  useEffect(() => {
    if (webView.current) {
      webViewRef = webView.current;
    }
    return () => {
      webViewRef = null;
      isReady = false;
    };
  }, []);

  return (
    <View style={[styles.container, !visible && styles.hidden]}>
      {visible && loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#6bcb77" />
          <Text style={styles.loadingText}>{status}</Text>
        </View>
      )}
      <WebView
        ref={webView}
        source={{ html: WEBVIEW_HTML }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
      />
    </View>
  );
}

/**
 * Extract food name from caption
 */
function extractFoodFromCaption(caption: string): string {
  const lower = caption.toLowerCase();
  
  // Try to find matching food label
  for (const label of FOOD_LABELS) {
    if (lower.includes(label.toLowerCase())) {
      return label;
    }
  }
  
  // Common food keywords
  const foodWords = ['pizza', 'burger', 'sandwich', 'salad', 'apple', 'orange', 
    'banana', 'chicken', 'fish', 'rice', 'pasta', 'soup', 'cake', 'cookie'];
  
  for (const word of foodWords) {
    if (lower.includes(word)) {
      return word;
    }
  }
  
  // Return cleaned caption
  return caption.replace(/^a\s+/i, '').replace(/\s+is.*$/, '').trim() || 'food';
}

/**
 * Analyze image using local BLIP model
 */
export async function analyzeImageLocally(imageUri: string): Promise<LocalVisionResult> {
  if (!webViewRef) {
    return {
      success: false,
      caption: '',
      foodName: 'Unknown',
      confidence: 0,
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: 'LocalVisionWebView not mounted. Add <LocalVisionWebView /> to your app.',
    };
  }

  if (!isReady) {
    return {
      success: false,
      caption: '',
      foodName: 'Unknown',
      confidence: 0,
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: 'AI model still loading. Please wait...',
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

    const requestId = Date.now().toString();

    // Create promise for response
    const resultPromise = new Promise<LocalVisionResult>((resolve, reject) => {
      pendingRequests.set(requestId, { resolve, reject });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          reject(new Error('Timeout - model took too long'));
        }
      }, 30000);
    });

    // Send to WebView
    webViewRef.injectJavaScript(`
      window.handleRNMessage('${JSON.stringify({
        type: 'analyze',
        base64,
        requestId,
      }).replace(/'/g, "\\'")}');
      true;
    `);

    return await resultPromise;

  } catch (error: any) {
    return {
      success: false,
      caption: '',
      foodName: 'Unknown',
      confidence: 0,
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: error.message,
    };
  }
}

/**
 * Check if local vision is ready
 */
export function isLocalVisionReady(): boolean {
  return isReady && webViewRef !== null;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 200,
    height: 60,
    bottom: 10,
    right: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  hidden: {
    width: 1,
    height: 1,
    opacity: 0,
    bottom: -100,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#ffd93d',
    fontSize: 10,
    marginTop: 4,
  },
});

export default LocalVisionWebView;

