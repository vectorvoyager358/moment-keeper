"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type JournalGreetingProps = {
  name: string;
};

const greetingClassName =
  "font-script text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.035em] text-accent sm:text-[3.5rem] lg:text-[4rem]";

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  if (typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function JournalGreetingStatic({ text }: { text: string }) {
  return (
    <p className={greetingClassName} aria-label={text}>
      <span aria-hidden="true">{text}</span>
    </p>
  );
}

function JournalGreetingAnimated({ text }: { text: string }) {
  const [visible, setVisible] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisible(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
        setDone(true);
      }
    }, 55);

    return () => {
      window.clearInterval(timer);
    };
  }, [text]);

  return (
    <p className={greetingClassName} aria-label={text}>
      <span aria-hidden="true">
        {visible}
        {!done ? (
          <span className="ml-0.5 inline-block w-0.5 animate-pulse text-accent/70">
            |
          </span>
        ) : null}
      </span>
    </p>
  );
}

export function JournalGreeting({ name }: JournalGreetingProps) {
  const text = `Hi ${name}`;
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  if (reducedMotion) {
    return <JournalGreetingStatic text={text} />;
  }

  return <JournalGreetingAnimated key={text} text={text} />;
}
