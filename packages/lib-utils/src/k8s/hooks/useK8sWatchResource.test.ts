import { renderHook } from '@testing-library/react-hooks/native';
import { Map as ImmutableMap } from 'immutable';
import { useSelector } from 'react-redux';
import type { K8sModelCommon, K8sResourceCommon } from '../../types/k8s';
import type { WatchData } from './k8s-watch-types';
import type { NoModelError } from './k8s-watcher';
import { getWatchData, getReduxData } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { useK8sModel } from './useK8sModel';
import { useK8sWatchResource } from './useK8sWatchResource';
import { useModelsLoaded } from './useModelsLoaded';
import type { WatchK8sResource } from './watch-resource-types';

const watchedResourceMock: WatchK8sResource = {
  isList: false,
  groupVersionKind: {
    group: 'appstudio.redhat.com',
    version: 'v1alpha1',
    kind: 'Application',
  },
  name: 'test',
  namespace: 'test-ns',
};

const resourceModelMock: K8sModelCommon | undefined = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  crd: true,
  kind: 'Application',
  namespaced: true,
  plural: 'applications',
};

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

let undefinedModelMock: K8sModelCommon | undefined;

// Mock modules

jest.mock('./k8s-watcher', () => ({
  getWatchData: jest.fn(),
  getReduxData: jest.fn(),
  NoModelError: jest.fn(() => ({ message: 'Model does not exist' })),
}));

jest.mock('./useK8sModel', () => ({
  useK8sModel: jest.fn(),
}));

jest.mock('./useDeepCompareMemoize', () => ({ useDeepCompareMemoize: jest.fn() }));

jest.mock('./useModelsLoaded', () => ({ useModelsLoaded: jest.fn() }));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn(),
}));

const useSelectorMock = jest.mocked(useSelector, false);
const useModelsLoadedMock = jest.mocked(useModelsLoaded, false);
const useDeepCompareMemoizeMock = jest.mocked(useDeepCompareMemoize, false);
const useK8sModelMock = jest.mocked(useK8sModel, false);
const getWatchDataMock = jest.mocked(getWatchData, false);
const getReduxDataMock = jest.mocked(getReduxData, false);

describe('useK8sWatchResource', () => {
  beforeEach(() => {
    jest.resetModules();

    getWatchDataMock.mockReturnValue(null);
    useSelectorMock.mockReturnValue(null); // get resourceK8s
    useModelsLoadedMock.mockReturnValue(true);
    useK8sModelMock.mockReturnValue([undefinedModelMock, false] as [K8sModelCommon, boolean]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should support null as an input value', () => {
    useDeepCompareMemoizeMock.mockReturnValue({ kind: '__not-a-value__' });

    const { result } = renderHook(() => useK8sWatchResource(null));
    const [data, loaded, error] = result.current;

    expect(data).toBeUndefined();
    expect(loaded).toEqual(true);
    expect(error).toBeUndefined();
  });

  test('should return "loaded" as false when models have not loaded', () => {
    const haveModelsLoaded = false;
    useModelsLoadedMock.mockReturnValue(haveModelsLoaded);
    useDeepCompareMemoizeMock.mockReturnValue(watchedResourceMock);

    const { result } = renderHook(() => useK8sWatchResource(watchedResourceMock));
    let [data, loaded, error] = result.current;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(false);
    expect(error).toBeUndefined();

    // When an initial batch of models has loaded
    useModelsLoadedMock.mockReturnValue(true);
    useSelectorMock
      .mockReturnValueOnce(null) // get resourceK8s
      .mockReturnValueOnce(true); // batchesInFlight: true to indicate that some batches of resources are still loading

    const checkAllBatches = renderHook(() => useK8sWatchResource(watchedResourceMock));
    [data, loaded, error] = checkAllBatches.result.current;
    expect(data).toMatchObject({});
    expect(loaded).toEqual(false);
    expect(error).toBeUndefined();
  });

  test('should return specific error if the model for the watched resource does not exist', () => {
    useDeepCompareMemoizeMock.mockReturnValue(watchedResourceMock);
    useSelectorMock
      .mockReturnValueOnce(null) // get resourceK8s
      .mockReturnValueOnce(false); // batchesInFlight: true to indicate that some batches of resources are still loading

    const { result } = renderHook(() => useK8sWatchResource(watchedResourceMock));
    const [data, loaded, error] = result.current;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(true);
    expect((error as NoModelError).message).toEqual('Model does not exist');
  });

  test('should return data for the watched resource', () => {
    const mockWatchData: WatchData = {
      id: 'appstudio.redhat.com~v1alpha1~Application---{"ns":"test-ns","name":"test"}',
      action: jest.fn(),
    };
    const payload = {
      data: resourceDataMock,
      loaded: true,
      loadError: '',
    };
    const reduxIdPayload: ImmutableMap<string, unknown> = ImmutableMap(payload);
    useSelectorMock.mockReturnValue(reduxIdPayload); // get resourceK8s
    getReduxDataMock.mockReturnValue(resourceDataMock);
    useDeepCompareMemoizeMock.mockReturnValue(watchedResourceMock);
    useK8sModelMock.mockReturnValue([resourceModelMock, false] as [K8sModelCommon, boolean]);
    getWatchDataMock.mockReturnValue(mockWatchData);

    const { result } = renderHook(() => useK8sWatchResource(watchedResourceMock));
    const [data, loaded, error] = result.current;

    expect(useSelectorMock).toHaveBeenCalled();
    const resourceData = data as K8sResourceCommon;

    expect(resourceData).toMatchObject(resourceDataMock);

    expect(loaded).toEqual(true);
    expect(error).toEqual('');
  });

  test('should return data for the watched resource from provided static model', () => {
    const mockWatchData: WatchData = {
      id: 'appstudio.redhat.com~v1alpha1~Application---{"ns":"test-ns","name":"test"}',
      action: jest.fn(),
    };
    const payload = {
      data: resourceDataMock,
      loaded: true,
      loadError: '',
    };
    const reduxIdPayload: ImmutableMap<string, unknown> = ImmutableMap(payload);
    useSelectorMock.mockReturnValue(reduxIdPayload); // get resourceK8s
    getReduxDataMock.mockReturnValue(resourceDataMock);
    useDeepCompareMemoizeMock.mockReturnValue(watchedResourceMock);
    getWatchDataMock.mockReturnValue(mockWatchData);

    const { result } = renderHook(() =>
      useK8sWatchResource(watchedResourceMock, resourceModelMock),
    );
    const [data, loaded, error] = result.current;

    expect(useSelectorMock).toHaveBeenCalled();
    const resourceData = data as K8sResourceCommon;

    expect(resourceData).toMatchObject(resourceDataMock);

    expect(loaded).toEqual(true);
    expect(error).toEqual('');
  });
});
