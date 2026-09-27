import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const HIDDEN_ATTRIBUTE = "data-sd-caret-hidden";

interface CaretHost {
  showCaret: boolean;
}

/**
 * Hide the caret by marking the element that ends the document with
 * `data-sd-caret-hidden`, and report whether the container should keep its
 * caret classes.
 */
export const useCaretHost = (
  shouldHideCaret: boolean,
  containerRef: RefObject<HTMLDivElement | null>
): CaretHost => {
  const caretHostRef = useRef<Element | null>(null);

  // Only the client can mark the caret's host, so server markup leaves the
  // caret off the container whenever it should be hidden. The first client
  // render reads the same flag, which keeps hydration matching.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Hiding the caret by toggling a class or custom property on the container
  // invalidates style for the whole document, tens of milliseconds on a long
  // one, every time the last block changes kind. The attribute sits in the
  // rightmost compound of the caret selector, so only the marked element
  // recalculates. The host is whatever element ends the document, which may
  // come from a consumer's renderer, so it is marked after the commit rather
  // than rendered with a marker.
  useLayoutEffect(() => {
    const updateHost = () => {
      const host = shouldHideCaret
        ? (containerRef.current?.lastElementChild ?? null)
        : null;
      const marked = caretHostRef.current;
      if (marked === host) {
        return;
      }
      marked?.removeAttribute(HIDDEN_ATTRIBUTE);
      host?.setAttribute(HIDDEN_ATTRIBUTE, "");
      caretHostRef.current = host;
    };
    updateHost();
    const container = containerRef.current;
    if (!(container && shouldHideCaret)) {
      return;
    }
    // Lazy/custom renderers can replace the host without rerendering Streamdown.
    const observer = new MutationObserver(updateHost);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  });

  return { showCaret: hydrated || !shouldHideCaret };
};
