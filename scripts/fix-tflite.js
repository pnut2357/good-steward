/**
 * Post-install fix for react-native-fast-tflite
 * 
 * The package has a bug where lib/commonjs/TensorflowModule.js 
 * tries to import from '../spec/NativeRNTflite' but that path doesn't exist.
 * This script creates the missing file.
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../node_modules/react-native-fast-tflite/lib/spec');
const targetFile = path.join(targetDir, 'NativeRNTflite.js');

const fileContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("react-native");
exports.default = react_native_1.TurboModuleRegistry.getEnforcing('RNTflite');
//# sourceMappingURL=NativeRNTflite.js.map
`;

try {
  // Create the spec directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✅ Created', targetDir);
  }

  // Write the missing file
  fs.writeFileSync(targetFile, fileContent, 'utf8');
  console.log('✅ Fixed react-native-fast-tflite: Created', targetFile);
} catch (error) {
  console.error('⚠️ Could not fix react-native-fast-tflite:', error.message);
}

