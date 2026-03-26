import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { Check, ChevronDown, GripVertical, Pencil, Plus } from 'lucide-react';
import type { IngredientUnit, RecipeIngredient } from '../../lib/types';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { cn } from '../../lib/cn';
import {
  convertIngredientQuantity,
  formatIngredientQuantity,
  getCompatibleIngredientUnits,
  getIngredientUnitLabel
} from './units';

type IngredientListProps = {
  editMode: boolean;
  ingredients: RecipeIngredient[];
  onAdd: () => void;
  onEdit: (ingredient: RecipeIngredient) => void;
  onTogglePurchased: (ingredient: RecipeIngredient) => Promise<void> | void;
  onReorder: (ingredient: RecipeIngredient, position: number) => Promise<void> | void;
};

function UnitPicker({
  value,
  units,
  onChange
}: {
  value: IngredientUnit;
  units: IngredientUnit[];
  onChange: (unit: IngredientUnit) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateMenuPosition = () => {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();

      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    updateMenuPosition();
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn('relative', open ? 'z-30' : 'z-0')}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-7 min-w-[64px] items-center justify-between gap-1 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(26,33,27,0.96),rgba(16,22,18,0.96))] px-2 text-[10px] uppercase tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_20px_rgba(0,0,0,0.12)] transition-all duration-200 hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[rgba(191,209,171,0.72)] focus:ring-offset-2 focus:ring-offset-transparent sm:h-8 sm:min-w-[84px] sm:gap-2 sm:px-3 sm:text-xs"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span>{getIngredientUnitLabel(value)}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', open ? 'rotate-180' : 'rotate-0')} />
      </button>

      {open && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="modal-rise-in fixed z-[120] min-w-[150px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,25,20,0.98),rgba(13,18,15,0.98))] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur-xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left
              }}
            >
              <div className="grid gap-1" role="listbox" aria-label="Ingredient unit">
                {units.map((unit) => {
                  const isActive = unit === value;

                  return (
                    <button
                      key={unit}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={cn(
                        'inline-flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.14em] transition-all duration-150',
                        isActive
                          ? 'bg-[rgba(127,155,113,0.2)] text-[color:var(--accent-strong)]'
                          : 'text-[color:var(--text-primary)] hover:bg-white/8'
                      )}
                      onClick={() => {
                        onChange(unit);
                        setOpen(false);
                      }}
                    >
                      <span>{getIngredientUnitLabel(unit)}</span>
                      {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function SortableIngredientRow({
  editMode,
  ingredient,
  displayUnit,
  onDisplayUnitChange,
  onEdit,
  onTogglePurchased
}: {
  editMode: boolean;
  ingredient: RecipeIngredient;
  displayUnit: IngredientUnit;
  onDisplayUnitChange: (ingredientId: string, unit: IngredientUnit) => void;
  onEdit: (ingredient: RecipeIngredient) => void;
  onTogglePurchased: (ingredient: RecipeIngredient) => Promise<void> | void;
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
        className={cn(
          'overflow-visible border px-3 py-2 transition duration-200 sm:px-5 sm:py-3',
          ingredient.purchased
            ? 'border-[rgba(191,209,171,0.24)] bg-[linear-gradient(180deg,rgba(191,209,171,0.11),rgba(255,255,255,0.025))] hover:border-[rgba(191,209,171,0.36)]'
            : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] hover:border-white/20 hover:bg-white/[0.07]',
          isDragging ? 'opacity-80 ring-2 ring-[rgba(191,209,171,0.5)]' : ''
        )}
      >
        <div className={cn('flex gap-3', editMode ? 'items-start' : 'items-center')}>
          <div className={cn('min-w-0 flex-1', editMode ? 'flex flex-col gap-2.5 lg:flex-row lg:items-center' : '')}>
            <div className={cn('min-w-0 flex-1', ingredient.notes ? 'space-y-1.5 sm:space-y-2' : '')}>
              <div className="flex min-h-7 min-w-0 flex-wrap items-center gap-1.5 text-[11px] font-semibold leading-none sm:min-h-9 sm:gap-2 sm:text-base">
                <span className={cn('inline-flex h-7 items-center leading-none sm:h-8', ingredient.purchased ? 'text-[color:var(--text-secondary)]' : 'text-white')}>
                  {formatIngredientQuantity(displayQuantity)}
                </span>
                {compatibleUnits.length > 1 ? (
                  <UnitPicker
                    value={displayUnit}
                    units={compatibleUnits}
                    onChange={(unit) => {
                      onDisplayUnitChange(ingredient.id, unit);
                    }}
                  />
                ) : (
                  <span
                    className={cn(
                      'inline-flex h-7 items-center leading-none text-[10px] uppercase tracking-[0.12em] sm:h-8 sm:text-xs',
                      ingredient.purchased ? 'text-[color:var(--text-secondary)]' : 'text-white'
                    )}
                  >
                    {getIngredientUnitLabel(displayUnit)}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex h-7 min-w-0 items-center truncate leading-none sm:h-8',
                    ingredient.purchased ? 'text-[color:var(--text-secondary)]' : 'text-white'
                  )}
                >
                  {ingredient.name}
                </span>
              </div>
              {ingredient.notes ? (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--text-secondary)] sm:text-xs">
                  <span
                    className={cn(
                      'truncate rounded-full border px-2.5 py-0.5 sm:py-1',
                      ingredient.purchased ? 'border-[rgba(191,209,171,0.16)] bg-[rgba(191,209,171,0.08)]' : 'border-white/10 bg-white/5'
                    )}
                  >
                    {ingredient.notes}
                  </span>
                </div>
              ) : null}
            </div>
            {editMode ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 lg:mt-0 lg:justify-end">
                <Button size="sm" variant="secondary" onClick={() => onEdit(ingredient)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <button
                  aria-label={`Drag ingredient ${ingredient.name}`}
                  className="inline-flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-100 transition-all duration-200 active:scale-[0.96] hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-[rgba(191,209,171,0.72)] focus:ring-offset-2 focus:ring-offset-transparent"
                  type="button"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-pressed={ingredient.purchased}
            aria-label={`Mark ${ingredient.name} as ${ingredient.purchased ? 'missing' : 'bought'}`}
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(191,209,171,0.72)] focus:ring-offset-2 focus:ring-offset-transparent sm:h-10 sm:w-10 sm:rounded-2xl',
              ingredient.purchased
                ? 'border-[rgba(191,209,171,0.35)] bg-[linear-gradient(135deg,rgba(191,209,171,0.98),rgba(118,144,103,0.95))] text-slate-950 shadow-[0_14px_28px_rgba(76,98,67,0.22)]'
                : 'border-[rgba(191,209,171,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] text-[color:var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-[rgba(191,209,171,0.3)] hover:bg-white/10 hover:text-[color:var(--accent-strong)]'
            )}
            onClick={() => {
              void onTogglePurchased(ingredient);
            }}
          >
            <Check className={cn('h-3.5 w-3.5 transition-opacity duration-150 sm:h-4 sm:w-4', ingredient.purchased ? 'opacity-100' : 'opacity-40')} />
          </button>
        </div>
      </Card>
    </div>
  );
}

export function IngredientList({ editMode, ingredients, onAdd, onEdit, onTogglePurchased, onReorder }: IngredientListProps) {
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
        description={
          editMode
            ? 'Add the ingredient list for this recipe so you can see quantities, units, and convert each ingredient on its own when needed.'
            : 'Turn on edit mode when you want to build out the ingredient list for this recipe.'
        }
        action={editMode ? (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add your first ingredient
          </Button>
        ) : undefined}
      />
    );
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!editMode) {
      return;
    }

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
        <div className="grid gap-3">
          {orderedIngredients.map((ingredient) => (
            <SortableIngredientRow
              key={ingredient.id}
              editMode={editMode}
              ingredient={ingredient}
              displayUnit={normalizedDisplayUnits[ingredient.id]}
              onDisplayUnitChange={(ingredientId, unit) => {
                setDisplayUnits((current) => ({
                  ...current,
                  [ingredientId]: unit
                }));
              }}
              onEdit={onEdit}
              onTogglePurchased={onTogglePurchased}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
