import { render, screen } from '@testing-library/react';
import { toHaveNoViolations, axe } from 'jest-axe';
import React from 'react';
import '@testing-library/jest-dom';

import { DetailsItemList } from './index';

expect.extend(toHaveNoViolations);

describe('DetailsItemList', () => {
  it('Is accessible', async () => {
    const { container } = render(
      <DetailsItemList>
        <dt>Hello</dt>
        <dd>world</dd>
      </DetailsItemList>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Adds a dl around children', () => {
    const { container } = render(
      <DetailsItemList>
        <dd>Hello</dd>
        <dt>world</dt>
      </DetailsItemList>,
    );
    expect(container.querySelector('dl')).toBeInTheDocument();
    // ensure that children are shown
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
