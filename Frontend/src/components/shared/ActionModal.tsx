import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  children?: ReactNode;
  saveDisabled?: boolean;
};

export default function ActionModal({
  open,
  onOpenChange,
  title,
  description,
  value,
  onChange,
  placeholder,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  children,
  saveDisabled,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3 py-1">
          {children}
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-sm rounded-md border border-border hover:bg-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled ?? !value.trim()}
            className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saveLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
