import { useEffect, useState } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

import { money } from "../../utils/format";
import { formatNumber as number } from "../../utils/format";

/**
 * Boshqaruv panelidagi diagrammalar.
 *
 * AdminOverview dan ajratildi: u 3300 qatordan oshib ketgan edi va bu
 * to'rtta komponent uning holatiga umuman tegmaydi — faqat berilgan
 * ma'lumotni chizadi. Alohida turgani ularni o'qishni ham, o'zgartirishni
 * ham osonlashtiradi.
 */

const percentage = (value, total) => {
  if (!Number(total)) {
    return 0;
  }

  return Math.min(100, Math.round((Number(value || 0) / Number(total)) * 100));
};

const compactMoney = (value) => {
  const amount = Number(value || 0);

  const format = (result) =>
    new Intl.NumberFormat("uz-UZ", {
      maximumFractionDigits: 1,
    }).format(result);

  if (Math.abs(amount) >= 1_000_000_000) {
    return `${format(amount / 1_000_000_000)} mlrd`;
  }

  if (Math.abs(amount) >= 1_000_000) {
    return `${format(amount / 1_000_000)} mln`;
  }

  if (Math.abs(amount) >= 1_000) {
    return `${format(amount / 1_000)} ming`;
  }

  return format(amount);
};


const ProgressList = ({ items, valueKey, color, quantity = false }) => {
  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
      }}
    >
      {items.slice(0, 6).map((item, index) => {
        const value = Number(item[valueKey] || 0);

        return (
          <Box key={`${item.group_id || index}-${item.group_name || index}`}>
            <Box
              sx={{
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography
                noWrap
                sx={{
                  color: "var(--aa-text-secondary)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {item.group_name || "Noma'lum"}
              </Typography>

              <Typography
                sx={{
                  color: "var(--aa-text-tertiary)",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {quantity ? number(value) : money(value)}
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={percentage(value, max)}
              sx={{
                height: 8,
                borderRadius: 99,
                backgroundColor: "#eef1f5",

                "& .MuiLinearProgress-bar": {
                  borderRadius: 99,
                  backgroundColor: color,
                },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

const buildSmoothPath = (points = []) => {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];

    const controlX = (previous.x + point.x) / 2;

    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
};

const SalesTrendChart = ({ items, title = "Savdo", color = "#8c1d2b" }) => {
  const [activeIndex, setActiveIndex] = useState(Math.max(items.length - 1, 0));

  useEffect(() => {
    setActiveIndex(Math.max(items.length - 1, 0));
  }, [items]);

  const width = 760;
  const height = 300;

  const chartLeft = 42;
  const chartRight = 730;
  const chartTop = 34;
  const chartBottom = 232;

  const chartWidth = chartRight - chartLeft;

  const chartHeight = chartBottom - chartTop;

  const values = items.map((item) => Number(item.value || 0));

  const maxValue = Math.max(...values, 1);

  const hasData = values.some((value) => value > 0);

  const points = items.map((item, index) => {
    const divider = Math.max(items.length - 1, 1);

    const x =
      items.length === 1 ? chartLeft + chartWidth / 2 : chartLeft + (index / divider) * chartWidth;

    const y = chartBottom - (Number(item.value || 0) / maxValue) * chartHeight;

    return {
      ...item,
      x,
      y: hasData ? y : chartBottom,
    };
  });

  const linePath = buildSmoothPath(points);

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${chartBottom} L ${
        points[0].x
      } ${chartBottom} Z`
    : "";

  const activeItem = items[activeIndex] || items[items.length - 1] || {};

  const currentValue = Number(items[items.length - 1]?.value || 0);

  const previousValue = Number(items[items.length - 2]?.value || 0);

  const growth =
    previousValue > 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : currentValue > 0
        ? 100
        : 0;

  return (
    <Box>
      <Box
        sx={{
          mb: 2.2,
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "var(--aa-text)",
              fontSize: {
                xs: 22,
                sm: 27,
              },
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: "-.04em",
            }}
          >
            {money(currentValue)}
          </Typography>

          <Box
            sx={{
              mt: 0.9,
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                color: growth >= 0 ? "#2f6b45" : "#7a1826",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {growth >= 0 ? "+" : ""}
              {growth.toFixed(1)}%
            </Typography>

            <Typography
              sx={{
                color: "var(--aa-text-tertiary)",
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              o‘tgan oyga nisbatan
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            minWidth: 150,
            px: 1.5,
            py: 1.1,
            borderRadius: "14px",
            border: "1px solid var(--aa-border)",
            backgroundColor: "var(--aa-surface-muted)",
          }}
        >
          <Typography
            sx={{
              color: "var(--aa-text-tertiary)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: ".07em",
              textTransform: "uppercase",
            }}
          >
            {activeItem.fullLabel || "Tanlangan oy"}
          </Typography>

          <Typography
            sx={{
              mt: 0.55,
              color,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {money(activeItem.value)}
          </Typography>
        </Box>
      </Box>

      <Box
        className="aa-dashboard-chart"
        sx={{
          position: "relative",
          overflowX: "hidden",
          overflowY: "hidden",
          borderRadius: "18px",
          border: "1px solid #e8e1d8",
          background: "linear-gradient(180deg,var(--aa-surface-muted),var(--aa-surface-solid))",
        }}
      >
        <Box
          component="svg"
          className="aa-dashboard-chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          sx={{
            display: "block",
            width: "100%",
            minWidth: 0,
            height: "auto",
          }}
          role="img"
          aria-label={`${title} dinamikasi`}
        >
          <defs>
            <linearGradient id="aaTrendArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity=".25" />

              <stop offset="72%" stopColor={color} stopOpacity=".06" />

              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>

            <filter id="aaTrendShadow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor={color} floodOpacity=".18" />
            </filter>
          </defs>

          {[0, 1, 2, 3].map((line) => {
            const y = chartTop + (line / 3) * chartHeight;

            return (
              <line
                key={line}
                x1={chartLeft}
                x2={chartRight}
                y1={y}
                y2={y}
                stroke="#e8edf2"
                strokeWidth="1"
                strokeDasharray={line === 3 ? "0" : "4 6"}
              />
            );
          })}

          <text x={chartLeft} y={20} fill="#8a807a" fontSize="10" fontWeight="700">
            {compactMoney(maxValue)}
          </text>

          <text x={chartLeft} y={chartBottom + 17} fill="#8a807a" fontSize="10" fontWeight="700">
            0
          </text>

          {areaPath && <path d={areaPath} fill="url(#aaTrendArea)" stroke="none" />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#aaTrendShadow)"
            />
          )}

          {points.map((point, index) => (
            <g
              key={`${point.label}-${index}`}
              tabIndex="0"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              style={{
                cursor: "pointer",
                outline: "none",
              }}
            >
              <circle cx={point.x} cy={point.y} r="17" fill="transparent" />

              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === index ? "7" : "5"}
                fill="#ffffff"
                stroke={color}
                strokeWidth={activeIndex === index ? "4" : "3"}
              />

              {activeIndex === index && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="none"
                  stroke={color}
                  strokeOpacity=".14"
                  strokeWidth="7"
                />
              )}

              <text
                x={point.x}
                y={270}
                textAnchor="middle"
                fill={activeIndex === index ? "#4b413c" : "#8a807a"}
                fontSize="11"
                fontWeight={activeIndex === index ? "900" : "700"}
              >
                {point.label}
              </text>
            </g>
          ))}
        </Box>

        {!hasData && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{
                px: 2,
                py: 1,
                color: "var(--aa-text-tertiary)",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: "999px",
                backgroundColor: "var(--aa-surface-elevated)",
                border: "1px solid var(--aa-border)",
              }}
            >
              Oxirgi 6 oyda ma’lumot topilmadi
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const ActivityDonut = ({ items }) => {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const radius = 54;

  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  const segments = items.map((item) => {
    const value = Number(item.value || 0);

    const share = total > 0 ? value / total : 0;

    const length = share * circumference;

    const segment = {
      ...item,
      value,
      percentage: Math.round(share * 100),
      length,
      offset,
    };

    offset += length;

    return segment;
  });

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "170px 1fr",
          xl: "1fr",
        },
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 170,
          height: 170,
          mx: "auto",
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 140 140"
          sx={{
            width: "100%",
            height: "100%",
            transform: "rotate(-90deg)",
          }}
        >
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--aa-border-strong)"
            strokeWidth="17"
          />

          {segments.map((segment) => (
            <circle
              key={segment.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="17"
              strokeLinecap="round"
              strokeDasharray={`${segment.length} ${circumference - segment.length}`}
              strokeDashoffset={-segment.offset}
            />
          ))}
        </Box>

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "var(--aa-text)",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-.035em",
            }}
          >
            {compactMoney(total)}
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: "var(--aa-text-tertiary)",
              fontSize: 9.5,
              fontWeight: 600,
            }}
          >
            umumiy hajm
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 1.15,
        }}
      >
        {segments.map((item) => (
          <Box
            key={item.label}
            sx={{
              p: 1.15,
              display: "flex",
              alignItems: "center",
              gap: 1.15,
              borderRadius: "13px",
              border: "1px solid var(--aa-border)",
              backgroundColor: "var(--aa-surface-muted)",
            }}
          >
            <Box
              sx={{
                width: 9,
                height: 9,
                flexShrink: 0,
                borderRadius: "50%",
                backgroundColor: item.color,
                boxShadow: `0 0 0 5px ${item.color}14`,
              }}
            />

            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                noWrap
                sx={{
                  color: "var(--aa-text-secondary)",
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                {item.label}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.3,
                  color: "var(--aa-text-tertiary)",
                  fontSize: 9,
                }}
              >
                {money(item.value)}
              </Typography>
            </Box>

            <Typography
              sx={{
                color: item.color,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {item.percentage}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const TrendSummaryCards = ({ items = [] }) => {
  const safeItems = items.filter((item) => Number.isFinite(Number(item.value)));

  const total = safeItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const average = safeItems.length ? total / safeItems.length : 0;

  const highest = safeItems.length
    ? safeItems.reduce((best, item) =>
        Number(item.value || 0) > Number(best.value || 0) ? item : best,
      )
    : null;

  const latest = Number(safeItems[safeItems.length - 1]?.value || 0);

  const previous = Number(safeItems[safeItems.length - 2]?.value || 0);

  const growth = previous > 0 ? ((latest - previous) / previous) * 100 : latest > 0 ? 100 : 0;

  const cards = [
    {
      label: "6 oylik jami",
      value: money(total),
      helper: "Barcha oylar yig‘indisi",
      color: "#8c1d2b",
    },
    {
      label: "Oylik o‘rtacha",
      value: money(average),
      helper: "Bir oyga o‘rtacha natija",
      color: "#1f6f8b",
    },
    {
      label: "Eng yuqori oy",
      value: highest?.label || "-",
      helper: highest ? money(highest.value) : "Ma’lumot mavjud emas",
      color: "#6d50d5",
    },
    {
      label: "Oxirgi o‘sish",
      value: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
      helper: "Oldingi oyga nisbatan",
      color: growth >= 0 ? "#2f6b45" : "#7a1826",
    },
  ];

  return (
    <Box
      sx={{
        mt: 2,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2,minmax(0,1fr))",
          lg: "repeat(4,minmax(0,1fr))",
        },
        gap: 1.3,
      }}
    >
      {cards.map((card) => (
        <Box
          key={card.label}
          sx={{
            minWidth: 0,
            p: 1.7,
            borderRadius: "16px",
            border: "1px solid var(--aa-border)",
            background: "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
            transition: "transform .18s ease, box-shadow .18s ease",

            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 12px 28px rgba(23, 17, 15,.06)",
            },
          }}
        >
          <Box
            sx={{
              mb: 1.2,
              display: "flex",
              alignItems: "center",
              gap: 0.9,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                flexShrink: 0,
                borderRadius: "50%",
                backgroundColor: card.color,
                boxShadow: `0 0 0 5px ${card.color}14`,
              }}
            />

            <Typography
              sx={{
                color: "var(--aa-text-secondary)",
                fontSize: 9.5,
                fontWeight: 600,
              }}
            >
              {card.label}
            </Typography>
          </Box>

          <Typography
            noWrap
            sx={{
              color: card.color,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-.025em",
            }}
          >
            {card.value}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 0.7,
              color: "var(--aa-text-tertiary)",
              fontSize: 9.5,
            }}
          >
            {card.helper}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export { ActivityDonut, ProgressList, SalesTrendChart, TrendSummaryCards };
