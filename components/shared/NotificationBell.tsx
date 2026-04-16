"use client";

import { BellIcon } from "@/components/ui/icons/BellIcon";

interface NotificationBellProps {
  count?: number;
}

export function NotificationBell({ count = 0 }: NotificationBellProps) {
  return (
    <button
      aria-label={
        count > 0 ? `${count} unread notifications` : "Notifications"
      }
      className="relative p-2 rounded text-white hover:bg-white/5 motion-safe:transition-colors cursor-pointer focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
    >
      <BellIcon size={24} />
      {count > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
