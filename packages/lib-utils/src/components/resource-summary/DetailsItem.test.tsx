import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import React from 'react';
import type { K8sResourceCommon } from '../../index';
import { DetailsItem } from './index';

// This is the default value set in the details-item.tsx
const defaultValue = '-';

const k8Object: K8sResourceCommon = {
  apiVersion: 'v1beta1',
  apiGroup: 'tenancy.kcp.dev',
  kind: 'Workspace',
  metadata: {
    name: 'demo_ws1',
  },
};

describe('DetailsItem', () => {
  it('Is accessible', async () => {
    const customDefault = 'myDefaultValue';
    const { container } = render(
      <dl>
        <DetailsItem label="myLabel" defaultValue={customDefault} />
      </dl>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Is accessible loading', async () => {
    const { container } = render(
      <dl>
        <DetailsItem label="myLabel" loaded={false} />
      </dl>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Displays correct value', () => {
    it('Children', () => {
      render(
        <DetailsItem label="myLabel" resource={k8Object} defaultValue="Do not show" hideEmpty>
          Hello world
        </DetailsItem>,
      );
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.queryByText(defaultValue)).not.toBeInTheDocument();
      expect(screen.queryByText('Do not show')).not.toBeInTheDocument();
    });

    it('Default value - no values passed', () => {
      render(<DetailsItem label="myLabel" />);
      expect(screen.getByText(defaultValue)).toBeInTheDocument();
    });

    it('Default value - undefined obj', () => {
      render(<DetailsItem label="myLabel" />);
      expect(screen.getByText(defaultValue)).toBeInTheDocument();
    });

    it('Default value - wrong path', () => {
      render(<DetailsItem label="myLabel" resource={k8Object} path="wrong.path" />);
      expect(screen.getByText(defaultValue)).toBeInTheDocument();
    });

    it('Custom default value', () => {
      const customDefault = 'myDefaultValue';
      render(<DetailsItem label="myLabel" defaultValue={customDefault} />);
      expect(screen.getByText(customDefault)).toBeInTheDocument();
      expect(screen.queryByText(defaultValue)).not.toBeInTheDocument();
    });

    it('K8s object', () => {
      render(<DetailsItem label="myLabel" resource={k8Object} path="metadata.name" hideEmpty />);
      expect(screen.getByText('demo_ws1')).toBeInTheDocument();
      expect(screen.queryByText(defaultValue)).not.toBeInTheDocument();
    });

    it('empty if hideEmpty', () => {
      const { container } = render(<DetailsItem label="myLabel" hideEmpty />);
      expect(container).toBeEmptyDOMElement();
    });

    it('Show skeleton if is loading', () => {
      const customDefault = 'myDefaultValue';
      const { container } = render(
        <DetailsItem label="myLabel" defaultValue={customDefault} loaded={false} />,
      );
      expect(screen.getByText('myLabel')).toBeInTheDocument();
      expect(screen.queryByText(customDefault)).not.toBeInTheDocument();
      expect(container.querySelector('.pf-v5-c-skeleton')).toBeInTheDocument();
    });
  });
});
