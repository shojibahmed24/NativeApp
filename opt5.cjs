const fs = require('fs');
let file = 'app.json';
let content = fs.readFileSync(file, 'utf8');

const appJson = JSON.parse(content);

console.log('Icon:', appJson.expo.icon);
console.log('Splash:', appJson.expo.splash);
console.log('Adaptive Icon:', appJson.expo.android?.adaptiveIcon);

// Let's ensure standard styling
if (!appJson.expo.android) appJson.expo.android = {};
if (!appJson.expo.android.adaptiveIcon) appJson.expo.android.adaptiveIcon = {};
appJson.expo.android.adaptiveIcon.foregroundImage = './assets/images/logo-icon-transparent.png';
appJson.expo.android.adaptiveIcon.backgroundColor = '#ffffff';

if (!appJson.expo.ios) appJson.expo.ios = {};
appJson.expo.ios.supportsTablet = true;

fs.writeFileSync(file, JSON.stringify(appJson, null, 2));
console.log('Optimized app.json');
