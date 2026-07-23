import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getUsers } from "../../api/getUsers";
import { getInventorySummary } from "../../api/inventory";
import { getClientBalance, getClientSales, getClientSalesSummary } from "../../api/clientSales";
import { getMaterialPurchases, getSupplierBalance } from "../../api/materialPurchases";
import { getProducts } from "../../api/products";
import { getWorkerOutputs, getWorkerOutputsSummary } from "../../api/workerOutputs";
import { getWorkerBalance } from "../../api/workerPayments";
import { getFinancialAccounts } from "../../api/finance";

import AlertIcon from "../../images/ui-icons/alert.svg";
import BoxIcon from "../../images/ui-icons/box.svg";
import CoinsIcon from "../../images/ui-icons/coins.svg";
import TrendUpIcon from "../../images/ui-icons/trend-up.svg";

import { hasPermission } from "../../utils/permissions";

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

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

const date = (value) => (value ? new Date(value).toLocaleDateString("uz-UZ") : "-");

const pad = (value) => String(value).padStart(2, "0");

const localDate = (value) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

const getMonthRangeByOffset = (offset = 0) => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);

  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);

  return {
    date_from: localDate(start),
    date_to: localDate(end),

    label: new Intl.DateTimeFormat("uz-UZ", {
      month: "short",
    })
      .format(start)
      .replace(".", "")
      .replace(/^./, (letter) => letter.toUpperCase()),

    fullLabel: new Intl.DateTimeFormat("uz-UZ", {
      month: "long",
      year: "numeric",
    }).format(start),
  };
};

const monthRange = () => {
  const { date_from, date_to } = getMonthRangeByOffset(0);

  return {
    date_from,
    date_to,
  };
};

const previousMonthRange = () => {
  const { date_from, date_to } = getMonthRangeByOffset(-1);

  return {
    date_from,
    date_to,
  };
};

const getTrendRanges = (count = 6) =>
  Array.from(
    {
      length: count,
    },
    (_, index) => getMonthRangeByOffset(index - (count - 1)),
  );

const getFinishedQuantity = (summary = []) => {
  const item = summary.find((entry) => {
    const value = `${entry.group_code || ""} ${entry.group_name || ""}`.toLowerCase();

    return /upakov|upakof|qadoq|pack|tayyor/.test(value);
  });

  return Number(item?.total_quantity || 0);
};

const percentage = (value, total) => {
  if (!Number(total)) {
    return 0;
  }

  return Math.min(100, Math.round((Number(value || 0) / Number(total)) * 100));
};

const tones = {
  red: {
    icon: "linear-gradient(145deg,#8f1d20,#c72a32)",
    soft: "rgba(143,29,32,.07)",
    shadow: "rgba(143,29,32,.20)",
  },

  green: {
    icon: "linear-gradient(145deg,#16985c,#21bd73)",
    soft: "rgba(22,152,92,.07)",
    shadow: "rgba(22,152,92,.18)",
  },

  amber: {
    icon: "linear-gradient(145deg,#e28720,#f4a238)",
    soft: "rgba(226,135,32,.08)",
    shadow: "rgba(226,135,32,.20)",
  },

  violet: {
    icon: "linear-gradient(145deg,#6750cf,#8a67e8)",
    soft: "rgba(103,80,207,.07)",
    shadow: "rgba(103,80,207,.20)",
  },

  blue: {
    icon: "linear-gradient(145deg,#3262d9,#587cf0)",
    soft: "rgba(50,98,217,.07)",
    shadow: "rgba(50,98,217,.20)",
  },
};

const KpiCard = ({ label, value, helper, icon, tone = "red" }) => {
  const colors = tones[tone] || tones.red;

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        minHeight: 145,
        p: 2.5,
        overflow: "hidden",
        borderRadius: "22px",
        border: "1px solid rgba(226,232,240,.9)",
        backgroundColor: "#ffffff",
        boxShadow: "0 14px 40px rgba(15,23,42,.055)",
        transition: "transform .2s ease, box-shadow .2s ease",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 50px rgba(15,23,42,.09)",
        },

        "&::after": {
          content: '""',
          position: "absolute",
          width: 150,
          height: 150,
          top: -80,
          right: -65,
          borderRadius: "50%",
          background: `radial-gradient(
            circle,
            ${colors.soft},
            transparent 68%
          )`,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 750,
            }}
          >
            {label}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 1.1,
              color: "#0f172a",
              fontSize: 21,
              lineHeight: 1.2,
              fontWeight: 950,
              letterSpacing: "-.035em",
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            borderRadius: "14px",
            background: colors.icon,
            boxShadow: `0 12px 26px ${colors.shadow}`,
          }}
        >
          <Box
            component="img"
            src={icon}
            alt=""
            sx={{
              width: 19,
              height: 19,
              filter: "brightness(0) invert(1)",
            }}
          />
        </Box>
      </Box>

      <Typography
        sx={{
          position: "relative",
          zIndex: 1,
          mt: 2,
          color: "#94a3b8",
          fontSize: 11,
          lineHeight: 1.55,
          fontWeight: 600,
        }}
      >
        {helper}
      </Typography>
    </Paper>
  );
};

const Section = ({ title, subtitle, action, children, className = "" }) => (
  <Paper
    elevation={0}
    className={className}
    sx={{
      p: 2.5,
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid rgba(226,232,240,.9)",
      backgroundColor: "#ffffff",
      boxShadow: "0 14px 40px rgba(15,23,42,.045)",
    }}
  >
    <Box
      sx={{
        mb: 2.5,
        minHeight: 40,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          sx={{
            color: "#0f172a",
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: "-.02em",
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              mt: 0.7,
              color: "#94a3b8",
              fontSize: 11,
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action}
    </Box>

    {children}
  </Paper>
);

const Empty = ({ children }) => (
  <Box
    sx={{
      minHeight: 145,
      px: 2,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1.5,
      textAlign: "center",
      borderRadius: "17px",
      border: "1px dashed #cbd5e1",
      backgroundColor: "#f8fafc",
    }}
  >
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: "#cbd5e1",
        boxShadow: "0 0 0 7px rgba(203,213,225,.25)",
      }}
    />

    <Typography
      sx={{
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: 650,
      }}
    >
      {children}
    </Typography>
  </Box>
);

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
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {item.group_name || "Noma'lum"}
              </Typography>

              <Typography
                sx={{
                  color: "#94a3b8",
                  fontSize: 10,
                  fontWeight: 750,
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

const SalesTrendChart = ({ items, title = "Savdo", color = "#b4232b" }) => {
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
              color: "#0f172a",
              fontSize: {
                xs: 22,
                sm: 27,
              },
              lineHeight: 1.1,
              fontWeight: 950,
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
                color: growth >= 0 ? "#15803d" : "#be123c",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {growth >= 0 ? "+" : ""}
              {growth.toFixed(1)}%
            </Typography>

            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 10.5,
                fontWeight: 650,
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
            border: "1px solid #e7ebf0",
            backgroundColor: "#f8fafc",
          }}
        >
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: 9,
              fontWeight: 850,
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
              fontWeight: 950,
            }}
          >
            {money(activeItem.value)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          position: "relative",
          overflowX: "auto",
          overflowY: "hidden",
          borderRadius: "18px",
          border: "1px solid #e7ebf0",
          background: "linear-gradient(180deg,#f8fafc,#ffffff)",
        }}
      >
        <Box
          component="svg"
          viewBox={`0 0 ${width} ${height}`}
          sx={{
            display: "block",
            width: "100%",
            minWidth: 620,
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

          <text x={chartLeft} y={20} fill="#94a3b8" fontSize="10" fontWeight="700">
            {compactMoney(maxValue)}
          </text>

          <text x={chartLeft} y={chartBottom + 17} fill="#94a3b8" fontSize="10" fontWeight="700">
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
                fill={activeIndex === index ? "#334155" : "#94a3b8"}
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
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 750,
                borderRadius: "999px",
                backgroundColor: "rgba(255,255,255,.9)",
                border: "1px solid #e7ebf0",
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
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#edf1f5" strokeWidth="17" />

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
              color: "#0f172a",
              fontSize: 18,
              fontWeight: 950,
              letterSpacing: "-.035em",
            }}
          >
            {compactMoney(total)}
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: "#94a3b8",
              fontSize: 9.5,
              fontWeight: 750,
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
              border: "1px solid #edf0f3",
              backgroundColor: "#fafbfc",
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
                  color: "#475569",
                  fontSize: 10.5,
                  fontWeight: 900,
                }}
              >
                {item.label}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.3,
                  color: "#94a3b8",
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
                fontWeight: 950,
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
      color: "#b4232b",
    },
    {
      label: "Oylik o‘rtacha",
      value: money(average),
      helper: "Bir oyga o‘rtacha natija",
      color: "#3262d9",
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
      color: growth >= 0 ? "#16985c" : "#be123c",
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
            border: "1px solid #e7ebf0",
            background: "linear-gradient(145deg,#ffffff,#f8fafc)",
            transition: "transform .18s ease, box-shadow .18s ease",

            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 12px 28px rgba(15,23,42,.06)",
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
                color: "#64748b",
                fontSize: 9.5,
                fontWeight: 850,
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
              fontWeight: 950,
              letterSpacing: "-.025em",
            }}
          >
            {card.value}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 0.7,
              color: "#94a3b8",
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

const LinkButton = ({ children, onClick }) => (
  <Button
    size="small"
    onClick={onClick}
    sx={{
      minWidth: 0,
      px: 1,
      color: "#8f1d20",
      borderRadius: 2,
      fontSize: 11,
      fontWeight: 900,
      textTransform: "none",

      "&:hover": {
        backgroundColor: "rgba(143,29,32,.055)",
      },
    }}
  >
    {children}

    <Box
      component="span"
      sx={{
        ml: 0.7,
        fontSize: 15,
      }}
    >
      →
    </Box>
  </Button>
);

const AdminOverview = ({ user }) => {
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === "super_admin";

  const canViewUsers = hasPermission(user, "users.view");

  const canViewProducts = hasPermission(user, "products.view");

  const canViewProduction = hasPermission(user, "production.view");

  const canViewPayroll = hasPermission(user, "payroll.view");

  const canViewFinance = hasPermission(user, "finance.view");

  const canViewInventory = hasPermission(user, "inventory.view");

  const hasClientAccounting =
    (!user?.plan_code || user.plan_features?.includes("client_accounting")) &&
    hasPermission(user, "client_sales.view");

  const hasSupplierAccounting =
    (!user?.plan_code || user.plan_features?.includes("supplier_accounting")) &&
    hasPermission(user, "material_purchases.view");

  const trendMode =
    isSuperAdmin && hasClientAccounting
      ? "sales"
      : canViewProduction
        ? "production"
        : hasSupplierAccounting
          ? "purchases"
          : null;

  const [loading, setLoading] = useState(true);

  const [filterForm, setFilterForm] = useState(monthRange);

  const [appliedRange, setAppliedRange] = useState(monthRange);

  const [sectionFilter, setSectionFilter] = useState("all");

  const [clients, setClients] = useState([]);

  const [workers, setWorkers] = useState([]);

  const [departments, setDepartments] = useState([]);

  const [purchases, setPurchases] = useState([]);

  const [trend, setTrend] = useState([]);

  const [inventory, setInventory] = useState({
    summary: {},
    warehouses: [],
  });

  const [data, setData] = useState({
    users: 0,
    products: 0,

    productionQuantity: 0,
    productionAmount: 0,

    salaryEarned: 0,
    salaryPaid: 0,
    salaryRemaining: 0,
    advances: 0,

    sales: 0,
    clientIncome: 0,
    clientDebt: 0,
    salesCount: 0,

    purchases: 0,
    supplierPaid: 0,
    supplierDebt: 0,
    purchasesCount: 0,
    cashBalance: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const range = appliedRange;

      const trendRanges = getTrendRanges(6);

      const trendPromise = trendMode
        ? Promise.allSettled(
            trendRanges.map((trendRange) => {
              if (trendMode === "sales") {
                return getClientSales({
                  date_from: trendRange.date_from,
                  date_to: trendRange.date_to,
                  offset: 0,
                  limit: 1,
                });
              }

              if (trendMode === "production") {
                return getWorkerOutputs({
                  date_from: trendRange.date_from,
                  date_to: trendRange.date_to,
                  offset: 0,
                  limit: 1,
                });
              }

              return getSupplierBalance({
                date_from: trendRange.date_from,
                date_to: trendRange.date_to,
              });
            }),
          )
        : Promise.resolve([]);

      const [
        usersRes,
        productsRes,
        outputsRes,
        workerRes,
        departmentRes,
        salaryMonthRes,
        salaryAllRes,
        salesRes,
        clientDebtRes,
        clientRes,
        purchasesRes,
        supplierMonthRes,
        supplierDebtRes,
        inventoryRes,
        accountsRes,
        trendResponses,
      ] = await Promise.all([
        canViewUsers
          ? getUsers({
              offset: 0,
              limit: 1,
            })
          : Promise.resolve({
              data: {
                pageInfo: {},
              },
            }),

        canViewProducts
          ? getProducts({
              offset: 0,
              limit: 1,
            })
          : Promise.resolve({
              data: {
                pageInfo: {},
              },
            }),

        canViewProduction
          ? getWorkerOutputs({
              ...range,
              offset: 0,
              limit: 1,
            })
          : Promise.resolve({
              data: {
                totals: {},
              },
            }),

        canViewProduction
          ? getWorkerOutputsSummary({
              ...range,
              group_by: "worker",
            })
          : Promise.resolve({
              data: {
                summary: [],
              },
            }),

        canViewProduction
          ? getWorkerOutputsSummary({
              ...range,
              group_by: "department",
            })
          : Promise.resolve({
              data: {
                summary: [],
              },
            }),

        canViewPayroll
          ? getWorkerBalance(range)
          : Promise.resolve({
              data: {
                balance: {},
              },
            }),

        canViewPayroll
          ? getWorkerBalance({})
          : Promise.resolve({
              data: {
                balance: {},
              },
            }),

        hasClientAccounting
          ? getClientSales({
              ...range,
              offset: 0,
              limit: 1,
            })
          : Promise.resolve({
              data: {
                totals: {},
                pageInfo: {},
              },
            }),

        isSuperAdmin && hasClientAccounting
          ? getClientBalance({})
          : Promise.resolve({
              data: {
                balance: {},
              },
            }),

        isSuperAdmin && hasClientAccounting
          ? getClientSalesSummary({
              ...range,
              group_by: "client",
            })
          : Promise.resolve({
              data: {
                summary: [],
              },
            }),

        hasSupplierAccounting
          ? getMaterialPurchases({
              ...range,
              offset: 0,
              limit: 6,
            })
          : Promise.resolve({
              data: {
                material_purchases: [],
                pageInfo: {},
              },
            }),

        hasSupplierAccounting
          ? getSupplierBalance(range)
          : Promise.resolve({
              data: {},
            }),

        hasSupplierAccounting
          ? getSupplierBalance({})
          : Promise.resolve({
              data: {},
            }),

        canViewInventory
          ? getInventorySummary()
          : Promise.resolve({
              data: {
                summary: {},
                warehouses: [],
              },
            }),

        canViewFinance
          ? getFinancialAccounts()
          : Promise.resolve({
              data: {
                financial_accounts: [],
              },
            }),

        trendPromise,
      ]);

      const departmentSummary = departmentRes.data.summary || [];

      setData({
        users: usersRes.data.pageInfo?.total || 0,

        products: productsRes.data.pageInfo?.total || 0,

        productionQuantity: getFinishedQuantity(departmentSummary),

        productionAmount: outputsRes.data.totals?.total_amount || 0,

        salaryEarned: salaryMonthRes.data.balance?.total_earned || 0,

        salaryPaid: salaryMonthRes.data.balance?.total_paid || 0,

        salaryRemaining: salaryAllRes.data.balance?.remaining || 0,

        advances: salaryAllRes.data.balance?.remaining_advance || 0,

        sales: salesRes.data.totals?.total_amount || 0,

        clientIncome: salesRes.data.totals?.paid_amount || 0,

        clientDebt: clientDebtRes.data.balance?.debt_amount || 0,

        salesCount: salesRes.data.pageInfo?.total || 0,

        purchases: supplierMonthRes.data.total_purchase || 0,

        supplierPaid: supplierMonthRes.data.total_paid || 0,

        supplierDebt: supplierDebtRes.data.debt_amount || 0,

        purchasesCount: purchasesRes.data.pageInfo?.total || 0,

        cashBalance: (accountsRes.data.financial_accounts || []).reduce(
          (sum, account) => sum + Number(account.balance || 0),
          0,
        ),
      });

      setClients(clientRes.data.summary || []);

      setWorkers(workerRes.data.summary || []);

      setDepartments(departmentSummary);

      setPurchases(purchasesRes.data.material_purchases || []);

      setInventory({
        summary: inventoryRes.data.summary || {},

        warehouses: inventoryRes.data.warehouses || [],
      });

      setTrend(
        trendRanges.map((trendRange, index) => {
          const result = trendResponses[index];

          const response = result?.status === "fulfilled" ? result.value : null;

          let value = 0;

          if (trendMode === "sales" || trendMode === "production") {
            value = response?.data?.totals?.total_amount || 0;
          } else if (trendMode === "purchases") {
            value = response?.data?.total_purchase || 0;
          }

          return {
            ...trendRange,
            value: Number(value || 0),
          };
        }),
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bosh sahifa ma'lumotlarini olishda xato.");
    } finally {
      setLoading(false);
    }
  }, [
    appliedRange,
    canViewInventory,
    canViewFinance,
    canViewPayroll,
    canViewProducts,
    canViewProduction,
    canViewUsers,
    hasClientAccounting,
    hasSupplierAccounting,
    isSuperAdmin,
    trendMode,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const allowed = [
      "all",

      hasClientAccounting && "clients",

      canViewProduction && "workers",

      hasSupplierAccounting && "suppliers",
    ].filter(Boolean);

    if (!allowed.includes(sectionFilter)) {
      setSectionFilter("all");
    }
  }, [canViewProduction, hasClientAccounting, hasSupplierAccounting, sectionFilter]);

  const attentionItems = useMemo(
    () =>
      [
        isSuperAdmin &&
          hasClientAccounting &&
          Number(data.clientDebt) > 0 && {
            label: "Mijozlardan olinadigan qarz",

            value: money(data.clientDebt),

            helper: "To'lov kutilayotgan umumiy summa",

            path: "/client-sales",

            color: "#179b60",
          },

        hasSupplierAccounting &&
          Number(data.supplierDebt) > 0 && {
            label: "Ta'minotchilarga qarz",

            value: money(data.supplierDebt),

            helper: "Oldingi qarzlar bilan umumiy summa",

            path: "/material-purchases",

            color: "#8f1d20",
          },

        canViewPayroll &&
          Number(data.salaryRemaining) > 0 && {
            label: "Berilmagan ish haqi",

            value: money(data.salaryRemaining),

            helper: "Hodimlarga to'lanishi kerak",

            path: "/worker-payments",

            color: "#e18a25",
          },

        canViewPayroll &&
          Number(data.advances) > 0 && {
            label: "Hodimlarning avansi",

            value: money(data.advances),

            helper: "Keyingi hisobda ushlanishi mumkin",

            path: "/worker-payments",

            color: "#7157cf",
          },

        canViewInventory &&
          Number(inventory.summary.low_stock_lines) > 0 && {
            label: "Omborda kam qolgan mahsulotlar",

            value: `${number(inventory.summary.low_stock_lines)} ta`,

            helper: "Minimal qoldiq chegarasiga yetgan pozitsiyalar",

            path: "/inventory",

            color: "#8f1d20",
          },
      ].filter(Boolean),
    [
      canViewInventory,
      canViewPayroll,
      data,
      hasClientAccounting,
      hasSupplierAccounting,
      inventory,
      isSuperAdmin,
    ],
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 430,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            display: "grid",
            placeItems: "center",
            borderRadius: "22px",
            border: "1px solid rgba(143,29,32,.1)",
            backgroundColor: "rgba(143,29,32,.05)",
          }}
        >
          <CircularProgress
            size={34}
            thickness={4.6}
            sx={{
              color: "#8f1d20",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: 750,
          }}
        >
          Bosh sahifa ma’lumotlari yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  const showClient =
    isSuperAdmin && hasClientAccounting && ["all", "clients"].includes(sectionFilter);

  const showWorkers = canViewProduction && ["all", "workers"].includes(sectionFilter);

  const showSupplier = hasSupplierAccounting && ["all", "suppliers"].includes(sectionFilter);

  const filters = [
    ["all", "Hammasi"],

    isSuperAdmin && hasClientAccounting && ["clients", "Mijozlar"],

    canViewProduction && ["workers", "Ishchilar"],

    hasSupplierAccounting && ["suppliers", "Yetkazib beruvchilar"],
  ].filter(Boolean);

  const activityItems = [
    isSuperAdmin &&
      hasClientAccounting && {
        label: "Savdo",
        value: data.sales,
        color: "#b4232b",
      },

    hasSupplierAccounting && {
      label: "Homashyo xaridi",
      value: data.purchases,
      color: "#ed921f",
    },

    canViewProduction && {
      label: "Ishlab chiqarish",
      value: data.productionAmount,
      color: "#6d50d5",
    },
  ].filter(Boolean);

  const trendPresentation = {
    sales: {
      title: "Savdo dinamikasi",
      subtitle: "Oxirgi 6 oydagi haqiqiy savdo summasi",
      label: "Savdo",
      color: "#b4232b",
    },

    production: {
      title: "Ishlab chiqarish dinamikasi",
      subtitle: "Oxirgi 6 oydagi hisoblangan ishlab chiqarish summasi",
      label: "Ishlab chiqarish",
      color: "#6d50d5",
    },

    purchases: {
      title: "Homashyo xaridi dinamikasi",
      subtitle: "Oxirgi 6 oydagi homashyo xaridlari summasi",
      label: "Homashyo xaridi",
      color: "#ed921f",
    },
  }[trendMode];

  return (
    <Box className="crm-page h-full overflow-auto pr-1">
      <style>{dashboardStyles}</style>

      <Box
        sx={{
          mb: 2.5,
          p: {
            xs: 2.5,
            sm: 3,
          },
          display: "flex",
          flexDirection: {
            xs: "column",
            xl: "row",
          },
          alignItems: {
            xs: "flex-start",
            xl: "center",
          },
          justifyContent: "space-between",
          gap: 2.5,
          overflow: "hidden",
          borderRadius: "24px",
          border: "1px solid rgba(226,232,240,.9)",
          background:
            "radial-gradient(circle at 98% 0%,rgba(143,29,32,.075),transparent 28%),linear-gradient(145deg,#ffffff,#fafafa)",
          boxShadow: "0 15px 42px rgba(15,23,42,.055)",
        }}
      >
        <Box>
          <Box
            sx={{
              mb: 1.2,
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <Box
              sx={{
                width: 25,
                height: 2,
                borderRadius: 99,
                background: "linear-gradient(90deg,#7f1d1d,#dc2626)",
              }}
            />

            <Typography
              sx={{
                color: "#8f1d20",
                fontSize: 10,
                fontWeight: 950,
                letterSpacing: ".13em",
                textTransform: "uppercase",
              }}
            >
              Boshqaruv paneli
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              color: "#0f172a",
              fontSize: {
                xs: 26,
                sm: 30,
              },
              lineHeight: 1.15,
              fontWeight: 950,
              letterSpacing: "-.04em",
            }}
          >
            Asosiy ko'rsatkichlar
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#94a3b8",
              fontSize: 13,
              lineHeight: 1.7,
              fontWeight: 600,
            }}
          >
            Salom,{" "}
            <Box
              component="span"
              sx={{
                color: "#8f1d20",
                fontWeight: 850,
              }}
            >
              {user?.first_name || "Admin"}
            </Box>
            . Sizga ochilgan bo'limlar bo'yicha tanlangan davr natijalari.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 1,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            backgroundColor: "rgba(255,255,255,.92)",
            boxShadow: "0 10px 25px rgba(15,23,42,.045)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              pr: {
                sm: 1,
              },
              borderRight: {
                sm: "1px solid #e2e8f0",
              },
            }}
          >
            <Button
              onClick={() => {
                const range = monthRange();

                setFilterForm(range);
                setAppliedRange(range);
              }}
              sx={presetButtonSx}
            >
              Bu oy
            </Button>

            <Button
              onClick={() => {
                const range = previousMonthRange();

                setFilterForm(range);
                setAppliedRange(range);
              }}
              sx={presetButtonSx}
            >
              O'tgan oy
            </Button>
          </Box>

          <TextField
            label="Dan"
            type="date"
            size="small"
            value={filterForm.date_from}
            onChange={(event) =>
              setFilterForm((current) => ({
                ...current,
                date_from: event.target.value,
              }))
            }
            InputLabelProps={{
              shrink: true,
            }}
            sx={dateFieldSx}
          />

          <TextField
            label="Gacha"
            type="date"
            size="small"
            value={filterForm.date_to}
            onChange={(event) =>
              setFilterForm((current) => ({
                ...current,
                date_to: event.target.value,
              }))
            }
            InputLabelProps={{
              shrink: true,
            }}
            sx={dateFieldSx}
          />

          <Button
            variant="contained"
            onClick={() => setAppliedRange(filterForm)}
            sx={applyButtonSx}
          >
            Ko'rish
          </Button>
        </Paper>
      </Box>

      <Box
        sx={{
          mb: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,minmax(0,1fr))",
            xl: "repeat(5,minmax(0,1fr))",
          },
          gap: 2,
        }}
      >
        {isSuperAdmin && hasClientAccounting && (
          <KpiCard
            label="Jami savdo"
            value={money(data.sales)}
            helper={`${number(data.salesCount)} ta savdo · tanlangan davr`}
            icon={TrendUpIcon}
            tone="red"
          />
        )}

        {isSuperAdmin && hasClientAccounting && (
          <KpiCard
            label="Mijozlardan tushum"
            value={money(data.clientIncome)}
            helper={`Mijozlar qarzi: ${money(data.clientDebt)}`}
            icon={CoinsIcon}
            tone="green"
          />
        )}

        {canViewProduction && (
          <KpiCard
            label="Tayyor mahsulot"
            value={`${number(data.productionQuantity)} par`}
            helper={`Hisoblangan summa: ${money(data.productionAmount)}`}
            icon={BoxIcon}
            tone="violet"
          />
        )}

        {hasSupplierAccounting && (
          <KpiCard
            label="Homashyo xaridi"
            value={money(data.purchases)}
            helper={`${number(data.purchasesCount)} ta xarid · tanlangan davr`}
            icon={AlertIcon}
            tone="amber"
          />
        )}

        {canViewInventory && (
          <KpiCard
            label="Ombordagi jami qoldiq"
            value={`${number(inventory.summary.total_quantity)} birlik`}
            helper={`${number(inventory.summary.warehouses_count)} ta faol ombor`}
            icon={BoxIcon}
            tone="blue"
          />
        )}
      </Box>

      <Box
        sx={{
          mb: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0,1.55fr) minmax(320px,.72fr)",
          },
          gap: 2,
          alignItems: "start",
        }}
      >
        {trendPresentation && trend.length > 0 && (
          <Section
            title={trendPresentation.title}
            subtitle={trendPresentation.subtitle}
            action={<Chip size="small" label="Oxirgi 6 oy" sx={redSoftChipSx} />}
          >
            <SalesTrendChart
              items={trend}
              title={trendPresentation.label}
              color={trendPresentation.color}
            />

            <TrendSummaryCards items={trend} />
          </Section>
        )}

        <Box
          sx={{
            display: "grid",
            gap: 2,
          }}
        >
          {activityItems.length > 0 && (
            <Section
              title="Faoliyat tarkibi"
              subtitle="Tanlangan davrdagi yo‘nalishlar ulushi"
              action={
                <Chip
                  size="small"
                  label={`${appliedRange.date_from} / ${appliedRange.date_to}`}
                  sx={neutralChipSx}
                />
              }
            >
              <ActivityDonut items={activityItems} />
            </Section>
          )}

          <Section title="Muhim eslatmalar" subtitle="E’tibor talab qiladigan holatlar">
            {attentionItems.length ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.15,
                }}
              >
                {attentionItems.slice(0, 4).map((item) => (
                  <Box
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    sx={{
                      minHeight: 58,
                      p: 1.35,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.35,
                      cursor: "pointer",
                      borderRadius: "14px",
                      border: "1px solid #e8edf2",
                      backgroundColor: "#fafbfc",
                      transition: "transform .18s ease,border-color .18s ease",

                      "&:hover": {
                        transform: "translateX(2px)",
                        borderColor: "rgba(143,29,32,.16)",
                        backgroundColor: "#ffffff",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
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
                          color: "#475569",
                          fontSize: 10.5,
                          fontWeight: 900,
                        }}
                      >
                        {item.label}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.4,
                          color: "#94a3b8",
                          fontSize: 9.5,
                        }}
                      >
                        {item.helper}
                      </Typography>
                    </Box>

                    <Typography
                      noWrap
                      sx={{
                        maxWidth: 125,
                        color: "#0f172a",
                        fontSize: 10,
                        fontWeight: 950,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Empty>Hozircha muhim ogohlantirish yo'q.</Empty>
            )}
          </Section>
        </Box>
      </Box>

      {canViewProduction && (
        <Section
          title="Bo‘limlar kesimi"
          subtitle="Tanlangan davrdagi bajarilgan ishlar miqdori"
          className="mb-5"
        >
          {departments.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2,minmax(0,1fr))",
                  xl: "repeat(3,minmax(0,1fr))",
                },
                gap: 2,
              }}
            >
              {departments.slice(0, 6).map((department, index) => (
                <Box
                  key={department.group_id || `${department.group_name || "department"}-${index}`}
                  sx={{
                    p: 1.8,
                    borderRadius: "16px",
                    border: "1px solid #e8edf2",
                    background: "linear-gradient(145deg,#ffffff,#f8fafc)",
                  }}
                >
                  <ProgressList
                    items={[department]}
                    valueKey="total_quantity"
                    color="#7157cf"
                    quantity
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Empty>Bo‘limlar bo‘yicha ma’lumot yo‘q.</Empty>
          )}
        </Section>
      )}

      <Box
        sx={{
          mb: 2,
          width: "fit-content",
          maxWidth: "100%",
          p: 0.75,
          display: "flex",
          gap: 0.5,
          overflowX: "auto",
          borderRadius: "15px",
          border: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          boxShadow: "0 8px 22px rgba(15,23,42,.035)",
        }}
      >
        {filters.map(([value, label]) => (
          <Button
            key={value}
            className={
              sectionFilter === value
                ? "aa-dashboard-tab aa-dashboard-tab-active"
                : "aa-dashboard-tab"
            }
            onClick={() => setSectionFilter(value)}
            sx={sectionFilter === value ? activeTabSx : tabSx}
          >
            {label}
          </Button>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "1fr 1fr",
          },
          gap: 2,
        }}
      >
        {showClient && (
          <Section
            title="So‘nggi mijozlar va savdo"
            subtitle="Mijozlar kesimidagi savdo, to‘lov va qarz"
            action={<LinkButton onClick={() => navigate("/client-sales")}>Barchasi</LinkButton>}
          >
            {clients.length ? (
              <Box
                sx={{
                  overflowX: "auto",
                }}
              >
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mijoz</TableCell>

                      <TableCell>Jami savdo</TableCell>

                      <TableCell>To‘langan</TableCell>

                      <TableCell>Qarz</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {clients.slice(0, 6).map((client, index) => (
                      <TableRow key={client.group_id || client.client_id || index} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.2,
                            }}
                          >
                            <Avatar sx={clientAvatarSx}>
                              {(client.group_name || "M")[0].toUpperCase()}
                            </Avatar>

                            <Typography
                              sx={{
                                color: "#475569",
                                fontSize: 11,
                                fontWeight: 900,
                              }}
                            >
                              {client.group_name || "Mijoz"}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>{money(client.total_amount)}</TableCell>

                        <TableCell>{money(client.paid_amount)}</TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={money(client.debt_amount)}
                            sx={Number(client.debt_amount) > 0 ? warningChipSx : successChipSx}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Empty>Mijozlar bo‘yicha ma’lumot yo‘q.</Empty>
            )}
          </Section>
        )}

        {showWorkers && (
          <Section
            title="Ishchilar samaradorligi"
            subtitle="Hisoblangan ish summasi bo‘yicha"
            action={<LinkButton onClick={() => navigate("/worker-outputs")}>Barchasi</LinkButton>}
          >
            {workers.length ? (
              <ProgressList items={workers} valueKey="total_amount" color="#179b60" />
            ) : (
              <Empty>Ishchilar bo‘yicha yozuv yo‘q.</Empty>
            )}
          </Section>
        )}

        {showSupplier && (
          <Section
            title="Oxirgi homashyo xaridlari"
            subtitle="Yetkazib beruvchilardan olingan so‘nggi xaridlar"
            action={
              <LinkButton onClick={() => navigate("/material-purchases")}>Barchasi</LinkButton>
            }
          >
            {purchases.length ? (
              <Box
                sx={{
                  overflowX: "auto",
                }}
              >
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Yetkazib beruvchi</TableCell>

                      <TableCell>Sana</TableCell>

                      <TableCell>Jami</TableCell>

                      <TableCell>Holat</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {purchases.slice(0, 6).map((purchase) => (
                      <TableRow key={purchase.id} hover>
                        <TableCell>
                          <Typography
                            sx={{
                              color: "#475569",
                              fontSize: 11,
                              fontWeight: 900,
                            }}
                          >
                            {purchase.supplier_name || "Ta’minotchi"}
                          </Typography>
                        </TableCell>

                        <TableCell>{date(purchase.purchased_at || purchase.created_at)}</TableCell>

                        <TableCell>{money(purchase.total_amount ?? purchase.subtotal)}</TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              purchase.status === "active" ? "Faol" : purchase.status || "Faol"
                            }
                            sx={successChipSx}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Empty>Homashyo xaridlari topilmadi.</Empty>
            )}
          </Section>
        )}

        {canViewInventory && (
          <Box
            sx={{
              gridColumn: {
                xs: "auto",
                xl: "1 / -1",
              },
            }}
          >
            <Section
              title="Omborlar holati"
              subtitle="Faol omborlardagi qoldiq va ogohlantirishlar"
              action={
                <LinkButton onClick={() => navigate("/inventory")}>Omborlarga o‘tish</LinkButton>
              }
            >
              {inventory.warehouses.length ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2,minmax(0,1fr))",
                      xl: "repeat(3,minmax(0,1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  {inventory.warehouses.map((warehouse) => {
                    const warning = Number(warehouse.low_stock_lines) > 0;

                    return (
                      <Box
                        key={warehouse.id}
                        onClick={() => navigate(`/inventory/warehouses/${warehouse.id}`)}
                        sx={{
                          p: 2,
                          cursor: "pointer",
                          borderRadius: "18px",
                          border: "1px solid #e7ebf0",
                          background: "linear-gradient(145deg,#ffffff,#f8fafc)",
                          transition:
                            "transform .2s ease,border-color .2s ease,box-shadow .2s ease",

                          "&:hover": {
                            transform: "translateY(-3px)",
                            borderColor: "rgba(143,29,32,.16)",
                            boxShadow: "0 16px 35px rgba(15,23,42,.07)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.4,
                          }}
                        >
                          <Box sx={warehouseIconSx}>
                            <Box
                              component="img"
                              src={BoxIcon}
                              alt=""
                              sx={{
                                width: 17,
                                height: 17,
                                opacity: 0.75,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <Typography
                              noWrap
                              sx={{
                                color: "#334155",
                                fontSize: 13,
                                fontWeight: 950,
                              }}
                            >
                              {warehouse.name}
                            </Typography>

                            <Typography
                              noWrap
                              sx={{
                                mt: 0.5,
                                color: "#94a3b8",
                                fontSize: 10,
                              }}
                            >
                              {warehouse.location || warehouse.code || "Ombor"}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={
                              warning ? `${number(warehouse.low_stock_lines)} ta kam` : "Me’yorda"
                            }
                            sx={warning ? warningChipSx : successChipSx}
                          />
                        </Box>

                        <Box
                          sx={{
                            mt: 2,
                            pt: 1.6,
                            display: "grid",
                            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                            gap: 1,
                            borderTop: "1px solid #edf0f3",
                          }}
                        >
                          {[
                            ["Pozitsiya", warehouse.stock_lines],

                            ["Jami qoldiq", warehouse.total_quantity],

                            ["Tugagan", warehouse.empty_lines],
                          ].map(([label, value]) => (
                            <Box key={label}>
                              <Typography
                                sx={{
                                  color: "#94a3b8",
                                  fontSize: 9,
                                  fontWeight: 750,
                                }}
                              >
                                {label}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.6,
                                  color: "#334155",
                                  fontSize: 14,
                                  fontWeight: 950,
                                }}
                              >
                                {number(value)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Empty>Faol ombor topilmadi.</Empty>
              )}
            </Section>
          </Box>
        )}

        {canViewFinance && (
          <Box
            component="section"
            className="aa-dark-balance"
            sx={{
              position: "relative",
              isolation: "isolate",
              gridColumn: {
                xs: "auto",
                xl: "1 / -1",
              },
              minHeight: 260,
              p: {
                xs: 2.5,
                sm: 3,
              },
              overflow: "hidden",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,.08)",
              color: "#ffffff",
              backgroundColor: "#0d1117 !important",
              backgroundImage:
                "radial-gradient(circle at 96% 0%,rgba(220,38,38,.34),transparent 32%),linear-gradient(145deg,#0d1117 0%,#171117 52%,#3a121a 100%) !important",
              boxShadow: "0 24px 60px rgba(15,23,42,.22)",

              "&::before": {
                content: '""',
                position: "absolute",
                width: 380,
                height: 380,
                top: -265,
                right: -210,
                borderRadius: "50%",
                border: "1px solid rgba(248,113,113,.17)",
                boxShadow: "0 0 0 62px rgba(248,113,113,.025),0 0 0 124px rgba(248,113,113,.015)",
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
              }}
            >
              <Box
                sx={{
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
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#ffffff !important",
                      fontSize: 18,
                      fontWeight: 950,
                    }}
                  >
                    Moliyaviy holat
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.8,
                      color: "rgba(255,255,255,.48) !important",
                      fontSize: 11.5,
                    }}
                  >
                    Hisoblardagi real pul va asosiy majburiyatlar
                  </Typography>
                </Box>

                <Box sx={liveBadgeSx}>
                  <Box sx={liveDotSx} />

                  <Typography
                    sx={{
                      color: "rgba(255,255,255,.68) !important",
                      fontSize: 10,
                      fontWeight: 850,
                    }}
                  >
                    Jonli ma’lumot
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  mt: 3.5,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2,minmax(0,1fr))",
                    xl: "repeat(4,minmax(0,1fr))",
                  },
                  gap: 1.5,
                }}
              >
                <DarkBalanceItem
                  icon="F"
                  iconTone="red"
                  label="Foydalanuvchilar"
                  value={number(data.users)}
                  helper="Tizimdagi foydalanuvchilar soni"
                />

                <DarkBalanceItem
                  icon="M"
                  iconTone="violet"
                  label="Mahsulotlar"
                  value={number(data.products)}
                  helper="Katalogdagi mahsulotlar soni"
                />

                <DarkBalanceItem
                  icon="+"
                  iconTone="green"
                  label="Mijozlardan olinadigan"
                  value={money(data.clientDebt)}
                  valueColor="#86efac"
                  helper="Mijozlarning umumiy qarzdorligi"
                />

                <DarkBalanceItem
                  icon={Number(data.cashBalance) >= 0 ? "↑" : "↓"}
                  iconTone={Number(data.cashBalance) >= 0 ? "green" : "rose"}
                  label="Pul mablag‘lari"
                  value={money(data.cashBalance)}
                  valueColor={Number(data.cashBalance) >= 0 ? "#86efac" : "#fda4af"}
                  helper="Kassa, karta va bank hisoblari jami"
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const DarkBalanceItem = ({ icon, iconTone, label, value, valueColor = "#ffffff", helper }) => {
  const tone = {
    red: {
      color: "#fecdd3",
      bg: "rgba(220,38,38,.14)",
      border: "rgba(248,113,113,.11)",
    },

    violet: {
      color: "#ddd6fe",
      bg: "rgba(124,58,237,.15)",
      border: "rgba(167,139,250,.11)",
    },

    green: {
      color: "#bbf7d0",
      bg: "rgba(34,197,94,.13)",
      border: "rgba(74,222,128,.11)",
    },

    rose: {
      color: "#fecdd3",
      bg: "rgba(244,63,94,.13)",
      border: "rgba(251,113,133,.11)",
    },
  }[iconTone];

  return (
    <Box sx={darkBalanceItemSx}>
      <Box
        sx={{
          width: 38,
          height: 38,
          display: "grid",
          placeItems: "center",
          borderRadius: "12px",
          color: tone.color,
          fontSize: 14,
          fontWeight: 950,
          backgroundColor: tone.bg,
          border: `1px solid ${tone.border}`,
        }}
      >
        {icon}
      </Box>

      <Typography sx={darkBalanceLabelSx}>{label}</Typography>

      <Typography
        sx={{
          ...darkBalanceValueSx,
          color: `${valueColor} !important`,
        }}
      >
        {value}
      </Typography>

      <Typography sx={darkBalanceHelperSx}>{helper}</Typography>
    </Box>
  );
};

const dashboardStyles = `
  .crm-page .aa-dashboard-tab-active,
  .crm-page .aa-dashboard-tab-active:hover {
    color: #ffffff !important;
    background: linear-gradient(
      135deg,
      #7f1d1d,
      #b91c1c
    ) !important;
    box-shadow:
      0 8px 18px rgba(127,29,29,.20) !important;
  }

  .crm-page .aa-dark-balance {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 96% 0%,
        rgba(220,38,38,.34),
        transparent 32%
      ),
      linear-gradient(
        145deg,
        #0d1117 0%,
        #171117 52%,
        #3a121a 100%
      ) !important;
  }
`;

const presetButtonSx = {
  minHeight: 38,
  px: 1.4,
  color: "#687385",
  borderRadius: 2.5,
  fontSize: 11,
  fontWeight: 900,
  textTransform: "none",

  "&:hover": {
    color: "#8f1d20",
    backgroundColor: "rgba(143,29,32,.055)",
  },
};

const dateFieldSx = {
  width: {
    xs: "100%",
    sm: 138,
  },

  flex: {
    xs: "1 1 calc(50% - 5px)",
    sm: "0 0 auto",
  },

  "& .MuiOutlinedInput-root": {
    minHeight: 40,
    borderRadius: 2.7,
    backgroundColor: "#f8fafc",
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#e1e6ec",
  },

  "& .MuiInputLabel-root": {
    fontSize: 12,
  },
};

const applyButtonSx = {
  width: {
    xs: "100%",
    sm: "auto",
  },

  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: 2.7,
  fontSize: 11.5,
  fontWeight: 900,
  textTransform: "none",
  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
  boxShadow: "0 9px 20px rgba(127,29,29,.17)",

  "&:hover": {
    background: "linear-gradient(135deg,#681818,#991b1b)",
  },
};

const tabSx = {
  minHeight: 36,
  px: 1.8,
  flexShrink: 0,
  color: "#747e8e",
  borderRadius: 2.5,
  fontSize: 11,
  fontWeight: 900,
  textTransform: "none",
};

const activeTabSx = {
  ...tabSx,

  color: "#ffffff !important",

  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",

  boxShadow: "0 8px 18px rgba(127,29,29,.20)",

  "&.MuiButton-root": {
    color: "#ffffff !important",
  },

  "&:hover": {
    color: "#ffffff !important",

    background: "linear-gradient(135deg,#681818,#991b1b)",
  },
};

const warningChipSx = {
  height: 23,
  color: "#a55b0b",
  backgroundColor: "rgba(245,158,11,.12)",
  fontSize: 9,
  fontWeight: 900,
};

const successChipSx = {
  height: 23,
  color: "#16804d",
  backgroundColor: "rgba(34,197,94,.10)",
  fontSize: 9,
  fontWeight: 900,
};

const redSoftChipSx = {
  height: 25,
  color: "#8f1d20",
  fontSize: 9,
  fontWeight: 900,
  backgroundColor: "rgba(143,29,32,.07)",
};

const neutralChipSx = {
  height: 24,
  color: "#64748b",
  fontSize: 8.5,
  fontWeight: 850,
  backgroundColor: "#f1f5f9",
};

const clientAvatarSx = {
  width: 31,
  height: 31,
  color: "#8f1d20",
  fontSize: 11,
  fontWeight: 900,
  backgroundColor: "rgba(143,29,32,.075)",
};

const warehouseIconSx = {
  width: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  borderRadius: "13px",
  backgroundColor: "rgba(143,29,32,.07)",
};

const liveBadgeSx = {
  px: 1.5,
  py: 0.9,
  display: "flex",
  alignItems: "center",
  gap: 1,
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,.09)",
  backgroundColor: "rgba(255,255,255,.05)",
};

const liveDotSx = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  backgroundColor: "#22c55e",
  boxShadow: "0 0 0 5px rgba(34,197,94,.10)",
};

const darkBalanceItemSx = {
  minWidth: 0,
  minHeight: 162,
  p: 2,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,.075)",
  background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.035)",
  backdropFilter: "blur(14px)",
};

const darkBalanceLabelSx = {
  mt: 1.7,
  color: "rgba(255,255,255,.50) !important",
  fontSize: 10.5,
  lineHeight: 1.3,
  fontWeight: 750,
};

const darkBalanceValueSx = {
  width: "100%",
  mt: 0.9,
  overflow: "hidden",
  fontSize: {
    xs: 19,
    sm: 21,
  },
  lineHeight: 1.15,
  fontWeight: 950,
  letterSpacing: "-.035em",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const darkBalanceHelperSx = {
  mt: 1,
  color: "rgba(255,255,255,.32) !important",
  fontSize: 9.5,
  lineHeight: 1.5,
  fontWeight: 500,
};

const tableSx = {
  minWidth: 570,

  "& .MuiTableCell-root": {
    px: 1.2,
    py: 1.25,
    color: "#5d6777",
    fontSize: 10.5,
    borderColor: "#edf0f3",
  },

  "& .MuiTableHead-root .MuiTableCell-root": {
    color: "#929aa7",
    backgroundColor: "#fafbfc",
    fontSize: 9.5,
    fontWeight: 900,
    letterSpacing: ".035em",
    textTransform: "uppercase",
  },
};

export default AdminOverview;
