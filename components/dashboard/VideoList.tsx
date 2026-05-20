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
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF4444",
  reels:   "#E1306C",
  tiktok:  "#69C9D0",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  reels:   "Reels",
  tiktok:  "TikTok",
};

type VideoRow = {
  id: string;
  title: string;
  platform: string;
  mp4_url: string | null;
  external_url: string | null;
  youtube_url: string | null;
  position: number;
  active: boolean;
};

function SortableItem({
  video,
  onToggle,
  onDelete,
}: {
  video: VideoRow;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const color = PLATFORM_COLORS[video.platform] ?? "#888";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border select-none ${
        video.active
          ? "border-white/10 bg-white/[0.03]"
          : "border-white/5 bg-white/[0.01] opacity-50"
      } ${isDragging ? "shadow-2xl border-[#B8966E]/40" : ""}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50 transition-colors touch-none flex-shrink-0"
        title="Arrastar para reordenar"
      >
        <GripVertical size={16} />
      </button>

      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{video.title}</p>
        <p className="text-white/30 text-xs truncate">
          {PLATFORM_LABELS[video.platform] ?? video.platform}
          {(video.mp4_url || video.external_url) && " · "}
          {video.mp4_url ? "MP4 enviado" : video.external_url}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(video.id, video.active)}
        className={`text-xs flex-shrink-0 ${
          video.active ? "text-green-400 hover:text-green-300" : "text-white/30 hover:text-white/50"
        }`}
      >
        {video.active ? "Ativo" : "Inativo"}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(video.id)}
        className="text-red-400/50 hover:text-red-400 h-8 w-8 flex-shrink-0"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

export function VideoList({
  videos,
  onReorder,
  onToggle,
  onDelete,
}: {
  videos: VideoRow[];
  onReorder: (videos: VideoRow[]) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);
    const reordered = arrayMove(videos, oldIndex, newIndex).map((v, i) => ({
      ...v,
      position: i,
    }));
    onReorder(reordered);
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 border border-dashed border-white/10 rounded-lg gap-2">
        <GripVertical size={24} className="text-white/10" />
        <p className="text-white/20 text-xs">Nenhum vídeo cadastrado ainda</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {videos.map((v) => (
            <SortableItem key={v.id} video={v} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
