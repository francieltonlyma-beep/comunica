export function isLoginCompanyIdentified(company, companyCode) {
  return Boolean(company && String(companyCode || '').trim().length >= 3);
}
