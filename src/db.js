import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "./supabase";

// ── Field name mapping: UI (camelCase) ↔ DB (snake_case) ──────
const SNAKE = {
  startTime: "start_time",
  startDate: "start_date",
  clientId: "client_id",
  lastContact: "last_contact",
  ref: "ref_range",
  pagesRead: "pages_read",
  desc: "descr",
};
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([k, v]) => [v, k]));

// Date-like fields that may be empty in the UI
const NULLABLE_DATES = new Set(["due", "startDate", "lastContact"]);
// UI-only fields that must never be sent to the database
const UI_ONLY = new Set(["expanded"]);
// UUID FK fields that may be empty in the UI
const NULLABLE_UUIDS = new Set(["clientId"]);

const rowIn = (r) => {
  const o = {};
  for (const [k, v] of Object.entries(r)) {
    if (k === "user_id" || k === "created_at") continue;
    const key = CAMEL[k] || k;
    o[key] = v === null && (NULLABLE_DATES.has(key) || key === "date") ? "" : v;
  }
  return o;
};

const rowOut = (r) => {
  const o = {};
  for (const [k, v] of Object.entries(r)) {
    if (k === "createdAt" || k === "userId") continue;
    if (UI_ONLY.has(k)) continue;
    if (k === "date" && v === "") continue; // let DB default apply
    const key = SNAKE[k] || k;
    o[key] = (NULLABLE_DATES.has(k) || NULLABLE_UUIDS.has(k)) && v === "" ? null : v;
  }
  return o;
};

// ── useSyncedState: drop-in useState replacement that syncs ───
// Local-first: UI updates instantly, changes flush to Supabase
// after 600ms of inactivity. Realtime reloads on remote changes.
export function useSyncedState(table) {
  const [rows, setRows] = useState([]);
  const rowsRef = useRef([]);
  const syncedRef = useRef([]);
  const dirty = useRef(false);
  const timer = useRef(null);

  const flushNow = async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    const base = syncedRef.current;
    const cur = rowsRef.current;
    dirty.current = false;
    syncedRef.current = cur;
    const baseMap = new Map(base.map((r) => [r.id, r]));
    const curIds = new Set(cur.map((r) => r.id));
    const inserts = cur.filter((r) => !baseMap.has(r.id));
    const updates = cur.filter((r) => {
      const b = baseMap.get(r.id);
      return b && JSON.stringify(b) !== JSON.stringify(r);
    });
    const dels = base.filter((r) => !curIds.has(r.id)).map((r) => r.id);
    let failed = false;
    try {
      if (inserts.length) {
        const { error } = await supabase.from(table).insert(inserts.map(rowOut));
        if (error) { console.error("insert", table, error); failed = true; }
      }
      for (const u of updates) {
        const { id, ...rest } = rowOut(u);
        const { error } = await supabase.from(table).update(rest).eq("id", u.id);
        if (error) { console.error("update", table, error); failed = true; }
      }
      if (dels.length) {
        const { error } = await supabase.from(table).delete().in("id", dels);
        if (error) { console.error("delete", table, error); failed = true; }
      }
    } catch (e) {
      console.error("sync failed", table, e);
      failed = true;
    }
    if (failed) {
      // keep changes locally and retry on the next edit / tab switch
      syncedRef.current = base;
      dirty.current = true;
    }
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) { console.error("load", table, error); return; }
      if (alive && data && !dirty.current) {
        const rs = data.map(rowIn);
        rowsRef.current = rs;
        syncedRef.current = rs;
        setRows(rs);
      }
    };
    load();

    const ch = supabase
      .channel("rt-" + table + "-" + Math.random().toString(36).slice(2, 8))
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (!dirty.current) load();
      })
      .subscribe();

    const onHide = () => { if (dirty.current) flushNow(); };
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      alive = false;
      if (dirty.current) flushNow();
      supabase.removeChannel(ch);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const set = (updater) => {
    const next = typeof updater === "function" ? updater(rowsRef.current) : updater;
    rowsRef.current = next;
    setRows(next);
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(flushNow, 600);
  };

  return [rows, set];
}

// ── Health: three tables behind one {weight, bp, tests} object ─
export function useHealthData() {
  const [weight, setWeight] = useSyncedState("weight_logs");
  const [bp, setBp] = useSyncedState("bp_logs");
  const [tests, setTests] = useSyncedState("test_results");
  const data = useMemo(() => ({ weight, bp, tests }), [weight, bp, tests]);
  const setData = (up) => {
    const next = typeof up === "function" ? up({ weight, bp, tests }) : up;
    if (next.weight !== weight) setWeight(next.weight);
    if (next.bp !== bp) setBp(next.bp);
    if (next.tests !== tests) setTests(next.tests);
  };
  return [data, setData];
}

// ── Nutrition: flat meals table behind days[{date, meals[]}] ───
const groupMeals = (meals) => {
  const m = {};
  for (const meal of meals) {
    (m[meal.date] = m[meal.date] || { id: meal.date, date: meal.date, meals: [] }).meals.push(meal);
  }
  return Object.values(m);
};

export function useNutritionDays() {
  const [meals, setMeals] = useSyncedState("meals");
  const days = useMemo(() => groupMeals(meals), [meals]);
  const setDays = (up) => {
    setMeals((prev) => {
      const cur = groupMeals(prev);
      const next = typeof up === "function" ? up(cur) : up;
      return next.flatMap((d) => d.meals.map((x) => ({ ...x, date: d.date })));
    });
  };
  return [days, setDays];
}

// ── Media: one table, three views (books / movies / games) ─────
const MEDIA_KIND = { knygos: "book", filmai: "movie", zaidimai: "game" };

export function useMediaItems(moduleId) {
  const kind = MEDIA_KIND[moduleId];
  const [all, setAll] = useSyncedState("media_items");

  const dec = (i) =>
    kind === "book" ? { ...i, author: i.creator }
    : kind === "movie" ? { ...i, director: i.creator }
    : i;

  const strip = (i) => {
    const { author, director, ...rest } = i;
    return { ...rest, kind, creator: author ?? director ?? i.creator ?? "" };
  };

  const items = useMemo(
    () => all.filter((i) => i.kind === kind).map(dec),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, kind]
  );

  const setItems = (up) => {
    setAll((prev) => {
      const mine = prev.filter((i) => i.kind === kind).map(dec);
      const others = prev.filter((i) => i.kind !== kind);
      const next = typeof up === "function" ? up(mine) : up;
      return [...others, ...next.map(strip)];
    });
  };

  return [items, setItems];
}
