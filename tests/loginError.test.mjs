import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loginErrorMessage} from '../src/loginError.js';

test('employee login explains temporary lockout instead of saying PIN is invalid', () => {
  assert.match(loginErrorMessage({code: 'functions/resource-exhausted'}), /bloqueado.*30 segundos/);
  assert.match(loginErrorMessage({code: 'functions/permission-denied'}), /PIN inválido/);
});

test('support login uses the same lockout guidance', () => {
  assert.match(loginErrorMessage({code: 'functions/resource-exhausted'}, true), /bloqueado.*30 segundos/);
  assert.match(loginErrorMessage({code: 'functions/permission-denied'}, true), /suporte inválido/);
});

test('blocked company code explains that support must restore access', () => {
  assert.match(loginErrorMessage({code: 'functions/failed-precondition'}), /código.*bloqueado.*suporte/);
});
