const fs = require('fs');
const path = require('path');

// ============================================
// PATCH FOR JSValueEncoder.swift
// ============================================
const encoderPath = path.join(__dirname, 'node_modules/@capacitor/ios/Capacitor/Capacitor/Codable/JSValueEncoder.swift');

if (fs.existsSync(encoderPath)) {
  let content = fs.readFileSync(encoderPath, 'utf8');
  let modified = false;
  
  const typePattern = /var type: String\s*\{\s*switch self\s*\{\s*case\s*\.singleValue:\s*"SingleValueContainer"\s*case\s*\.unkeyed:\s*"UnkeyedContainer"\s*case\s*\.keyed:\s*"KeyedContainer"\s*\}\s*\}/s;
  
  if (typePattern.test(content)) {
    content = content.replace(typePattern, `var type: String {
        switch self {
        case .singleValue:
            return "SingleValueContainer"
        case .unkeyed:
            return "UnkeyedContainer"
        case .keyed:
            return "KeyedContainer"
        }
    }`);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(encoderPath, content);
    console.log('Patch applied to JSValueEncoder.swift');
  } else {
    console.log('JSValueEncoder.swift is already patched or no changes needed');
  }
} else {
  console.log('JSValueEncoder.swift not found');
}

// ============================================
// PATCH FOR JSValueDecoder.swift
// ============================================
const decoderPath = path.join(__dirname, 'node_modules/@capacitor/ios/Capacitor/Capacitor/Codable/JSValueDecoder.swift');

if (fs.existsSync(decoderPath)) {
  let content = fs.readFileSync(decoderPath, 'utf8');
  let modified = false;
  
  if (!content.includes('import Foundation')) {
    content = 'import Foundation\n' + content;
    modified = true;
  }
  
  if (content.includes('MSEC_PER_SEC')) {
    content = content.replace(/MSEC_PER_SEC/g, '1000');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(decoderPath, content);
    console.log('Patch applied to JSValueDecoder.swift');
  } else {
    console.log('JSValueDecoder.swift is already patched or no changes needed');
  }
} else {
  console.log('JSValueDecoder.swift not found');
}

// ============================================
// PATCH FOR FILESYSTEM FILES
// ============================================
const filesystemFiles = [
  'CAPPluginCall+Accelerators.swift',
  'FilesystemError.swift',
  'FilesystemLocationResolver.swift',
  'FilesystemOperationExecutor.swift',
  'IONFileStructures+Converters.swift'
];

const filesystemBasePath = path.join(__dirname, 'node_modules/@capacitor/filesystem/ios/Sources/FilesystemPlugin');

filesystemFiles.forEach(filename => {
  const filePath = path.join(filesystemBasePath, filename);
  
  if (fs.existsSync(filePath)) {  
    console.log(`${filename} is present in node_modules`);
  } else {
    console.log(`${filename} not found in node_modules`);
  }
});
