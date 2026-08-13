import { TextField } from "@mui/material";

import { formatPhoneInput, toStoredPhone } from "../../utils/phone";

/**
 * O'zbekiston telefon raqami uchun maydon.
 *
 * Ekranda "+998 (95) 600-10-06" ko'rinadi, tashqariga esa toza xalqaro raqam
 * chiqadi: "+998956001006". Ya'ni bazada ajratgichlar saqlanmaydi va bir xil
 * raqam har xil yozilgani uchun ikki xil qiymatga aylanib qolmaydi.
 */
const PhoneTextField = ({ value, onChange, slotProps, ...props }) => (
  <TextField
    {...props}
    type="tel"
    value={formatPhoneInput(value)}
    onChange={(event) => {
      const stored = toStoredPhone(event.target.value);
      onChange?.({ ...event, target: { ...event.target, value: stored } });
    }}
    slotProps={{
      ...slotProps,
      htmlInput: {
        inputMode: "tel",
        placeholder: "+998 (__) ___-__-__",
        ...slotProps?.htmlInput,
      },
    }}
  />
);

export { formatPhoneInput, parsePhoneInput, toStoredPhone } from "../../utils/phone";

export default PhoneTextField;
