import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import PremiumDialog from "../../Components/UI/PremiumDialog";
import { getDashboardBreakdown } from "../../api/dashboard";

/**
 * KPI kartasi bosilganda ochiladigan tafsilot.
 *
 * Tepasida — kartadagi bilan bir xil jami, pastida esa u nimadan yig'ilgani.
 * Jami ham, qatorlar ham bitta so'rovdan keladi, shuning uchun ular
 * hech qachon bir-biriga zid bo'lmaydi.
 */

const money = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Math.round(Number(value || 0)))} so'm`;
const qty = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

/** Har bir tur uchun: sarlavha, jami satri va jadval ustunlari. */
const VIEWS = {
  sales: {
    title: "Jami savdo",
    subtitle: "Qaysi mijozga qancha sotilgan",
    summary: (total) => [
      { label: "Jami summa", value: money(total.amount), strong: true },
      { label: "Savdolar soni", value: `${qty(total.count)} ta` },
      { label: "Miqdor", value: `${qty(total.quantity)} dona` },
    ],
    columns: ["Mijoz", "Savdo", "Miqdor", "Summa", "To‘landi", "Qarz"],
    row: (row) => [
      { text: row.client_name, primary: true },
      { text: `${qty(row.sales_count)} ta` },
      { text: qty(row.quantity), num: true },
      { text: money(row.amount), num: true, strong: true },
      { text: money(row.paid), num: true },
      { text: money(row.debt), num: true, tone: row.debt > 0 ? "danger" : undefined },
    ],
  },

  client_income: {
    title: "Mijozlardan tushum",
    subtitle: "Qaysi mijoz qancha pul bergan",
    summary: (total) => [
      { label: "Jami tushum", value: money(total.amount), strong: true },
      { label: "Savdo paytida", value: money(total.at_sale) },
      { label: "Keyingi to‘lovlar", value: money(total.later) },
    ],
    columns: ["Mijoz", "Savdo paytida", "Keyin to‘lagan", "Jami"],
    row: (row) => [
      { text: row.client_name, primary: true },
      { text: money(row.at_sale), num: true },
      { text: money(row.later), num: true },
      { text: money(row.amount), num: true, strong: true },
    ],
  },

  production: {
    title: "Tayyor mahsulot",
    subtitle: "Yakunlovchi bosqichdan chiqqan mahsulotlar",
    summary: (total) => [
      { label: "Jami", value: `${qty(total.quantity)} par`, strong: true },
      { label: "Hisoblangan ish haqi", value: money(total.amount) },
    ],
    columns: ["Mahsulot", "Rangi", "Material", "Padoj", "Partiya", "Soni"],
    row: (row) => [
      {
        text: row.product_name,
        hint: row.size_from && row.size_to ? `${row.size_from} - ${row.size_to}` : null,
        primary: true,
      },
      { text: row.color || "—" },
      { text: row.material_name || "—" },
      { text: row.sole_name || "—" },
      { text: row.batch_number || "—", mono: true },
      { text: `${qty(row.quantity)} ${row.unit || "par"}`, num: true, strong: true },
    ],
  },

  purchases: {
    title: "Xomashyo xaridi",
    subtitle: "Qaysi ta’minotchidan qanday xomashyo olingan",
    summary: (total) => [
      { label: "Jami summa", value: money(total.amount), strong: true },
      { label: "Ta’minotchilar", value: `${qty(total.suppliers)} ta` },
    ],
    columns: ["Ta’minotchi", "Xomashyo", "Miqdor", "Birlik narxi", "Summa"],
    row: (row) => [
      { text: row.supplier_name, primary: true },
      { text: row.material_name },
      { text: `${qty(row.quantity)} ${row.unit || ""}`, num: true },
      { text: money(row.unit_price), num: true },
      { text: money(row.amount), num: true, strong: true },
    ],
  },

  inventory: {
    title: "Ombordagi qoldiq",
    subtitle: "Qaysi omborda nima turibdi",
    // Dona, juft va kilogrammni qo'shib bo'lmaydi — har biri alohida chiqadi.
    summary: (total) => [
      ...total.units.map((unit) => ({
        label: unit.unit,
        value: qty(unit.quantity),
        strong: true,
      })),
      { label: "Faol ombor", value: `${qty(total.warehouses)} ta` },
    ],
    columns: ["Ombor", "Birlik", "Nomlar", "Qoldiq"],
    row: (row) => [
      { text: row.warehouse_name, hint: row.warehouse_code, primary: true },
      { text: row.unit },
      { text: `${qty(row.item_lines)} nom` },
      { text: `${qty(row.quantity)} ${row.unit}`, num: true, strong: true },
    ],
  },

  cash: {
    title: "Kassa",
    subtitle: "Qancha kirdi, qayerga ketdi, qancha qoldi",
    summary: (total) => [
      { label: "Hisoblardagi qoldiq", value: money(total.balance), strong: true },
      { label: "Davrda kirdi", value: money(total.income), tone: "ok" },
      { label: "Davrda chiqdi", value: money(total.spent), tone: "danger" },
      { label: "Farqi", value: money(total.remainder) },
    ],
    columns: ["Nima", "Yo‘nalish", "Summa"],
    row: (row) => [
      { text: row.label, primary: true },
      { text: row.direction === "in" ? "kirim" : "chiqim" },
      {
        text: `${row.direction === "in" ? "+" : "−"} ${money(row.amount)}`,
        num: true,
        strong: true,
        tone: row.direction === "in" ? "ok" : "danger",
      },
    ],
  },
};

const toneColor = (tone) =>
  tone === "danger" ? "var(--aa-danger)" : tone === "ok" ? "var(--aa-success)" : "var(--aa-text)";

const KpiBreakdownDialog = ({ type, range, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!type) return undefined;

    let cancelled = false;
    setLoading(true);
    setError("");

    getDashboardBreakdown(type, range)
      .then(({ data }) => {
        if (!cancelled) setPayload(data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setPayload(null);
          setError(requestError?.response?.data?.message || "Ma'lumotni olishda xato.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range, type]);

  const view = type ? VIEWS[type] : null;
  if (!view) return null;

  return (
    <PremiumDialog
      open={Boolean(type)}
      onClose={onClose}
      maxWidth="md"
      title={view.title}
      subtitle={view.subtitle}
      actions={
        <Button onClick={onClose} sx={closeSx}>
          Yopish
        </Button>
      }
    >
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 200 }}>
          <CircularProgress size={28} sx={{ color: "#991b1b" }} />
        </Box>
      ) : error ? (
        <Typography sx={{ py: 5, textAlign: "center", color: "var(--aa-text-tertiary)" }}>
          {error}
        </Typography>
      ) : (
        <>
          {/* Jami — kartadagi raqam bilan bir xil manbadan. */}
          <Box
            sx={{
              mb: 2.2,
              p: 1.8,
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                sm: "repeat(auto-fit,minmax(140px,1fr))",
              },
              gap: 1.8,
              borderRadius: "16px",
              border: "1px solid var(--aa-border)",
              backgroundColor: "var(--aa-surface-muted)",
            }}
          >
            {view.summary(payload.total).map((item) => (
              <Box key={item.label} sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "var(--aa-text-tertiary)",
                    fontSize: 9.5,
                    fontWeight: 900,
                    letterSpacing: ".05em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,
                    color: toneColor(item.tone),
                    fontSize: item.strong ? 17 : 14,
                    fontWeight: item.strong ? 950 : 800,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>

          {payload.rows.length ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table
                size="small"
                sx={{
                  minWidth: view.columns.length > 4 ? 640 : 460,
                  "& th": {
                    py: 1.1,
                    color: "var(--aa-text-tertiary)",
                    fontSize: 9.5,
                    fontWeight: 900,
                    letterSpacing: ".045em",
                    textTransform: "uppercase",
                    borderColor: "var(--aa-border)",
                    whiteSpace: "nowrap",
                  },
                  "& td": {
                    py: 1.1,
                    color: "var(--aa-text-secondary)",
                    fontSize: 11.5,
                    borderColor: "var(--aa-border)",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    {view.columns.map((column, index) => (
                      <TableCell key={column} align={index === 0 ? "left" : "right"}>
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {payload.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} hover>
                      {view.row(row).map((cell, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          align={cellIndex === 0 ? "left" : "right"}
                          sx={{
                            color: cell.tone ? toneColor(cell.tone) : undefined,
                            fontWeight: cell.strong ? 900 : cell.primary ? 850 : undefined,
                            fontFamily: cell.mono ? "ui-monospace, Consolas, monospace" : undefined,
                            whiteSpace: cell.num ? "nowrap" : undefined,
                            ...(cell.primary ? { color: "var(--aa-text)" } : null),
                          }}
                        >
                          {cell.text}
                          {cell.hint && (
                            <Typography
                              component="span"
                              sx={{
                                display: "block",
                                color: "var(--aa-text-tertiary)",
                                fontSize: 9.5,
                                fontWeight: 700,
                              }}
                            >
                              {cell.hint}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Box
              sx={{
                minHeight: 130,
                display: "grid",
                placeItems: "center",
                borderRadius: "14px",
                border: "1px dashed var(--aa-border-strong)",
              }}
            >
              <Typography
                sx={{ color: "var(--aa-text-tertiary)", fontSize: 11.5, fontWeight: 700 }}
              >
                Tanlangan davrda yozuv yo‘q
              </Typography>
            </Box>
          )}

          {payload.rows.length > 0 && (
            <Chip
              size="small"
              label={`${qty(payload.rows.length)} qator`}
              sx={{
                mt: 1.6,
                height: 24,
                color: "var(--aa-text-secondary)",
                fontSize: 9.5,
                fontWeight: 900,
                backgroundColor: "var(--aa-surface-muted)",
              }}
            />
          )}
        </>
      )}
    </PremiumDialog>
  );
};

const closeSx = {
  minHeight: 42,
  px: 2.4,
  color: "var(--aa-text-secondary)",
  borderRadius: "12px",
  fontSize: 11.5,
  fontWeight: 850,
  textTransform: "none",
};

export default KpiBreakdownDialog;
