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
  assert.match(appSource, /const fileRef = ref\(storage, file\.storagePath \|\| fileUrl\)/);
  assert.match(appSource, /getBlob\(fileRef\)/);
  assert.match(appSource, /handleDownload\(item\.file, item\.file\?\.name\)/);
  assert.match(appSource, /handleDownload\(msg\.attachment, msg\.attachment\.name\)/);
});

test('mobile Firebase files open outside the inbox without replacing the app', () => {
  assert.match(appSource, /const isNativeContainer = Boolean\(window\.cordova \|\| window\.Capacitor\)/);
  assert.match(appSource, /const authenticatedUrl = await getDownloadURL\(fileRef\)/);
  assert.match(appSource, /previewWindow = window\.open\('about:blank', '_blank'\)/);
  assert.match(appSource, /previewWindow\.location\.replace\(authenticatedUrl\)/);
  assert.match(appSource, /window\.open\(authenticatedUrl, '_system'\)/);
  assert.doesNotMatch(appSource, /window\.location\.assign\(authenticatedUrl\)/);
});

test('document deletion also removes its physical object', () => {
  assert.match(appSource, /deleteStoredFile\(documentItem\?\.file\)/);
  assert.match(functionsSource, /export const cleanupDeletedDocumentFile = onDocumentDeleted/);
  assert.match(functionsSource, /getStorage\(\)\.bucket\(\)\.file\(filePath\)\.delete\(\{ignoreNotFound: true\}\)/);
});
