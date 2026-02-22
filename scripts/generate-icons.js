const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 256, 512];
const sourceIcon = path.join(__dirname, '..', 'src', 'images', 'icon.png');
const iconsDir = path.join(__dirname, '..', 'build', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Check if ImageMagick is available
try {
    execSync('which convert', { stdio: 'pipe' });
} catch {
    console.log('⚠️  ImageMagick not found. Copying source icon as-is...');
    // Just copy the original icon to all sizes
    for (const size of sizes) {
        const destPath = path.join(iconsDir, `${size}x${size}.png`);
        fs.copyFileSync(sourceIcon, destPath);
        console.log(`  Created ${size}x${size}.png (copied)`);
    }
    console.log('✅ Icons copied successfully!');
    process.exit(0);
}

console.log('🎨 Generating icons with ImageMagick...');

for (const size of sizes) {
    const destPath = path.join(iconsDir, `${size}x${size}.png`);
    try {
        execSync(`convert "${sourceIcon}" -resize ${size}x${size} "${destPath}"`, { stdio: 'pipe' });
        console.log(`  Created ${size}x${size}.png`);
    } catch (error) {
        console.error(`  Failed to create ${size}x${size}.png:`, error.message);
        // Fallback: copy the original
        fs.copyFileSync(sourceIcon, destPath);
        console.log(`  Copied source as ${size}x${size}.png (fallback)`);
    }
}

console.log('✅ Icons generated successfully!');
