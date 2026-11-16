import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { compressImage, formatBytes } from "@/lib/mobility/image";
import {
  ACCEPTED_IMAGE_TYPES,
  REPORT_CATEGORIES,
  validateImageFile,
  type ReportCategory,
} from "@/lib/mobility/rules";
import type { LatLng } from "@/lib/mobility/routing";
import { addReport } from "@/lib/mobility/store";

interface ReportDialogProps {
  point: LatLng | null;
  onClose: () => void;
}

export function ReportDialog({ point, onClose }: ReportDialogProps) {
  const [category, setCategory] = useState<ReportCategory>("pothole");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setCategory("pothole");
    setDescription("");
    clearFile();
    setError(null);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    const check = validateImageFile(f);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!point) return;
    setSaving(true);
    try {
      const image = file ? await compressImage(file) : undefined;
      const { points } = addReport({
        category,
        description: description.trim(),
        lat: point[0],
        lng: point[1],
        image,
      });
      toast.success(`+${points} pontos!`, {
        description: `${REPORT_CATEGORIES[category].label} registrado. Obrigado por cuidar da cidade.`,
      });
      reset();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o reporte.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={point !== null}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-display text-2xl">Reportar ocorrência</DialogTitle>
          <DialogDescription>
            {point
              ? `Local marcado em ${point[0].toFixed(5)}, ${point[1].toFixed(5)}`
              : "Marque o local no mapa"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de ocorrência">
            {(Object.keys(REPORT_CATEGORIES) as ReportCategory[]).map((key) => {
              const c = REPORT_CATEGORIES[key];
              const selected = key === category;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
                    selected
                      ? "border-ink bg-signal/25"
                      : "border-border bg-card hover:border-muted-foreground",
                  )}
                >
                  <span className="text-xl leading-none">{c.emoji}</span>
                  <span className="text-sm font-semibold text-foreground">{c.short}</span>
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-ink-foreground">
                    +{c.points} pts
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-desc">Descrição</Label>
            <Textarea
              id="report-desc"
              placeholder={REPORT_CATEGORIES[category].description}
              value={description}
              maxLength={280}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto (opcional)</Label>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              aria-label="Escolher foto"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            {preview && file ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={preview} alt="Pré-visualização" className="max-h-60 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 bg-card px-3 py-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {file.name} · {formatBytes(file.size)}
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={clearFile}>
                    <X /> Remover
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pick(e.dataTransfer.files?.[0]);
                }}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/60 px-4 py-8 text-center transition-colors hover:border-ink"
              >
                <ImagePlus className="size-7 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Toque para enviar ou arraste a imagem
                </span>
                <span className="text-xs text-muted-foreground">PNG, JPEG/JPG ou WebP · até 5MB</span>
              </button>
            )}
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="signal" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Enviar e ganhar +{REPORT_CATEGORIES[category].points} pts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
