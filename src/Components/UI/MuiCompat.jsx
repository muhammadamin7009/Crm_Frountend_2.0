import { forwardRef } from "react";
import { Dialog, Drawer, Grid, Stack, TextField } from "@mui/material";

const mergeSlotProps = (slotProps, compatibilitySlots) => {
  const result = { ...slotProps };

  Object.entries(compatibilitySlots).forEach(([slot, value]) => {
    if (!value && !slotProps?.[slot]) return;

    result[slot] = {
      ...(value || {}),
      ...(slotProps?.[slot] || {}),
    };
  });

  return result;
};

export const CompatTextField = forwardRef(function CompatTextField({
  inputProps,
  InputProps,
  InputLabelProps,
  SelectProps,
  FormHelperTextProps,
  slotProps,
  ...props
}, ref) {
  return (
  <TextField
    {...props}
    ref={ref}
    slotProps={mergeSlotProps(slotProps, {
      htmlInput: inputProps,
      input: InputProps,
      inputLabel: InputLabelProps,
      select: SelectProps,
      formHelperText: FormHelperTextProps,
    })}
  />
  );
});

export const CompatDialog = forwardRef(function CompatDialog(
  { PaperProps, slotProps, ...props },
  ref,
) {
  return (
    <Dialog
      {...props}
      ref={ref}
      slotProps={mergeSlotProps(slotProps, {
        paper: PaperProps,
      })}
    />
  );
});

export const CompatDrawer = forwardRef(function CompatDrawer(
  { PaperProps, slotProps, ...props },
  ref,
) {
  return (
    <Drawer
      {...props}
      ref={ref}
      slotProps={mergeSlotProps(slotProps, {
        paper: PaperProps,
      })}
    />
  );
});

export const CompatStack = forwardRef(function CompatStack(
  { alignItems, justifyContent, sx, ...props },
  ref,
) {
  return (
    <Stack
      {...props}
      ref={ref}
      sx={{
        ...(alignItems !== undefined ? { alignItems } : {}),
        ...(justifyContent !== undefined ? { justifyContent } : {}),
        ...sx,
      }}
    />
  );
});

export const CompatGrid = forwardRef(function CompatGrid({
  item: _item,
  xs,
  sm,
  md,
  lg,
  xl,
  alignItems,
  justifyContent,
  size,
  sx,
  ...props
}, ref) {
  const responsiveSize = {
    ...(xs !== undefined ? { xs } : {}),
    ...(sm !== undefined ? { sm } : {}),
    ...(md !== undefined ? { md } : {}),
    ...(lg !== undefined ? { lg } : {}),
    ...(xl !== undefined ? { xl } : {}),
  };

  return (
    <Grid
      {...props}
      ref={ref}
      size={size ?? (Object.keys(responsiveSize).length ? responsiveSize : undefined)}
      sx={{
        ...(alignItems !== undefined ? { alignItems } : {}),
        ...(justifyContent !== undefined ? { justifyContent } : {}),
        ...sx,
      }}
    />
  );
});
