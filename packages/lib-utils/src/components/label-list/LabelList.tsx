import { LabelGroup, Label, Text } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import * as React from 'react';

/** Type mapping label keys to hrefs */
export type HrefForLabels = {
  [key: string]: string;
};

export type LabelListProps = {
  /** Key value pair for labels (k8s labels) */
  labels: Record<string, string>;
  /** Optional icon for labels in list */
  icon?: React.ReactNode;
  /** Optional icon for labels in list */
  color?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey';
  /** Optional href for each label */
  hrefForLabels?: HrefForLabels;
  /** Optional flag indicating that the label list appears expanded by default */
  expand?: boolean;
};

export const LabelList: React.FC<LabelListProps> = ({
  labels,
  icon,
  color,
  hrefForLabels,
  expand,
}) => {
  const defaultColor = 'purple';

  return _.isEmpty(labels) ? (
    <Text>No labels</Text>
  ) : (
    <LabelGroup defaultIsOpen={expand}>
      {Object.entries(labels).map(([key, value]) => (
        <Label
          href={hrefForLabels?.[key]}
          icon={icon}
          color={color ?? defaultColor}
          key={key}
        >{`${key}=${value}`}</Label>
      ))}
    </LabelGroup>
  );
};

export default LabelList;
