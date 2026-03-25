export const clampPosition = (position: number | undefined, min: number, max: number) => {
  if (position === undefined || Number.isNaN(position)) {
    return max;
  }

  return Math.min(Math.max(position, min), max);
};
