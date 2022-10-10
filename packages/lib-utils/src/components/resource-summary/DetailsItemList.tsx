import { DescriptionList } from '@patternfly/react-core';

import React from 'react';

const DetailsItemList: React.FC = ({ children }) => {
  return <DescriptionList>{children}</DescriptionList>;
};

export default DetailsItemList;
