const { withMainActivity, withMainApplication } = require('@expo/config-plugins');

const plugin = (config) => {
  // Patch MainActivity.kt: remove Expo ReactActivityDelegateWrapper usage
  config = withMainActivity(config, (cfg) => {
    const src = cfg.modResults.contents;
    let next = src.replace(/^[\t ]*import\s+expo\.modules\.ReactActivityDelegateWrapper\s*\r?\n/m, '');
    next = next.replace(
      /return\s+ReactActivityDelegateWrapper\([\s\S]*?\)\s*\r?\n\s*\}/m,
      'return object : DefaultReactActivityDelegate(\n      this,\n      mainComponentName,\n      fabricEnabled\n    ) {}\n  }\n'
    );
    cfg.modResults.contents = next;
    return cfg;
  });

  // Overwrite MainApplication.kt with a wrapper-free template using the same package name
  config = withMainApplication(config, (cfg) => {
    const src = cfg.modResults.contents;
    const pkgMatch = src.match(/^package\s+([\w\.]+)/m);
    const pkg = pkgMatch ? pkgMatch[1] : 'com.example.app';
    const template = `package ${pkg}

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
    override fun getPackages(): List<ReactPackage> = PackageList(this).packages
    override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"
    override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
    override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
  }

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
  }
}
`;
    cfg.modResults.contents = template;
    return cfg;
  });

  return config;
};

module.exports = plugin;
