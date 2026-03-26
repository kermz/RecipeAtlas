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
import { Plus } from 'lucide-react';
import type { RecipeStep } from '../../lib/types';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { StepCard } from './step-card';

type StepListProps = {
  editMode: boolean;
  steps: RecipeStep[];
  onAdd: () => void;
  onEdit: (step: RecipeStep) => void;
  onComplete: (step: RecipeStep) => void;
  onReset: (step: RecipeStep) => void;
  onStartTimer: (step: RecipeStep) => void;
  onReorder: (step: RecipeStep, position: number) => Promise<void> | void;
};

function SortableStepCard({
  editMode,
  step,
  onEdit,
  onComplete,
  onReset,
  onStartTimer
}: {
  editMode: boolean;
  step: RecipeStep;
  onEdit: (step: RecipeStep) => void;
  onComplete: (step: RecipeStep) => void;
  onReset: (step: RecipeStep) => void;
  onStartTimer: (step: RecipeStep) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
    >
      <StepCard
        editMode={editMode}
        step={step}
        onEdit={onEdit}
        onComplete={onComplete}
        onReset={onReset}
        onStartTimer={onStartTimer}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

export function StepList({ editMode, steps, onAdd, onEdit, onComplete, onReset, onStartTimer, onReorder }: StepListProps) {
  const [orderedSteps, setOrderedSteps] = useState(steps);

  useEffect(() => {
    setOrderedSteps(steps);
  }, [steps]);

  const stepMap = useMemo(() => new Map(steps.map((step) => [step.id, step])), [steps]);
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

  if (steps.length === 0) {
    return (
      <EmptyState
        title="No steps yet"
        description={
          editMode
            ? 'Add ordered steps to track the process, attach timers, and mark completion timestamps when each step is finished.'
            : 'Turn on edit mode when you want to add or rearrange the cooking flow for this recipe.'
        }
        action={editMode ? (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add your first step
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

    const oldIndex = orderedSteps.findIndex((step) => step.id === active.id);
    const newIndex = orderedSteps.findIndex((step) => step.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const nextSteps = arrayMove(orderedSteps, oldIndex, newIndex).map((step, index) => ({
      ...step,
      position: index + 1
    }));

    setOrderedSteps(nextSteps);

    const movedStep = stepMap.get(String(active.id));
    if (!movedStep) {
      return;
    }

    await onReorder(movedStep, newIndex + 1);
  };

  return (
    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedSteps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-4">
          {orderedSteps.map((step) => (
            <SortableStepCard
              key={step.id}
              editMode={editMode}
              step={step}
              onEdit={onEdit}
              onComplete={onComplete}
              onReset={onReset}
              onStartTimer={onStartTimer}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
