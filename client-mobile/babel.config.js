module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 这里就是解决报错的关键，注册 reanimated 插件
      'react-native-reanimated/plugin',
    ],
  };
};