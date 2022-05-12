// This adds custom Jest matchers for working with the DOM
// https://github.com/testing-library/jest-dom#custom-matchers
import '@testing-library/jest-dom';

import type { AnyObject } from '../src/types/common';

jest.mock('react', () => ({
  ...jest.requireActual<AnyObject>('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

// Following APIs are not implemented in jsdom
// eslint-disable-next-line @typescript-eslint/no-empty-function
Element.prototype.scrollTo = () => {};
