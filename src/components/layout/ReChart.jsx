import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, ReferenceDot,
} from "recharts";
import { useEffect, useMemo, useRef, useState } from "react";
import "./ReChart.css";

const UP = "#26a69a";
const AXIS = "rgba(255,255,255,0.6)";
const EMPTY_BARS = [];
const VISIBLE_POINT_COUNT = 15;   // số điểm mỗi trang
const WHEEL_THROTTLE_MS = 150;    // chống trackpad nhảy nhiều trang một lần
const AUTO_RETURN_MS = 5000;      // tự về hiện tại sau 5s không thao tác (0 = tắt)

function formatTime(seconds) {
    const total = Math.max(Math.floor(seconds), 0);
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function toChartData(savedBars) {
    return savedBars
        .map(({ time, bayesianAverange, barttelID, battlerId }) => ({
            time: Number(time),
            value: bayesianAverange ?? 5,
            barttelID: barttelID ?? battlerId ?? null,
        }))
        .filter(({ time }) => Number.isFinite(time))
        .sort((a, b) => a.time - b.time)
        .map((item, index) => ({ ...item, index }));
}

// Tìm chỉ số điểm cuối cùng có time <= t (binary search)
function findIndexAtTime(data, t) {
    let lo = 0;
    let hi = data.length - 1;
    let result = -1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (data[mid].time <= t) {
            result = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return result;
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <span className="chart-tooltip__label">{formatTime(payload[0].payload.time)}</span>
            <strong className="chart-tooltip__value">{payload[0].value.toFixed(2)}</strong>
        </div>
    );
}

function AxisTick({
    x, y, payload, textAnchor = "middle", formatter = (value) => value, activeValue,
}) {
    const label = formatter(payload.value);
    const width = String(label).length * 7 + 12;
    const rectX = textAnchor === "start"
        ? x - 6
        : textAnchor === "end"
            ? x - width + 6
            : x - width / 2;
    const isActive = activeValue !== undefined && payload.value === activeValue;

    return (
        <g className={`chart-axis-tick${isActive ? " is-active" : ""}`}>
            <rect x={rectX} y={y - 9} width={width} height={18} rx={5} />
            <text x={x} y={y + 4} textAnchor={textAnchor}>
                {label}
            </text>
        </g>
    );
}

function LiveLabel({ viewBox, time, value }) {
    const { x, y } = viewBox;
    const w = 64;
    const h = 52;
    // Đặt hộp bên trái điểm để không bị tràn ra mép phải
    const boxX = x - w - 14;
    const boxY = y - h / 2;

    return (
        <g className="chart-live-label">
            <rect x={boxX} y={boxY} width={w} height={h} rx={8} />
            <text x={boxX + w / 2} y={boxY + 20} textAnchor="middle" className="chart-live-label__time">
                {formatTime(time)}
            </text>
            <text x={boxX + w / 2} y={boxY + 40} textAnchor="middle" className="chart-live-label__value">
                {value.toFixed(2)}
            </text>
        </g>
    );
}

export default function ReChart({ savedBars = EMPTY_BARS, currentTimeRef }) {
    const data = useMemo(() => toChartData(savedBars), [savedBars]);
    const battlerChanges = useMemo(
        () => data.flatMap((point, index) => {
            if (index === 0) return [];
            const previousBattlerId = data[index - 1].barttelID;
            const currentBattlerId = point.barttelID;
            const hasChanged = String(previousBattlerId ?? '') !== String(currentBattlerId ?? '');

            return hasChanged ? [{ index: point.index - 0.5, key: point.index }] : [];
        }),
        [data],
    );
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [manualPage, setManualPage] = useState(null); // null = tự theo video

    const cardRef = useRef(null);
    const lastWheelRef = useRef(0);
    const livePageRef = useRef(0);

    const totalPages = Math.max(Math.ceil(data.length / VISIBLE_POINT_COUNT), 1);
    const livePage = currentIndex >= 0 ? Math.floor(currentIndex / VISIBLE_POINT_COUNT) : 0;
    livePageRef.current = livePage;

    const isLive = manualPage === null;
    const page = manualPage ?? livePage;
    const pageStart = page * VISIBLE_POINT_COUNT;

    const currentPoint = currentIndex >= 0 ? data[currentIndex] : null;
    // Chỉ highlight điểm hiện tại khi nó nằm trong trang đang xem
    const showLive = Boolean(currentPoint)
        && currentPoint.index >= pageStart
        && currentPoint.index < pageStart + VISIBLE_POINT_COUNT;

    // Theo dõi thời gian video mỗi frame, chỉ setState khi sang điểm mới
    useEffect(() => {
        if (!currentTimeRef) return undefined;

        let rafId;
        const tick = () => {
            const t = Number(currentTimeRef.current);
            if (Number.isFinite(t)) {
                const next = findIndexAtTime(data, t);
                setCurrentIndex((prev) => (prev === next ? prev : next));
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [currentTimeRef, data]);

    // Lăn chuột để đổi trang
    useEffect(() => {
        const el = cardRef.current;
        if (!el) return undefined;

        const onWheel = (e) => {
            e.preventDefault(); // không cho cả trang cuộn theo
            const now = performance.now();
            if (now - lastWheelRef.current < WHEEL_THROTTLE_MS) return;

            const dir = Math.sign(e.deltaY || e.deltaX);
            if (!dir) return;
            lastWheelRef.current = now;

            setManualPage((prev) => {
                const base = prev ?? livePageRef.current;
                const next = Math.min(Math.max(base + dir, 0), totalPages - 1);
                // Về đúng trang đang chạy thì theo video lại
                return next === livePageRef.current ? null : next;
            });
        };

        // passive: false thì mới preventDefault được
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [totalPages]);

    // Tự quay về hiện tại sau một lúc không thao tác
    useEffect(() => {
        if (manualPage === null || !AUTO_RETURN_MS) return undefined;
        const id = window.setTimeout(() => setManualPage(null), AUTO_RETURN_MS);
        return () => window.clearTimeout(id);
    }, [manualPage]);

    const { visibleData, domain, ticks } = useMemo(() => {
        const pageEnd = Math.min(pageStart + VISIBLE_POINT_COUNT, data.length) - 1;

        // Tự theo video: chỉ hiện đến điểm hiện tại. Xem tay: hiện cả trang
        const endIndex = isLive ? currentIndex : pageEnd;
        const visible = endIndex >= pageStart ? data.slice(pageStart, endIndex + 1) : [];

        return {
            visibleData: visible,
            // Domain cố định trong một trang → điểm cũ không bị dịch chỗ
            domain: [pageStart, pageStart + VISIBLE_POINT_COUNT - 1],
            ticks: visible.map(({ index }) => index),
        };
    }, [data, currentIndex, pageStart, isLive]);

    return (
        <div className="chart-card" ref={cardRef}>
            {!isLive && (
                <div className="chart-pager">
                    <span>Trang {page + 1}/{totalPages}</span>
                    <button type="button" onClick={() => setManualPage(null)}>
                        Về hiện tại
                    </button>
                </div>
            )}

            <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={visibleData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={UP} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={UP} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <XAxis
                        type="number"
                        dataKey="index"
                        domain={domain}
                        ticks={ticks}
                        allowDataOverflow
                        axisLine={{ stroke: AXIS }}
                        tickLine={false}
                        tickMargin={10}
                        padding={{ left: 10, right: 10 }}
                        tick={
                            <AxisTick
                                activeValue={currentIndex}
                                formatter={(i) => formatTime(data[i]?.time ?? 0)}
                            />
                        }
                    />
                    <YAxis
                        domain={[0, 10]}
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                        axisLine={{ stroke: AXIS }}
                        tickLine={false}
                        mirror
                        tick={<AxisTick formatter={(value) => value.toFixed(0)} />}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: "#787b86", strokeDasharray: "4 4" }}
                    />

                    <Area
                        type="linear"
                        dataKey="value"
                        stroke={UP}
                        strokeWidth={2}
                        fill="url(#areaGradient)"
                        isAnimationActive={false}
                        dot={{ r: 4, fill: "#131722", stroke: UP, strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: UP, stroke: "#fff", strokeWidth: 2 }}
                    />

                    {battlerChanges
                        .filter(({ key }) => key > pageStart
                            && key <= (visibleData[visibleData.length - 1]?.index ?? -1))
                        .map(({ index, key }) => (
                            <ReferenceLine
                                key={`battler-change-${key}`}
                                x={index}
                                stroke="#f77348"
                                strokeDasharray="3 3"
                                strokeOpacity={0.85}
                            />
                        ))}

                    {showLive && (
                        <>
                            <ReferenceLine
                                x={currentPoint.index}
                                stroke="#787b86"
                                strokeDasharray="4 4"
                            />
                            <ReferenceDot
                                x={currentPoint.index}
                                y={currentPoint.value}
                                r={6}
                                fill={UP}
                                stroke="#fff"
                                strokeWidth={2}
                                isFront
                                label={
                                    <LiveLabel time={currentPoint.time} value={currentPoint.value} />
                                }
                            />
                        </>
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}