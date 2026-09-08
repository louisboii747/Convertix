"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
} from "react";

type TypingElementType =
  | "article"
  | "div"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "li"
  | "p"
  | "section"
  | "span";

interface TypingAnimationProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> {
  children?: string;
  words?: string[];
  className?: string;
  duration?: number;
  typeSpeed?: number;
  deleteSpeed?: number;
  delay?: number;
  pauseDelay?: number;
  loop?: boolean;
  as?: TypingElementType;
  startOnView?: boolean;
  startOnInteraction?: boolean;
  showCursor?: boolean;
  blinkCursor?: boolean;
  cursorStyle?: "line" | "block" | "underscore";
  reducedMotionText?: string;
  reserveSpace?: boolean;
}

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

export function TypingAnimation({
  children,
  words,
  className,
  duration = 100,
  typeSpeed,
  deleteSpeed,
  delay = 0,
  pauseDelay = 1000,
  loop = false,
  as = "span",
  startOnView = true,
  startOnInteraction = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = "line",
  reducedMotionText,
  reserveSpace = true,
  ...props
}: TypingAnimationProps) {
  const wordsToAnimate = useMemo(
    () => words ?? (children ? [children] : []),
    [words, children],
  );
  const firstWord = wordsToAnimate[0] ?? "";
  const lastWord = wordsToAnimate.at(-1) ?? "";
  const reservationText = useMemo(
    () =>
      wordsToAnimate.reduce(
        (longest, word) =>
          Array.from(word).length > Array.from(longest).length ? word : longest,
        "",
      ),
    [wordsToAnimate],
  );

  // Keep the complete server-rendered first phrase through hydration. Starting
  // from a full phrase avoids repainting the page's largest text block during
  // the initial LCP measurement window.
  const [displayedText, setDisplayedText] = useState(firstWord);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(
    Array.from(firstWord).length,
  );
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">(
    "pause",
  );
  const [isInView, setIsInView] = useState(!startOnView);
  const [interactionReady, setInteractionReady] = useState(!startOnInteraction);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const elementRef = useRef<HTMLElement | null>(null);
  const hasMultipleWords = wordsToAnimate.length > 1;
  const typingSpeed = typeSpeed ?? duration;
  const deletingSpeed = deleteSpeed ?? typingSpeed / 2;

  const animationSourceKey = useMemo(
    () => (words ? words.join("\u0000") : (children ?? "")),
    [words, children],
  );

  useEffect(() => {
    setDisplayedText(firstWord);
    setCurrentWordIndex(0);
    setCurrentCharIndex(Array.from(firstWord).length);
    setPhase("pause");
  }, [animationSourceKey, firstWord]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (!startOnView) {
      setIsInView(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.3 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!startOnInteraction) {
      setInteractionReady(true);
      return;
    }

    const activate = () => setInteractionReady(true);
    const options: AddEventListenerOptions = { passive: true, once: true };

    window.addEventListener("pointerdown", activate, options);
    window.addEventListener("scroll", activate, options);
    window.addEventListener("keydown", activate, { once: true });

    return () => {
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("scroll", activate);
      window.removeEventListener("keydown", activate);
    };
  }, [startOnInteraction]);

  const shouldStart =
    interactionReady &&
    !prefersReducedMotion &&
    (startOnView ? isInView : true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (shouldStart && wordsToAnimate.length > 0) {
      const timeoutDelay =
        delay > 0 &&
        currentWordIndex === 0 &&
        currentCharIndex === 0 &&
        phase === "typing"
          ? delay
          : phase === "typing"
            ? typingSpeed
            : phase === "deleting"
              ? deletingSpeed
              : pauseDelay;

      timeout = setTimeout(() => {
        const currentWord = wordsToAnimate[currentWordIndex] ?? "";
        const graphemes = Array.from(currentWord);

        switch (phase) {
          case "typing":
            if (currentCharIndex < graphemes.length) {
              setDisplayedText(
                graphemes.slice(0, currentCharIndex + 1).join(""),
              );
              setCurrentCharIndex(currentCharIndex + 1);
            } else if (hasMultipleWords || loop) {
              const isLastWord = currentWordIndex === wordsToAnimate.length - 1;
              if (!isLastWord || loop) setPhase("pause");
            }
            break;

          case "pause":
            setPhase("deleting");
            break;

          case "deleting":
            if (currentCharIndex > 0) {
              setDisplayedText(
                graphemes.slice(0, currentCharIndex - 1).join(""),
              );
              setCurrentCharIndex(currentCharIndex - 1);
            } else {
              const nextIndex = (currentWordIndex + 1) % wordsToAnimate.length;
              const nextWord = wordsToAnimate[nextIndex] ?? "";

              setCurrentWordIndex(nextIndex);
              setDisplayedText("");
              setCurrentCharIndex(0);
              setPhase(nextWord ? "typing" : "pause");
            }
            break;
        }
      }, timeoutDelay);
    }

    return () => {
      if (timeout !== null) clearTimeout(timeout);
    };
  }, [
    shouldStart,
    phase,
    currentCharIndex,
    currentWordIndex,
    wordsToAnimate,
    hasMultipleWords,
    loop,
    typingSpeed,
    deletingSpeed,
    pauseDelay,
    delay,
  ]);

  const currentWordGraphemes = Array.from(
    wordsToAnimate[currentWordIndex] ?? "",
  );
  const isComplete =
    !loop &&
    currentWordIndex === wordsToAnimate.length - 1 &&
    currentCharIndex >= currentWordGraphemes.length &&
    phase !== "deleting";
  const shouldShowCursor =
    interactionReady &&
    !prefersReducedMotion &&
    showCursor &&
    !isComplete &&
    (hasMultipleWords || loop || currentCharIndex < currentWordGraphemes.length);
  const visibleText = prefersReducedMotion
    ? (reducedMotionText ?? lastWord)
    : displayedText;

  const cursorCharacter =
    cursorStyle === "block" ? "▌" : cursorStyle === "underscore" ? "_" : "|";
  const Component = as as ElementType;

  return (
    <Component
      ref={elementRef}
      className={joinClassNames(
        "grid min-w-0",
        as === "span" && "w-full",
        reserveSpace && "typing-animation-reserved",
        className,
      )}
      data-reserve-text={
        reserveSpace
          ? `${reservationText}${showCursor ? cursorCharacter : ""}`
          : undefined
      }
      {...props}
    >
      <span className="col-start-1 row-start-1 min-w-0">
        {visibleText}
        {shouldShowCursor ? (
          <span
            aria-hidden="true"
            className={joinClassNames(
              "inline-block",
              blinkCursor && "animate-blink-cursor",
            )}
          >
            {cursorCharacter}
          </span>
        ) : null}
      </span>
    </Component>
  );
}
