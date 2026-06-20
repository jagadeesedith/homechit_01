import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Users } from "lucide-react";

interface Member {
  id: string;
}

interface RadialMemberDialProps {
  sortedMembers: Member[];
  maxMemberNumber: number;
  openMember: (memberId: string) => void;
  handleActiveGroupChange: (groupStart: number | null) => void;
  selectMode: boolean;
}

interface WheelItem {
  label: string;
  value: number;
}

type Phase = "idle" | "wheel" | "group-locked";

interface GestureState {
  phase: Phase;
  showingRing: "A" | "B";
  drillGroupStart: number | null;
  highlightedIndex: number | null;
  centerX: number;
  centerY: number;
}

const BTN_SIZE = 84;
const BTN_RADIUS = BTN_SIZE / 2;
const RING_A_INNER = BTN_RADIUS;
const RING_A_OUTER = 92;
const RING_B_INNER = 98;
const RING_B_OUTER = 148;
const MAX_R = RING_B_OUTER;
const HOLD_MS = 550;
const SVG_SIZE = MAX_R;

function polarToSVG(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlice(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
) {
  const outerS = polarToSVG(cx, cy, rOuter, startDeg);
  const outerE = polarToSVG(cx, cy, rOuter, endDeg);
  const innerE = polarToSVG(cx, cy, rInner, endDeg);
  const innerS = polarToSVG(cx, cy, rInner, startDeg);
  const span = endDeg - startDeg;
  const large = span > 180 ? 1 : 0;
  return [
    `M ${outerS.x} ${outerS.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${outerE.x} ${outerE.y}`,
    `L ${innerE.x} ${innerE.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${innerS.x} ${innerS.y}`,
    "Z",
  ].join(" ");
}

function pointerAngleDeg(dx: number, dy: number) {
  let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (a < 0) a += 360;
  return a;
}

export function RadialMemberDial({
  sortedMembers,
  maxMemberNumber,
  openMember,
  handleActiveGroupChange,
  selectMode,
}: RadialMemberDialProps) {
  const [gesture, setGesture] = useState<GestureState>({
    phase: "idle",
    showingRing: "A",
    drillGroupStart: null,
    highlightedIndex: null,
    centerX: 0,
    centerY: 0,
  });

  const gRef = useRef(gesture);
  gRef.current = gesture;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {
      return !!localStorage.getItem("radial-dial-hint-shown");
    } catch {
      return false;
    }
  });

  const groups = useMemo(() => {
    const gs: { start: number; end: number; label: string }[] = [];
    for (let s = 1; s <= maxMemberNumber; s += 10) {
      const e = Math.min(s + 9, maxMemberNumber);
      gs.push({ start: s, end: e, label: `${s}-${e}` });
    }
    return gs;
  }, [maxMemberNumber]);

  const getMembersInGroup = useCallback(
    (start: number) => {
      const end = start + 9;
      return sortedMembers
        .filter((m) => {
          const n = Number(m.id);
          return Number.isFinite(n) && n >= start && n <= end;
        })
        .map((m) => ({ id: m.id, number: Number(m.id) }))
        .sort((a, b) => a.number - b.number);
    },
    [sortedMembers],
  );

  const wheelItemsA: WheelItem[] = useMemo(
    () => groups.map((g) => ({ label: g.label, value: g.start })),
    [groups],
  );

  const drillGroupMembers = useMemo(() => {
    if (gesture.drillGroupStart === null) return [];
    return getMembersInGroup(gesture.drillGroupStart);
  }, [gesture.drillGroupStart, getMembersInGroup]);

  const wheelItemsB: WheelItem[] = useMemo(
    () => drillGroupMembers.map((m) => ({ label: m.id, value: m.number })),
    [drillGroupMembers],
  );

  const dismissHint = useCallback(() => {
    if (!hintDismissed) {
      setHintDismissed(true);
      try {
        localStorage.setItem("radial-dial-hint-shown", "true");
      } catch {}
    }
  }, [hintDismissed]);

  const resetGesture = useCallback(() => {
    setGesture({
      phase: "idle",
      showingRing: "A",
      drillGroupStart: null,
      highlightedIndex: null,
      centerX: 0,
      centerY: 0,
    });
  }, []);

  const getButtonCenter = useCallback(() => {
    if (!buttonRef.current) return { x: 0, y: 0 };
    const r = buttonRef.current.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (holdTimer.current) clearTimeout(holdTimer.current);
      const btn = buttonRef.current;
      if (btn) btn.setPointerCapture(e.pointerId);

      const center = getButtonCenter();
      if (center.x === 0 && center.y === 0) return;

      if (gRef.current.phase === "group-locked") {
        const lockedStart = gRef.current.drillGroupStart;
        if (lockedStart !== null) {
          holdTimer.current = setTimeout(() => {
            const members = getMembersInGroup(lockedStart);
            if (members.length > 0) {
              setGesture({
                phase: "wheel",
                showingRing: "B",
                drillGroupStart: lockedStart,
                highlightedIndex: null,
                centerX: center.x,
                centerY: center.y,
              });
            }
          }, HOLD_MS);
        }
        return;
      }

      holdTimer.current = setTimeout(() => {
        const c = getButtonCenter();
        setGesture({
          phase: "wheel",
          showingRing: "A",
          drillGroupStart: null,
          highlightedIndex: null,
          centerX: c.x,
          centerY: c.y,
        });
      }, HOLD_MS);
    },
    [getButtonCenter, getMembersInGroup],
  );

  const indexForUpperRing = useCallback(
    (angleDeg: number, items: WheelItem[]) => {
      const n = items.length;
      if (n === 0) return null;
      let a = angleDeg;
      if (a < 270) a += 360;
      const normalized = a - 270;
      return Math.min(Math.floor((normalized / 180) * n), n - 1);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (gRef.current.phase !== "wheel") return;

      const g = gRef.current;
      if (g.centerX === 0 && g.centerY === 0) return;

      const dx = e.clientX - g.centerX;
      const dy = e.clientY - g.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = pointerAngleDeg(dx, dy);
      const inUpper = angle >= 270 || angle <= 90;

      if (!inUpper || dist < BTN_RADIUS) {
        setGesture((prev) => ({ ...prev, highlightedIndex: null }));
        return;
      }

      let newRing = g.showingRing;
      let newDrillStart: number | null = g.drillGroupStart;

      if (g.showingRing === "A" && dist > RING_A_OUTER) {
        const idx = indexForUpperRing(angle, wheelItemsA);
        if (idx !== null) {
          const locked = wheelItemsA[idx];
          if (locked) {
            const members = getMembersInGroup(locked.value);
            if (members.length > 0) {
              newRing = "B";
              newDrillStart = locked.value;
            }
          }
        }
      } else if (g.showingRing === "B" && dist < RING_A_OUTER) {
        newRing = "A";
        newDrillStart = null;
      }

      const items = newRing === "A" ? wheelItemsA : wheelItemsB;
      const outerR = newRing === "A" ? RING_A_OUTER : RING_B_OUTER;
      const hi = dist <= outerR ? indexForUpperRing(angle, items) : null;

      setGesture((prev) => ({
        ...prev,
        showingRing: newRing,
        drillGroupStart: newDrillStart,
        highlightedIndex: hi,
      }));
    },
    [wheelItemsA, wheelItemsB, indexForUpperRing, getMembersInGroup],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }

      const g = gRef.current;
      if (g.phase !== "wheel") return;

      const hi = g.highlightedIndex;

      if (g.showingRing === "B" && hi !== null) {
        const m = drillGroupMembers[hi];
        if (m) {
          dismissHint();
          openMember(m.id);
          resetGesture();
          return;
        }
      }

      if (g.showingRing === "A" && hi !== null) {
        const grp = groups[hi];
        if (grp) {
          handleActiveGroupChange(grp.start);
          dismissHint();
          setGesture((prev) => ({
            ...prev,
            phase: "group-locked",
            showingRing: "A",
            drillGroupStart: grp.start,
            highlightedIndex: null,
            centerX: 0,
            centerY: 0,
          }));
          return;
        }
      }

      resetGesture();
    },
    [
      drillGroupMembers,
      groups,
      openMember,
      handleActiveGroupChange,
      dismissHint,
      resetGesture,
    ],
  );

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  const showHint = !hintDismissed && gesture.phase === "idle";
  const showWheel = gesture.phase === "wheel";
  const showLocked = gesture.phase === "group-locked";
  const hasCenter = gesture.centerX > 0 && gesture.centerY > 0;

  const currentItems =
    gesture.showingRing === "A" ? wheelItemsA : wheelItemsB;
  const currentInnerR =
    gesture.showingRing === "A" ? RING_A_INNER : RING_B_INNER;
  const currentOuterR =
    gesture.showingRing === "A" ? RING_A_OUTER : RING_B_OUTER;
  const ringLabel =
    gesture.showingRing === "A" ? "Groups" : "Members";

  const renderRing = () => {
    const cx = SVG_SIZE;
    const cy = SVG_SIZE;
    const n = currentItems.length;
    if (n === 0) return null;
    const wedgeDeg = 180 / n;

    return currentItems.map((item, i) => {
      const startDeg = 270 + i * wedgeDeg;
      const endDeg = 270 + (i + 1) * wedgeDeg;
      const hi = gesture.highlightedIndex;
      const active = hi === i;

      const path = donutSlice(
        cx,
        cy,
        currentOuterR,
        currentInnerR,
        startDeg,
        endDeg,
      );

      const midDeg = startDeg + wedgeDeg / 2;
      const midR = (currentInnerR + currentOuterR) / 2;
      const lp = polarToSVG(cx, cy, midR, midDeg);
      const hideText = wedgeDeg < 12 && currentItems.length > 10;

      return (
        <g key={i}>
          <path
            d={path}
            fill={active ? "#2563eb" : "#f1f5f9"}
            stroke="#ffffff"
            strokeWidth={1.5}
            className={active ? "drop-shadow-lg" : "drop-shadow-sm"}
          />
          {!hideText && (
            <text
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={active ? "#ffffff" : "#1e293b"}
              fontSize={gesture.showingRing === "A" ? 11 : 10}
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
              pointerEvents="none"
            >
              {item.label}
            </text>
          )}
        </g>
      );
    });
  };

  const dialButton = (
    <button
      ref={buttonRef}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
      className={`w-[84px] h-[84px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full shadow-lg flex items-center justify-center text-white transition-colors admin-press select-none ${
        showLocked ? "ring-2 ring-blue-300 ring-offset-2" : ""
      }`}
      aria-label={
        showLocked && gesture.drillGroupStart
          ? `Group ${gesture.drillGroupStart} selected. Hold to pick a member.`
          : "Quick Dial — hold to find a member"
      }
    >
      {showWheel && gesture.highlightedIndex !== null ? (
        <span className="text-[11px] font-black leading-tight text-center px-1">
          {currentItems[gesture.highlightedIndex]?.label}
        </span>
      ) : (
        <Users className="w-8 h-8" />
      )}
    </button>
  );

  const portalContent = (
    <div
      className={`fixed left-0 right-0 flex justify-center pointer-events-none transition-all duration-300 ${
        selectMode ? "bottom-24 z-[60]" : "bottom-6 z-50"
      } lg:left-[280px]`}
    >
      <div className="relative pointer-events-auto">
        {showHint && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-10">
            <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
              Hold to dial
            </div>
          </div>
        )}

        {showLocked && gesture.drillGroupStart !== null && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-10 whitespace-nowrap">
            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
              Group {gesture.drillGroupStart}–{Math.min(gesture.drillGroupStart + 9, maxMemberNumber)} — Hold to pick member
            </div>
          </div>
        )}

        {showWheel && hasCenter && (
          <svg
            className="fixed pointer-events-none"
            style={{
              left: gesture.centerX - SVG_SIZE,
              top: gesture.centerY - SVG_SIZE,
              width: SVG_SIZE * 2,
              height: SVG_SIZE,
            }}
            viewBox={`0 0 ${SVG_SIZE * 2} ${SVG_SIZE}`}
          >
            <defs>
              <filter id="rd-shadow-sm">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.12" />
              </filter>
              <filter id="rd-shadow-lg">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
              </filter>
            </defs>
            {renderRing()}
          </svg>
        )}

        {dialButton}

        {showLocked && gesture.drillGroupStart !== null && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10">
            <button
              type="button"
              onClick={() => resetGesture()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors bg-white/90 px-2 py-1 rounded shadow-sm"
            >
              Change group
            </button>
          </div>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {showLocked && gesture.drillGroupStart !== null
          ? `Group selected. Hold again to pick a member.`
          : showWheel
            ? gesture.highlightedIndex !== null
              ? `${ringLabel}: ${currentItems[gesture.highlightedIndex]?.label ?? ""}`
              : `Drag in the ${ringLabel.toLowerCase()} ring to select`
            : "Quick dial ready"}
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
}
