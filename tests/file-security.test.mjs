import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const storageRules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
const functionsSource = readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');

test('uploads carry owner and record identifiers used by storage authorization', () => {
  assert.match(appSource, /customMetadata = Object\.fromEntries\(Object\.entries\(\{ ownerUid: uploader\.uid, \.\.\.accessMetadata \}\)/);
  assert.match(appSource, /uploadFileToStorage\([\s\S]{0,160}file,[\s\S]{0,80}'documents',[\s\S]{0,80}\{ documentId \}/);
  assert.match(appSource, /uploadFileToStorage\(file, 'attachments', \{ messageId, threadId: attachmentThreadId \}\)/);
  assert.match(storageRules, /resource\.metadata\.get\('documentId'/);
  assert.match(storageRules, /resource\.metadata\.get\('messageId'/);
  assert.match(storageRules, /uploadCompanyId/);
  assert.match(storageRules, /uploadFolder/);
  assert.match(storageRules, /uploadFileName/);
  assert.match(storageRules, /uploadSize/);
  assert.match(storageRules, /uploadContentType/);
  assert.match(storageRules, /function currentSessionUpload\(companyId, userId, folder\)/);
  assert.match(storageRules, /folder == 'images'[\s\S]*?request\.auth\.token\.get\('companyId', ''\) == companyId/);
  assert.match(storageRules, /boundUpload\(companyId, userId, folder, fileName\)/);
  assert.match(storageRules, /folder in \['avatars', 'images', 'whistleblowing-poster'\][\s\S]*?request\.auth\.uid == userId[\s\S]*?request\.auth\.token\.get\('companyId', ''\) == companyId/);
});

test('restricted files are downloaded through authenticated storage reads', () => {
  assert.match(appSource, /getBlob\(ref\(storage, file\.storagePath \|\| fileUrl\)\)/);
  assert.match(appSource, /handleDownload\(item\.file, item\.file\?\.name\)/);
  assert.match(appSource, /handleDownload\(msg\.attachment, msg\.attachment\.name\)/);
});

test('document deletion also removes its physical object', () => {
  assert.match(appSource, /deleteStoredFile\(documentItem\?\.file\)/);
  assert.match(functionsSource, /export const cleanupDeletedDocumentFile = onDocumentDeleted/);
  assert.match(functionsSource, /getStorage\(\)\.bucket\(\)\.file\(filePath\)\.delete\(\{ignoreNotFound: true\}\)/);
});
