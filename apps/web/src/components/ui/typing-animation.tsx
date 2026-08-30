"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefAttributes,
  type RefObject,
} from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type DOMMotionComponents,
  type HTMLMotionProps,
  type MotionProps,
} from "motion/react";

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const;

type MotionElementType = Extract<
  keyof DOMMotionComponents,
  keyof typeof motionElements
>;

type TypingAnimationMotionComponent = ComponentType<
  Omit<HTMLMotionProps<"span">, "ref"> & RefAttributes<HTMLElement>
>;

interface TypingAnimationProps extends Omit<MotionProps, "children"> {
  children?: string;
  words?: string[];
  className?: string;
  duration?: number;
  typeSpeed?: number;
  deleteSpeed?: number;
  delay?: number;
  pauseDelay?: number;
  loop?: boolean;
  as?: MotionElementType;
  startOnView?: boolean;
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
  as: Component = "span",
  startOnView = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = "line",
  reducedMotionText,
  reserveSpace = true,
  ...props
}: TypingAnimationProps) {
  const MotionComponent = motionElements[
    Component
  ] as TypingAnimationMotionComponent;

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

  // Rendering the first phrase initially keeps the server-rendered/no-JS hero
  // complete. Hydration then resets the visual line and begins the animation.
  const [displayedText, setDisplayedText] = useState(firstWord);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");
  const [animationReady, setAnimationReady] = useState(false);

  const elementRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(elementRef as RefObject<Element>, {
    amount: 0.3,
    once: true,
  });
  const prefersReducedMotion = useReducedMotion();

  const hasMultipleWords = wordsToAnimate.length > 1;
  const typingSpeed = typeSpeed ?? duration;
  const deletingSpeed = deleteSpeed ?? typingSpeed / 2;
  const shouldStart =
    animationReady && !prefersReducedMotion && (startOnView ? isInView : true);

  const animationSourceKey = useMemo(
    () => (words ? words.join("\u0000") : (children ?? "")),
    [words, children],
  );

  useEffect(() => {
    const resetTimeout = window.setTimeout(() => {
      setDisplayedText("");
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);
      setPhase("typing");
      setAnimationReady(true);
    }, 0);

    return () => window.clearTimeout(resetTimeout);
  }, [animationSourceKey]);

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

              if (!isLastWord || loop) {
                setPhase("pause");
              }
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

              setCurrentWordIndex(nextIndex);
              setPhase("typing");
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
    animationReady &&
    !prefersReducedMotion &&
    showCursor &&
    !isComplete &&
    (hasMultipleWords ||
      loop ||
      currentCharIndex < currentWordGraphemes.length);
  const visibleText = prefersReducedMotion
    ? (reducedMotionText ?? lastWord)
    : displayedText;

  const cursorCharacter =
    cursorStyle === "block" ? "▌" : cursorStyle === "underscore" ? "_" : "|";

  return (
    <MotionComponent
      ref={elementRef}
      className={joinClassNames(
        "grid min-w-0",
        Component === "span" && "w-full",
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
    </MotionComponent>
  );
}
