// This adds custom Jest matchers for working with the DOM
// https://github.com/testing-library/jest-dom#custom-matchers
import '@testing-library/jest-dom';

import { toHaveNoViolations } from 'jest-axe';
import { noop } from 'lodash';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

// Following APIs are not implemented in jsdom
Element.prototype.scrollTo = noop;
