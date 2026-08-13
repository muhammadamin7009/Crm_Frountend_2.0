import {
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { getMyClientAccount } from "../../api/clientSales";

import AlertIcon from "../../images/ui-icons/alert.svg";
import CoinsIcon from "../../images/ui-icons/coins.svg";
import TrendUpIcon from "../../images/ui-icons/trend-up.svg";
import WalletIcon from "../../images/ui-icons/wallet.svg";

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const date = (value) => (value ? new Date(value).toLocaleDateString("uz-UZ") : "-");

const clientTones = {
  red: {
    gradient: "linear-gradient(145deg,#6e1622,#8c1d2b)",
    soft: "rgba(110, 22, 34,.07)",
    shadow: "rgba(110, 22, 34,.20)",
  },

  green: {
    gradient: "linear-gradient(145deg,#2f6b45,#4e9c6b)",
    soft: "rgba(47, 107, 69,.07)",
    shadow: "rgba(47, 107, 69,.18)",
  },

  blue: {
    gradient: "linear-gradient(145deg,#1f6f8b,#3e8ba3)",
    soft: "rgba(31, 111, 139,.07)",
    shadow: "rgba(31, 111, 139,.20)",
  },

  amber: {
    gradient: "linear-gradient(145deg,#a06a12,#b8823a)",
    soft: "rgba(160, 106, 18,.08)",
    shadow: "rgba(160, 106, 18,.20)",
  },
};

const ClientStatCard = ({ label, value, helper, icon, tone = "red" }) => {
  const colors = clientTones[tone] || clientTones.red;

  return (
    <Paper
      className="aa-dashboard-kpi"
      elevation={0}
      sx={{
        position: "relative",
        minHeight: 145,
        p: 2.4,
        overflow: "hidden",
        borderRadius: "22px",
        border: "1px solid rgba(232, 225, 216,.9)",
        backgroundColor: "var(--aa-surface-solid)",
        boxShadow: "0 14px 40px rgba(23, 17, 15,.055)",
        transition: "transform .2s ease, box-shadow .2s ease",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 50px rgba(23, 17, 15,.09)",
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
          pointerEvents: "none",
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
              color: "var(--aa-text-secondary)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {label}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 1.2,
              color: "var(--aa-text)",
              fontSize: 21,
              lineHeight: 1.2,
              fontWeight: 700,
              letterSpacing: "-0.035em",
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
            background: colors.gradient,
            boxShadow: `0 12px 25px ${colors.shadow}`,
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
          mt: 2.1,
          color: "var(--aa-text-tertiary)",
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

const ClientSection = ({ title, subtitle, action, children }) => (
  <Paper
    className="aa-dashboard-section"
    elevation={0}
    sx={{
      p: 2.5,
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid rgba(232, 225, 216,.9)",
      backgroundColor: "var(--aa-surface-solid)",
      boxShadow: "0 14px 40px rgba(23, 17, 15,.045)",
    }}
  >
    <Box
      sx={{
        mb: 2.5,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          sx={{
            color: "var(--aa-text)",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              mt: 0.7,
              color: "var(--aa-text-tertiary)",
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

const ClientEmptyState = ({ title, description }) => (
  <Box
    sx={{
      minHeight: 160,
      px: 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      borderRadius: "17px",
      border: "1px dashed #d8cec1",
      backgroundColor: "var(--aa-surface-muted)",
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        mb: 2,
        display: "grid",
        placeItems: "center",
        borderRadius: "14px",
        backgroundColor: "rgba(110, 22, 34,.07)",
      }}
    >
      <Box
        component="img"
        src={WalletIcon}
        alt=""
        sx={{
          width: 18,
          height: 18,
          opacity: 0.65,
        }}
      />
    </Box>

    <Typography
      sx={{
        color: "var(--aa-text)",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {title}
    </Typography>

    <Typography
      sx={{
        maxWidth: 340,
        mt: 0.8,
        color: "var(--aa-text-tertiary)",
        fontSize: 11,
        lineHeight: 1.6,
      }}
    >
      {description}
    </Typography>
  </Box>
);

const ClientDashboard = ({ user }) => {
  const [account, setAccount] = useState({
    balance: {
      total_amount: 0,
      paid_amount: 0,
      debt_amount: 0,
    },
    client_sales: [],
    client_payments: [],
  });

  const [loading, setLoading] = useState(true);

  const loadAccount = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getMyClientAccount({
        limit: 10,
        offset: 0,
      });

      setAccount({
        balance: data.balance || {
          total_amount: 0,
          paid_amount: 0,
          debt_amount: 0,
        },

        client_sales: data.client_sales || [],

        client_payments: data.client_payments || [],
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Hisob ma’lumotlarini olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const balance = account.balance || {};

  const totalAmount = Number(balance.total_amount || 0);

  const paidAmount = Number(balance.paid_amount || 0);

  const debtAmount = Number(balance.debt_amount || 0);

  const paymentPercent = useMemo(() => {
    if (totalAmount <= 0) return 0;

    return Math.min(100, Math.round((paidAmount / totalAmount) * 100));
  }, [paidAmount, totalAmount]);

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
            border: "1px solid rgba(110, 22, 34,.1)",
            backgroundColor: "rgba(110, 22, 34,.05)",
          }}
        >
          <CircularProgress
            size={34}
            thickness={4.5}
            sx={{
              color: "#6e1622",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "var(--aa-text-tertiary)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Hisob ma’lumotlari yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="crm-page aa-dashboard-page h-full overflow-auto pr-1">
      {/* Sahifa boshi */}

      <Box
        className="aa-dashboard-hero"
        sx={{
          position: "relative",
          mb: 2.5,
          p: {
            xs: 2.5,
            sm: 3,
          },
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          justifyContent: "space-between",
          gap: 2.5,
          overflow: "hidden",
          borderRadius: "24px",
          border: "1px solid var(--aa-border)",
          background:
            "radial-gradient(circle at 98% 0%,rgba(110, 22, 34,.075),transparent 28%),linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
          boxShadow: "var(--aa-shadow-md)",
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
                background: "linear-gradient(90deg,#4d0f18,#8c1d2b)",
              }}
            />

            <Typography
              sx={{
                color: "#6e1622",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".13em",
                textTransform: "uppercase",
              }}
            >
              Shaxsiy mijoz paneli
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              color: "var(--aa-text)",
              fontSize: {
                xs: 26,
                sm: 30,
              },
              lineHeight: 1.15,
              fontFamily: "var(--aa-display)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
            }}
          >
            Mening hisobim
          </Typography>

          <Typography
            sx={{
              mt: 1,
              maxWidth: 620,
              color: "var(--aa-text-tertiary)",
              fontSize: 13,
              lineHeight: 1.7,
              fontWeight: 600,
            }}
          >
            Salom,{" "}
            <Box
              component="span"
              sx={{
                color: "#6e1622",
                fontWeight: 600,
              }}
            >
              {user?.first_name || "Mijoz"}
            </Box>
            . Xaridlaringiz, to‘lovlaringiz va qolgan qarzingiz shu sahifada ko‘rinadi.
          </Typography>
        </Box>

        <Button
          onClick={loadAccount}
          sx={{
            minHeight: 42,
            px: 2,
            color: "#6e1622",
            borderRadius: "13px",
            border: "1px solid rgba(110, 22, 34,.13)",
            backgroundColor: "rgba(110, 22, 34,.045)",
            fontSize: 11.5,
            fontWeight: 700,
            textTransform: "none",

            "&:hover": {
              backgroundColor: "rgba(110, 22, 34,.08)",
            },
          }}
        >
          Ma’lumotlarni yangilash
        </Button>
      </Box>

      {/* Statistikalar */}

      <Box
        className="aa-dashboard-kpi-grid"
        sx={{
          mb: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2,minmax(0,1fr))",
            sm: "repeat(2,minmax(0,1fr))",
            xl: "repeat(4,minmax(0,1fr))",
          },
          gap: 2,
        }}
      >
        <ClientStatCard
          label="Jami xarid"
          value={money(totalAmount)}
          helper={`${number(account.client_sales.length)} ta so‘nggi savdo yozuvi`}
          icon={TrendUpIcon}
          tone="blue"
        />

        <ClientStatCard
          label="Jami to‘langan"
          value={money(paidAmount)}
          helper={`${paymentPercent}% to‘lov amalga oshirilgan`}
          icon={CoinsIcon}
          tone="green"
        />

        <ClientStatCard
          label="Qolgan qarz"
          value={money(debtAmount)}
          helper={
            debtAmount > 0
              ? "Hozir to‘lanishi kerak bo‘lgan summa"
              : "To‘lanmagan qarzdorlik mavjud emas"
          }
          icon={debtAmount > 0 ? AlertIcon : WalletIcon}
          tone={debtAmount > 0 ? "red" : "green"}
        />

        <ClientStatCard
          label="To‘lov darajasi"
          value={`${paymentPercent}%`}
          helper="Jami xaridga nisbatan to‘langan qism"
          icon={WalletIcon}
          tone={paymentPercent >= 100 ? "green" : "amber"}
        />
      </Box>

      {/* Balans kartasi */}

      <Box
        component="section"
        sx={{
          position: "relative",
          isolation: "isolate",
          mb: 2.5,
          minHeight: 285,
          p: {
            xs: 2.5,
            sm: 3,
          },
          overflow: "hidden",
          color: "#ffffff",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,.08)",

          backgroundColor: "#151211 !important",
          backgroundImage: `
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.34),
        transparent 32%
      ),
      linear-gradient(
        145deg,
        #151211 0%,
        #1e1a18 52%,
        #3a1219 100%
      )
    `,

          boxShadow: "0 24px 60px rgba(23, 17, 15,.22)",

          "&::before": {
            content: '""',
            position: "absolute",
            zIndex: 0,
            width: 380,
            height: 380,
            top: -270,
            right: -215,
            borderRadius: "50%",
            border: "1px solid rgba(201, 168, 117,.17)",
            boxShadow: `
        0 0 81px 22px rgba(201, 168, 117,.025),
        0 0 161px 43px rgba(201, 168, 117,.015)
      `,
            pointerEvents: "none",
          },

          "&::after": {
            content: '""',
            position: "absolute",
            zIndex: 0,
            width: 280,
            height: 280,
            left: -180,
            bottom: -200,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(77, 15, 24,.30),transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "1fr 1fr",
            },
            gap: {
              xs: 3,
              lg: 5,
            },
            alignItems: "center",
          }}
        >
          {/* Chap tomon */}

          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.1,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  flexShrink: 0,
                  borderRadius: "50%",
                  backgroundColor: debtAmount > 0 ? "#c9a875" : "#4e9c6b",
                  boxShadow:
                    debtAmount > 0
                      ? "0 0 0 5px rgba(251,113,133,.10)"
                      : "0 0 0 5px rgba(78, 156, 107,.10)",
                }}
              />

              <Typography
                sx={{
                  color: "rgba(255,255,255,.52) !important",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: ".09em",
                  textTransform: "uppercase",
                }}
              >
                Hisob holati
              </Typography>
            </Box>

            <Typography
              sx={{
                mt: 2.4,
                color: "#ffffff !important",
                fontSize: {
                  xs: 26,
                  sm: 34,
                },
                lineHeight: 1.1,
                fontWeight: 700,
                letterSpacing: "-.045em",
              }}
            >
              {debtAmount > 0 ? money(debtAmount) : "Qarzdorlik yo‘q"}
            </Typography>

            <Typography
              sx={{
                maxWidth: 500,
                mt: 1.3,
                color: "rgba(255,255,255,.45) !important",
                fontSize: 11.5,
                lineHeight: 1.7,
                fontWeight: 500,
              }}
            >
              {debtAmount > 0
                ? "Bu summa xaridlaringiz bo‘yicha hali to‘lanmagan umumiy qarzdorlik hisoblanadi."
                : "Barcha xaridlaringiz bo‘yicha to‘lovlar to‘liq amalga oshirilgan."}
            </Typography>

            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))",
                },
                gap: 1.3,
              }}
            >
              <Box sx={clientDarkInfoCardSx}>
                <Typography sx={clientDarkLabelSx}>Jami xarid</Typography>

                <Typography
                  sx={{
                    ...clientDarkValueSx,
                    color: "#ffffff !important",
                  }}
                >
                  {money(totalAmount)}
                </Typography>
              </Box>

              <Box sx={clientDarkInfoCardSx}>
                <Typography sx={clientDarkLabelSx}>Jami to‘langan</Typography>

                <Typography
                  sx={{
                    ...clientDarkValueSx,
                    color: "#8fd4a8 !important",
                  }}
                >
                  {money(paidAmount)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* O‘ng tomon */}

          <Box
            sx={{
              p: {
                xs: 2,
                sm: 2.5,
              },
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,.075)",
              background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.035)",
              backdropFilter: "blur(14px)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,.48) !important",
                    fontSize: 10.5,
                    fontWeight: 600,
                  }}
                >
                  To‘lov bajarilishi
                </Typography>

                <Typography
                  sx={{
                    mt: 0.8,
                    color: "#ffffff !important",
                    fontSize: 25,
                    lineHeight: 1,
                    fontWeight: 700,
                    letterSpacing: "-.04em",
                  }}
                >
                  {paymentPercent}%
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 1.4,
                  py: 0.8,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.9,
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,.08)",
                  backgroundColor: "rgba(255,255,255,.045)",
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: paymentPercent >= 100 ? "#4e9c6b" : "#c9a875",
                    boxShadow:
                      paymentPercent >= 100
                        ? "0 0 0 5px rgba(78, 156, 107,.09)"
                        : "0 0 0 5px rgba(251,113,133,.09)",
                  }}
                />

                <Typography
                  sx={{
                    color: "rgba(255,255,255,.62) !important",
                    fontSize: 9.5,
                    fontWeight: 600,
                  }}
                >
                  {paymentPercent >= 100 ? "To‘liq to‘langan" : "To‘lov davom etmoqda"}
                </Typography>
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={paymentPercent}
              sx={{
                mt: 3,
                height: 11,
                borderRadius: 99,
                backgroundColor: "rgba(255,255,255,.10)",

                "& .MuiLinearProgress-bar": {
                  borderRadius: 99,
                  background:
                    paymentPercent >= 100
                      ? "linear-gradient(90deg,#2f6b45,#6cbf8b)"
                      : "linear-gradient(90deg,#7a1826,#c9a875)",
                },
              }}
            />

            <Box
              sx={{
                mt: 3,
                pt: 2.2,
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gap: 1.3,
                borderTop: "1px solid rgba(255,255,255,.07)",
              }}
            >
              <Box>
                <Typography sx={clientDarkLabelSx}>To‘langan qism</Typography>

                <Typography
                  sx={{
                    mt: 0.8,
                    color: "#8fd4a8 !important",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {money(paidAmount)}
                </Typography>
              </Box>

              <Box>
                <Typography sx={clientDarkLabelSx}>Qolgan qarz</Typography>

                <Typography
                  sx={{
                    mt: 0.8,
                    color: debtAmount > 0 ? "#d9b782 !important" : "#8fd4a8 !important",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {money(debtAmount)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Jadvallar */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "1.2fr .8fr",
          },
          gap: 2,
        }}
      >
        <ClientSection
          title="Oxirgi xaridlar"
          subtitle="Sizga rasmiylashtirilgan so‘nggi mahsulotlar"
          action={
            <Chip
              size="small"
              label={`${number(account.client_sales.length)} ta yozuv`}
              sx={neutralChipSx}
            />
          }
        >
          {account.client_sales.length ? (
            <Box className="aa-mobile-cards aa-client-sales-table" sx={{ overflowX: "auto" }}>
              <Table
                size="small"
                sx={{
                  ...tableSx,
                  minWidth: 760,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Mahsulot</TableCell>

                    <TableCell>Miqdor</TableCell>

                    <TableCell>Narx</TableCell>

                    <TableCell>Jami</TableCell>

                    <TableCell>Qarz</TableCell>

                    <TableCell>Sana</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {account.client_sales.map((sale) => (
                    <TableRow key={sale.id} hover>
                      <TableCell>
                        <Box
                          sx={{
                            minWidth: 140,
                          }}
                        >
                          <Typography
                            sx={{
                              color: "var(--aa-text)",
                              fontSize: 11.5,
                              fontWeight: 700,
                            }}
                          >
                            {sale.product_name || "Mahsulot"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.4,
                              color: "var(--aa-text-tertiary)",
                              fontSize: 9.5,
                            }}
                          >
                            {sale.product_model || sale.product_sku || "Model ko‘rsatilmagan"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "var(--aa-text)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {number(sale.quantity)}
                        </Typography>
                      </TableCell>

                      <TableCell>{money(sale.unit_price)}</TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "var(--aa-text)",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {money(sale.total_amount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={money(sale.remaining_debt)}
                          sx={Number(sale.remaining_debt) > 0 ? debtChipSx : paidChipSx}
                        />
                      </TableCell>

                      <TableCell>{date(sale.sold_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <ClientEmptyState
              title="Hali xarid mavjud emas"
              description="Sizga mahsulot savdosi rasmiylashtirilganda ma’lumotlar shu yerda ko‘rinadi."
            />
          )}
        </ClientSection>

        <ClientSection
          title="Oxirgi to‘lovlar"
          subtitle="Hisobingizga kiritilgan so‘nggi to‘lovlar"
          action={
            <Chip
              size="small"
              label={`${number(account.client_payments.length)} ta yozuv`}
              sx={neutralChipSx}
            />
          }
        >
          {account.client_payments.length ? (
            <Box
              sx={{
                display: "grid",
                gap: 1.3,
              }}
            >
              {account.client_payments.map((payment) => (
                <Box
                  key={payment.id}
                  sx={{
                    p: 1.7,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.4,
                    borderRadius: "15px",
                    border: "1px solid var(--aa-border)",
                    background:
                      "linear-gradient(135deg,var(--aa-surface-muted),var(--aa-surface-solid))",
                    transition: "transform .18s ease, border-color .18s ease",

                    "&:hover": {
                      transform: "translateX(2px)",
                      borderColor: "rgba(110, 22, 34,.16)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      borderRadius: "13px",
                      backgroundColor: "rgba(78, 156, 107,.10)",
                    }}
                  >
                    <Box
                      component="img"
                      src={CoinsIcon}
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
                        color: "var(--aa-text)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {money(payment.amount)}
                    </Typography>

                    <Typography
                      noWrap
                      sx={{
                        mt: 0.5,
                        color: "var(--aa-text-tertiary)",
                        fontSize: 9.5,
                      }}
                    >
                      {payment.product_name ||
                        (payment.client_sale_id
                          ? `Savdo #${payment.client_sale_id}`
                          : "Umumiy to‘lov")}
                    </Typography>

                    {payment.note && (
                      <Typography
                        noWrap
                        sx={{
                          mt: 0.4,
                          color: "var(--aa-text-secondary)",
                          fontSize: 9.5,
                        }}
                      >
                        {payment.note}
                      </Typography>
                    )}
                  </Box>

                  <Typography
                    sx={{
                      flexShrink: 0,
                      color: "var(--aa-text-tertiary)",
                      fontSize: 9.5,
                      fontWeight: 600,
                    }}
                  >
                    {date(payment.paid_at)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <ClientEmptyState
              title="Hali to‘lov mavjud emas"
              description="Hisobingizga to‘lov kiritilganda ma’lumotlar shu yerda ko‘rinadi."
            />
          )}
        </ClientSection>
      </Box>
    </Box>
  );
};

const clientDarkInfoCardSx = {
  minWidth: 0,
  p: 1.7,
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,.075)",
  background: "linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.025))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
};

const clientDarkLabelSx = {
  color: "rgba(255,255,255,.44) !important",
  fontSize: 9.5,
  lineHeight: 1.4,
  fontWeight: 700,
};

const clientDarkValueSx = {
  width: "100%",
  mt: 0.9,
  overflow: "hidden",
  fontSize: {
    xs: 14,
    sm: 16,
  },
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-.025em",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const neutralChipSx = {
  height: 24,
  color: "var(--aa-text-secondary)",
  fontSize: 9.5,
  fontWeight: 600,
  backgroundColor: "var(--aa-surface-muted)",
};

const debtChipSx = {
  height: 24,
  color: "#a06a12",
  fontSize: 9.5,
  fontWeight: 700,
  backgroundColor: "rgba(160, 106, 18,.12)",
};

const paidChipSx = {
  height: 24,
  color: "#2f6b45",
  fontSize: 9.5,
  fontWeight: 700,
  backgroundColor: "rgba(78, 156, 107,.10)",
};

const tableSx = {
  "& .MuiTableCell-root": {
    px: 1.3,
    py: 1.4,
    color: "var(--aa-text-secondary)",
    fontSize: 10.5,
    borderColor: "#e8e1d8",
  },

  "& .MuiTableHead-root .MuiTableCell-root": {
    color: "var(--aa-text-tertiary)",
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: ".04em",
    textTransform: "uppercase",
    backgroundColor: "var(--aa-surface-muted)",
  },

  "& .MuiTableBody-root .MuiTableRow-root": {
    transition: "background-color .18s ease",
  },

  "& .MuiTableBody-root .MuiTableRow-root:hover": {
    backgroundColor: "rgba(110, 22, 34,.025)",
  },
};

export default ClientDashboard;
