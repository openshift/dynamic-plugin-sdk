import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import React from 'react';
import type { K8sResourceCommon } from '../../index';
import { ResourceSummary } from './index';

const k8Object: K8sResourceCommon = {
  apiVersion: 'v1beta1',
  apiGroup: 'tenancy.kcp.dev',
  kind: 'Workspace',
  metadata: {
    name: 'demo-workspace',
    labels: {
      label1: 'value1',
      label2: 'value2',
    },
    creationTimestamp: '2022-09-15T21:07:32Z',
    ownerReferences: [
      {
        name: 'owner1',
        apiVersion: 'apps/v1',
        kind: 'StatefulSet',
        uid: '8f5ce882-4a20-47da-ad6a-16d0c4846405',
      },
      {
        name: 'owner2',
        apiVersion: 'apps/v1',
        kind: 'StatefulSet',
        uid: '8f5ce882-4a20-47da-ad6a-16d0c4846406',
      },
    ],
  },
};

describe('ResourceSummary', () => {
  it('is accessible', async () => {
    const { container } = render(<ResourceSummary resource={k8Object} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('is accessible - loading', async () => {
    const { container } = render(<ResourceSummary loaded={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('displays data', () => {
    const { container } = render(
      <ResourceSummary resource={k8Object}>
        <dt>My custom label</dt>
        <dd>My custom value</dd>
      </ResourceSummary>,
    );
    expect(screen.getByText('demo-workspace')).toBeInTheDocument();
    expect(screen.getByText('label1=value1')).toBeInTheDocument();
    expect(screen.getByText('2022-09-15T21:07:32Z')).toBeInTheDocument();
    expect(screen.getByText('owner1')).toBeInTheDocument();
    expect(screen.getByText('owner2')).toBeInTheDocument();

    expect(screen.getByText('My custom label')).toBeInTheDocument();
    expect(screen.getByText('My custom value')).toBeInTheDocument();

    expect(screen.queryByText('Namespace')).not.toBeInTheDocument();
    expect(screen.queryByText('No owner')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.pf-v5-c-skeleton').length).toEqual(0);
  });

  it('displays with missing owner', () => {
    const k8Object2: K8sResourceCommon = {
      apiVersion: 'v1beta1',
      apiGroup: 'tenancy.kcp.dev',
      kind: 'Workspace',
      metadata: {
        name: 'demo-workspace',
      },
    };

    render(<ResourceSummary resource={k8Object2} />);
    expect(screen.getByText('No owner')).toBeInTheDocument();
  });

  it('displays skeletons when loading', () => {
    const k8Object2: K8sResourceCommon = {
      apiVersion: 'v1beta1',
      apiGroup: 'tenancy.kcp.dev',
      kind: 'Workspace',
      metadata: {
        name: 'demo-workspace',
      },
    };

    const { container } = render(<ResourceSummary resource={k8Object2} loaded={false} />);
    expect(screen.queryByText('demo-workspace')).not.toBeInTheDocument();
    expect(screen.getByText('Loading Name')).toBeInTheDocument();
    expect(screen.getByText('Loading Labels')).toBeInTheDocument();
    expect(container.querySelectorAll('.pf-v5-c-skeleton').length).toBeGreaterThan(0);
  });
});
