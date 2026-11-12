export const SUPPLIER_COLUMNS = [
  'Nome do fornecedor', 'Razão social', 'CNPJ/CPF', 'Inscrição estadual',
  'Ramo de atividade', 'Telefone', 'E-mail', 'Endereço', 'Número',
  'Complemento', 'Bairro', 'CEP', 'Cidade', 'UF',
];

export const SUPPLIER_FIELDS = [
  'name', 'legalName', 'taxId', 'stateRegistration', 'activity', 'phone',
  'email', 'address', 'number', 'complement', 'district', 'postalCode', 'city', 'state',
];

export function parseSupplierCsv(content) {
  const source = content.replace(/^\uFEFF/, '');
  const rows = [];
  let cells = [], value = '', quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ';' && !quoted) {
      cells.push(value); value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      cells.push(value); value = '';
      if (cells.some(cell => cell.trim())) rows.push(cells);
      cells = [];
    } else value += char;
  }
  if (quoted) throw new Error('O CSV contém aspas sem fechamento.');
  cells.push(value);
  if (cells.some(cell => cell.trim())) rows.push(cells);
  if (!rows.length || SUPPLIER_COLUMNS.some((column, index) => rows[0][index]?.trim() !== column)) {
    throw new Error('Use o CSV de fornecedores preparado para o Comunica, com as 14 colunas esperadas.');
  }
  return rows.slice(1).map((cells, index) => {
    if (cells.length !== SUPPLIER_FIELDS.length) throw new Error(`Linha ${index + 2}: quantidade de colunas inválida.`);
    const record = Object.fromEntries(SUPPLIER_FIELDS.map((field, position) => [field, cells[position].trim()]));
    if (!record.name) throw new Error(`Linha ${index + 2}: informe o nome do fornecedor.`);
    return record;
  });
}

export function supplierDocumentId(record) {
  const digits = record.taxId.replace(/\D/g, '');
  if (digits.length === 11 || digits.length === 14) return `tax-${digits}`;
  const key = `${record.name}|${record.city}|${record.state}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
  return `name-${(hash >>> 0).toString(16)}`;
}
