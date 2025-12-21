# Phase 9: Tab Navigation

## 🎯 Goal
Configure the tab bar and app-level layout.

---

## File 9.1: Tab Layout (`app/(tabs)/_layout.tsx`)

```typescript
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="qr-code-scanner" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="info-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## File 9.2: Root Layout (`app/_layout.tsx`)

```typescript
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="+not-found" 
          options={{ headerTitle: 'Not Found' }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

---

## Tab Bar Design

| Tab | Icon | Label |
|-----|------|-------|
| Scanner | `qr-code-scanner` | Scan |
| History | `history` | History |
| About | `info-outline` | About |

**Colors:**
- Active: `#2E7D32` (Emerald Green)
- Inactive: `#999` (Gray)

---

## Navigation Flow

```
app/_layout.tsx (Root)
    │
    └── (tabs)/_layout.tsx (Tab Navigator)
            │
            ├── index.tsx     → Scanner
            ├── history.tsx   → History
            └── about.tsx     → About
```

---

## ✅ Checklist

- [ ] Updated `app/(tabs)/_layout.tsx` with 3 tabs
- [ ] Updated `app/_layout.tsx` with GestureHandler
- [ ] Tab icons use MaterialIcons
- [ ] Active/inactive colors set
- [ ] Tab bar styled (white background, border)

---

## 🔜 Next: Phase 10 - Environment & Polish

