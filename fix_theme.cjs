const fs = require('fs');
let file = 'src/components/ThemeComponents.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useColorScheme')) {
  content = content.replace(/import React from 'react';/, "import React from 'react';\nimport { useColorScheme } from 'react-native';");
}

const gradRegex = /colors=\{\['#A8E0FF', '#DDF2FF', '#A8E0FF'\]\}/;
const gradReplacement = `colors={colorScheme === 'dark' ? ['#0f172a', '#1e293b', '#0f172a'] : ['#A8E0FF', '#DDF2FF', '#A8E0FF']}`;

if(content.match(gradRegex)) {
  content = content.replace(/export const GradientBackground = \(\{ children, \.\.\.props \}: \{ children: React\.ReactNode \} & YStackProps\) => \{/, "export const GradientBackground = ({ children, ...props }: { children: React.ReactNode } & YStackProps) => {\n  const colorScheme = useColorScheme();");
  content = content.replace(gradRegex, gradReplacement);
}

const glassRegex = /backgroundColor="rgba\(255, 255, 255, 0\.6\)"/;
const glassReplacement = `backgroundColor={colorScheme === 'dark' ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.6)"}`;

if(content.match(glassRegex)) {
  content = content.replace(/export const GlassCard = \(\{ children, \.\.\.props \}: \{ children: React\.ReactNode \} & YStackProps\) => \{/, "export const GlassCard = ({ children, ...props }: { children: React.ReactNode } & YStackProps) => {\n  const colorScheme = useColorScheme();");
  content = content.replace(glassRegex, glassReplacement);
}

fs.writeFileSync(file, content);
console.log('Fixed ThemeComponents for dark mode');
