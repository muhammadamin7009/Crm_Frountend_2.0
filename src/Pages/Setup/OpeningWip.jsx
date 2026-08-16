import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Box, Button, Chip, CircularProgress, MenuItem, Stack, Typography } from "@mui/material";

import Card from "../../Components/UI/AppCard";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import { createOpeningWip, deleteOpeningWip, getOpeningWip } from "../../api/setup";
import { formatNumber } from "../../utils/format";

/**
 * Sexdagi tugallanmagan ish.
 *
 * ERP ishlab turgan korxonaga o'rnatiladi — uni to'xtatib nolga tushirib
 * bo'lmaydi. Ko'chish kuni kroyda 30 par kesilgan, tikuvda 20 par tikilgan
 * holda turadi. Bu ishlar kiritilmasa yo'qoladi: keyingi bo'lim ularni
 * qabul qila olmaydi.
 *
 * "Kroyda 30 par" degani — kroy ularni KESIB BO'LGAN. Shuning uchun ish
 * darhol tikuv navbatiga tushadi.
 */
const emptyRow = {
  department_id: "",
  product_id: "",
  quantity: "",
  client_name: "",
  materials: [],
};

const OpeningWip = () => {
  const [data, setData] = useState({
    items: [],
    departments: [],
    products: [],
    materials: [],
    last_department: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyRow);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getOpeningWip();
      setData(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ma'lumotni olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const changeMaterial = (index, field, value) =>
    setForm((current) => ({
      ...current,
      materials: current.materials.map((row, position) =>
        position === index ? { ...row, [field]: value } : row,
      ),
    }));

  const save = async () => {
    if (!form.department_id || !form.product_id || Number(form.quantity) <= 0) {
      toast.warning("Bo'lim, mahsulot va sonini kiriting.");
      return;
    }

    setSaving(true);

    try {
      await createOpeningWip({
        department_id: Number(form.department_id),
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        client_name: form.client_name.trim() || null,
        materials: form.materials
          .filter((row) => row.raw_material_id && Number(row.quantity) > 0)
          .map((row) => ({
            raw_material_id: Number(row.raw_material_id),
            quantity: Number(row.quantity),
          })),
      });

      toast.success("Kiritildi — ish keyingi bo'lim navbatiga tushdi");
      setForm(emptyRow);
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`${item.batch_number} o'chirilsinmi?`)) return;

    try {
      await deleteOpeningWip(item.id);
      toast.success("O'chirildi");
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "O'chirishda xato.");
    }
  };

  if (loading) {
    return (
      <Card sx={{ py: 6, display: "grid", placeItems: "center" }}>
        <CircularProgress size={28} sx={{ color: "var(--aa-brand-800)" }} />
      </Card>
    );
  }

  return (
    <Card sx={{ p: { xs: 2.2, md: 3 } }}>
      <Typography sx={{ fontFamily: "var(--aa-display)", fontSize: 18, color: "var(--aa-text)" }}>
        Sexdagi tugallanmagan ish
      </Typography>

      <Typography sx={{ mt: 0.5, color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
        Bo'lim <b>tugatgan</b> ishni kiriting — u darhol keyingi bo'lim navbatiga tushadi. Ish haqi
        hisoblanmaydi va ombor qoldig'iga tegilmaydi: bu ish tizimdan oldin bajarilgan.
      </Typography>

      {data.last_department && (
        <Typography sx={{ mt: 0.6, color: "var(--aa-text-tertiary)", fontSize: 11 }}>
          {data.last_department.name} bu yerda yo'q — uni tugatgan mahsulot tayyor mahsulot
          omborida. Uni ombor qoldig'i sifatida kiriting.
        </Typography>
      )}

      <Box
        sx={{
          mt: 2.2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 110px 1fr" },
          gap: 1.4,
        }}
      >
        <TextField
          select
          size="small"
          label="Qaysi bo'lim tugatgan"
          value={form.department_id}
          onChange={change("department_id")}
        >
          {data.departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>
              {department.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Mahsulot"
          value={form.product_id}
          onChange={change("product_id")}
        >
          {data.products.map((product) => (
            <MenuItem key={product.id} value={product.id}>
              {product.name}
              {product.color ? ` · ${product.color}` : ""}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          type="number"
          label="Soni"
          value={form.quantity}
          onChange={change("quantity")}
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />

        {/* Zakaz yaratilmaydi — mijoz ismi shunchaki yozib qo'yiladi.
            Ko'chish paytida zakazlarni ham birma-bir kiritish uzoq va xato
            ko'p bo'ladi; muhimi ish kimniki ekani ishchi ko'zi oldida turishi. */}
        <TextField
          size="small"
          label="Mijoz (bo'sh bo'lsa — omborga)"
          value={form.client_name}
          onChange={change("client_name")}
          helperText="Zakaz yaratilmaydi, faqat ism yoziladi"
        />
      </Box>

      <Box sx={{ mt: 1.6 }}>
        <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 11, fontWeight: 600 }}>
          Ketgan xomashyo — tannarx uchun. Ombor qoldig'i o'zgarmaydi.
        </Typography>

        <Stack spacing={1} sx={{ mt: 1 }}>
          {form.materials.map((row, index) => (
            <Box
              key={index}
              sx={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 1.2 }}
            >
              <TextField
                select
                size="small"
                label="Xomashyo"
                value={row.raw_material_id}
                onChange={(event) => changeMaterial(index, "raw_material_id", event.target.value)}
              >
                {data.materials.map((material) => (
                  <MenuItem key={material.id} value={material.id}>
                    {material.name} · {material.unit}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                type="number"
                label="Miqdor"
                value={row.quantity}
                onChange={(event) => changeMaterial(index, "quantity", event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 0.001 } }}
              />

              <Button
                color="error"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    materials: current.materials.filter((_, position) => position !== index),
                  }))
                }
                sx={{ textTransform: "none", fontSize: 11.5 }}
              >
                O'chirish
              </Button>
            </Box>
          ))}
        </Stack>

        <Button
          onClick={() =>
            setForm((current) => ({
              ...current,
              materials: [...current.materials, { raw_material_id: "", quantity: "" }],
            }))
          }
          sx={{ mt: 0.8, textTransform: "none", fontSize: 11.5 }}
        >
          + xomashyo
        </Button>
      </Box>

      <Button
        variant="contained"
        disabled={saving}
        onClick={save}
        sx={{
          mt: 2,
          minHeight: 42,
          px: 2.6,
          color: "#ffffff !important",
          borderRadius: "12px",
          fontSize: 12,
          fontWeight: 600,
          textTransform: "none",
          backgroundColor: "var(--aa-brand-800)",
          "&:hover": { backgroundColor: "var(--aa-brand-600)" },
        }}
      >
        {saving ? "Saqlanmoqda..." : "Kiritish"}
      </Button>

      {data.items.length > 0 && (
        <Box sx={{ mt: 2.6, display: "grid", gap: 1 }}>
          {data.items.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" },
                alignItems: "center",
                gap: 1.2,
                p: 1.5,
                borderRadius: "13px",
                border: "1px solid var(--aa-border)",
                backgroundColor: "var(--aa-surface-solid)",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "var(--aa-text)", fontSize: 13, fontWeight: 700 }}>
                  {item.product_name} · {formatNumber(item.quantity)} {item.product_unit || "par"}
                </Typography>

                <Typography sx={{ mt: 0.2, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
                  {item.department_name} tugatgan ·{" "}
                  {item.client_name ? `Mijoz: ${item.client_name}` : "Omborga"}
                  {item.materials.length
                    ? ` · ${item.materials
                        .map((m) => `${m.name} ${formatNumber(m.quantity)} ${m.unit}`)
                        .join(", ")}`
                    : ""}
                </Typography>
              </Box>

              <Box>
                <Chip
                  size="small"
                  label={
                    item.current_department ? `Hozir: ${item.current_department}` : "Yakunlangan"
                  }
                  sx={{
                    height: 22,
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: "#1f6f8b",
                    bgcolor: "rgba(31, 111, 139,.10)",
                  }}
                />

                <Typography sx={{ mt: 0.3, color: "var(--aa-text-tertiary)", fontSize: 10 }}>
                  {item.batch_number}
                </Typography>
              </Box>

              <Button
                color="error"
                onClick={() => remove(item)}
                sx={{ textTransform: "none", fontSize: 11.5 }}
              >
                O'chirish
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
};

export default OpeningWip;
