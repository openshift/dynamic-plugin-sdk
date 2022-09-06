import { render, screen } from '@testing-library/react';
import * as React from 'react';
import type { K8sResourceCommon } from '../../types/k8s';
import type { DetailsItemProps } from './DetailsItem';
import { DetailsItem } from './DetailsItem';

const workspaceObj: K8sResourceCommon = {
  apiVersion: 'v1beta1',
  apiGroup: 'tenancy.kcp.dev',
  kind: 'Workspace',
  metadata: {
    name: 'Test Workspace',
  },
  spec: {},
};

const mockDetails: DetailsItemProps = {
  title: 'Name',
  titleLabel: {
    name: 'Service Preview',
  },
  obj: workspaceObj,
  path: 'metadata.name',
  hideEmpty: true,
};

describe('Details Item', () => {
  test('Details for workspace name are rendered', () => {
    render(
      <DetailsItem
        title={mockDetails.title}
        titleLabel={mockDetails.titleLabel}
        obj={mockDetails.obj}
        path={mockDetails.path}
        hideEmpty
      />,
    );

    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Test Workspace')).toBeTruthy();
    expect(screen.getByText('Service Preview')).toBeTruthy();
  });

  test('When attribute value is not found the component is not rendered (hideEmpty: true)', () => {
    const { container } = render(
      <DetailsItem title="Type" obj={workspaceObj} path="spec.type.name" hideEmpty />,
    );

    expect(container.childElementCount).toEqual(0);
  });

  test('Value for attribute is rendered as a custom component', () => {
    const CustomValueComponent: React.FC = () => {
      return <p>Universal</p>;
    };
    render(
      <DetailsItem title="Type" obj={workspaceObj}>
        <CustomValueComponent />
      </DetailsItem>,
    );

    expect(screen.getByText('Universal')).toBeTruthy();
  });
});
