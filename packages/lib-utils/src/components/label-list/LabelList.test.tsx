import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import type { LabelListProps } from './LabelList';
import { LabelList } from './LabelList';

const mockLabels: LabelListProps = {
  labels: {
    'test-label1': 'test-value1',
    'test-label2': 'test-value2',
  },
  icon: <InfoCircleIcon />,
  color: 'grey',
};

describe('Label list', () => {
  test('Labels are rendered', () => {
    render(
      <LabelList labels={mockLabels.labels} icon={mockLabels.icon} color={mockLabels.color} />,
    );

    expect(screen.getByText('test-label1=test-value1')).toBeTruthy();
    expect(screen.getByText('test-label2=test-value2')).toBeTruthy();
  });
});
