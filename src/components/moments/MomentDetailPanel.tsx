"use client";

import { useState } from "react";

import type { MomentDetail } from "@/lib/moments/queries";

import { EditMomentForm } from "@/components/moments/EditMomentForm";
import { MomentDetailView } from "@/components/moments/MomentDetailView";

type MomentDetailPanelProps = {
  moment: MomentDetail;
};

export function MomentDetailPanel({ moment }: MomentDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <EditMomentForm moment={moment} onCancel={() => setIsEditing(false)} />
    );
  }

  return <MomentDetailView moment={moment} onEdit={() => setIsEditing(true)} />;
}
