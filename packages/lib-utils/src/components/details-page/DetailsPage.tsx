import React from 'react';
import type { DetailsPageHeaderProps } from '../details-page-header';
import { DetailsPageHeader } from '../details-page-header';
import type { HorizontalNavProps } from '../horizontal-nav';
import { withRouter, HorizontalNav } from '../horizontal-nav';

export type DetailsPageProps = HorizontalNavProps & DetailsPageHeaderProps;

export const DetailsPage = withRouter<DetailsPageProps>(
  ({ ariaLabel, tabs, breadcrumbs, actionButtons, actionMenu, pageHeading, obj }) => {
    return (
      <>
        <DetailsPageHeader
          breadcrumbs={breadcrumbs}
          actionButtons={actionButtons}
          actionMenu={actionMenu}
          pageHeading={pageHeading}
          obj={obj}
        />
        <HorizontalNav ariaLabel={ariaLabel} tabs={tabs} />
      </>
    );
  },
);
