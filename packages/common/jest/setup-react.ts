// This adds custom Jest matchers for working with the DOM
// https://github.com/testing-library/jest-dom#custom-matchers
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { noop } from 'lodash';

configure({ testIdAttribute: 'data-test-id' });

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

// Following APIs are not implemented in jsdom
Element.prototype.scrollTo = noop;
