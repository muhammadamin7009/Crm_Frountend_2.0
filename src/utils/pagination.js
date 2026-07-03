export const uzbekPaginationProps = {
  labelRowsPerPage: "Sahifadagi qatorlar:",
  labelDisplayedRows: ({ from, to, count }) =>
    `${from}-${to} / ${count === -1 ? `${to} dan ko'p` : count}`,
  getItemAriaLabel: (type) => {
    if (type === "first") return "Birinchi sahifa";
    if (type === "last") return "Oxirgi sahifa";
    if (type === "next") return "Keyingi sahifa";
    return "Oldingi sahifa";
  },
};
