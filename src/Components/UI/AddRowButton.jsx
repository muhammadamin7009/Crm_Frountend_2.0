import { useEffect, useRef } from "react";
import { Button } from "@mui/material";

/**
 * Ro'yxatga yangi qator qo'shish tugmasi.
 *
 * Ikkita narsani hal qiladi:
 *
 * 1. Joyi. Tugma ro'yxat OSTIDA turadi. Sarlavha yonida turganda qator
 *    ko'paygan sayin u ko'rinishdan chiqib ketardi va foydalanuvchi har
 *    safar tepaga qaytishi kerak bo'lardi.
 *
 * 2. Surish. Yangi qator qo'shilganda tugma (ya'ni undan yuqoridagi yangi
 *    maydonlar) ekranga o'zi suriladi. Aks holda oyna uzayganda qator
 *    ko'rinmaydigan joyda paydo bo'ladi va "bosdim, hech nima bo'lmadi"
 *    tuyg'usi qoladi.
 *
 * `count` — hozirgi qatorlar soni. Surish faqat u ORTGANDA ishlaydi:
 * qator o'chirilganda yoki oyna qayta ochilganda ekran sakramaydi.
 */
const AddRowButton = ({ count, children, sx, ...props }) => {
  const buttonRef = useRef(null);
  const previousCount = useRef(count);

  useEffect(() => {
    if (count > previousCount.current) {
      buttonRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    previousCount.current = count;
  }, [count]);

  // `variant="outlined"` ataylab ishlatilmaydi. index.css da qorong'i mavzu
  // uchun `[data-theme="dark"] .MuiDialog-paper .MuiButton-outlined` qoidasi
  // bor va u `!important` bilan rangni bosib ketadi — oddiy "Bekor qilish"
  // tugmasi uchun to'g'ri, bu tugma uchun emas. Chegarani o'zimiz chizamiz,
  // shunda o'sha qoida bu tugmaga umuman tegmaydi.
  return (
    <Button ref={buttonRef} sx={{ ...addRowButtonSx, ...sx }} {...props}>
      {children}
    </Button>
  );
};

// Uzuq chegara va to'liq kenglik: tugmaning o'zi "shu yerga yangi qator
// qo'shiladi" degan bo'sh joyga o'xshab turadi.
const addRowButtonSx = {
  width: "100%",
  mt: 1.4,
  minHeight: 46,
  borderRadius: "13px",
  // Guruch rang: tugma bosiladigan narsa ekani ko'rinib tursin. Kulrang
  // chegara ajratuvchi chiziqqa o'xshab qolardi.
  border: "1px dashed var(--aa-accent)",
  backgroundColor: "var(--aa-accent-soft)",

  // `--aa-accent-strong` ikkala mavzuda ham o'qiladi: yorug'da to'q
  // jigarrang (#8a6838), qorong'ida och guruch (#dcc094). Sharob rangi
  // bu yerda yaramaydi — qorong'i fonda u deyarli ko'rinmaydi.
  //
  // `!important` kerak: index.css dagi `.MuiButton-text` global qoidasi
  // rangni majburan `--aa-text-secondary` ga o'tkazadi.
  color: "var(--aa-accent-strong) !important",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: ".01em",
  textTransform: "none",
  "&:hover": {
    border: "1px solid var(--aa-accent-strong)",
    backgroundColor: "var(--aa-accent-soft)",
  },
  "&.Mui-disabled": {
    border: "1px dashed var(--aa-border-strong)",
    backgroundColor: "transparent",
    color: "var(--aa-text-disabled) !important",
  },
};

export default AddRowButton;
