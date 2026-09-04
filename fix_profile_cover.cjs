const fs = require('fs');
let file = 'app/(main)/my-profile.tsx';
let content = fs.readFileSync(file, 'utf8');

const coverRegex = /<View style=\{styles\.cover\}>[\s\S]*?<View style=\{styles\.coverTopRow\}>/;
const coverReplacement = `<View style={[styles.cover, { overflow: 'hidden' }]}>
              { (user?.avatar || user?.profile_picture) ? (
                <ImageBackground source={{ uri: (user?.avatar || user?.profile_picture) }} style={StyleSheet.absoluteFillObject} blurRadius={30}>
                  <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,94,184,0.4)'}} />
                </ImageBackground>
              ) : (
                <View style={{...StyleSheet.absoluteFillObject, backgroundColor: '#005eb8'}} />
              )}
              <View style={styles.coverTopRow}>`;

content = content.replace(coverRegex, coverReplacement);

if (!content.includes('ImageBackground')) {
  content = content.replace(/import \{ View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Modal, ActivityIndicator, Image, Dimensions \}/, "import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Modal, ActivityIndicator, Image, Dimensions, ImageBackground }");
}

fs.writeFileSync(file, content);
console.log('Fixed profile cover');
