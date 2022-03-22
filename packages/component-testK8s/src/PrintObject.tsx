import * as React from 'react';
import { K8sResourceCommon } from '@openshift/dynamic-plugin-sdk-utils';

type PrintObjectProps = {
  object: K8sResourceCommon;
};

const PrintObject: React.FC<PrintObjectProps> = ({ object }) => {
  const [expanded, setExpanded] = React.useState(false);

  const sanitize = (resourceOrResourceList) => {
    if (Array.isArray(resourceOrResourceList)) {
      return resourceOrResourceList.map(sanitize);
    }

    const {
      apiVersion,
      kind,
      apiGroup,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata: { managedFields, ...metadata }, // drop managedFields
      ...resource
    } = resourceOrResourceList;

    return {
      apiVersion,
      kind,
      apiGroup,
      metadata,
      ...resource,
    };
  };

  if (!object) {
    return <div>No Object to Report</div>;
  }

  return (
    <pre style={{ overflow: 'hidden', maxHeight: expanded ? undefined : 150, position: 'relative', paddingTop: 25 }}>
      {JSON.stringify(sanitize(object), null, 2)}
      {expanded ? (
        <div onClick={() => setExpanded(false)} style={{ cursor: 'pointer', top: 0, width: '100%', position: 'absolute', textAlign: 'center' }}>
          (Click to collapse)
        </div>
      ) : (
        <div
          onClick={() => setExpanded(true)}
          style={{
            cursor: 'pointer',
            background: 'linear-gradient(transparent, gray)',
            bottom: 0,
            width: '100%',
            height: '100%',
            position: 'absolute',
            textAlign: 'center',
          }}
        >
          (Click to expand)
        </div>
      )}
    </pre>
  );
};

export default PrintObject;
