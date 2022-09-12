const glob = require('glob');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const { promisify } = require('util');
const execFile = promisify(cp.execFile);
const readFile = promisify(fs.readFile);

/**
 * For all available hook types, see:
 * @see https://github.com/NativeScript/NativeScript/blob/9ccc54b6035c04e383d9256fb3ad9c0c7b00fa20/packages/core/config/config.interface.ts#L134
 * @see https://github.com/NativeScript/nativescript-hook/issues/11#issuecomment-457705213
 * @see https://docs.npmjs.com/cli/v6/using-npm/scripts#pre--post-scripts
 * @see https://github.com/NativeScript/nativescript-app-templates/blob/master/packages/template-hello-world-ts/hooks/after-createProject/after-createProject.js
 * @see https://www.nsplugins.com/plugin/nativescript
 * @see https://github.com/NativeScript/plugins/tree/31b0f5157d02fdf17e89ac29233585cb7e4ebf6f/packages/localize/hooks
 * @see https://github.com/NativeScript/nativescript-cli/blob/master/extending-cli.md
 * @see https://blog.nativescript.org/migrating-cli-hooks-to-nativescript-6.0/
 * @see https://github.com/NativeScript/nativescript-cli/blob/c61edbeef668b9c17e744d7af3909306c435a16a/lib/project-data.ts
 *
 * @param {object} hookArgs
 * @param {object} hookArgs.platformData
 * https://github.com/NativeScript/nativescript-cli/blob/fa257dd455ca55374cf419d638ac74166dc727db/lib/services/android-project-service.ts#L200
 * https://github.com/NativeScript/nativescript-cli/blob/1435eef272aced36e7f97a355ff5c7ea936f94e7/lib/services/ios-project-service.ts#L131
 * @param {string} hookArgs.platformData.frameworkPackageName
 * @param {"iOS"|"Android"} hookArgs.platformData.normalizedPlatformName
 * @param {"ios"|"android"} hookArgs.platformData.platformNameLowerCase
 * @param {object} hookArgs.projectData
 * https://github.com/NativeScript/nativescript-cli/blob/master/lib/services/android-project-service.ts
 * https://github.com/NativeScript/nativescript-cli/blob/master/lib/services/ios-project-service.ts
 * @param {string} hookArgs.projectData.projectDir
 *   The absolute path to the root of your project. Typically where you'd see
 *   package.json, webpack.config.js, nativescript.config.js, and the platforms
 *   directory.
 * @param {string} hookArgs.projectData.platformsDir
 *   The absolute path to the platforms directory.
 * @param {unknown} hookArgs.projectData.projectConfig
 * @param {string} hookArgs.projectData.projectFilePath
 *   The filepath to the package.json file for your project.
 * @param {{ ios: string; android: string } | string} hookArgs.projectData.projectIdentifiers
 *   I'm unclear of the exact type of this.
 * @param {string} hookArgs.projectData.projectName
 *  The directory name of your projectDir.
 * @param {unknown} hookArgs.projectData.packageJsonData
 *   The full contents of package.json.
 * @param {unknown} hookArgs.projectData.nsConfig
 *   The full contents of nativescript.config.ts. Defined here:
 *   https://github.com/NativeScript/NativeScript/blob/9ccc54b6035c04e383d9256fb3ad9c0c7b00fa20/packages/core/config/config.interface.ts#L153
 * @param {string} hookArgs.projectData.appDirectoryPath
 * @param {string} hookArgs.projectData.appResourcesDirectoryPath
 *   From nativescript.config.ts. The absolute path to App_Resources.
 * @param {Record<string, string>} hookArgs.projectData.dependencies
 *   From package.json. The record of dependencies.
 * @param {Record<string, string>} hookArgs.projectData.devDependencies
 *   From package.json. The record of devDependencies.
 * @param {string[]} hookArgs.projectData.ignoredDependencies
 *   From nativescript.config.ts. Optionally specify a list of npm package names
 *   for which you would like the NativeScript CLI to ignore when attaching
 *   native dependencies to the build.
 * @param {string} hookArgs.projectData.projectType
 *   The renderer or template, e.g. "Angular", "Vue.js", "React", "Svelte",
 *   "Pure TypeScript", "Pure JavaScript".
 *   https://github.com/NativeScript/nativescript-cli/blob/3150049f8076b12fed7deb86dc221490c8d13394/test/project-data.ts#L93
 * @param {string} hookArgs.projectData.androidManifestPath
 * @param {string} hookArgs.projectData.infoPlistPath
 * @param {string} hookArgs.projectData.appGradlePath
 * @param {string} hookArgs.projectData.gradleFilesDirectoryPath
 * @param {string} hookArgs.projectData.buildXcconfigPath
 * @param {string} hookArgs.projectData.podfilePath
 * @param {boolean} hookArgs.projectData.isShared
 * @param {string} hookArgs.projectData.previewAppSchema
 * @param {string} hookArgs.projectData.webpackConfigPath
 * @param {boolean} hookArgs.projectData.initialized
 */
module.exports = async function ({ projectData, platformData }) {
  const { platformNameLowerCase } = platformData;
  // For now, we handle only iOS (as platforms other than iOS are experimental
  // on NativeScript). We might come back for macOS one day! :D
  if (platformNameLowerCase !== 'ios') {
    return;
  }

  const { devDependencies, dependencies, ignoredDependencies, projectDir } = projectData;

  const ignoredDepsSet = new Set(ignoredDependencies);
  const depsArr = Object.keys({ ...devDependencies, ...dependencies }).filter((key) => !ignoredDepsSet.has(key));
  console.log('Alive with depsArr', depsArr);
  const packagePaths = depsArr.map((depName) => path.dirname(require.resolve(`${depName}/package.json`, { paths: [projectDir] })));
  console.log('Got packagePaths', packagePaths);

  const output = await Promise.all(
    packagePaths.map(
      async (
        // @example '/Users/jamie/Documents/git/nativescript-magic-spells/dist/packages/react-native-module-test'
        packagePath
      ) => {
        const podspecs = await globProm('*.podspec', { cwd: packagePath, absolute: true });
        console.log(`Got podspecs for package: ${path.basename(packagePath)}:`, podspecs);
        if (podspecs.length === 0) {
          return;
        }

        const packageName = path.basename(packagePath);
        const packagePodspec = path.join(packageName, `${packagePath}.podspec`);

        // If there are multiple podspecs, prefer the podspec named after the
        // package; otherwise just take the first match (all of this is
        // consistent with how the React Native Community CLI works).
        const podspecFile = podspecs.find((podspec) => podspec === packagePodspec) || podspecs[0];

        // A comment to write into the header to indicate where the interfaces
        // that we're about to extract came from.
        const comment = `${packageName}/${path.basename(podspecFile)}`;

        const { stdout: podspecContents } = await execFile('pod', ['ipc', 'spec', podspecFile]);

        /**
         * These are the typings (that we're interested in), assuming a valid
         * podspec. We'll handle it in a failsafe manner.
         * @type {{
         *   source_files?: string|string[];
         *   ios?: {
         *     source_files?: string|string[];
         *   };
         * }}
         */
        const podspecParsed = JSON.parse(podspecContents);

        // The other platforms are "osx", "macos", "tvos", and "watchos".
        const { source_files: commonSourceFiles = [], ios: { source_files: iosSourceFiles } = { source_files: [] } } = podspecParsed;

        // Normalise to an array, treating empty-string as an empty array.
        const commonSourceFilesArr = commonSourceFiles ? (Array.isArray(commonSourceFiles) ? commonSourceFiles : [commonSourceFiles]) : [];
        const iosSourceFilesArr = iosSourceFiles ? (Array.isArray(iosSourceFiles) ? iosSourceFiles : [iosSourceFiles]) : [];

        // Take all the distinct patterns.
        const platformSourceFilesArr = [...new Set([...commonSourceFilesArr, ...iosSourceFilesArr])];

        const sourceFilePathsArrays = await Promise.all(platformSourceFilesArr.map(async (pattern) => await globProm(pattern, { cwd: packagePath, absolute: true })));

        // Look just for Obj-C and Obj-C++ implementation files, ignoring
        // headers.
        const sourceFilePaths = [...new Set(sourceFilePathsArrays.flat(1))].filter((sourceFilePath) => /\.mm?$/.test(sourceFilePath));

        return await Promise.all(
          sourceFilePaths.map(async (sourceFilePath) => {
            const sourceFileContents = await readFile(sourceFilePath, { encoding: 'utf8' });

            const classImplementations = [...sourceFileContents.matchAll(/\s*@implementation\s+([A-z0-9$]+)\s+(?:.|[\r\n])*?@end/gm)].reduce((acc, matches) => {
              const [fullMatch, objcClassName] = matches;
              if (!objcClassName) {
                return acc;
              }

              const exportModuleMatches = fullMatch.match(/RCT_EXPORT_MODULE\((.*)\)/gm) || [];
              const exportModuleNoLoadMatches = fullMatch.match(/RCT_EXPORT_MODULE_NO_LOAD\((.*)\)/gm) || [];
              const exportPreRegisteredModuleNoLoadMatches = fullMatch.match(/RCT_EXPORT_PRE_REGISTERED_MODULE\((.*)\)/gm) || [];
              const jsModuleName = exportModuleMatches[1] || exportModuleNoLoadMatches[1] || exportPreRegisteredModuleNoLoadMatches[1] || objcClassName;

              if (!jsModuleName) {
                return acc;
              }

              const remappedMethods = [...fullMatch.matchAll(/\s*RCT_REMAP_METHOD\((.|[\r\n])*?\)*?\{$/gm)].map((match) => {
                const [, fromMethodName] = match[0].split(/RCT_REMAP_METHOD\(\s*/);
                const [methodName, afterMethodName] = fromMethodName.split(/\s*,/);
                const methodArgs = afterMethodName.split(')').slice(0, -1).join(')');

                return `- (void)${methodName.trim()}${methodArgs.trim().split(/\s+/).join('\n')};`;
              });

              const exportedMethods = [...fullMatch.matchAll(/\s*RCT_EXPORT_METHOD\((.|[\r\n])*?\)*\{$/gm)].map((match) => {
                const [, macroContents] = match[0].split(/RCT_EXPORT_METHOD\(\s*/);
                const methodArgs = macroContents.split(')').slice(0, -1).join(')');

                return `- (void)${methodArgs.trim().split(/\s+/).join('\n')};`;
              });

              acc[jsModuleName] = [...remappedMethods, ...exportedMethods];

              return acc;
            }, {});

            const categories = Object.keys(classImplementations)
              .map((jsModuleName) => {
                const methods = classImplementations[jsModuleName];
                return [`@interface ${jsModuleName} (${jsModuleName}TNS)`, methods.join('\n\n'), `@end`].join('\n');
              })
              .join('\n\n');

            return [comment, categories, podspecFile];
          })
        );
      }
    )
  );

  const outputFlat = output.filter((p) => !!p).flat(1);

  const header = [
    `#import <React/RCTBridgeModule.h>`,
    '',
    outputFlat
      .map(([comment, categories, podspecFile]) => {
        return `// ${comment}\n${categories}`;
      })
      .join('\n\n'),
    '',
  ].join('\n');

  console.log(`Got header: ${header}`);

  // TODO: We should ideally strip comments first.
  // Finally, we'll need a ReactNativeTNS.podspec, probably with a dependency
  // on React, that refers to headers in this npm package.
  // @see https://github.com/nativescript-community/expo-nativescript/blob/main/packages/expo-nativescript-adapter/hooks/after-prepare.js
};

/**
 * @param {string} pattern
 * @param {import('glob').IOptions} options
 * @returns {Promise<string[]>}
 */
function globProm(pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, matches) => {
      return err ? reject(err) : resolve(matches);
    });
  });
}
