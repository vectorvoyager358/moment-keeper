"use client";

import { useEffect, useRef, useState } from "react";

import type { MomentDetail } from "@/lib/moments/queries";

import { EditMomentForm } from "@/components/moments/EditMomentForm";
import { MomentDetailView } from "@/components/moments/MomentDetailView";

type MomentDetailPanelProps = {
  moment: MomentDetail;
  earlierId: string | null;
  laterId: string | null;
};

export function MomentDetailPanel({
  moment,
  earlierId,
  laterId,
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
      <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-border bg-surface p-5 shadow-card sm:p-8">
        <EditMomentForm
          moment={moment}
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
      onEdit={() => {
        editingMomentRef.current = moment;
        setIsEditing(true);
      }}
    />
  );
}
