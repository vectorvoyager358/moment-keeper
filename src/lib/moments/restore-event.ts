import type { TimelineMoment } from "@/lib/moments/timeline";
import { restoreMomentToOnThisDayView } from "@/lib/moments/view-cache";

export const MOMENT_RESTORED_EVENT = "moment-keeper:moment-restored";

export type MomentRestoredEvent = CustomEvent<TimelineMoment>;

const pendingRestoredMoments = new Map<string, TimelineMoment>();

export function announceRestoredMoment(moment: TimelineMoment): void {
  restoreMomentToOnThisDayView(moment);
  pendingRestoredMoments.set(moment.id, moment);
  window.dispatchEvent(
    new CustomEvent(MOMENT_RESTORED_EVENT, { detail: moment }),
  );
}

export function subscribeToRestoredMoments(
  listener: (moment: TimelineMoment) => void,
): () => void {
  let active = true;
  const handleRestoredMoment = (event: Event) => {
    const moment = (event as MomentRestoredEvent).detail;

    if (!moment) {
      return;
    }

    pendingRestoredMoments.delete(moment.id);
    listener(moment);
  };

  window.addEventListener(MOMENT_RESTORED_EVENT, handleRestoredMoment);

  const pending = [...pendingRestoredMoments.values()];
  pendingRestoredMoments.clear();
  queueMicrotask(() => {
    if (active) {
      pending.forEach(listener);
    }
  });

  return () => {
    active = false;
    window.removeEventListener(MOMENT_RESTORED_EVENT, handleRestoredMoment);
  };
}
