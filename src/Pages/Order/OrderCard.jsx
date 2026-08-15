import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from "@mui/material";

const date = (value) => (value ? new Date(value).toLocaleDateString("uz-UZ") : "—");

/**
 * Zakaz yorlig'i — sexga chiqariladigan qog'oz karta.
 *
 * Har bir qator uchun alohida karta: mahsulot, miqdor, muddat va eng
 * muhimi — qaysi bo'lim nima ishlatishi. Ishchi qog'ozga qarab ishlaydi,
 * hech kimdan so'rab o'tirmaydi.
 *
 * Chop etish uchun alohida kutubxona ishlatilmaydi: brauzerning o'z
 * `window.print()` i yetadi, faqat chop etishda ekranning qolgan qismi
 * yashiriladi.
 */
const OrderCard = ({ order, open, onClose }) => {
  if (!order) return null;

  const print = () => window.print();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="order-card-dialog">
      <DialogContent sx={{ p: 0 }}>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .order-card-print, .order-card-print * { visibility: visible !important; }
            .order-card-print {
              position: absolute; left: 0; top: 0; width: 100%;
              padding: 0; background: #fff; color: #000;
            }
            .order-card-sheet {
              page-break-after: always;
              border: 1px solid #000 !important;
              box-shadow: none !important;
            }
            .order-card-sheet:last-child { page-break-after: auto; }
          }
        `}</style>

        <Box
          className="order-card-print"
          sx={{ p: { xs: 1.5, sm: 2.5 }, display: "grid", gap: 2.5, overflowX: "hidden" }}
        >
          {(order.items || []).map((item, index) => (
            <Box
              key={item.id || index}
              className="order-card-sheet"
              sx={{
                border: "2px solid var(--aa-border)",
                borderRadius: 2,
                p: { xs: 1.5, sm: 2.5 },
                breakInside: "avoid",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "1px solid var(--aa-border)",
                  pb: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 11, letterSpacing: ".1em", fontWeight: 700 }}>
                    ZAKAZ KARTASI
                  </Typography>
                  {/* Raqam bo'linib ketmasin: telefonda shrift kichrayadi. */}
                  <Typography
                    sx={{
                      fontSize: { xs: 19, sm: 26 },
                      fontWeight: 800,
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.order_number}
                  </Typography>
                  <Typography sx={{ fontSize: 13 }}>{order.client_name || "—"}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
                    {order.priority === "urgent" ? "SHOSHILINCH" : "ODATIY"}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 11.5, sm: 13 }, whiteSpace: "nowrap" }}>
                    Muddat: {date(order.due_date)}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "var(--aa-text-tertiary)" }}>
                    {index + 1} / {(order.items || []).length}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  py: 1.5,
                }}
              >
                <Typography
                  sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 700, minWidth: 0, flex: 1 }}
                >
                  {item.product_name}
                  {item.product_sku ? (
                    <Box
                      component="span"
                      sx={{ fontSize: 12, fontWeight: 500, ml: 1, wordBreak: "break-all" }}
                    >
                      {item.product_sku}
                    </Box>
                  ) : null}
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: 24, sm: 30 }, fontWeight: 800, whiteSpace: "nowrap" }}
                >
                  {Number(item.quantity)} {item.product_unit || "par"}
                </Typography>
              </Box>

              {item.materials?.length > 0 ? (
                <Box sx={{ border: "1px solid var(--aa-border)", borderRadius: 1.5 }}>
                  {/*
                    Telefonda uch ustun sig'maydi va sahifa yon tomonga
                    surilib ketardi. Kichik ekranda bo'lim nomi alohida
                    qatorga chiqadi, sarlavha esa umuman ko'rsatilmaydi —
                    har qatorning o'zida bo'lim yozib turadi.
                  */}
                  <Box
                    sx={{
                      display: { xs: "none", sm: "grid" },
                      gridTemplateColumns: "140px 1fr auto",
                      gap: 1.5,
                      px: 1.5,
                      py: 0.75,
                      bgcolor: "var(--aa-surface-muted)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: ".06em",
                      color: "var(--aa-text-tertiary)",
                    }}
                  >
                    <span>BO'LIM</span>
                    <span>XOMASHYO</span>
                    <span>JAMI KERAK</span>
                  </Box>
                  {item.materials.map((material) => (
                    <Box
                      key={`${material.department_id}-${material.raw_material_id}`}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr auto", sm: "140px 1fr auto" },
                        columnGap: 1.5,
                        rowGap: 0.3,
                        px: 1.5,
                        py: 1.1,
                        borderTop: "1px solid var(--aa-border)",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          gridColumn: { xs: "1 / -1", sm: "auto" },
                          fontSize: { xs: 10.5, sm: 13 },
                          fontWeight: 700,
                          letterSpacing: { xs: ".06em", sm: 0 },
                          textTransform: { xs: "uppercase", sm: "none" },
                          color: { xs: "var(--aa-text-tertiary)", sm: "var(--aa-text)" },
                        }}
                      >
                        {material.department_name}
                      </Typography>
                      <Typography sx={{ fontSize: 15, fontWeight: 600, minWidth: 0 }}>
                        {material.material_name}
                        {material.note ? (
                          <Box component="span" sx={{ fontSize: 12.5, fontWeight: 500 }}>
                            {" "}
                            — {material.note}
                          </Box>
                        ) : null}
                      </Typography>
                      {/*
                        Butun zakazga ketadigan miqdor. 1 juftga bo'lgan
                        me'yor sexda kerak emas — ishchi 40 par ish oldi,
                        unga "22 metr kerak" degan raqam kerak, "0,55" emas.
                      */}
                      <Typography
                        sx={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}
                      >
                        {material.total_quantity === null
                          ? "—"
                          : `${material.total_quantity} ${material.material_unit}`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: 13, color: "var(--aa-text-tertiary)" }}>
                  Bo'limlar uchun xomashyo belgilanmagan — mahsulot retsepti bo'yicha ishlanadi.
                </Typography>
              )}

              {item.note && (
                <Typography sx={{ mt: 1.5, fontSize: 13 }}>
                  <b>Izoh:</b> {item.note}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={onClose}>Yopish</Button>
        <Button variant="contained" onClick={print}>
          Chop etish
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderCard;
