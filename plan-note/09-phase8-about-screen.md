# Phase 8: About Screen

## 🎯 Goal
Create a beautiful about page with app info, inspiration, and credits.

---

## File: `app/(tabs)/about.tsx`

```typescript
import { View, Text, ScrollView, StyleSheet, Image, Linking, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/good-steward-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Good Steward</Text>
        <Text style={styles.tagline}>
          Make informed food choices with AI
        </Text>
      </View>

      {/* Inspiration Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="auto-awesome" size={24} color="#2E7D32" />
          <Text style={styles.sectionTitle}>Inspiration</Text>
        </View>
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            "For every creature of God is good, and nothing to be refused, 
            if it be received with thanksgiving."
          </Text>
          <Text style={styles.quoteReference}>— 1 Timothy 4:4</Text>
        </View>
        <Text style={styles.inspirationText}>
          As stewards of our bodies and the earth, we are called to make 
          wise choices about what we consume. This app helps you understand 
          what's in your food so you can make decisions that honor God 
          and care for your health.
        </Text>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="help-outline" size={24} color="#2E7D32" />
          <Text style={styles.sectionTitle}>How It Works</Text>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Scan</Text>
            <Text style={styles.stepText}>
              Point your camera at any food product barcode
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Analyze</Text>
            <Text style={styles.stepText}>
              AI analyzes ingredients for health concerns
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Decide</Text>
            <Text style={styles.stepText}>
              Get a clear recommendation: safe or caution
            </Text>
          </View>
        </View>
      </View>

      {/* Credits Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="favorite" size={24} color="#2E7D32" />
          <Text style={styles.sectionTitle}>Credits</Text>
        </View>
        
        <Text style={styles.creditsIntro}>
          This app is made possible by these amazing open-source projects:
        </Text>

        <Pressable 
          style={styles.creditItem}
          onPress={() => openLink('https://world.openfoodfacts.org')}
        >
          <Text style={styles.creditName}>Open Food Facts</Text>
          <Text style={styles.creditDesc}>
            Free, open database of food products
          </Text>
        </Pressable>

        <Pressable 
          style={styles.creditItem}
          onPress={() => openLink('https://groq.com')}
        >
          <Text style={styles.creditName}>Groq</Text>
          <Text style={styles.creditDesc}>
            Lightning-fast AI inference
          </Text>
        </Pressable>

        <Pressable 
          style={styles.creditItem}
          onPress={() => openLink('https://expo.dev')}
        >
          <Text style={styles.creditName}>Expo</Text>
          <Text style={styles.creditDesc}>
            React Native development platform
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ for His glory
        </Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#F8FFF8',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 16,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  quoteBox: {
    backgroundColor: '#F8FFF8',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
    lineHeight: 24,
  },
  quoteReference: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'right',
  },
  inspirationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  creditsIntro: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  creditItem: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  creditName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  creditDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
```

---

## Sections

| Section | Content |
|---------|---------|
| Header | Logo, app name, tagline |
| Inspiration | Bible verse (1 Timothy 4:4) + explanation |
| How It Works | 3-step guide with icons |
| Credits | Links to Open Food Facts, Groq, Expo |
| Footer | Version info |

---

## ✅ Checklist

- [ ] Created `app/(tabs)/about.tsx`
- [ ] App logo and name displayed
- [ ] Bible verse with styled quote box
- [ ] "How It Works" steps
- [ ] Credits with tappable links
- [ ] Version in footer

---

## 🔜 Next: Phase 9 - Tab Navigation

