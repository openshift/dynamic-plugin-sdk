import { renderHook } from '@testing-library/react-hooks/native';
import { Map as ImmutableMap } from 'immutable';
import * as redux from 'react-redux';
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

describe('useK8sWatchResource', () => {
  beforeEach(() => {
    jest.resetModules();

    jest.spyOn(redux, 'useDispatch').mockReturnValue(jest.fn());
    (getWatchData as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should support null as an input value', () => {
    jest.spyOn(redux, 'useSelector').mockReturnValueOnce(null); // get resourceK8s
    (useModelsLoaded as jest.Mock).mockReturnValue(true);
    (useDeepCompareMemoize as jest.Mock).mockReturnValue({ kind: '__not-a-value__' });
    (useK8sModel as jest.Mock).mockReturnValue([undefinedModelMock, false] as [
      K8sModelCommon,
      boolean,
    ]);

    const { result } = renderHook(() => useK8sWatchResource(null));
    const [data, loaded, error] = result.current;

    expect(data).toBeUndefined();
    expect(loaded).toEqual(true);
    expect(error).toBeUndefined();
  });

  test('should return "loaded" as false when models have not loaded', () => {
    const haveModelsLoaded = false;
    (useModelsLoaded as jest.Mock).mockReturnValue(haveModelsLoaded);
    jest.spyOn(redux, 'useSelector').mockReturnValueOnce(null); // get resourceK8s
    (useDeepCompareMemoize as jest.Mock).mockReturnValue(watchedResourceMock);
    (useK8sModel as jest.Mock).mockReturnValue([undefinedModelMock, false] as [
      K8sModelCommon,
      boolean,
    ]);

    const { result } = renderHook(() => useK8sWatchResource(watchedResourceMock));
    const [data, loaded, error] = result.current;

    expect(data).toMatchObject({});
    expect(loaded).toEqual(false);
    expect(error).toBeUndefined();
  });

  test('should return specific error if the model for the watched resource does not exist', () => {
    jest.spyOn(redux, 'useSelector').mockReturnValueOnce(null); // get resourceK8s
    (useModelsLoaded as jest.Mock).mockReturnValue(true);
    (useDeepCompareMemoize as jest.Mock).mockReturnValue(watchedResourceMock);
    (useK8sModel as jest.Mock).mockReturnValue([undefinedModelMock, false] as [
      K8sModelCommon,
      boolean,
    ]);
    // (NoModelError as jest.Mock).mockReturnValue({ message: 'Model does not exist' });
    // NoModelError.mockImplementation(() => ({ message: 'Model does not exist' }));

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
    const useSelectorSpy = jest.spyOn(redux, 'useSelector').mockReturnValueOnce(reduxIdPayload); // get resourceK8s
    (getReduxData as jest.Mock).mockReturnValue(resourceDataMock);
    (useModelsLoaded as jest.Mock).mockReturnValue(true);
    (useDeepCompareMemoize as jest.Mock).mockReturnValue(watchedResourceMock);
    (useK8sModel as jest.Mock).mockReturnValue([resourceModelMock, false] as [
      K8sModelCommon,
      boolean,
    ]);
    (getWatchData as jest.Mock).mockReturnValue(mockWatchData);

    const { result } = renderHook(() => useK8sWatchResource(watchedResourceMock));
    const [data, loaded, error] = result.current;

    expect(useSelectorSpy).toHaveBeenCalledTimes(1);
    const resourceData = data as K8sResourceCommon;
    expect(resourceData?.metadata?.creationTimestamp).toEqual('2022-04-29T13:41:21Z');
    expect(loaded).toEqual(true);
    expect(error).toEqual('');
  });
});
