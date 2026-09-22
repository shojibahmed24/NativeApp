module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-transform-imports',
        {
          'lucide-react-native': {
            transform: 'lucide-react-native/dist/cjs/icons/',
            preventFullImport: true,
          }
        }
      ],
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
        },
      ],
    ],
    env: {
      production: {
        plugins: ['babel-plugin-transform-remove-console']
      }
    }
  };
};
