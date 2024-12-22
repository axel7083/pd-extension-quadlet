/**
 * @author axel7083
 */
import { test, expect } from 'vitest';
import { greet } from 'demo-wasm-pack';

test('demo wasm', async () => {
  const greeting = greet();
  expect(greeting).toBe('Hello, demo-wasm-pack!');
});
