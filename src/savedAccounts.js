const storageKey = 'comunica_saved_accounts';

export function accountKey(account) {
  return JSON.stringify([account.companyId, account.userId]);
}

export function employeeAccount(company, user) {
  if (!company?.id || !company.code || !user?.id || !user.name || user.isDeveloper || user.isEmployee === false) return null;
  return {
    companyId: company.id,
    companyCode: company.code,
    companyName: company.name || company.code,
    userId: user.id,
    name: user.name,
  };
}

export function readSavedAccounts(storage) {
  try {
    const accounts = JSON.parse(storage.getItem(storageKey) || '[]');
    if (!Array.isArray(accounts)) return [];
    return accounts.flatMap(account => {
      if (!account || !['companyId', 'companyCode', 'userId', 'name'].every(field => typeof account[field] === 'string' && account[field])) return [];
      const { companyId, companyCode, userId, name } = account;
      return [{ companyId, companyCode, userId, name, companyName: typeof account.companyName === 'string' ? account.companyName : companyCode }];
    });
  } catch {
    return [];
  }
}

export function rememberAccounts(storage, ...accounts) {
  const saved = new Map(readSavedAccounts(storage).map(account => [accountKey(account), account]));
  for (const account of accounts) {
    if (account) saved.set(accountKey(account), account);
  }
  storage.setItem(storageKey, JSON.stringify([...saved.values()]));
}

export function clearSavedAccounts(storage) {
  storage.removeItem(storageKey);
}

export async function signInToSavedAccount({ account, pin, authenticate, prepareDevice, signIn }) {
  const { data: session } = await authenticate({ companyCode: account.companyCode, userId: account.userId, pin });
  if (!session?.token || session.user?.id !== account.userId || session.company?.id !== account.companyId || session.user?.isDeveloper) {
    throw new Error('A conta autenticada não corresponde à conta selecionada.');
  }
  await prepareDevice();
  await signIn(session.token);
  return session;
}
