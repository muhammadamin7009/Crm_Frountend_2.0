import { Box, MenuItem, Pagination, TextField, Typography } from "@mui/material";

const CrmPagination = ({
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  rowsPerPageOptions = [10, 20, 50],
}) => {
  const pageCount = Math.max(1, Math.ceil(Number(total || 0) / Number(limit || 10)));
  const from = total ? page * limit + 1 : 0;
  const to = Math.min((page + 1) * limit, total);

  return (
    <Box
      className="flex shrink-0 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
      sx={{ borderTop: "1px solid var(--aa-border)" }}
    >
      <Box className="flex items-center gap-2">
        <Typography variant="body2" sx={{ color: "var(--aa-text-secondary)" }}>
          Sahifadagi qatorlar
        </Typography>
        <TextField
          select
          size="small"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          sx={{ width: 76 }}
        >
          {rowsPerPageOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
        <Typography
          variant="body2"
          className="whitespace-nowrap"
          sx={{ color: "var(--aa-text-secondary)" }}
        >
          {from}-{to} / {total}
        </Typography>
      </Box>
      <Pagination
        count={pageCount}
        page={Math.min(page + 1, pageCount)}
        onChange={(_, nextPage) => onPageChange(nextPage - 1)}
        variant="outlined"
        shape="rounded"
        size="small"
        siblingCount={1}
        boundaryCount={1}
        sx={{
          "& .MuiPagination-ul": { justifyContent: { xs: "center", sm: "flex-end" } },
          "& .MuiPaginationItem-root": {
            minWidth: 38,
            height: 38,
            color: "var(--aa-text)",
            borderColor: "var(--aa-border-strong)",
            fontWeight: 800,
          },
          "& .Mui-selected": {
            color: "#fff",
            bgcolor: "#6e1622 !important",
            borderColor: "#6e1622 !important",
          },
        }}
      />
    </Box>
  );
};

export default CrmPagination;
