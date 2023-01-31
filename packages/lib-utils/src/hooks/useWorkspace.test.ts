import { renderHook } from '@testing-library/react-hooks/native';
// import { act } from 'react-dom/test-utils';
import { useWorkspace } from './useWorkspace';
import TestRenderer from 'react-test-renderer';
const { act } = TestRenderer;

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn(),
}));

const WORKSPACE_KEY = 'sdk/active-workspace';

describe('useWorkspace', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('unset workspace should return null', () => {
    const { result } = renderHook(() => useWorkspace());
    const [data, _] = result.current;

    expect(data).toBeNull();
  });

  test('set workspace should return the activeWorkspace', () => {
    localStorage.setItem(WORKSPACE_KEY, 'platform-experience');
    const { result } = renderHook(() => useWorkspace());
    const [data, setter] = result.current;

    expect(data).toBe('platform-experience');
    expect(setter).toBeDefined();
  });

  test('updating workspace should return the activeWorkspace', () => {
    localStorage.setItem(WORKSPACE_KEY, 'platform-experience');
    const { result } = renderHook(() => useWorkspace());
    const [data, setter] = result.current;

    expect(data).toBe('platform-experience');

    act(() => {
      setter('openshift');
    });
    expect(localStorage.getItem(WORKSPACE_KEY)).toBe('openshift');
  });
});
