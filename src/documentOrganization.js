export const DEFAULT_DOCUMENT_FOLDER = 'Sem pasta';

export function normalizeDocumentFolder(value) {
  const folder = String(value || '').trim().replace(/\s+/g, ' ');
  return folder && folder.length <= 60 ? folder : DEFAULT_DOCUMENT_FOLDER;
}

export function documentFileType(document) {
  const name = String(document?.file?.name || '').toLocaleLowerCase('pt-BR');
  const mime = String(document?.file?.type || '').toLocaleLowerCase('pt-BR');
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic)$/.test(name)) return 'Imagem';
  if (/spreadsheet|excel|csv/.test(mime) || /\.(xlsx?|csv|ods)$/.test(name)) return 'Planilha';
  if (/word|document|text\//.test(mime) || /\.(docx?|odt|txt|rtf)$/.test(name)) return 'Texto';
  return 'Outros';
}

export function documentFolders(documents) {
  return [...new Set(documents.map(item => normalizeDocumentFolder(item.folder)))].sort((a, b) =>
    a === DEFAULT_DOCUMENT_FOLDER ? -1 : b === DEFAULT_DOCUMENT_FOLDER ? 1 : a.localeCompare(b, 'pt-BR'));
}

export function documentReviewStatus(reviewDate, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(reviewDate || ''))) return 'sem-data';
  const deadline = Date.parse(`${reviewDate}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(deadline) || !Number.isFinite(current)) return 'sem-data';
  const days = Math.round((deadline - current) / 86400000);
  if (days < 0) return 'vencida';
  if (days <= 30) return 'proxima';
  return 'em-dia';
}

export function canAccessDocument(document, { allowedDepartments = [], userId = '', isAdmin = false } = {}) {
  if (isAdmin) return true;
  const accessMode = document?.accessMode || (Array.isArray(document?.allowedUserIds) && document.allowedUserIds.length ? 'people' : document?.dept === 'all' ? 'company' : 'department');
  if (accessMode === 'company') return true;
  if (accessMode === 'people') return Array.isArray(document?.allowedUserIds) && document.allowedUserIds.includes(userId);
  return document?.dept === 'all' || allowedDepartments.includes(document?.dept);
}

export function filterDocuments(documents, { allowedDepartments, category = 'Todos', folder = 'Todas as pastas',
  department = 'Todos os setores', fileType = 'Todos os tipos', reading = 'Todos', review = 'Todas', today = '', search = '', userId = '', isAdmin = false, sort = 'recentes' }) {
  const term = search.trim().toLocaleLowerCase('pt-BR');
  return documents
    .filter(item => canAccessDocument(item, { allowedDepartments, userId, isAdmin }))
    .filter(item => category === 'Todos' || (item.category || 'Geral') === category)
    .filter(item => folder === 'Todas as pastas' || normalizeDocumentFolder(item.folder) === folder)
    .filter(item => department === 'Todos os setores' || item.dept === department)
    .filter(item => fileType === 'Todos os tipos' || documentFileType(item) === fileType)
    .filter(item => reading !== 'Pendentes' || (item.requiredRead && !(item.readBy || []).includes(userId)))
    .filter(item => review === 'Todas' || documentReviewStatus(item.reviewDate, today) === review)
    .filter(item => !term || [item.title, item.description, item.category, item.folder, item.file?.name, ...(item.tags || [])]
      .filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(term))
    .sort((a, b) => sort === 'titulo'
      ? String(a.title || '').localeCompare(String(b.title || ''), 'pt-BR')
      : Number(b.createdAt || 0) - Number(a.createdAt || 0));
}
