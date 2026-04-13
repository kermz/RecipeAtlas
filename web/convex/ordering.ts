export type OrderedRecord<TId extends string = string> = {
  id: TId;
  position: number;
};

export function clampPosition(position: number | undefined, min: number, max: number) {
  if (position === undefined || Number.isNaN(position)) {
    return max;
  }

  return Math.min(Math.max(Math.trunc(position), min), max);
}

export function reorderRecords<TRecord extends OrderedRecord>(
  records: TRecord[],
  targetId: TRecord["id"],
  nextPosition: number
) {
  if (records.length === 0) {
    return [];
  }

  const ordered = [...records].sort((left, right) => left.position - right.position);
  const target = ordered.find((record) => record.id === targetId);

  if (!target) {
    return ordered.map((record, index) => ({
      id: record.id,
      position: index + 1
    }));
  }

  const remaining = ordered.filter((record) => record.id !== targetId);
  const insertAt = clampPosition(nextPosition, 1, ordered.length) - 1;

  remaining.splice(insertAt, 0, target);

  return remaining.map((record, index) => ({
    id: record.id,
    position: index + 1
  }));
}

export function removeRecord<TRecord extends OrderedRecord>(records: TRecord[], targetId: TRecord["id"]) {
  return records
    .filter((record) => record.id !== targetId)
    .sort((left, right) => left.position - right.position)
    .map((record, index) => ({
      id: record.id,
      position: index + 1
    }));
}
