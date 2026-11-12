export const SUPPLIER_COLUMNS = [
  'Nome do fornecedor', 'Razão social', 'CNPJ/CPF', 'Inscrição estadual',
  'Ramo de atividade', 'Telefone', 'E-mail', 'Endereço', 'Número',
  'Complemento', 'Bairro', 'CEP', 'Cidade', 'UF',
];

export const SUPPLIER_FIELDS = [
  'name', 'legalName', 'taxId', 'stateRegistration', 'activity', 'phone',
  'email', 'address', 'number', 'complement', 'district', 'postalCode', 'city', 'state',
];

const XLSX_HEADERS = {
  name: ['Nome Do Fornecedor'],
  legalName: ['Razão Social Fornecedor', 'Razão social'],
  taxId: ['CNPJ/CPF'],
  stateRegistration: ['Inscr. Estadual', 'Inscrição estadual'],
  activity: ['Ramo Atividade', 'Ramo de atividade'],
  phone: ['Fone', 'Telefone'],
  email: ['E-Mail', 'E-mail'],
  address: ['Endereco', 'Endereço'],
  number: ['Número Endereço', 'Número'],
  complement: ['Compl. Endereço', 'Complemento'],
  district: ['Bairro'],
  postalCode: ['CEP'],
  city: ['Nome Município', 'Cidade'],
  state: ['UF'],
};

const normalizedHeader = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const cellText = value => String(value ?? '').trim();

function validateSupplierRecord(record, rowNumber) {
  if (!record.name) throw new Error(`Linha ${rowNumber}: informe o nome do fornecedor.`);
  for (const field of SUPPLIER_FIELDS) {
    const limit = field === 'legalName' || field === 'address' ? 240 : 160;
    if (record[field].length > limit) throw new Error(`Linha ${rowNumber}: ${SUPPLIER_COLUMNS[SUPPLIER_FIELDS.indexOf(field)]} excede ${limit} caracteres.`);
  }
  return record;
}

export function parseSupplierSpreadsheetRows(rows) {
  const headerIndex = rows.findIndex(row => {
    const headings = row.map(normalizedHeader);
    return ['name', 'legalName', 'taxId'].every(field => XLSX_HEADERS[field].some(label => headings.includes(normalizedHeader(label))));
  });
  if (headerIndex < 0) throw new Error('Não encontrei o cabeçalho de fornecedores na planilha. Confira as colunas Nome Do Fornecedor, Razão Social Fornecedor e CNPJ/CPF.');
  const headings = rows[headerIndex].map(normalizedHeader);
  const columns = Object.fromEntries(SUPPLIER_FIELDS.map(field => [field,
    XLSX_HEADERS[field].map(normalizedHeader).map(label => headings.indexOf(label)).find(index => index >= 0) ?? -1]));
  return rows.slice(headerIndex + 1).flatMap((row, index) => {
    if (!row.some(value => cellText(value))) return [];
    const record = Object.fromEntries(SUPPLIER_FIELDS.map(field => [field, cellText(row[columns[field]])]));
    return [validateSupplierRecord(record, headerIndex + index + 2)];
  });
}

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
    return validateSupplierRecord(record, index + 2);
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
