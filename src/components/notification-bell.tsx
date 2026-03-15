"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  createdAt: Date;
};

const POLL_INTERVAL = 30000;

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [, startTransition] = useTransition();

  async function fetchNotifications() {
    try {
      const data = await getUnreadNotifications();
      setCount(data.count);
      setItems(data.items as NotificationItem[]);
    } catch {
      // Silently fail
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setCount((prev) => Math.max(0, prev - 1));
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setItems([]);
      setCount(0);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Benachrichtigungen</p>
          {count > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Alle gelesen
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Keine neuen Benachrichtigungen
          </div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-1 p-3" asChild>
              {n.link ? (
                <Link href={n.link} onClick={() => handleMarkRead(n.id)}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: de })}
                  </p>
                </Link>
              ) : (
                <div onClick={() => handleMarkRead(n.id)}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: de })}
                  </p>
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
