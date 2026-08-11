import { InputAdornment, TextField } from "@mui/material";

export const parseMoneyInput = (value) => {
  const normalized = String(value ?? "")
    .replace(/so['‘’`]?m/gi, "")
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const [integer = "", ...decimalParts] = normalized.split(".");
  const decimal = decimalParts.join("").slice(0, 2);
  if (!integer && !decimal) return "";
  return decimalParts.length ? `${integer || "0"}.${decimal}` : integer;
};

export const formatMoneyInput = (value) => {
  const raw = parseMoneyInput(value);
  if (!raw) return "";
  const [integer, decimal] = raw.split(".");
  const grouped = integer.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decimal === undefined ? grouped : `${grouped}.${decimal}`;
};

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

export default MoneyTextField;
