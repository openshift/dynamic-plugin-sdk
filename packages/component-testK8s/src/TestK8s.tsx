/* eslint-disable no-console */
import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import WSTest from './WSTest';
import FetchTest from './FetchTest';
import DetermineNamespace from './DetermineNamespace';

const TestK8s: React.FC = () => {
  const [namespace, setNamespace] = React.useState<string>();

  return (
    <PageSection>
      <DetermineNamespace namespace={namespace} setNamespace={setNamespace} />
      {namespace && (
        <>
          <hr style={{ margin: 20 }} />
          <FetchTest namespace={namespace} />
          <hr style={{ margin: 20 }} />
          <WSTest namespace={namespace} />
        </>
      )}
    </PageSection>
  );
};

export default TestK8s;
