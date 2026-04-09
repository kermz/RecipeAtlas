import convert from 'convert-units';
import type { IngredientUnit } from '../../lib/types';

type UnitDefinition = {
  value: IngredientUnit;
  label: string;
  category: 'mass' | 'volume' | 'count';
};

export const ingredientUnits: UnitDefinition[] = [
  { value: 'g', label: 'g', category: 'mass' },
  { value: 'kg', label: 'kg', category: 'mass' },
  { value: 'oz', label: 'oz', category: 'mass' },
  { value: 'lb', label: 'lb', category: 'mass' },
  { value: 'ml', label: 'ml', category: 'volume' },
  { value: 'l', label: 'l', category: 'volume' },
  { value: 'tsp', label: 'tsp', category: 'volume' },
  { value: 'Tbs', label: 'tbsp', category: 'volume' },
  { value: 'cup', label: 'cup', category: 'volume' },
  { value: 'fl-oz', label: 'fl oz', category: 'volume' },
  { value: 'pcs', label: 'pcs', category: 'count' }
];

const ingredientUnitMap = new Map(ingredientUnits.map((unit) => [unit.value, unit]));

export function getIngredientUnitLabel(unit: IngredientUnit) {
  return ingredientUnitMap.get(unit)?.label ?? unit;
}

export function getCompatibleIngredientUnits(unit: IngredientUnit) {
  const source = ingredientUnitMap.get(unit);
  if (!source) {
    return [unit];
  }

  return ingredientUnits.filter((candidate) => candidate.category === source.category).map((candidate) => candidate.value);
}

export function convertIngredientQuantity(quantity: number, from: IngredientUnit, to: IngredientUnit) {
  if (from === to) {
    return quantity;
  }

  const source = ingredientUnitMap.get(from);
  const target = ingredientUnitMap.get(to);

  if (!source || !target || source.category !== target.category || source.category === 'count') {
    return quantity;
  }

  return convert(quantity).from(from as never).to(to as never);
}

export function formatIngredientQuantity(quantity: number) {
  const rounded = Number(quantity.toFixed(quantity >= 10 ? 1 : 2));

  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return rounded.toString();
}
