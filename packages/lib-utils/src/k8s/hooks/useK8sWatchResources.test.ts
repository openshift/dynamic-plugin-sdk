import { renderHook } from '@testing-library/react-hooks/native';
import { Map as ImmutableMap, fromJS } from 'immutable';
import { useSelector } from 'react-redux';
import type { K8sModelCommon, K8sResourceCommon } from '../../types/k8s';
import type { WatchData } from './k8s-watch-types';
import type { NoModelError } from './k8s-watcher';
import { getWatchData, getReduxData } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { useK8sWatchResources } from './useK8sWatchResources';
import { useModelsLoaded } from './useModelsLoaded';

const watchedResourcesMock = {
  application: {
    isList: false,
    groupVersionKind: {
      group: 'appstudio.redhat.com',
      version: 'v1alpha1',
      kind: 'Application',
    },
    name: 'test',
    namespace: 'test-ns',
  },
};

const resourceModelMock: K8sModelCommon | undefined = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  crd: true,
  kind: 'Application',
  namespaced: true,
  plural: 'applications',
};

const allModelsMock: ImmutableMap<string, K8sModelCommon> = ImmutableMap<string, K8sModelCommon>({
  'appstudio.redhat.com~v1alpha1~Application': resourceModelMock,
});

const resourceDataMock: K8sResourceCommon = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Application',
  metadata: {
    annotations: { finalizeCount: '0', test: 'patched-value' },
    creationTimestamp: '2022-04-29T13:41:21Z',
    finalizers: ['application.appstudio.redhat.com/finalizer'],
    generation: 1,
    name: 'test',
    namespace: 'vnambiar',
    resourceVersion: '414309692',
    uid: '602ad43f-1a71-4e71-9314-d93bffbc0762',
  },
  spec: { appModelRepository: { url: '' }, displayName: '', gitOpsRepository: { url: '' } },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-04-29T13:41:22Z',
        message: 'Application has been successfully created',
        reason: 'OK',
        status: 'True',
        type: 'Created',
      },
    ],
    devfile:
      'metadata:\\n  attributes:\\n    appModelRepository.context: /\\n    appModelRepository.url: https://github.com/redhat-appstudio-appdata/-vnambiar-touch-drive\\n    gitOpsRepository.context: /\\n    gitOpsRepository.url: https://github.com/redhat-appstudio-appdata/-vnambiar-touch-drive\\nschemaVersion: 2.1.0\\n',
  },
};

// Mock modules

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn(),
}));

jest.mock('./k8s-watcher', () => ({
  getWatchData: jest.fn(),
  getReduxData: jest.fn(),
  NoModelError: jest.fn(() => ({ message: 'Model does not exist' })),
}));

jest.mock('./useModelsLoaded', () => ({ useModelsLoaded: jest.fn() }));

jest.mock('./useDeepCompareMemoize', () => ({ useDeepCompareMemoize: jest.fn() }));

describe('useK8sWatchResources', () => {
  beforeEach(() => {
    jest.resetModules();
    (getWatchData as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return "loaded" as false when models have not loaded', () => {
    const haveModelsLoaded = false;
    (useModelsLoaded as jest.Mock).mockReturnValue(haveModelsLoaded);
    (useSelector as jest.Mock)
      .mockReturnValueOnce(ImmutableMap<string, K8sModelCommon>()) // Models have not loaded so allK8sModels is empty
      .mockReturnValueOnce(ImmutableMap<string, unknown>());
    (useDeepCompareMemoize as jest.Mock).mockReturnValue(watchedResourcesMock);

    const { result } = renderHook(() => useK8sWatchResources(watchedResourcesMock));
    const { application } = result.current;
    const { data, loaded, loadError } = application;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(false);
    expect(loadError).toBeUndefined();
  });

  test('should return specific error if the model for the watched resource does not exist', () => {
    (useModelsLoaded as jest.Mock).mockReturnValue(true);
    (useDeepCompareMemoize as jest.Mock).mockReturnValue(watchedResourcesMock);
    (useSelector as jest.Mock)
      .mockReturnValueOnce(ImmutableMap<string, K8sModelCommon>()) // Models have loaded but do not contain "application" model
      .mockReturnValueOnce(ImmutableMap<string, unknown>());

    const { result } = renderHook(() => useK8sWatchResources(watchedResourcesMock));
    const { application } = result.current;
    const { data, loaded, loadError } = application;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(true);
    expect((loadError as NoModelError).message).toEqual('Model does not exist');
  });

  test('should return data for the watched resource', () => {
    const mockWatchData: WatchData = {
      id: 'appstudio.redhat.com~v1alpha1~Application---{"ns":"test-ns","name":"test"}',
      action: jest.fn(),
    };
    const payload = {
      'appstudio.redhat.com~v1alpha1~Application---{"ns":"test-ns","name":"test"}': {
        data: resourceDataMock,
        loaded: true,
        loadError: '',
      },
    };
    const resourceK8s: ImmutableMap<string, unknown> = ImmutableMap(fromJS(payload));

    jest.mock('./usePrevious', () => ({
      usePrevious: jest.fn(() => undefined),
    }));
    (useModelsLoaded as jest.Mock).mockReturnValue(true);
    (useDeepCompareMemoize as jest.Mock).mockReturnValue(watchedResourcesMock);
    const useSelectorSpy = (useSelector as jest.Mock)
      .mockReturnValueOnce(ImmutableMap<string, K8sModelCommon>(allModelsMock)) // Mock models
      .mockReturnValueOnce(ImmutableMap<string, unknown>(resourceK8s));
    (getWatchData as jest.Mock).mockReturnValue(mockWatchData);
    (getReduxData as jest.Mock).mockReturnValue(resourceDataMock);

    const { result } = renderHook(() => useK8sWatchResources(watchedResourcesMock));
    const { application } = result.current;
    const { data, loaded, loadError } = application;
    expect(loaded).toEqual(true);
    expect(loadError).toEqual('');
    expect((data as K8sResourceCommon).metadata?.creationTimestamp).toEqual('2022-04-29T13:41:21Z');
    expect(useSelectorSpy).toHaveBeenCalledTimes(2);
  });
});
