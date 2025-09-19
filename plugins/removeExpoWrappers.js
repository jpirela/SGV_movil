const { withMainActivity, withMainApplication, AndroidConfig } = require('@expo/config-plugins');

function replaceAll(source, replacements) {
  let out = source;
  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

const plugin = (config) => {
  // Patch MainActivity.kt: remove Expo ReactActivityDelegateWrapper usage
  config = withMainActivity(config, (cfg) => {
    const src = cfg.modResults.contents;
    let next = src;
    next = replaceAll(next, [
      [/^import\s+expo\.modules\.ReactActivityDelegateWrapper\s*\r?\n/m, ''],
      [
        /return\s+ReactActivityDelegateWrapper\([\s\S]*?\)\s*\r?\n\s*\}/m,
        'return object : DefaultReactActivityDelegate(\n      this,\n      mainComponentName,\n      fabricEnabled\n    ) {}\n  }\n',
      ],
    ]);
    cfg.modResults.contents = next;
    return cfg;
  });

  // Patch MainApplication.kt: remove Expo wrappers and dispatcher
  config = withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    let next = src;
    next = replaceAll(next, [
      [/^import\s+expo\.modules\.ApplicationLifecycleDispatcher\s*\r?\n/m, ''],
      [/^import\s+expo\.modules\.ReactNativeHostWrapper\s*\r?\n/m, ''],
      [/^import\s+com\.facebook\.react\.ReactHost\s*\r?\n/m, ''],
      [
        /override\s+val\s+reactNativeHost:[\s\S]*?\)\s*\r?\n\s*\)\s*\r?\n/m,
        'override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {\n        override fun getPackages(): List<ReactPackage> =\n            PackageList(this).packages\n        override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"\n        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG\n        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED\n      }\n\n',
      ],
      [/^\s*override\s+val\s+reactHost:[\s\S]*?\r?\n\s*\}\s*\r?\n/m, ''],
      [/^\s*ApplicationLifecycleDispatcher\.onApplicationCreate\(this\)\s*\r?\n/m, ''],
      [/^\s*ApplicationLifecycleDispatcher\.onConfigurationChanged\([\s\S]*?\)\s*\r?\n/m, ''],
    ]);
    cfg.modResults.contents = next;
    return cfg;
  });

  return config;
};

module.exports = plugin;
