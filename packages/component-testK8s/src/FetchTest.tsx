/* eslint-disable no-console */
import * as React from 'react';
import { Button, TextInput, Title } from '@patternfly/react-core';
import {
  k8sCreateResource,
  k8sDeleteResource,
  k8sGetResource,
  k8sPatchResource,
  K8sResourceCommon,
  k8sUpdateResource,
} from '@openshift/dynamic-plugin-sdk-utils';
import { ApplicationModel } from './models';

import PrintObject from './PrintObject';

// eslint-disable-next-line no-shadow
enum ActionType {
  CREATE = 'create',
  GET = 'get',
  PATCH = 'patch',
  PUT = 'put',
  DELETE = 'delete',
}

type FetchTestProps = {
  namespace: string;
};

const FetchTest: React.FC<FetchTestProps> = ({ namespace }) => {
  const [r, setR] = React.useState(null);
  const [name, setName] = React.useState<string>('test');
  const [status, setStatus] = React.useState<string>('');
  const [action, setAction] = React.useState<ActionType | null>(null);
  const [resourceVersion, setResourceVersion] = React.useState<string>(null);

  React.useEffect(() => {
    const testApplicationMetadata = {
      name,
      ns: namespace,
    };
    const testApplicationData: K8sResourceCommon & { [key: string]: any } = {
      apiVersion: `${ApplicationModel.apiGroup}/${ApplicationModel.apiVersion}`,
      kind: ApplicationModel.kind,
      metadata: {
        name,
        namespace,
      },
    };

    let promise = null;
    switch (action) {
      case ActionType.CREATE:
        promise = k8sCreateResource({
          model: ApplicationModel,
          queryOptions: testApplicationMetadata,
          resource: testApplicationData,
        });
        break;
      case ActionType.GET:
        promise = k8sGetResource({
          model: ApplicationModel,
          queryOptions: testApplicationMetadata,
        }).then((data) => {
          setResourceVersion(data?.metadata?.resourceVersion);
          return data;
        });
        break;
      case ActionType.PATCH:
        promise = k8sPatchResource({
          model: ApplicationModel,
          queryOptions: testApplicationMetadata,
          patches: [
            {
              op: 'replace',
              path: '/test',
              value: 'false',
            },
          ],
        });
        break;
      case ActionType.PUT:
        promise = k8sUpdateResource({
          model: ApplicationModel,
          queryOptions: testApplicationMetadata,
          resource: {
            ...testApplicationData,
            metadata: {
              ...testApplicationData.metadata,
              resourceVersion,
            },
          },
        }).then((data) => {
          setResourceVersion(data?.metadata?.resourceVersion);
          return data;
        });
        break;
      case ActionType.DELETE:
        promise = k8sDeleteResource({
          model: ApplicationModel,
          queryOptions: testApplicationMetadata,
        });
        break;
      case null:
        // ignore effect
        break;
      default:
        // this shouldn't happen, catch state for missed cases
        throw new Error('uh oh!');
    }
    promise
      ?.then((data) => {
        setStatus(`${action} response:`);
        setR(data);
        console.debug(`++++${action}!`, data);
      })
      .catch((err) => {
        console.error(`++++failed ${action}`, err);
        setStatus(`failed call: ${err.message}`);
        setR(null);
      })
      .finally(() => {
        setAction(null); // prevent the hook for re-firing on name change
      });
  }, [action, name, namespace, resourceVersion]);

  return (
    <>
      <Title headingLevel="h2" size="xl">
        Fetch Calls
      </Title>
      <TextInput placeholder="Application name" onChange={(v) => setName(v)} value={name} />
      <div>
        <p>Test calls -- predefined data; use the above input to make/update/get multiple Applications</p>
        {Object.values(ActionType).map((v) => (
          <React.Fragment key={v}>
            <Button isDisabled={v === ActionType.PUT && resourceVersion === null} onClick={() => setAction(v)}>
              {v}
            </Button>{' '}
          </React.Fragment>
        ))}
      </div>
      <div>{status}</div>
      {r && <PrintObject object={r} />}
    </>
  );
};

export default FetchTest;
