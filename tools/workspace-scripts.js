module.exports = {
  message: 'NativeScript Plugins ~ made with ❤️  Choose a command to start...',
  pageSize: 32,
  scripts: {
    default: 'nps-i',
    nx: {
      script: 'nx',
      description: 'Execute any command with the @nrwl/cli',
    },
    format: {
      script: 'nx format:write',
      description: 'Format source code of the entire workspace (auto-run on precommit hook)',
    },
    '🔧': {
      script: `npx cowsay "NativeScript plugin demos make developers 😊"`,
      description: '_____________  Apps to demo plugins with  _____________',
    },
    // demos
    apps: {
      '...React Native...': {
        script: `npx cowsay "Let's get native ⚛️"`,
        description: ` 🔻 React Native`,
      },
      // TODO: I have no idea how nx run works, so these are just placeholders
      // for now. Not clear what they'll actually call on the CLI.
      ['demo-react-native']: {
        clean: {
          script: 'nx run demo-react-native:clean',
          description: '⚆  Clean  🧹',
        },
        ios: {
          script: 'nx run demo-react-native:ios',
          description: '⚆  Run iOS  ',
        },
        android: {
          script: 'nx run demo-react-native:android',
          description: '⚆  Run Android  🤖',
        },
      },
      '...Vanilla...': {
        script: `npx cowsay "Nothing wrong with vanilla 🍦"`,
        description: ` 🔻 Vanilla`,
      },
      demo: {
        clean: {
          script: 'nx run demo:clean',
          description: '⚆  Clean  🧹',
        },
        ios: {
          script: 'nx run demo:ios',
          description: '⚆  Run iOS  ',
        },
        android: {
          script: 'nx run demo:android',
          description: '⚆  Run Android  🤖',
        },
      },
      '...Angular...': {
        script: `npx cowsay "Test all the Angles!"`,
        description: ` 🔻 Angular`,
      },
      'demo-angular': {
        clean: {
          script: 'nx run demo-angular:clean',
          description: '⚆  Clean  🧹',
        },
        ios: {
          script: 'nx run demo-angular:ios',
          description: '⚆  Run iOS  ',
        },
        android: {
          script: 'nx run demo-angular:android',
          description: '⚆  Run Android  🤖',
        },
      },
    },
    '⚙️': {
      script: `npx cowsay "@ammarahm-ed/* packages will keep your ⚙️ cranking"`,
      description: '_____________  @ammarahm-ed/*  _____________',
    },
    // packages
    // build output is always in dist/packages
    '@ammarahm-ed': {
      // @ammarahm-ed/react-native
      'react-native': {
        build: {
          script: 'nx run react-native:build.all',
          description: '@ammarahm-ed/react-native: Build',
        },
      },
      'build-all': {
        script: 'nx run-many --target=build.all --all',
        description: 'Build all packages',
      },
    },
    '⚡': {
      script: `npx cowsay "Focus only on source you care about for efficiency ⚡"`,
      description: '_____________  Focus (VS Code supported)  _____________',
    },
    focus: {
      'react-native': {
        script: 'nx run react-native:focus',
        description: 'Focus on @ammarahm-ed/react-native',
      },
      reset: {
        script: 'nx g @ammarahm-ed/plugin-tools:focus-packages',
        description: 'Reset Focus',
      },
    },
    '.....................': {
      script: `npx cowsay "That's all for now folks ~"`,
      description: '.....................',
    },
  },
};
