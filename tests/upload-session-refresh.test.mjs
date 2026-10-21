import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');

test('upload session refresh is authenticated and remains tenant-bound', () => {
  const section = source.match(/export const refreshUploadSession[\s\S]*?export const getLoginDirectory/)?.[0] || '';
  assert.match(section, /if \(!request\.auth\)/);
  assert.match(section, /request\.auth\.token\.companyId \|\| ''\) !== companyId/);
  assert.match(section, /users\/\$\{request\.auth\.uid\}/);
  assert.match(section, /profileData\.isAdmin === true/);
  assert.match(section, /uploadAuthorized: true/);
  assert.match(section, /uploadCompanyId: companyId/);
  assert.match(section, /uploadFolder: folder/);
  assert.match(section, /uploadFileName: fileName/);
  assert.match(section, /uploadSize/);
  assert.match(section, /uploadContentType/);
});

test('platform support refresh still requires the private support authorization', () => {
  const section = source.match(/export const refreshUploadSession[\s\S]*?export const getLoginDirectory/)?.[0] || '';
  assert.match(section, /_platformSupport\/\$\{SUPPORT_UID\}/);
  assert.match(section, /support\.data\(\)\?\.enabled !== true/);
  assert.match(section, /support\.data\(\)\?\.appId !== appId/);
  assert.doesNotMatch(section, /request\.auth\.token\.isDeveloper !== true/);
});

test('upload authorization validates folder and exact generated file name', () => {
  const section = source.match(/export const refreshUploadSession[\s\S]*?export const getLoginDirectory/)?.[0] || '';
  assert.match(section, /allowedFolders = \['documents', 'attachments', 'avatars', 'images', 'whistleblowing-poster'\]/);
  assert.match(section, /!isAdmin && !\['attachments', 'images'\]\.includes\(folder\)/);
  assert.match(section, /\[a-zA-Z0-9\._-\]\{1,220\}/);
  assert.match(section, /uploadSize <= 25 \* 1024 \* 1024/);
  assert.match(section, /uploadSize <= 50 \* 1024 \* 1024/);
  assert.match(section, /uploadContentType\.startsWith\('image\/'\)/);
});
