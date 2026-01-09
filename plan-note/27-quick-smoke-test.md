# Quick Smoke Test (15 minutes)

## 🎯 Goal
Quickly verify the app works and catches major issues before detailed testing.

---

## ✅ Quick Test Checklist

### **1. App Launch (2 minutes)**
- [ ] App icon appears on home screen
- [ ] Tap icon - app launches
- [ ] Splash screen shows (Good Steward logo)
- [ ] App opens to home screen
- [ ] No immediate crashes

**What to check:**
- Does splash screen look good?
- Does app feel responsive?
- Any weird colors or layout issues?

---

### **2. Camera Test (3 minutes)**
- [ ] Find and tap camera button
- [ ] Camera permission dialog appears
- [ ] Grant permission
- [ ] Camera preview shows
- [ ] Take a photo of a food label
- [ ] Photo is captured successfully

**What to check:**
- Camera preview is not upside down or rotated weird
- Shutter button works
- Can see what you're photographing

---

### **3. OCR Test (3 minutes)**
- [ ] After taking photo, OCR processes
- [ ] Text is extracted from image
- [ ] Results are displayed
- [ ] Text is reasonably accurate

**What to check:**
- Does it extract ingredient lists?
- Is text readable in results?
- Does it handle common labels?

**Test photos:**
- Take photo of cereal box ingredients
- Take photo of snack package
- Take photo of canned food label

---

### **4. Navigation Test (2 minutes)**
- [ ] Tap all bottom tab buttons
- [ ] Each tab opens correctly
- [ ] Can navigate back
- [ ] No crashes when switching tabs

**What to check:**
- All screens load
- No white screens or errors
- Back button works

---

### **5. Food Search Test (3 minutes)**
- [ ] Find search feature
- [ ] Search for "apple"
- [ ] Results appear
- [ ] Tap a result
- [ ] Details show

**What to check:**
- Search is responsive
- Results make sense
- Can view details

---

### **6. Basic Functionality (2 minutes)**
- [ ] Try saving/favoriting something
- [ ] Check if history is saved
- [ ] Close app and reopen
- [ ] Data persists

**What to check:**
- App remembers your actions
- No data loss after restart

---

## 🚨 Critical Issues to Report Immediately

If you encounter ANY of these, stop and report:

1. **App crashes on launch**
2. **Camera doesn't open**
3. **App freezes and won't respond**
4. **Black screen or no UI visible**
5. **Permissions cause crash**

---

## ✅ Smoke Test Results

**Date:** _______________
**Device:** _______________
**Android Version:** _______________

### Quick Assessment:
- [ ] ✅ PASS - App works, ready for detailed testing
- [ ] ⚠️ MINOR ISSUES - Works but has some problems
- [ ] ❌ FAIL - Critical issues, needs fixing

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## 📋 Next Steps

**If PASS:**
→ Continue to comprehensive testing (see `26-testing-checklist.md`)

**If MINOR ISSUES:**
→ Note issues, continue testing, fix later

**If FAIL:**
→ Report critical issues, fix before continuing

