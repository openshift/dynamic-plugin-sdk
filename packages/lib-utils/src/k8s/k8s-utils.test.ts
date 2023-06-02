import type { K8sModelCommon, K8sResourceCommon, QueryOptions } from '../types/k8s';
import { getK8sResourceURL } from './k8s-utils';

const resourceModelMock: K8sModelCommon | undefined = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'Application',
  namespaced: true,
  plural: 'applications',
};

const resourceDataMock: K8sResourceCommon = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Application',
  metadata: {
    creationTimestamp: '2023-04-29T13:41:21Z',
    generation: 1,
    name: 'thequickbrownfox',
    namespace: 'foobar',
    resourceVersion: '414309692',
    uid: '602ad43f-1a71-4e71-9314-d93bffbc0772',
  },
};

const queryOptionsMock: QueryOptions = {
  ns: 'foobar',
  name: 'thequickbrownfox',
  path: 'path',
  queryParams: {
    pretty: 'true',
    dryRun: 'true',
    name: 'thequickbrownfox',
    watch: 'true',
  },
};

describe('k8s-utils', () => {
  describe('getK8sResourceURL', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should append name to URL path and query params by default', () => {
      expect(getK8sResourceURL(resourceModelMock, resourceDataMock, queryOptionsMock)).toBe(
        '/apis/appstudio.redhat.com/v1alpha1/namespaces/foobar/applications/thequickbrownfox/path?pretty=true&dryRun=true&name=thequickbrownfox&watch=true',
      );
    });

    test('should omit name from URL path and query params when method is "POST"', () => {
      expect(getK8sResourceURL(resourceModelMock, resourceDataMock, queryOptionsMock, 'POST')).toBe(
        '/apis/appstudio.redhat.com/v1alpha1/namespaces/foobar/applications/path?pretty=true&dryRun=true',
      );
    });
  });
});
