/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarOff, Plus, Repeat, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { IHoliday } from "@/models/Holiday";
import { getHolidays, createHoliday, deleteHoliday } from "@/service/Holiday";

/* Compact Ethiopian-calendar label (matches the capacity calendar's context). */
const ETHIOPIAN_MONTHS = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagume",
];
const ethLabel = (g: Date) => {
  if (!g || Number.isNaN(g.getTime())) return "";
  const gy = g.getFullYear();
  const afterNewYear =
    g.getMonth() + 1 > 9 || (g.getMonth() + 1 === 9 && g.getDate() > 10);
  const months = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5];
  let ny = new Date(gy, 8, 11);
  let doy = Math.floor((g.getTime() - ny.getTime()) / 86400000) + 1;
  let year = gy - 7;
  if (doy < 1) {
    ny = new Date(gy - 1, 8, 11);
    doy = Math.floor((g.getTime() - ny.getTime()) / 86400000) + 1;
    year = gy - 8;
  } else if (!afterNewYear) {
    year = gy - 8;
  }
  let m = 1;
  let d = doy;
  for (let i = 0; i < months.length; i += 1) {
    if (d <= months[i]) {
      m = i + 1;
      break;
    }
    d -= months[i];
  }
  return `${d} ${ETHIOPIAN_MONTHS[m - 1]} ${year}`;
};

// Parse a stored UTC-midnight marker into a stable local date for display.
const localFromIso = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);
const todayKey = new Date().toISOString().slice(0, 10);

export default function HolidayManager() {
  const [holidays, setHolidays] = useState<IHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setHolidays(await getHolidays());
    } catch {
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Pick a date first");
      return;
    }
    if (!name.trim()) {
      toast.error("Give the holiday a name");
      return;
    }
    setAdding(true);
    try {
      await createHoliday({ date, name: name.trim(), recurring });
      toast.success("Holiday added — the scheduler will skip it");
      setDate("");
      setName("");
      setRecurring(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to add holiday");
    } finally {
      setAdding(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteHoliday(id);
      toast.success("Holiday removed");
      setHolidays((h) => h.filter((x) => x.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to remove holiday");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form
        onSubmit={onAdd}
        className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-end"
      >
        <div className="space-y-1.5 sm:w-[170px]">
          <Label htmlFor="hol-date">Date</Label>
          <Input
            id="hol-date"
            type="date"
            value={date}
            min={todayKey}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="hol-name">Name</Label>
          <Input
            id="hol-name"
            placeholder="e.g. New Year, factory maintenance"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pb-2.5 sm:pb-2">
          <Switch
            id="hol-recurring"
            checked={recurring}
            onCheckedChange={setRecurring}
          />
          <Label
            htmlFor="hol-recurring"
            className="cursor-pointer whitespace-nowrap text-sm"
          >
            Repeat yearly
          </Label>
        </div>
        <Button type="submit" disabled={adding} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {adding ? "Adding…" : "Add"}
        </Button>
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-border bg-muted/40"
            />
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <CalendarOff className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium">No holidays set</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            The workshop runs every working day (Sunday off). Add a date to have
            the scheduler skip it.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {holidays.map((h) => {
            const d = localFromIso(h.date);
            const isPast = !h.recurring && h.date.slice(0, 10) < todayKey;
            return (
              <li
                key={h.id}
                className={`flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-foreground/20 ${isPast ? "opacity-55" : ""}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-500/10 text-rose-500">
                  <CalendarOff className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {h.name}
                    </span>
                    {h.recurring && (
                      <Badge
                        variant="secondary"
                        className="gap-1 px-1.5 py-0 text-[10px] font-medium"
                      >
                        <Repeat className="h-3 w-3" /> Yearly
                      </Badge>
                    )}
                    {isPast && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        past
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {d.toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <span className="mx-1.5 opacity-40">·</span>
                    <span className="font-mono">{ethLabel(d)} E.C.</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(h.id)}
                  disabled={deletingId === h.id}
                  aria-label={`Remove ${h.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
