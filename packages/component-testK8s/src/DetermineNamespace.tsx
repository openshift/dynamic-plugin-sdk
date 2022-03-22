import * as React from 'react';
import { isUtilsConfigSet, k8sListResourceItems } from '@openshift/dynamic-plugin-sdk-utils';
import { ProjectModel } from './models';
import { Alert, Spinner } from '@patternfly/react-core';

type DetermineNamespaceProps = {
  namespace: string;
  setNamespace: (namespace: string) => void;
};

const DetermineNamespace: React.FC<DetermineNamespaceProps> = ({ namespace, setNamespace }) => {
  const [error, setError] = React.useState<string>(null);

  const hasConfig = isUtilsConfigSet();
  React.useEffect(() => {
    if (hasConfig) {
      k8sListResourceItems({
        model: ProjectModel,
      })
        .then((items) => {
          const ns = items[0]?.metadata.name;

          if (ns) {
            setNamespace(ns);
          } else {
            setError('Could not find namespace; you are likely not able to do much as we are targeting "default"');
          }
        })
        .catch((e) => {
          setError(`Unknown issue loading namespace ${e?.message}`);
        });
    }
  }, [hasConfig, setNamespace]);

  if (error) {
    return (
      <Alert variant="danger" isInline title="Determining Namespace Error">
        {error}
      </Alert>
    );
  }

  return namespace ? (
    <p>Current namespace: {namespace}</p>
  ) : (
    <>
      <Spinner /> Loading Namespace
    </>
  );
};

export default DetermineNamespace;
