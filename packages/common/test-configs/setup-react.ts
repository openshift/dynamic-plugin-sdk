import '@testing-library/jest-dom';

jest.mock('react', () => {
  const originalModule = jest.requireActual('react');

  return {
    __esModule: true,
    ...originalModule,
    useLayoutEffect: jest.requireActual('react').useEffect,
  };
});

// Following APIs are not implemented in jsdom
// eslint-disable-next-line @typescript-eslint/no-empty-function
Element.prototype.scrollTo = () => {};
