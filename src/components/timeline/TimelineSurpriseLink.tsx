import Link from "next/link";
import { Shuffle } from "lucide-react";

import { buttonClassName } from "@/components/ui/Button";

export function TimelineSurpriseLink() {
  return (
    <div className="flex justify-center">
      <Link
        href="/timeline/surprise"
        className={buttonClassName({ variant: "secondary", size: "sm" })}
      >
        <Shuffle className="h-4 w-4" aria-hidden />
        Surprise me
      </Link>
    </div>
  );
}
