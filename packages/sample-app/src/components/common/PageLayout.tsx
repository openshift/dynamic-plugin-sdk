import { Page, PageSection } from '@patternfly/react-core';
import * as React from 'react';

type PageLayoutProps = {
  header?: React.ReactNode;
};

const PageLayout: React.FC<PageLayoutProps> = ({ header, children }) => (
  <Page header={header}>
    <PageSection isFilled>{children}</PageSection>
  </Page>
);

export default PageLayout;
