export type HealthPayload = {
  status: "ok";
  timestamp: string;
  supabaseConfigured: boolean;
};

export function getHealthPayload(input: {
  supabaseConfigured: boolean;
  now?: Date;
}): HealthPayload {
  return {
    status: "ok",
    timestamp: (input.now ?? new Date()).toISOString(),
    supabaseConfigured: input.supabaseConfigured,
  };
}
