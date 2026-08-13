import { InputAdornment, TextField } from "@mui/material";

import { formatMoneyInput, parseMoneyInput } from "../../utils/money";

/**
 * Summa maydoni. Ekranda minglik ajratgich bilan ("5 555 555"), tashqariga esa
 * toza raqam chiqadi ("5555555") — hisob-kitob va backend shu qiymat bilan ishlaydi.
 *
 * DIQQAT: `value` ga XOM qiymat berilishi kerak, formatlashni komponent o'zi
 * qiladi. Formatlangan matn uzatilsa qo'sh formatlash bo'ladi.
 */
const MoneyTextField = ({ value, onChange, slotProps, InputProps, ...props }) => (
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
      htmlInput: {
        inputMode: "decimal",
        pattern: "[0-9 ]*",
        ...slotProps?.htmlInput,
      },
      input: {
        endAdornment: <InputAdornment position="end">so‘m</InputAdornment>,
        ...slotProps?.input,
      },
    }}
    InputProps={InputProps}
  />
);

export { formatMoneyInput, parseMoneyInput } from "../../utils/money";

export default MoneyTextField;
