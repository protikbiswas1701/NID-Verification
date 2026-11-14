export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPaginationMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});
