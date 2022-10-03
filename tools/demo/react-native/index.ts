import { DemoSharedBase } from '../utils';
import { NativeModules } from '@ammarahm-ed/react-native';

export class DemoSharedReactNative extends DemoSharedBase {
  loadBridge() {
    console.log(
      NativeModules.RNTestModule.show()
        .then((result) => {
          console.log('resolved');
        })
        .catch((rej) => {
          console.log('error', rej);
        })
    );
  }
  getName() {
    console.log(Object.keys(NativeModules));
  }
  callbackTest() {
    console.log('to do');
  }
}
