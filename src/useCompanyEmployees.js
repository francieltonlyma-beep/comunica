import { useMemo } from 'react';
import { isCompanyEmployee } from './teamMembership.js';

export function useCompanyEmployees(users) {
  return useMemo(() => users.filter(isCompanyEmployee), [users]);
}
