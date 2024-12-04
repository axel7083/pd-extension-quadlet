/**
 * @author axel7083
 */
import { test, expect } from 'vitest';
import { dependencies } from '../../package.json';
import { coerce } from 'semver';

/**
 * This test ensure dependabot cannot update unzipper
 * runtime problem very hard to catch in dev mode
 * {@link https://github.com/ZJONSSON/node-unzipper/issues/330}
 */
test('unzipper should not be updated', () => {
  const version = coerce(dependencies['unzipper']);
  expect(version).toBeDefined();
  expect(version?.major).toBe(0);
  expect(version?.minor).toBe(11);
  expect(version?.patch).toBeGreaterThanOrEqual(6);
});
