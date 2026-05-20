"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, RotateCw, ImageIcon, Images } from "lucide-react";
import { Button } from "@/components/ui/button";

type Property360Row = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  external_url: string | null;
  position: number;
  active: boolean;
  imageCount?: number;
};

function SortableItem({
  property,
  onToggle,
  onDelete,
  onManageImages,
}: {
  property: Property360Row;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onManageImages: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const count = property.imageCount ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border select-none ${
        property.active
          ? "border-white/10 bg-white/[0.03]"
          : "border-white/5 bg-white/[0.01] opacity-50"
      } ${isDragging ? "shadow-2xl border-[#B8966E]/40" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50 transition-colors touch-none flex-shrink-0"
        title="Arrastar para reordenar"
      >
        <GripVertical size={16} />
      </button>

      {property.thumbnail_url ? (
        <img
          src={property.thumbnail_url}
          alt=""
          className="w-8 h-10 rounded object-cover flex-shrink-0 border border-white/10"
        />
      ) : (
        <div className="w-8 h-10 rounded border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
          <ImageIcon size={12} className="text-white/20" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{property.title}</p>
        <p className="text-white/30 text-xs flex items-center gap-1">
          <RotateCw size={9} />
          {count === 0 ? "Sem fotos 360°" : `${count} foto${count > 1 ? "s" : ""} 360°`}
        </p>
      </div>

      <button
        onClick={() => onManageImages(property.id)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 text-white/40 hover:text-[#B8966E] hover:border-[#B8966E]/30 transition-all text-xs flex-shrink-0"
        title="Gerenciar fotos 360°"
      >
        <Images size={12} />
        <span className="hidden sm:inline">Fotos</span>
      </button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(property.id, property.active)}
        className={`text-xs flex-shrink-0 ${
          property.active ? "text-green-400 hover:text-green-300" : "text-white/30 hover:text-white/50"
        }`}
      >
        {property.active ? "Ativo" : "Inativo"}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(property.id)}
        className="text-red-400/50 hover:text-red-400 h-8 w-8 flex-shrink-0"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

export function Property360List({
  properties,
  onReorder,
  onToggle,
  onDelete,
  onManageImages,
}: {
  properties: Property360Row[];
  onReorder: (properties: Property360Row[]) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onManageImages: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = properties.findIndex((p) => p.id === active.id);
    const newIndex = properties.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(properties, oldIndex, newIndex).map((p, i) => ({
      ...p,
      position: i,
    }));
    onReorder(reordered);
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 border border-dashed border-white/10 rounded-lg gap-2">
        <RotateCw size={24} className="text-white/10" />
        <p className="text-white/20 text-xs">Nenhum imóvel 360° cadastrado ainda</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={properties.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {properties.map((p) => (
            <SortableItem
              key={p.id}
              property={p}
              onToggle={onToggle}
              onDelete={onDelete}
              onManageImages={onManageImages}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
