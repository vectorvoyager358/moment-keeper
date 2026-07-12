"use client";

import { useActionState, useState } from "react";

import { updateProfileName } from "@/app/settings/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldHint, Input, Label } from "@/components/ui/Input";
import {
  MAX_PROFILE_NAME_LENGTH,
  normalizeProfileName,
} from "@/lib/profile/validation";

type ProfileNameFormProps = {
  initialDisplayName: string;
  setup?: boolean;
};

const initialState = { error: undefined };

export function ProfileNameForm({
  initialDisplayName,
  setup = false,
}: ProfileNameFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileName,
    initialState,
  );
  const [value, setValue] = useState(initialDisplayName);

  const normalizedValue = normalizeProfileName(value);
  const normalizedInitial = normalizeProfileName(initialDisplayName);
  const hasChanges = normalizedValue !== normalizedInitial;
  const canSave = hasChanges && normalizedValue.length > 0;

  return (
    <form action={formAction} className="space-y-4">
      {setup ? <input type="hidden" name="setup" value="1" /> : null}

      <div className="space-y-2">
        <Label htmlFor="displayName" className="sr-only">
          Profile name
        </Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          required
          maxLength={MAX_PROFILE_NAME_LENGTH}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="name"
          placeholder="What should we call you?"
          aria-describedby="displayName-hint"
        />
        <FieldHint id="displayName-hint">
          Required. Up to {MAX_PROFILE_NAME_LENGTH} characters. Shown on your
          journal home.
        </FieldHint>
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <Button type="submit" disabled={pending || !canSave}>
        {pending ? "Saving…" : setup ? "Continue" : "Save name"}
      </Button>
    </form>
  );
}
