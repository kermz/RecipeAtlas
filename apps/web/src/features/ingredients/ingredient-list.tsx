import { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Plus } from 'lucide-react';
import type { IngredientUnit, RecipeIngredient } from '../../lib/types';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import {
  convertIngredientQuantity,
  formatIngredientQuantity,
  getCompatibleIngredientUnits,
  getIngredientUnitLabel
} from './units';

type IngredientListProps = {
  ingredients: RecipeIngredient[];
  onAdd: () => void;
  onEdit: (ingredient: RecipeIngredient) => void;
  onReorder: (ingredient: RecipeIngredient, position: number) => Promise<void> | void;
};

function SortableIngredientRow({
  ingredient,
  displayUnit,
  onDisplayUnitChange,
  onEdit
}: {
  ingredient: RecipeIngredient;
  displayUnit: IngredientUnit;
  onDisplayUnitChange: (ingredientId: string, unit: IngredientUnit) => void;
  onEdit: (ingredient: RecipeIngredient) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ingredient.id
  });

  const compatibleUnits = getCompatibleIngredientUnits(ingredient.unit);
  const displayQuantity = convertIngredientQuantity(ingredient.quantity, ingredient.unit, displayUnit);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
    >
      <Card
        className={`border border-white/10 bg-slate-950/35 px-4 py-3 transition hover:border-white/20 ${isDragging ? 'opacity-80 ring-2 ring-sky-300/50' : ''}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {formatIngredientQuantity(displayQuantity)} {getIngredientUnitLabel(displayUnit)} {ingredient.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {displayUnit !== ingredient.unit ? (
                <span>
                  (Base {formatIngredientQuantity(ingredient.quantity)} {getIngredientUnitLabel(ingredient.unit)})
                </span>
              ) : null}
              {ingredient.notes ? <span className="truncate">{ingredient.notes}</span> : null}
            </div>
          </div>
          {compatibleUnits.length > 1 ? (
            <label className="flex items-center text-xs text-slate-300">
              <select
                className="h-9 w-24 rounded-xl border border-white/12 bg-slate-950/50 px-3 text-sm text-slate-100 outline-none transition focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/30"
                value={displayUnit}
                onChange={(event) => {
                  onDisplayUnitChange(ingredient.id, event.target.value as IngredientUnit);
                }}
              >
                {compatibleUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {getIngredientUnitLabel(unit)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => onEdit(ingredient)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <button
            aria-label={`Drag ingredient ${ingredient.name}`}
            className="inline-flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-100 transition-all hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-transparent"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

export function IngredientList({ ingredients, onAdd, onEdit, onReorder }: IngredientListProps) {
  const [displayUnits, setDisplayUnits] = useState<Record<string, IngredientUnit>>({});
  const [orderedIngredients, setOrderedIngredients] = useState(ingredients);

  useEffect(() => {
    setOrderedIngredients(ingredients);
  }, [ingredients]);

  const normalizedDisplayUnits = useMemo(() => {
    const nextUnits: Record<string, IngredientUnit> = {};

    for (const ingredient of ingredients) {
      nextUnits[ingredient.id] = displayUnits[ingredient.id] ?? ingredient.unit;
    }

    return nextUnits;
  }, [displayUnits, ingredients]);
  const ingredientMap = useMemo(() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])), [ingredients]);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 6
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  if (ingredients.length === 0) {
    return (
      <EmptyState
        title="No ingredients yet"
        description="Add the ingredient list for this recipe so you can see quantities, units, and convert each ingredient on its own when needed."
        action={
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add your first ingredient
          </Button>
        }
      />
    );
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedIngredients.findIndex((ingredient) => ingredient.id === active.id);
    const newIndex = orderedIngredients.findIndex((ingredient) => ingredient.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const nextIngredients = arrayMove(orderedIngredients, oldIndex, newIndex).map((ingredient, index) => ({
      ...ingredient,
      position: index + 1
    }));

    setOrderedIngredients(nextIngredients);

    const movedIngredient = ingredientMap.get(String(active.id));
    if (!movedIngredient) {
      return;
    }

    await onReorder(movedIngredient, newIndex + 1);
  };

  return (
    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIngredients.map((ingredient) => ingredient.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-2">
          {orderedIngredients.map((ingredient) => (
            <SortableIngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              displayUnit={normalizedDisplayUnits[ingredient.id]}
              onDisplayUnitChange={(ingredientId, unit) => {
                setDisplayUnits((current) => ({
                  ...current,
                  [ingredientId]: unit
                }));
              }}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
