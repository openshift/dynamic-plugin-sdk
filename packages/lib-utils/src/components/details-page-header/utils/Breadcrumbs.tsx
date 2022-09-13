import { v4 as uuidv4 } from 'uuid';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import React from 'react';
import { Link } from 'react-router-dom';

export type BreadcrumbProp = { name: string; path: string; uuid?: string; id?: string };

export type BreadcrumbsProps = {
  breadcrumbs: BreadcrumbProp[];
};

export const Breadcrumbs: React.SFC<BreadcrumbsProps> = ({ breadcrumbs }) => {
  const [crumbs, setCrumbs] = React.useState<BreadcrumbProp[]>([]);

  const addUUID = (allData: BreadcrumbProp[]) => {
    return allData.map((item: BreadcrumbProp) => ({
      ...item,
      uuid: item.uuid || item.id || uuidv4(),
    }));
  };

  React.useEffect(() => {
    setCrumbs(addUUID(breadcrumbs));
  }, [breadcrumbs]);

  return (
    <Breadcrumb>
      {crumbs.map((crumb, i, { length }) => {
        const isLast = i === length - 1;

        return (
          <BreadcrumbItem key={crumb.uuid} isActive={isLast}>
            {isLast ? (
              crumb.name
            ) : (
              <Link
                className="pf-c-breadcrumb__link"
                to={crumb.path}
                data-testid={`breadcrumb-link-${i}`}
              >
                {crumb.name}
              </Link>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

export default Breadcrumbs;
