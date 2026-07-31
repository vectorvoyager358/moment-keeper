"use client";

import { useEffect, useRef, useState } from "react";

import type { MomentDetail } from "@/lib/moments/queries";

import { EditMomentForm } from "@/components/moments/EditMomentForm";
import { MomentDetailView } from "@/components/moments/MomentDetailView";

type MomentDetailPanelProps = {
  moment: MomentDetail;
  earlierId: string | null;
  laterId: string | null;
  backHref?: string;
  backLabel?: string;
};

export function MomentDetailPanel({
  moment,
  earlierId,
  laterId,
  backHref,
  backLabel,
}: MomentDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [waitingForSavedMoment, setWaitingForSavedMoment] = useState(false);
  const editingMomentRef = useRef(moment);

  useEffect(() => {
    if (waitingForSavedMoment && moment !== editingMomentRef.current) {
      setWaitingForSavedMoment(false);
      setIsEditing(false);
    }
  }, [moment, waitingForSavedMoment]);

  if (isEditing) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl bg-surface p-5 shadow-card ring-1 ring-border/60 sm:p-8">
        <EditMomentForm
          moment={moment}
          returnTo={backHref}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setWaitingForSavedMoment(true)}
        />
      </div>
    );
  }

  return (
    <MomentDetailView
      moment={moment}
      earlierId={earlierId}
      laterId={laterId}
      backHref={backHref}
      backLabel={backLabel}
      onEdit={() => {
        editingMomentRef.current = moment;
        setIsEditing(true);
      }}
    />
  );
}
