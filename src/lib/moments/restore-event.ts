import type { TimelineMoment } from "@/lib/moments/timeline";

export const MOMENT_RESTORED_EVENT = "moment-keeper:moment-restored";

export type MomentRestoredEvent = CustomEvent<TimelineMoment>;
