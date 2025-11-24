"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ToggleRecurringButtonProps {
  id: string;
  isActive: boolean;
}

export function ToggleRecurringButton({
  id,
  isActive,
}: ToggleRecurringButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recurring/${id}/toggle`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error toggling recurring booking:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {isActive ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  );
}

