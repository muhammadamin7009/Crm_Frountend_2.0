import { InputAdornment, TextField } from "@mui/material";

import { formatMoneyInput, parseMoneyInput } from "../../utils/money";

/**
 * Summa maydoni. Ekranda minglik ajratgich bilan ("5 555 555"), tashqariga esa
 * toza raqam chiqadi ("5555555") — hisob-kitob va backend shu qiymat bilan ishlaydi.
 *
 * DIQQAT: `value` ga XOM qiymat berilishi kerak, formatlashni komponent o'zi
 * qiladi. Formatlangan matn uzatilsa qo'sh formatlash bo'ladi.
 */
const MoneyTextField = ({ value, onChange, slotProps, InputProps, inputProps, ...props }) => (
  <TextField
    {...props}
    type="text"
    value={formatMoneyInput(value)}
    onChange={(event) => {
      const rawValue = parseMoneyInput(event.target.value);
      onChange?.({ ...event, target: { ...event.target, value: rawValue } });
    }}
    slotProps={{
      ...slotProps,
      // MUI v9 da `inputProps` yo'q — u DOM'ga o'tib ketib konsolda
      // ogohlantirish chiqarardi. Chaqiruvchilar hammasini o'zgartirish
      // o'rniga shu yerda qabul qilamiz.
      htmlInput: {
        inputMode: "decimal",
        pattern: "[0-9 ]*",
        ...inputProps,
        ...slotProps?.htmlInput,
      },
      // `InputProps` ham MUI v9 da yo'q. Uni TextField'ga uzatgan edik va u
      // DOM'ga tushib ketardi — konsolda ogohlantirish chiqardi.
      input: {
        endAdornment: <InputAdornment position="end">so‘m</InputAdornment>,
        ...InputProps,
        ...slotProps?.input,
      },
    }}
  />
);

export { formatMoneyInput, parseMoneyInput } from "../../utils/money";

export default MoneyTextField;
