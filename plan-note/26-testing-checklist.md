# Testing Checklist for Good Steward App

## 🎯 Testing Strategy

Before deploying to Google Play, test the **preview APK** on at least 2 different Android devices (if possible).

---

## ✅ Core Feature Testing

### **1. Camera & OCR**
- [ ] Open camera from home screen
- [ ] Take photo of food label
- [ ] OCR extracts text correctly
- [ ] Handles poor lighting conditions
- [ ] Handles blurry images
- [ ] Works in portrait and landscape
- [ ] Camera permissions requested properly

### **2. Food Database Search**
- [ ] Search by ingredient name
- [ ] Search by barcode
- [ ] Results display correctly
- [ ] Nutritional info shows accurately
- [ ] "Real food" classification works
- [ ] No crashes with special characters
- [ ] Empty search handled gracefully

### **3. Barcode Scanner**
- [ ] Barcode scanner opens
- [ ] Scans common barcodes (UPC, EAN)
- [ ] Retrieves product information
- [ ] Handles unknown barcodes
- [ ] Scanner permission works

### **4. Food Analysis**
- [ ] Ingredient list processed correctly
- [ ] Additives detected and highlighted
- [ ] Health score calculated
- [ ] Recommendations displayed
- [ ] Share results works

### **5. History & Favorites**
- [ ] Recently scanned items saved
- [ ] Favorites can be added
- [ ] Favorites can be removed
- [ ] History persists after app restart
- [ ] Clear history works

---

## 🎨 UI/UX Testing

### **App Launch**
- [ ] Splash screen displays correctly (logo visible)
- [ ] App icon looks good on home screen
- [ ] Launch time is reasonable (< 3 seconds)
- [ ] No white flash or weird transitions

### **Navigation**
- [ ] Bottom tabs work smoothly
- [ ] Back button behaves correctly
- [ ] Deep links work (if applicable)
- [ ] Drawer/menu opens properly
- [ ] All screens accessible

### **Responsive Design**
- [ ] Works on small phones (5" screen)
- [ ] Works on large phones (6.5"+ screen)
- [ ] Works on tablets
- [ ] Portrait orientation
- [ ] Landscape orientation
- [ ] Text is readable on all devices
- [ ] Buttons are tappable (not too small)

### **Dark Mode**
- [ ] Dark mode toggle works
- [ ] All screens look good in dark mode
- [ ] No text visibility issues
- [ ] Images/icons adapt properly

---

## ⚡ Performance Testing

- [ ] App launches quickly (< 3 seconds)
- [ ] Scrolling is smooth (60 FPS)
- [ ] No lag when switching tabs
- [ ] OCR processing is reasonable (< 5 seconds)
- [ ] Database searches are fast (< 1 second)
- [ ] Camera preview has no lag
- [ ] No memory leaks (use for 10+ minutes)
- [ ] Battery drain is acceptable

---

## 🔐 Permissions Testing

- [ ] Camera permission requested with clear explanation
- [ ] Photo library permission (if used)
- [ ] Storage permission (if needed)
- [ ] Permissions can be denied gracefully
- [ ] App explains why permissions are needed
- [ ] Links to settings if permission denied

---

## 📱 Device-Specific Testing

Test on **at least 2** of these:
- [ ] Samsung device (One UI)
- [ ] Google Pixel (Stock Android)
- [ ] OnePlus/Xiaomi (OxygenOS/MIUI)
- [ ] Old device (Android 8.0 - minSdk 26)
- [ ] New device (Android 14+)

---

## 🌐 Network Testing

- [ ] Works on WiFi
- [ ] Works on mobile data (4G/5G)
- [ ] Handles slow connection
- [ ] Handles no connection (offline)
- [ ] Shows appropriate error messages
- [ ] Retries failed requests

---

## 💾 Data & Storage Testing

- [ ] App data persists after restart
- [ ] Handles low storage gracefully
- [ ] Can clear app data/cache
- [ ] Uninstall and reinstall works
- [ ] No data loss during update

---

## 🐛 Edge Cases & Error Handling

- [ ] Empty states handled (no history, no favorites)
- [ ] Invalid input handled (special characters, emojis)
- [ ] Large ingredient lists (100+ items)
- [ ] Very long product names
- [ ] Missing or corrupted images
- [ ] API failures handled gracefully
- [ ] Timeout errors shown properly
- [ ] App doesn't crash on errors

---

## 🔄 App Lifecycle Testing

- [ ] App resumes correctly after backgrounding
- [ ] Handles incoming phone call
- [ ] Handles low memory warning
- [ ] Handles screen rotation
- [ ] Handles system back button
- [ ] Handles "clear all apps"

---

## 📊 Real-World Testing

### **Grocery Store Test**
- [ ] Take app to grocery store
- [ ] Scan 10+ different products
- [ ] Test in store lighting conditions
- [ ] Use while walking (realistic scenario)
- [ ] Test battery life during active use

### **Home Use Test**
- [ ] Check ingredients in pantry
- [ ] Scan meal package
- [ ] Compare multiple products
- [ ] Share results with family member

---

## 🚀 Pre-Deployment Final Check

- [ ] No known crashes
- [ ] All major features work
- [ ] UI looks polished
- [ ] Performance is acceptable
- [ ] Permissions work correctly
- [ ] App icon and name are correct
- [ ] Version number is correct (1.0.0)
- [ ] No test/debug features visible
- [ ] No placeholder text or images

---

## 📝 Testing Tools & Commands

### **Download Preview APK**
```bash
# Get download link
echo "https://expo.dev/accounts/pnut2357/projects/good-steward/builds"
```

### **Start Development Server**
```bash
# For Expo Go testing
npx expo start

# For development build
npx expo start --dev-client
```

### **Check App Performance**
- Use Android Studio Profiler
- Monitor CPU, Memory, Network
- Check for memory leaks

### **View Logs**
```bash
# View device logs
adb logcat

# Filter for your app
adb logcat | grep "goodsteward"
```

---

## ✅ Testing Sign-Off

Once you've completed this checklist:
- [ ] Tested on at least 2 devices
- [ ] All critical features work
- [ ] No blocking bugs found
- [ ] Ready for production build

**Tested by:** _______________
**Date:** _______________
**Devices tested:**
1. _______________
2. _______________

---

## 🐛 Known Issues

Document any known issues here before deployment:

| Issue | Severity | Workaround | Will Fix? |
|-------|----------|------------|-----------|
| Example: OCR slow on old devices | Low | Wait longer | v1.1 |

---

## 📚 References

- [Expo Testing Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android Testing Fundamentals](https://developer.android.com/training/testing/fundamentals)
- [Google Play Pre-Launch Reports](https://support.google.com/googleplay/android-developer/answer/7002270)

