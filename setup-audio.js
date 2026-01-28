const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'DnDLab', 'audio');
const targetDir = path.join(__dirname, 'client', 'public', 'audio');

console.log('🎮 D&D Labyrinth v2 - Audio Setup');
console.log('=================================\n');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('✓ Created audio directory');
}

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error('❌ Error: Source audio directory not found at:', sourceDir);
  console.error('\nPlease make sure the original DnDLab project exists at:');
  console.error('C:\\xampp\\htdocs\\DnDLab\\audio');
  process.exit(1);
}

// Get all MP3 files from source
const audioFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.mp3'));

if (audioFiles.length === 0) {
  console.error('❌ Error: No MP3 files found in source directory');
  process.exit(1);
}

console.log(`Found ${audioFiles.length} audio files to copy:\n`);

// Copy each file
let successCount = 0;
audioFiles.forEach(file => {
  try {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`  ✓ ${file}`);
    successCount++;
  } catch (error) {
    console.error(`  ❌ Failed to copy ${file}:`, error.message);
  }
});

console.log(`\n✅ Successfully copied ${successCount}/${audioFiles.length} audio files!`);
console.log('\nNext steps:');
console.log('  1. cd client');
console.log('  2. npm install');
console.log('  3. npm run dev');
console.log('\nHappy gaming! 🎲\n');
