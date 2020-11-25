import React, { useEffect, useState } from 'react';
import { FunctionComponent } from 'react';
import {
  Linking,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Pressable,
} from 'react-native';
import {
  LinkError,
  LinkEventListener,
  LinkExit,
  LinkSuccess,
  PlaidLinkComponentProps,
  PlaidLinkProps,
} from './Types';

/**
 * A hook that registers a listener on the Plaid emitter for the 'onEvent' type.
 * The listener is cleaned up when this view is unmounted
 *
 * @param LinkEventListener the listener to call
 */
export const usePlaidEmitter = (LinkEventListener: LinkEventListener) => {
  useEffect(() => {
    const emitter = new NativeEventEmitter(
      Platform.OS === 'ios'
        ? NativeModules.RNLinksdk
        : NativeModules.PlaidAndroid,
    );
    const listener = emitter.addListener('onEvent', LinkEventListener);
    // Clean up after this effect:
    return function cleanup() {
      listener.remove();
    };
  }, []);
};


export const openLink = async (props: PlaidLinkProps) => {
  let config = props.tokenConfig ? props.tokenConfig : props.publicKeyConfig!;
  if (Platform.OS === 'android') {
    NativeModules.PlaidAndroid.startLinkActivityForResult(
      JSON.stringify(config),
      (result: LinkSuccess) => {
        if (props.onSuccess != null) {
          props.onSuccess(result);
        }
      },
      (result: LinkExit) => {
        if (props.onExit != null) {
          props.onExit(result);
        }
      },
    );
  } else {
    NativeModules.RNLinksdk.create(config);
    NativeModules.RNLinksdk.open(
      (error: LinkError, result: LinkExit & LinkSuccess) => {
        if (error) {
          if (props.onExit != null) {
            var data = result || {};
            data.error = error;
            props.onExit(data);
          }
        } else {
          switch (result.metadata.status) {
            case 'connected':
              if (props.onSuccess != null) {
                delete result.metadata.status;
                props.onSuccess(result);
              }
              break;
            default:
              if (props.onExit != null) {
                delete result.metadata.status;
                props.onExit(result);
              }
              break;
          }
        }
      },
    );
  }
};

export const dismissLink = () => {
  if (Platform.OS === 'ios') {
    NativeModules.RNLinksdk.dismiss();
  }
};

const _handleListenerChange = (event: { url: string }) => {
  if (event.url !== null && Platform.OS === 'ios') {
    NativeModules.RNLinksdk.continueFromRedirectUriString(event.url);
  }
};

export const useDeepLinkRedirector = (listener: LinkingEventListener) => {
  useEffect(() => {
    Linking.addEventListener('url', listener);

    return () => {
      Linking.removeEventListener('url', listener);
    };
  });
};

export function PlaidLink(props: PlaidLinkComponentProps) {
  //useDeepLinkRedirector(_handleListenerChange);
  const [a,b] = useState(false)
  return (<Pressable onPress={() => {
    b(!a)
    openLink(props)
  }
  }>{props.children}</Pressable>);
};

type LinkingEventListener = (event: { url: string }) => void

/*
FunctionalComonent<PlaidLinkComponentProps>
React.ReactNode
Forced cast -> <Pressable onPress={() => openLink(props)}>{props.children}</Pressable> as React.FunctionComponent<PressableProps>
*/