import { describe, expect, it } from 'vitest';
import { LIFECYCLE_STAGES } from '../api/types';
import { LIFECYCLE_GUIDANCE } from './lifecycleGuidance';

describe('lifecycle guidance catalog', () => {
  it('provides how-to guidance and pitfalls for all six stages', () => {
    expect(Object.keys(LIFECYCLE_GUIDANCE)).toEqual([...LIFECYCLE_STAGES]);

    for (const stage of LIFECYCLE_STAGES) {
      expect(LIFECYCLE_GUIDANCE[stage].length).toBeGreaterThan(0);
      for (const item of LIFECYCLE_GUIDANCE[stage]) {
        expect(item.id).toBeTruthy();
        expect(item.title).toBeTruthy();
        expect(item.documents.trim()).toBeTruthy();
        expect(item.howTo).toBeTruthy();
        expect(item.watchFor).toBeTruthy();
      }
    }
  });

  it('uses unique guidance anchors across stages', () => {
    const ids = LIFECYCLE_STAGES.flatMap((stage) => LIFECYCLE_GUIDANCE[stage].map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});