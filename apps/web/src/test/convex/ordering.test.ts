import { describe, expect, it } from 'vitest';

import { clampPosition, removeRecord, reorderRecords } from '../../../convex/ordering';

describe('ordering helpers', () => {
  it('clamps positions into the available range', () => {
    expect(clampPosition(undefined, 1, 4)).toBe(4);
    expect(clampPosition(-10, 1, 4)).toBe(1);
    expect(clampPosition(10, 1, 4)).toBe(4);
    expect(clampPosition(2.8, 1, 4)).toBe(2);
  });

  it('reorders a record into a new contiguous position set', () => {
    const result = reorderRecords(
      [
        { id: 'a', position: 1 },
        { id: 'b', position: 2 },
        { id: 'c', position: 3 }
      ],
      'c',
      1
    );

    expect(result).toEqual([
      { id: 'c', position: 1 },
      { id: 'a', position: 2 },
      { id: 'b', position: 3 }
    ]);
  });

  it('removes a record and resequences the remainder', () => {
    const result = removeRecord(
      [
        { id: 'a', position: 1 },
        { id: 'b', position: 2 },
        { id: 'c', position: 3 }
      ],
      'b'
    );

    expect(result).toEqual([
      { id: 'a', position: 1 },
      { id: 'c', position: 2 }
    ]);
  });
});
