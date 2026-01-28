import { useEffect } from 'react';

export const useEventListener = (
  eventTarget: EventTarget,
  event: keyof WindowEventMap,
  cb: EventListener,
) => {
  useEffect(() => {
    eventTarget.addEventListener(event, cb);
    return () => eventTarget.removeEventListener(event, cb);
  }, [cb, event, eventTarget]);
};
