import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import { useResolvedExtensions } from '@openshift/dynamic-plugin-sdk';
import type { ReduxProvider } from '@openshift/dynamic-plugin-sdk-extensions';
import { render } from '@testing-library/react';
import * as React from 'react';
import type { ReactReduxContextValue } from 'react-redux';
import { createSelectorHook } from 'react-redux';
import type { Store } from 'redux';
import { createStore } from 'redux';
import ReduxExtensionProvider from './ReduxExtensionProvider';

type LRReduxReducer = LoadedAndResolvedExtension<ReduxProvider>;

jest.mock('@openshift/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}));

const useResolvedExtensionsMock = jest.mocked(useResolvedExtensions, false);

describe('ReduxExtensionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register multiple providers with separate redux contexts', () => {
    type State = {
      value: number;
    };

    const store1: Store<State> = createStore((state) => state ?? { value: 1 });
    const store2: Store<State> = createStore((state) => state ?? { value: 2 });

    // create 2 core.redux-provider extensions
    const extensions: LRReduxReducer[] = [
      {
        uid: '1',
        pluginName: 'test',
        type: 'core.redux-provider',
        properties: {
          store: store1,
          context: React.createContext<ReactReduxContextValue>({
            store: store1,
          } as ReactReduxContextValue),
        },
      },
      {
        uid: '2',
        pluginName: 'test',
        type: 'core.redux-provider',
        properties: {
          store: store2,
          context: React.createContext<ReactReduxContextValue>({
            store: store2,
          } as ReactReduxContextValue),
        },
      },
    ];

    // mock that returns the test extensions
    useResolvedExtensionsMock.mockReturnValue([extensions, true, []]);

    // create 2 contextual redux selectors; one for each extension
    const useSelector1 = createSelectorHook(extensions[0].properties.context);
    const useSelector2 = createSelectorHook(extensions[1].properties.context);

    let value1 = -1;
    let value2 = -1;

    // this component will select values separately from each redux store
    const Test: React.FC = () => {
      value1 = useSelector1((state: State) => state.value);
      value2 = useSelector2((state: State) => state.value);
      return null;
    };

    render(
      <ReduxExtensionProvider>
        <Test />
      </ReduxExtensionProvider>,
    );

    // assert that the values received by each selector relate to their corresponding redux state
    expect(value1).toBe(1);
    expect(value2).toBe(2);
  });

  test('should render children', () => {
    // mock return value of empty set of extensions
    useResolvedExtensionsMock.mockReturnValue([[], true, []]);

    const { container } = render(
      <ReduxExtensionProvider>
        <span id="test" />
      </ReduxExtensionProvider>,
    );

    expect(container.firstElementChild?.tagName).toBe('SPAN');
    expect(container.firstElementChild?.getAttribute('id')).toBe('test');
  });

  test('should return null if extensions are unresolved', () => {
    // mock return value of empty set of extensions
    useResolvedExtensionsMock.mockReturnValue([[], false, []]);

    const { container } = render(
      <ReduxExtensionProvider>
        <span id="test" />
      </ReduxExtensionProvider>,
    );

    expect(container.firstElementChild).toBe(null);
  });
});
