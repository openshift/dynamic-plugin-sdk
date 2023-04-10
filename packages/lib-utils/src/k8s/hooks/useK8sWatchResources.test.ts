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
    creationTimestamp: '2022-04-29T13:41:21Z',
    generation: 1,
    name: 'test',
    namespace: 'vnambiar',
    resourceVersion: '414309692',
    uid: '602ad43f-1a71-4e71-9314-d93bffbc0762',
  },
  spec: {},
  status: {},
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

const useSelectorMock = jest.mocked(useSelector, false);
const useModelsLoadedMock = jest.mocked(useModelsLoaded, false);
const useDeepCompareMemoizeMock = jest.mocked(useDeepCompareMemoize, false);
const getWatchDataMock = jest.mocked(getWatchData, false);
const getReduxDataMock = jest.mocked(getReduxData, false);

describe('useK8sWatchResources', () => {
  beforeEach(() => {
    jest.resetModules();
    getWatchDataMock.mockReturnValue(null);
    useDeepCompareMemoizeMock.mockReturnValue(watchedResourcesMock);
    useModelsLoadedMock.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return "loaded" as false when models have not loaded', () => {
    const haveModelsLoaded = false;
    useModelsLoadedMock.mockReturnValue(haveModelsLoaded);
    useSelectorMock
      .mockReturnValueOnce(ImmutableMap<string, K8sModelCommon>()) // Models have not loaded so allK8sModels is empty
      .mockReturnValueOnce(ImmutableMap<string, unknown>())
      .mockReturnValueOnce(false) // inFlight
      .mockReturnValueOnce(false); // batchesInFlight

    const { result } = renderHook(() => useK8sWatchResources(watchedResourcesMock));
    const { application } = result.current;
    const { data, loaded, loadError } = application;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(false);
    expect(loadError).toBeUndefined();

    // When an initial batch of models has loaded
    useModelsLoadedMock.mockReturnValue(true);
    useSelectorMock
      .mockReturnValueOnce(ImmutableMap<string, K8sModelCommon>()) // get resourceK8s
      .mockReturnValueOnce(ImmutableMap<string, unknown>())
      .mockReturnValueOnce(true) // inFlight
      .mockReturnValueOnce(true); // batchesInFlight

    const checkAllBatches = renderHook(() => useK8sWatchResources(watchedResourcesMock));
    const resultingApp = checkAllBatches.result.current.application;

    expect(resultingApp.data).toMatchObject({});
    expect(resultingApp.loaded).toEqual(false);
    expect(resultingApp.loadError).toBeUndefined();
  });

  test('should return specific error if the model for the watched resource does not exist', () => {
    useSelectorMock
      .mockReturnValueOnce(ImmutableMap<string, K8sModelCommon>()) // Models have loaded but do not contain "application" model
      .mockReturnValueOnce(ImmutableMap<string, unknown>())
      .mockReturnValueOnce(false) // inFlight
      .mockReturnValueOnce(false); // batchesInFlight

    const { result } = renderHook(() => useK8sWatchResources(watchedResourcesMock));
    const { application } = result.current;
    const { data, loaded, loadError } = application;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(true);
    expect((loadError as NoModelError).message).toEqual('Model does not exist');
  });

  test('should return data for the watched resource', () => {
    const ID_MOCK = 'appstudio.redhat.com~v1alpha1~Application---{"ns":"test-ns","name":"test"}';
    const mockWatchData: WatchData = {
      id: ID_MOCK,
      action: jest.fn(),
    };
    const payload = {
      [ID_MOCK]: {
        data: resourceDataMock,
        loaded: true,
        loadError: '',
      },
    };
    const resourceK8s: ImmutableMap<string, unknown> = ImmutableMap(fromJS(payload));

    jest.mock('./usePrevious', () => ({
      usePrevious: jest.fn(() => undefined),
    }));
    useSelectorMock
      .mockReturnValueOnce(ImmutableMap<string, K8sModelCommon>(allModelsMock)) // Mock models
      .mockReturnValueOnce(ImmutableMap<string, unknown>(resourceK8s))
      .mockReturnValueOnce(false) // inFlight
      .mockReturnValueOnce(false); // batchesInFlight
    getWatchDataMock.mockReturnValue(mockWatchData);
    getReduxDataMock.mockReturnValue(resourceDataMock);

    const { result } = renderHook(() => useK8sWatchResources(watchedResourcesMock));
    const { application } = result.current;
    const { data, loaded, loadError } = application;
    expect(loaded).toEqual(true);
    expect(loadError).toEqual('');
    expect(data as K8sResourceCommon).toMatchObject(resourceDataMock);
    expect(useSelectorMock).toHaveBeenCalled();
  });
});
