import React from 'react';

import type { K8sResourceCommon } from '../../index';
import { LabelList } from '../label-list';
import DetailsItem from './DetailsItem';
import DetailsItemList from './DetailsItemList';

type ResourceSummaryProps = {
  resource?: K8sResourceCommon;
  loaded?: boolean;
};

const LABELS = {
  name: 'Name',
  namespace: 'Namespace',
  labels: 'Labels',
  created: 'Created at',
  owner: 'Owner',
};

const ResourceSummary: React.FC<ResourceSummaryProps> = ({ children, loaded = true, resource }) => {
  return (
    <DetailsItemList>
      <DetailsItem label="Name" resource={resource} path="metadata.name" loaded={loaded} />

      <DetailsItem
        label={LABELS.name}
        resource={resource}
        path="metadata.namespace"
        hideEmpty
        loaded={loaded}
      />

      {children}

      <DetailsItem label={LABELS.labels} resource={resource} path="metadata.labels" loaded={loaded}>
        <LabelList labels={resource?.metadata?.labels} />
      </DetailsItem>

      <DetailsItem
        label={LABELS.created}
        resource={resource}
        path="metadata.creationTimestamp"
        loaded={loaded}
      >
        {/* Leaving raw for now - there will need to be a special datetime formatter component */}
      </DetailsItem>

      <DetailsItem
        label={LABELS.owner}
        resource={resource}
        path="metadata.ownerReferences"
        loaded={loaded}
      >
        {resource?.metadata?.ownerReferences ? (
          resource.metadata?.ownerReferences.map((ownerReference) => (
            <span key={ownerReference.uid}>{ownerReference.name}</span>
          ))
        ) : (
          <span className="pf-u-disabled-color-100">No owner</span>
        )}
      </DetailsItem>
    </DetailsItemList>
  );
};

export default ResourceSummary;
