import * as path from 'path';
import type { HookArgs } from './hookArgs';
import { autolinkAndroid } from './prepare-android';
import { autolinkIos } from './prepare-ios';

const logPrefix = '[react-native/hooks/before-prepareNativeApp.js]';
const green = '\x1b[32m';
const reset = '\x1b[0m';

/**
 * autolink any React Native native modules.
 */
export = async function (hookArgs: HookArgs) {
  const platformName = (hookArgs && hookArgs.platformData && hookArgs.platformData.normalizedPlatformName).toLowerCase();
  const platformTitle = platformName === 'android' ? 'Android' : 'iOS';
  const { devDependencies, dependencies, ignoredDependencies, projectDir } = hookArgs.projectData;
  const ignoredDepsSet = new Set(ignoredDependencies);
  const depsArr = Object.keys({ ...devDependencies, ...dependencies }).filter((key) => !ignoredDepsSet.has(key));
  let packageNames: Array<string>;

  /**
   * @example '/Users/jamie/Documents/git/nativescript-magic-spells/dist/packages/react-native'
   */
  const packageDir = path.dirname(__dirname);

  console.log(`${logPrefix} Autolinking React Native ${platformTitle} native modules...`);

  if (platformName === 'android') {
    const outputModulesJsonPath = path.resolve(packageDir, 'react-android/bridge/modules.json');
    const outputPackagesJavaPath = path.resolve(packageDir, 'react-android/bridge/src/main/java/com/bridge/Packages.java');
    packageNames = await autolinkAndroid({
      dependencies: depsArr,
      projectDir,
      outputModulesJsonPath,
      outputPackagesJavaPath,
    });
  } else {
    const outputModuleMapPath = path.resolve(packageDir, 'platforms/ios/lib_community/modulemap.json');
    const outputHeaderPath = path.resolve(packageDir, 'platforms/ios/lib_community/RNPodspecs.h');
    const outputPodfilePath = path.resolve(packageDir, 'platforms/ios/Podfile');

    packageNames = await autolinkIos({
      dependencies: depsArr,
      projectDir,
      outputHeaderPath,
      outputPodfilePath,
      outputModuleMapPath,
    });
  }

  packageNames.forEach((packageName) => console.log(`${logPrefix} Autolinked ${green}${packageName}${reset}!`));
  console.log(`${logPrefix} ... Finished autolinking React Native Android native modules.`);

  console.log(`${logPrefix} ... Finished autolinking React Native ${platformTitle} native modules.`);
};
