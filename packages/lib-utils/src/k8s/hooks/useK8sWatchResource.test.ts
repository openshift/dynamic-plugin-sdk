import { renderHook } from '@testing-library/react-hooks/native';
import { Map as ImmutableMap } from 'immutable';
import * as redux from 'react-redux';
import type { K8sModelCommon, K8sResourceCommon } from '../../types/k8s';
import type { WatchData } from './k8s-watch-types';
import * as watcher from './k8s-watcher';
import * as deepCompare from './useDeepCompareMemoize';
import * as k8sModel from './useK8sModel';
import { useK8sWatchResource } from './useK8sWatchResource';
import * as modelsLoaded from './useModelsLoaded';
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

let undefinedModelMock: K8sModelCommon | undefined;

describe('useK8sWatchResource', () => {
  beforeEach(() => {
    jest.resetModules();

    jest.spyOn(redux, 'useDispatch').mockReturnValue(jest.fn());

    jest.spyOn(watcher, 'getWatchData').mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should support null as an input value', () => {
    jest.spyOn(redux, 'useSelector').mockReturnValueOnce(null); // get resourceK8s
    jest.spyOn(modelsLoaded, 'useModelsLoaded').mockReturnValue(true);
    jest.spyOn(deepCompare, 'useDeepCompareMemoize').mockReturnValue({ kind: '__not-a-value__' });
    jest
      .spyOn(k8sModel, 'useK8sModel')
      .mockReturnValue([undefinedModelMock, false] as [K8sModelCommon, boolean]);

    const { result } = renderHook(() => useK8sWatchResource(null));
    const [data, loaded, error] = result.current;

    expect(data).toBeUndefined();
    expect(loaded).toEqual(true);
    expect(error).toBeUndefined();
  });

  test('should return "loaded" as false when models have not loaded', () => {
    const haveModelsLoaded = false;
    jest.spyOn(modelsLoaded, 'useModelsLoaded').mockReturnValue(haveModelsLoaded);
    jest.spyOn(redux, 'useSelector').mockReturnValueOnce(null); // get resourceK8s
    jest.spyOn(deepCompare, 'useDeepCompareMemoize').mockReturnValue(watchedResourceMock);
    jest
      .spyOn(k8sModel, 'useK8sModel')
      .mockReturnValue([undefinedModelMock, false] as [K8sModelCommon, boolean]);

    const { result } = renderHook(() => useK8sWatchResource(watchedResourceMock));
    const [data, loaded, error] = result.current;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(false);
    expect(error).toBeUndefined();
  });

  test('should return specific error if the model for the watched resource does not exist', () => {
    jest.spyOn(redux, 'useSelector').mockReturnValueOnce(null); // get resourceK8s
    jest.spyOn(modelsLoaded, 'useModelsLoaded').mockReturnValue(true);
    jest.spyOn(deepCompare, 'useDeepCompareMemoize').mockReturnValue(watchedResourceMock);
    jest
      .spyOn(k8sModel, 'useK8sModel')
      .mockReturnValue([undefinedModelMock, false] as [K8sModelCommon, boolean]);

    const { result } = renderHook(() => useK8sWatchResource(watchedResourceMock));
    const [data, loaded, error] = result.current;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(true);
    expect((error as watcher.NoModelError).message).toEqual('Model does not exist');
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
    const useSelectorSpy = jest.spyOn(redux, 'useSelector').mockReturnValueOnce(reduxIdPayload); // get resourceK8s
    jest.spyOn(watcher, 'getReduxData').mockReturnValue(resourceDataMock);
    jest.spyOn(modelsLoaded, 'useModelsLoaded').mockReturnValue(true);
    jest.spyOn(deepCompare, 'useDeepCompareMemoize').mockReturnValue(watchedResourceMock);
    jest
      .spyOn(k8sModel, 'useK8sModel')
      .mockReturnValue([resourceModelMock, false] as [K8sModelCommon, boolean]);
    jest.spyOn(watcher, 'getWatchData').mockReturnValue(mockWatchData);

    const { result } = renderHook(() => useK8sWatchResource(watchedResourceMock));
    const [data, loaded, error] = result.current;

    expect(useSelectorSpy).toHaveBeenCalledTimes(1);
    const resourceData = data as K8sResourceCommon;
    expect(resourceData?.metadata?.creationTimestamp).toEqual('2022-04-29T13:41:21Z');
    expect(loaded).toEqual(true);
    expect(error).toEqual('');
  });
});
