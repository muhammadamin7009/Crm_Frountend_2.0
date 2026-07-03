import { Box, MenuItem, Pagination, TextField, Typography } from "@mui/material";

const CrmPagination = ({ total, page, limit, onPageChange, onLimitChange, rowsPerPageOptions = [10, 20, 50] }) => {
  const pageCount = Math.max(1, Math.ceil(Number(total || 0) / Number(limit || 10)));
  const from = total ? page * limit + 1 : 0;
  const to = Math.min((page + 1) * limit, total);

  return (
    <Box className="flex shrink-0 flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <Box className="flex items-center gap-2">
        <Typography variant="body2" className="text-slate-500">Sahifadagi qatorlar</Typography>
        <TextField select size="small" value={limit} onChange={(event) => onLimitChange(Number(event.target.value))} sx={{ width: 76 }}>
          {rowsPerPageOptions.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
        </TextField>
        <Typography variant="body2" className="whitespace-nowrap text-slate-500">{from}-{to} / {total}</Typography>
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
          "& .MuiPaginationItem-root": { minWidth: 34, height: 34, borderColor: "#cbd5e1", fontWeight: 800 },
          "& .Mui-selected": { color: "#fff", bgcolor: "#8f1d20 !important", borderColor: "#8f1d20 !important" },
        }}
      />
    </Box>
  );
};

export default CrmPagination;
