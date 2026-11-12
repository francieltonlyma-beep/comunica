import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSupplierSpreadsheetRows, supplierDocumentId } from '../src/supplierImport.js';

test('importa as colunas úteis da planilha RP One após as linhas do relatório', () => {
  const headings = Array(72).fill(null);
  for (const [index, label] of [
    [0, 'Código'], [1, 'Nome Do Fornecedor'], [2, 'Razão Social Fornecedor'],
    [3, 'CNPJ/CPF'], [6, 'Inscr. Estadual'], [9, 'Ramo Atividade'],
    [10, 'Endereco'], [11, 'Bairro'], [12, 'CEP'], [15, 'Fone'],
    [17, 'E-Mail'], [42, 'Número Endereço'], [43, 'Compl. Endereço'],
    [70, 'Nome Município'], [71, 'UF'],
  ]) headings[index] = label;
  const supplier = Array(72).fill(null);
  for (const [index, value] of [
    [0, 10022], [1, 'Valle & Theisen Ltda'], [2, 'Valle & Theisen Ltda'],
    [3, '04897235000189'], [6, '9025161405'], [10, 'Rua Fagundes Varela'],
    [11, 'Vila Portes'], [12, '85.865-160'], [15, '(45) 35286767'],
    [42, '01'], [70, 'Foz Do Iguacu'], [71, 'PR'],
  ]) supplier[index] = value;
  const records = parseSupplierSpreadsheetRows([
    ['Relação Dos Fornecedores Cadastrados'], [], headings, supplier,
  ]);
  assert.deepEqual(records, [{
    name: 'Valle & Theisen Ltda', legalName: 'Valle & Theisen Ltda',
    taxId: '04897235000189', stateRegistration: '9025161405', activity: '',
    phone: '(45) 35286767', email: '', address: 'Rua Fagundes Varela',
    number: '01', complement: '', district: 'Vila Portes',
    postalCode: '85.865-160', city: 'Foz Do Iguacu', state: 'PR',
  }]);
  assert.equal(supplierDocumentId(records[0]), 'tax-04897235000189');
});

test('recusa planilha sem o cabeçalho de fornecedores', () => {
  assert.throws(() => parseSupplierSpreadsheetRows([['Código', 'Produto', 'Preço']]), /cabeçalho de fornecedores/);
});
