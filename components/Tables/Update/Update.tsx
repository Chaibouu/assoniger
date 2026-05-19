import React, { type ReactNode, useState } from "react";
import { FilePenLine } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface UpdateProps {
  id?: string;
  children?: ReactNode;
}

export default function Update({ children }: UpdateProps) {
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
        <FilePenLine className="cursor-pointer" color="#306ced" aria-hidden />
      </DialogTrigger>
      <DialogContent className="overflow-visible sm:max-w-md">{content}</DialogContent>
    </Dialog>
  );
}
