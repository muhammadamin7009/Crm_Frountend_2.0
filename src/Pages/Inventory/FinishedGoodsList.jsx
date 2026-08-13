import { Box, Chip, CircularProgress, InputBase, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getFinishedGoods } from "../../api/inventory";

/**
 * Tayyor mahsulot ombori — model va o'lcham bo'yicha guruhlangan.
 *
 * Ilgari har bir model x o'lcham x rang alohida qator edi va ro'yxat yuzlab
 * qatorga cho'zilardi. Endi uch pog'ona: model ustiga bosilganda o'lchamlar,
 * o'lcham ustiga bosilganda variantlar ochiladi.
 *
 * Variantni faqat rang emas, PADOJ va MATERIAL ham ajratadi — bir xil rangdagi
 * ikki qator har xil padoj bilan omborda aralashmaydi.
 */

const formatNumber = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const cardSx = {
  borderRadius: "16px",
  border: "1px solid var(--aa-border)",
  backgroundColor: "var(--aa-surface-solid)",
};

const FinishedGoodsList = ({ warehouseId, lowOnly = false, onClearLowOnly }) => {
  const [loading, setLoading] = useState(true);
  const [allGroups, setAllGroups] = useState([]);
  const [query, setQuery] = useState("");

  // Qaysi model va o'lcham ochiq. Model bosilmaguncha ichi yuklanmaydi ham,
  // chizilmaydi ham — ro'yxat qisqa turadi.
  const [openModels, setOpenModels] = useState(() => new Set());
  const [openSizes, setOpenSizes] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getFinishedGoods({
        q: query.trim() || undefined,
        warehouse_id: warehouseId || undefined,
      });
      setAllGroups(data?.groups || []);
    } catch {
      setAllGroups([]);
    } finally {
      setLoading(false);
    }
  }, [query, warehouseId]);

  useEffect(() => {
    // Yozayotganda har harfda so'rov ketmasin.
    const timer = setTimeout(load, query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  // Ko'rsatkichlar to'liq ro'yxatdan hisoblanadi, "kam qolgan" filtri esa faqat
  // ko'rinadigan qatorlarni qisqartiradi.
  const totals = useMemo(
    () => ({
      models: allGroups.length,
      pairs: allGroups.reduce((sum, group) => sum + Number(group.total_quantity || 0), 0),
      low: allGroups.reduce((sum, group) => sum + Number(group.low_count || 0), 0),
    }),
    [allGroups],
  );

  /** Filtr yoqilganda faqat minimal qoldiqqa yetgan variantlar qoladi. */
  const groups = useMemo(() => {
    if (!lowOnly) return allGroups;

    return allGroups
      .map((group) => {
        const sizes = group.sizes
          .map((size) => {
            const variants = size.variants.filter((variant) => variant.is_low);

            return {
              ...size,
              variants,
              variant_count: variants.length,
              total_quantity: variants.reduce((sum, v) => sum + Number(v.quantity || 0), 0),
            };
          })
          .filter((size) => size.variants.length);

        return {
          ...group,
          sizes,
          total_quantity: sizes.reduce((sum, size) => sum + size.total_quantity, 0),
        };
      })
      .filter((group) => group.sizes.length);
  }, [allGroups, lowOnly]);

  // Filtr yoqilganda ro'yxat qisqa bo'ladi — hammasini ochib qo'yamiz, aks holda
  // foydalanuvchi yopiq akkordeonlarni birma-bir ochib chiqishi kerak bo'lardi.
  useEffect(() => {
    if (!lowOnly) return;

    setOpenModels(new Set(groups.map((group) => group.model)));
    setOpenSizes(
      new Set(groups.flatMap((group) => group.sizes.map((size) => `${group.model}:${size.label}`))),
    );
  }, [groups, lowOnly]);

  const toggle = (setter) => (key) =>
    setter((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleModel = toggle(setOpenModels);
  const toggleSize = toggle(setOpenSizes);

  return (
    <Box sx={{ ...cardSx, p: 2.2 }}>
      <Box
        sx={{
          mb: 1.8,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.2,
        }}
      >
        <Box>
          <Typography sx={{ color: "var(--aa-text)", fontSize: 15, fontWeight: 950 }}>
            Tayyor mahsulotlar
          </Typography>

          <Typography sx={{ mt: 0.4, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
            {formatNumber(totals.models)} model · {formatNumber(totals.pairs)} par
            {totals.low > 0 ? ` · ${formatNumber(totals.low)} pozitsiya kam qoldi` : ""}
          </Typography>

          {lowOnly && (
            <Chip
              size="small"
              label="Faqat kam qolganlar"
              onDelete={onClearLowOnly}
              sx={{
                mt: 0.8,
                height: 24,
                color: "#991b1b",
                fontSize: 9.5,
                fontWeight: 900,
                backgroundColor: "rgba(153,27,27,.08)",
                border: "1px solid rgba(153,27,27,.2)",
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.4,
            minHeight: 40,
            borderRadius: "12px",
            border: "1px solid var(--aa-border)",
            backgroundColor: "var(--aa-surface-muted)",
          }}
        >
          <Box component="span" aria-hidden="true" sx={{ color: "var(--aa-text-tertiary)" }}>
            ⌕
          </Box>

          <InputBase
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Model, rang yoki partiya raqami"
            inputProps={{ "aria-label": "Tayyor mahsulot qidirish" }}
            sx={{ flex: 1, color: "var(--aa-text)", fontSize: 12.5, minWidth: { sm: 240 } }}
          />
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 160 }}>
          <CircularProgress size={26} sx={{ color: "var(--aa-brand-500)" }} />
        </Box>
      ) : !groups.length ? (
        <Box
          sx={{
            minHeight: 160,
            display: "grid",
            placeItems: "center",
            borderRadius: "15px",
            border: "1px dashed var(--aa-border-strong)",
            backgroundColor: "var(--aa-surface-muted)",
          }}
        >
          <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 11.5, fontWeight: 700 }}>
            {lowOnly
              ? "Kam qolgan tayyor mahsulot yo‘q"
              : query
                ? `«${query}» bo‘yicha tayyor mahsulot topilmadi`
                : "Tayyor mahsulot yo‘q"}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1 }}>
          {groups.map((group) => {
            const modelOpen = openModels.has(group.model);

            return (
              <Box key={group.model} sx={{ ...cardSx, overflow: "hidden" }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => toggleModel(group.model)}
                  aria-expanded={modelOpen}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    width: "100%",
                    minHeight: 52,
                    px: 1.8,
                    cursor: "pointer",
                    color: "inherit",
                    border: 0,
                    background: "transparent",
                    textAlign: "left",
                    "&:hover": { backgroundColor: "var(--aa-surface-hover)" },
                  }}
                >
                  <Typography sx={{ color: "var(--aa-text)", fontSize: 13.5, fontWeight: 900 }}>
                    {group.model}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {group.low_count > 0 && (
                      <Chip
                        size="small"
                        label={`${group.low_count} kam`}
                        sx={{
                          height: 22,
                          color: "var(--aa-danger)",
                          fontSize: 9.5,
                          fontWeight: 900,
                          backgroundColor: "rgba(220,38,38,.12)",
                        }}
                      />
                    )}

                    <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 11.5, fontWeight: 800 }}>
                      {formatNumber(group.total_quantity)} par
                    </Typography>

                    <Box
                      component="span"
                      aria-hidden="true"
                      sx={{
                        color: "var(--aa-text-tertiary)",
                        fontSize: 9,
                        transform: modelOpen ? "none" : "rotate(-90deg)",
                        transition: "transform .18s ease",
                      }}
                    >
                      ▼
                    </Box>
                  </Box>
                </Box>

                {modelOpen && (
                  <Box sx={{ px: 1.2, pb: 1.2, display: "grid", gap: 0.8 }}>
                    {group.sizes.map((size) => {
                      const sizeKey = `${group.model}:${size.label}`;
                      const sizeOpen = openSizes.has(sizeKey);

                      return (
                        <Box
                          key={sizeKey}
                          sx={{
                            borderRadius: "13px",
                            border: "1px solid var(--aa-border)",
                            backgroundColor: "var(--aa-surface-muted)",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            component="button"
                            type="button"
                            onClick={() => toggleSize(sizeKey)}
                            aria-expanded={sizeOpen}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                              width: "100%",
                              minHeight: 44,
                              px: 1.5,
                              cursor: "pointer",
                              color: "inherit",
                              border: 0,
                              background: "transparent",
                              textAlign: "left",
                              "&:hover": { backgroundColor: "var(--aa-surface-hover)" },
                            }}
                          >
                            <Typography sx={{ color: "var(--aa-text)", fontSize: 12.5, fontWeight: 850 }}>
                              {size.label}
                            </Typography>

                            <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 10.5, fontWeight: 750 }}>
                              {size.variant_count} variant · {formatNumber(size.total_quantity)} par
                            </Typography>
                          </Box>

                          {sizeOpen && (
                            <Box sx={{ px: 1, pb: 1, display: "grid", gap: 0.7 }}>
                              {size.variants.map((variant) => (
                                <VariantRow key={variant.balance_id} variant={variant} />
                              ))}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

/** Bitta qoldiq qatori: rasm, rang, padoj, material, partiya, qoldiq. */
const VariantRow = ({ variant }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "44px 1fr", md: "44px 1fr 150px 120px" },
      alignItems: "center",
      gap: 1.2,
      p: 1,
      borderRadius: "11px",
      backgroundColor: "var(--aa-surface-solid)",
      border: "1px solid var(--aa-border)",
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        borderRadius: "10px",
        backgroundColor: "var(--aa-surface-muted)",
      }}
    >
      {variant.image_url ? (
        <Box
          component="img"
          src={variant.image_url}
          alt={variant.product_name}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 15, fontWeight: 900 }}>
          {(variant.color || variant.product_name || "?").charAt(0).toUpperCase()}
        </Typography>
      )}
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography noWrap sx={{ color: "var(--aa-text)", fontSize: 12, fontWeight: 850 }}>
        {variant.product_name}
        {variant.color ? ` · ${variant.color}` : ""}
      </Typography>

      <Typography noWrap sx={{ mt: 0.2, color: "var(--aa-text-tertiary)", fontSize: 10 }}>
        {/* Partiyasiz eski qoldiqda padoj va material bo'lmaydi. */}
        {[variant.sole_name, variant.material_name, variant.category_name]
          .filter(Boolean)
          .join(" · ") || "Partiya ma'lumoti yo‘q"}
      </Typography>
    </Box>

    <Box sx={{ display: { xs: "none", md: "block" } }}>
      {variant.batch_number ? (
        <Chip
          size="small"
          label={variant.batch_number}
          sx={{
            height: 22,
            color: "var(--aa-text-secondary)",
            fontSize: 9.5,
            fontWeight: 900,
            backgroundColor: "var(--aa-surface-muted)",
          }}
        />
      ) : null}
    </Box>

    <Box sx={{ textAlign: { md: "right" }, gridColumn: { xs: "2", md: "auto" } }}>
      <Typography
        sx={{
          color: variant.is_low ? "var(--aa-danger)" : "var(--aa-text)",
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {formatNumber(variant.quantity)} {variant.unit || "par"}
      </Typography>

      <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 9.5 }}>
        {variant.minimum_quantity > 0
          ? `minimum ${formatNumber(variant.minimum_quantity)}`
          : "minimum belgilanmagan"}
      </Typography>
    </Box>
  </Box>
);

export default FinishedGoodsList;
