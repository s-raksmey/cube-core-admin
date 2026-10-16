"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartNoAxesCombined } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";

type ChartPoint = { label: string; value: number };
type ChartVariant = "line" | "bars";

const top = 18;
const bottom = 202;
const left = 48;

function formatLabel(label: string) {
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(label)) {
    const date = new Date(
      `${label.length === 7 ? `${label}-01` : label}T00:00:00Z`,
    );
    return new Intl.DateTimeFormat("en", {
      month: "short",
      ...(label.length === 10 ? { day: "numeric" } : { year: "numeric" }),
      timeZone: "UTC",
    }).format(date);
  }
  return label.replaceAll("_", " ");
}

function axisMaximum(maximum: number) {
  if (maximum <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(maximum / 4));
  const step =
    [1, 2, 5, 10].find((candidate) => candidate * magnitude * 4 >= maximum) ??
    10;
  return step * magnitude * 4;
}

function LineChart({ title, points }: { title: string; points: ChartPoint[] }) {
  const gradientId = useId().replaceAll(":", "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () =>
      setChartWidth(Math.max(280, Math.floor(container.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  const right = chartWidth - 20;
  const maximum = axisMaximum(
    Math.max(...points.map((point) => point.value), 1),
  );
  const x = (index: number) =>
    left +
    (points.length === 1
      ? (right - left) / 2
      : (index / (points.length - 1)) * (right - left));
  const y = (value: number) => bottom - (value / maximum) * (bottom - top);
  const line = points
    .map((point, index) => `${index ? "L" : "M"} ${x(index)} ${y(point.value)}`)
    .join(" ");
  const area = `${line} L ${x(points.length - 1)} ${bottom} L ${x(0)} ${bottom} Z`;
  const tickIndices = [
    ...new Set(
      Array.from({ length: Math.min(5, points.length) }, (_, index) =>
        Math.round(
          (index * (points.length - 1)) /
            Math.max(Math.min(5, points.length) - 1, 1),
        ),
      ),
    ),
  ];

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const pointer = event.currentTarget.createSVGPoint();
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    const position = pointer.matrixTransform(matrix.inverse());
    const fraction = Math.max(
      0,
      Math.min(1, (position.x - left) / (right - left)),
    );
    setActive(Math.round(fraction * (points.length - 1)));
  }

  const selected = active === null ? null : points[active];
  return (
    <div ref={containerRef} className="min-w-0">
      <div className="flex min-h-10 items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Total{" "}
          <strong className="ml-1 text-lg font-semibold tabular-nums text-foreground">
            {points
              .reduce((sum, point) => sum + point.value, 0)
              .toLocaleString()}
          </strong>
        </span>
        <span
          aria-live="polite"
          className="text-right tabular-nums text-muted-foreground"
        >
          {selected ? (
            <>
              <span className="text-foreground">
                {formatLabel(selected.label)}
              </span>{" "}
              · {selected.value.toLocaleString()}
            </>
          ) : (
            "Hover for details"
          )}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${chartWidth} 250`}
        className="h-56 w-full touch-pan-y overflow-visible focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primary"
        role="img"
        aria-label={`${title}: ${points.reduce((sum, point) => sum + point.value, 0).toLocaleString()} total across ${points.length} periods`}
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setActive((index) =>
              Math.max(
                0,
                Math.min(
                  points.length - 1,
                  (index ?? points.length - 1) +
                    (event.key === "ArrowRight" ? 1 : -1),
                ),
              ),
            );
          }
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((index) => {
          const value = (maximum / 4) * (4 - index);
          const position = y(value);
          return (
            <g key={index}>
              <line
                x1={left}
                x2={right}
                y1={position}
                y2={position}
                stroke="var(--border)"
                strokeDasharray={index === 4 ? undefined : "4 5"}
              />
              <text
                x={left - 10}
                y={position + 4}
                textAnchor="end"
                fill="var(--muted-foreground)"
                fontSize="11"
              >
                {value.toLocaleString()}
              </text>
            </g>
          );
        })}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {active !== null ? (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={top}
              y2={bottom}
              stroke="var(--primary)"
              strokeOpacity="0.55"
              strokeDasharray="4 4"
            />
            <circle
              cx={x(active)}
              cy={y(points[active].value)}
              r="6"
              fill="var(--card)"
              stroke="var(--primary)"
              strokeWidth="3"
            />
          </g>
        ) : points.length === 1 ? (
          <circle
            cx={x(0)}
            cy={y(points[0].value)}
            r="5"
            fill="var(--primary)"
          />
        ) : null}
        {tickIndices.map((index) => (
          <text
            key={index}
            x={x(index)}
            y="237"
            textAnchor={
              index === 0
                ? "start"
                : index === points.length - 1
                  ? "end"
                  : "middle"
            }
            fill="var(--muted-foreground)"
            fontSize="11"
          >
            {formatLabel(points[index].label)}
          </text>
        ))}
      </svg>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer hover:text-foreground">
          View data table
        </summary>
        <div className="mt-2 max-h-48 overflow-auto rounded-md border border-border">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-card">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 text-right font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.label} className="border-t border-border">
                  <td className="px-3 py-1.5">{point.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {point.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function BarChart({ points }: { points: ChartPoint[] }) {
  const maximum = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="space-y-4 py-1">
      {points.map((point) => (
        <div key={point.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span
              className="truncate text-muted-foreground"
              title={point.label}
            >
              {formatLabel(point.label)}
            </span>
            <strong className="tabular-nums text-foreground">
              {point.value.toLocaleString()}
            </strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${(point.value / maximum) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartPanel({
  title,
  points,
  loading,
  emptyLabel = "No data yet",
  variant = "line",
}: {
  title: string;
  points: ChartPoint[];
  loading?: boolean;
  emptyLabel?: string;
  variant?: ChartVariant;
}) {
  const hasData = points.some((point) => point.value > 0);
  return (
    <Card className="min-w-0 border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : !hasData ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-2 text-center">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <ChartNoAxesCombined className="size-5" />
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              {emptyLabel}
            </p>
          </div>
        ) : variant === "bars" ? (
          <BarChart points={points} />
        ) : (
          <LineChart title={title} points={points} />
        )}
      </CardContent>
    </Card>
  );
}
