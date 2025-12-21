import { MaterialIcons } from '@expo/vector-icons';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
          Food product information at your fingertips
        </Text>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="stars" size={24} color="#1976D2" />
          <Text style={styles.sectionTitle}>Features</Text>
        </View>
        
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <MaterialIcons name="qr-code-scanner" size={24} color="#1976D2" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Barcode Scanning</Text>
            <Text style={styles.featureText}>
              Scan product barcodes for nutrition information
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <MaterialIcons name="restaurant" size={24} color="#1976D2" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Nutrition Facts</Text>
            <Text style={styles.featureText}>
              View Nutriscore, NOVA, sugar, salt, and more
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <MaterialIcons name="warning" size={24} color="#1976D2" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Allergen Information</Text>
            <Text style={styles.featureText}>
              See allergens and "may contain" traces
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <MaterialIcons name="offline-bolt" size={24} color="#1976D2" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Offline First</Text>
            <Text style={styles.featureText}>
              Previously scanned items work without internet
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="help-outline" size={24} color="#1976D2" />
          <Text style={styles.sectionTitle}>How It Works</Text>
        </View>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Scan Barcode</Text>
            <Text style={styles.stepText}>
              Point your camera at a product barcode
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Get Information</Text>
            <Text style={styles.stepText}>
              View nutrition data from OpenFoodFacts database
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Make Informed Decisions</Text>
            <Text style={styles.stepText}>
              Use the factual data to inform your choices
            </Text>
          </View>
        </View>
      </View>

      {/* Data Sources */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="source" size={24} color="#1976D2" />
          <Text style={styles.sectionTitle}>Data Sources</Text>
        </View>
        
        <Pressable 
          style={styles.creditItem}
          onPress={() => openLink('https://world.openfoodfacts.org')}
        >
          <Text style={styles.creditName}>Open Food Facts</Text>
          <Text style={styles.creditDesc}>
            Free, open database of food products worldwide
          </Text>
        </Pressable>

        <Pressable 
          style={styles.creditItem}
          onPress={() => openLink('https://www.santepubliquefrance.fr')}
        >
          <Text style={styles.creditName}>Nutri-Score</Text>
          <Text style={styles.creditDesc}>
            Official nutrition rating by Santé publique France
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

      {/* Legal Disclaimer */}
      <View style={styles.disclaimerSection}>
        <View style={styles.disclaimerHeader}>
          <MaterialIcons name="gavel" size={24} color="#666" />
          <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
        </View>
        
        <Text style={styles.disclaimerText}>
          Good Steward is an <Text style={styles.bold}>information tool</Text> that displays 
          nutritional data from public databases. This app does NOT provide medical advice, 
          health recommendations, or dietary guidance.
        </Text>
        
        <Text style={styles.disclaimerText}>
          • Always read the actual product label before consuming{'\n'}
          • Consult healthcare providers for dietary guidance{'\n'}
          • Data accuracy depends on third-party sources{'\n'}
          • Allergen information may be incomplete
        </Text>
        
        <Text style={styles.disclaimerText}>
          The Nutriscore and NOVA ratings shown are official classifications, not 
          recommendations. This app does not tell you what to eat or avoid.
        </Text>
      </View>

      {/* Privacy Note */}
      <View style={styles.privacySection}>
        <MaterialIcons name="security" size={20} color="#666" />
        <Text style={styles.privacyText}>
          Your scan history is stored locally on your device. We don't collect any personal data.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built for informed choices
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
    backgroundColor: '#E3F2FD',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
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
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1976D2',
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
  creditItem: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  creditName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  creditDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  disclaimerSection: {
    padding: 20,
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 12,
    gap: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
