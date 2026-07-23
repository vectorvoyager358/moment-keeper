"use client";

import { useState } from "react";

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

  if (isEditing) {
    return (
      <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-border bg-surface p-5 shadow-card sm:p-8">
        <EditMomentForm
          moment={moment}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <MomentDetailView
      moment={moment}
      earlierId={earlierId}
      laterId={laterId}
      onEdit={() => setIsEditing(true)}
    />
  );
}
