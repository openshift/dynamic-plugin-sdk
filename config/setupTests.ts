import '@testing-library/jest-dom';

jest.mock('react', () => {
  const originalModule = jest.requireActual('react');

  return {
    __esModule: true,
    ...originalModule,
    useLayoutEffect: jest.requireActual('react').useEffect,
  };
});
Element.prototype.scrollTo = () => {};
