import React, { type ReactNode, useState } from "react";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ViewProps {
  children?: ReactNode;
}

/** Ouverture d’un modal lecture seule (icône œil), même pattern que `Update`. */
export default function View({ children }: ViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  const content =
    React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<{ onClose?: () => void }>, {
          onClose: handleClose,
        })
      : children;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Eye
          className="cursor-pointer text-teal-700 dark:text-teal-400"
          aria-label="Voir les détails"
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">{content}</DialogContent>
    </Dialog>
  );
}
