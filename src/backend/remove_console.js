const fs = require('fs');
const path = require('path');

// Files to process
const files = [
    'src/backend/events.cjs',
    'src/backend/registrations.cjs',
    'src/backend/email.cjs',
    'src/backend/auth.cjs',
    'src/backend/accounts.cjs',
    'src/backend/timer.cjs',
    'src/backend/symposium.cjs',
    'src/backend/cart.cjs',
    'src/backend/pass_cart.cjs',
    'src/backend/passes.cjs',
    'src/backend/offer.cjs',
    'src/backend/placements.cjs',
    'src/backend/api.cjs',
    'src/backend/accommodation.cjs'
];

files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);

    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file} - not found`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;

    // Remove console.log, console.error, console.warn lines
    content = content.replace(/^\s*console\.(log|error|warn)\(.*?\);?\s*$/gm, '');

    // Remove inline console statements
    content = content.replace(/\s*console\.(log|error|warn)\([^;]*\);?/g, '');

    if (content.length !== originalLength) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned ${file}`);
    } else {
        console.log(`No changes needed for ${file}`);
    }
});

console.log('Done!');
