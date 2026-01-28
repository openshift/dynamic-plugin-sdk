import { Page, PageSection } from '@patternfly/react-core';
import type { ReactNode, PropsWithChildren, FC } from 'react';

type PageLayoutProps = PropsWithChildren<{
  header?: ReactNode;
}>;

const PageLayout: FC<PageLayoutProps> = ({ header, children }) => (
  <Page isContentFilled masthead={header}>
    <PageSection isFilled>{children}</PageSection>
  </Page>
);

export default PageLayout;
