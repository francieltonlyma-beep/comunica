import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DOCUMENT_FOLDER, normalizeDocumentFolder, documentFileType, documentFolders, documentReviewStatus, filterDocuments, canAccessDocument } from '../src/documentOrganization.js';

const documents = [
  { id: 'a', title: 'Manual de Integração', description: '', category: 'Manuais', dept: 'all', folder: 'Integração', file: { name: 'manual.pdf' }, requiredRead: true, readBy: [], createdAt: 1 },
  { id: 'b', title: 'Planilha', category: 'Produção', dept: 'producao', file: { name: 'lote.xlsx' }, requiredRead: false, createdAt: 3 },
  { id: 'c', title: 'Norma', category: 'Políticas', dept: 'rh', folder: 'RH', file: { name: 'norma.docx' }, createdAt: 2 },
];

test('documentos antigos sem pasta continuam disponíveis', () => {
  assert.equal(normalizeDocumentFolder(undefined), DEFAULT_DOCUMENT_FOLDER);
  assert.deepEqual(documentFolders(documents), ['Sem pasta', 'Integração', 'RH']);
  assert.deepEqual(filterDocuments(documents, { allowedDepartments: ['producao'], folder: 'Sem pasta' }).map(item => item.id), ['b']);
});

test('filtros combinados respeitam setor e leitura do usuário', () => {
  assert.deepEqual(filterDocuments(documents, { allowedDepartments: ['producao'], reading: 'Pendentes', userId: 'u1', fileType: 'PDF', search: 'integração' }).map(item => item.id), ['a']);
  assert.deepEqual(filterDocuments(documents, { allowedDepartments: ['producao'], department: 'rh' }), []);
  assert.deepEqual(filterDocuments(documents, { allowedDepartments: ['producao'], sort: 'titulo' }).map(item => item.id), ['a', 'b']);
});

test('tipos de arquivo e nomes de pasta são normalizados', () => {
  assert.equal(documentFileType({ file: { type: 'image/png' } }), 'Imagem');
  assert.equal(documentFileType(documents[1]), 'Planilha');
  assert.equal(documentFileType(documents[2]), 'Texto');
  assert.equal(normalizeDocumentFolder('  Recursos   Humanos '), 'Recursos Humanos');
});

test('revisões usam datas civis e distinguem vencidas das próximas', () => {
  assert.equal(documentReviewStatus('', '2026-10-12'), 'sem-data');
  assert.equal(documentReviewStatus('2026-10-11', '2026-10-12'), 'vencida');
  assert.equal(documentReviewStatus('2026-10-12', '2026-10-12'), 'proxima');
  assert.equal(documentReviewStatus('2026-11-11', '2026-10-12'), 'proxima');
  assert.equal(documentReviewStatus('2026-11-12', '2026-10-12'), 'em-dia');
  const due = { ...documents[0], reviewDate: '2026-10-11' };
  assert.deepEqual(filterDocuments([due, ...documents.slice(1)], { allowedDepartments: ['producao'], review: 'vencida', today: '2026-10-12' }).map(item => item.id), ['a']);
});

test('acesso pode ser liberado para toda empresa, setor ou pessoas específicas', () => {
  const privateDocument = { id: 'private', accessMode: 'people', allowedUserIds: ['u2'], dept: 'all' };
  const departmentDocument = { id: 'department', accessMode: 'department', dept: 'rh' };
  assert.equal(canAccessDocument(privateDocument, { userId: 'u1', allowedDepartments: ['rh'] }), false);
  assert.equal(canAccessDocument(privateDocument, { userId: 'u2', allowedDepartments: [] }), true);
  assert.equal(canAccessDocument(departmentDocument, { userId: 'u1', allowedDepartments: ['rh'] }), true);
  assert.equal(canAccessDocument(departmentDocument, { userId: 'u1', allowedDepartments: ['producao'] }), false);
  assert.equal(canAccessDocument(privateDocument, { userId: 'u1', isAdmin: true }), true);
});
