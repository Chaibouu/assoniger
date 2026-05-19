"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import appConfig from "@/settings";
import {
  approvePendingAssociation,
  rejectPendingAssociation,
} from "@/actions/associations/pending-moderation";
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
import { cn } from "@/lib/utils";

type Props = {
  associationId: string;
  associationName: string;
};

export function PendingAssociationModerationActions({
  associationId,
  associationName,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  async function handleApprove() {
    setBusy("approve");
    try {
      const res = await approvePendingAssociation(associationId);
      if (res.ok) {
        toast.success("Association validée", {
          description: "Le compte association est désormais actif.",
          style: { backgroundColor: appConfig.primaryColor, color: "white" },
        });
        router.push(`/dashboard/associations/${associationId}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Erreur réseau ou serveur");
    } finally {
      setBusy(null);
    }
  }

  async function handleRejectSubmit() {
    setBusy("reject");
    try {
      const res = await rejectPendingAssociation(associationId, rejectReason);
      if (res.ok) {
        toast.success("Demande refusée", {
          description: "Le dossier est marqué comme rejeté.",
        });
        setRejectOpen(false);
        setRejectReason("");
        router.push("/dashboard/associations/pending");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Erreur réseau ou serveur");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Décision sur le dossier</p>
          <p className="text-xs text-muted-foreground">
            Valider pour activer le compte et passer l&apos;association en « Vérifiée », ou refuser avec une
            motivation.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={busy !== null}
            onClick={() => setRejectOpen(true)}
          >
            <XCircle className="h-4 w-4" aria-hidden />
            Refuser
          </Button>
          <Button
            type="button"
            className="gap-2 text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: appConfig.primaryColor }}
            disabled={busy !== null}
            onClick={handleApprove}
          >
            {busy === "approve" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            )}
            Valider le dossier
          </Button>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              Indiquez la raison du refus pour <span className="font-medium text-foreground">{associationName}</span>.
              Elle sera conservée dans le dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Motif (obligatoire)</Label>
            <textarea
              id="reject-reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex. : document illisible, informations incohérentes…"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={busy === "reject"}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)} disabled={busy === "reject"}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy === "reject" || rejectReason.trim().length < 3}
              onClick={handleRejectSubmit}
            >
              {busy === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Confirmer le refus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
