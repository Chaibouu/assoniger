"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileKey2, FolderOpen, Pencil, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { AssociationStatus } from "@prisma/client";
import appConfig from "@/settings";
import {
  deleteAssociationAction,
  toggleAssociationStatusAction,
} from "@/actions/associations/association-admin-actions";
import { setAssociationManagedUserPassword } from "@/actions/associations/set-association-user-password";
import { AssociationDeleteDialog } from "@/components/dashboard/AssociationDeleteDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AssociationDetailToolbarProps = {
  associationId: string;
  associationName: string;
  status: AssociationStatus;
  hasLinkedUser: boolean;
  /** Email du compte tableau de bord lié (affichage dans le dialogue). */
  linkedUserEmail: string | null;
  /** Si true, l’utilisateur doit saisir l’ancien mot de passe (compte association sur son propre compte). */
  requireCurrentPassword: boolean;
  canFullEdit: boolean;
  canUseToolbar: boolean;
  showPendingDossier: boolean;
  isEditMode: boolean;
};

export function AssociationDetailToolbar({
  associationId,
  associationName,
  status,
  hasLinkedUser,
  linkedUserEmail,
  requireCurrentPassword,
  canFullEdit,
  canUseToolbar,
  showPendingDossier,
  isEditMode,
}: AssociationDetailToolbarProps) {
  const router = useRouter();
  const [pwdOpen, setPwdOpen] = React.useState(false);
  const [pwdBusy, setPwdBusy] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  async function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwdBusy(true);
    try {
      const fd = new FormData();
      fd.set("associationId", associationId);
      fd.set("currentPassword", currentPassword);
      fd.set("newPassword", newPassword);
      fd.set("confirmPassword", confirmPassword);
      const res = await setAssociationManagedUserPassword(fd);
      if (res.ok) {
        toast.success("Mot de passe mis à jour", {
          style: { backgroundColor: appConfig.primaryColor, color: "white" },
        });
        setPwdOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setPwdBusy(false);
    }
  }

  if (isEditMode) {
    return null;
  }

  if (!canUseToolbar && !showPendingDossier) {
    return null;
  }

  const isActive = status === AssociationStatus.ACTIVE;

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-center lg:justify-between"
        )}
      >
        <p className="text-sm font-medium text-foreground">Actions</p>
        <div className="flex flex-wrap items-center gap-2">
          {showPendingDossier ? (
            <Button variant="outline" size="icon" asChild title="Dossier d'inscription">
              <Link
                href={`/dashboard/associations/pending/${associationId}`}
                aria-label="Dossier d'inscription"
              >
                <FolderOpen className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : null}

          {canUseToolbar ? (
            <>
              {canFullEdit ? (
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  title="Modifier"
                  className="border-orange-500/40 text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950/30"
                >
                  <Link
                    href={`/dashboard/associations/${associationId}?mode=edit`}
                    aria-label="Modifier"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              ) : null}

              <form action={toggleAssociationStatusAction}>
                <input type="hidden" name="associationId" value={associationId} />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  title={isActive ? "Désactiver" : "Activer"}
                  aria-label={isActive ? "Désactiver" : "Activer"}
                >
                  {isActive ? (
                    <PowerOff className="h-4 w-4 text-muted-foreground" aria-hidden />
                  ) : (
                    <Power className="h-4 w-4" style={{ color: appConfig.primaryColor }} aria-hidden />
                  )}
                </Button>
              </form>

              {hasLinkedUser ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Mot de passe du compte"
                  aria-label="Mot de passe du compte"
                  onClick={() => setPwdOpen(true)}
                >
                  <FileKey2 className="h-4 w-4" aria-hidden />
                </Button>
              ) : null}

              <AssociationDeleteDialog
                associationId={associationId}
                associationName={associationName}
                deleteAction={deleteAssociationAction}
              />
            </>
          ) : null}
        </div>
      </div>

      <Dialog
        open={pwdOpen}
        onOpenChange={(open) => {
          setPwdOpen(open);
          if (!open) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau mot de passe du compte</DialogTitle>
            <DialogDescription>
              Compte de connexion au tableau de bord
              {linkedUserEmail ? (
                <>
                  {" "}
                  (<span className="font-medium text-foreground">{linkedUserEmail}</span>)
                </>
              ) : null}
              . Minimum 8 caractères.
              {!requireCurrentPassword ? (
                <span className="mt-2 block text-muted-foreground">
                  En tant qu’administrateur ou modérateur, vous pouvez définir un nouveau mot de passe sans
                  l’ancien.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitPassword} className="space-y-4">
            <input type="hidden" name="associationId" value={associationId} />
            {requireCurrentPassword ? (
              <div className="space-y-2">
                <Label htmlFor="assoc-current-pwd">Ancien mot de passe</Label>
                <div className="relative">
                  <Input
                    id="assoc-current-pwd"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={pwdBusy}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    disabled={pwdBusy}
                    aria-label={
                      showCurrentPassword ? "Masquer l’ancien mot de passe" : "Afficher l’ancien mot de passe"
                    }
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="assoc-new-pwd">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="assoc-new-pwd"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={pwdBusy}
                  minLength={8}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword((v) => !v)}
                  disabled={pwdBusy}
                  aria-label={showNewPassword ? "Masquer le nouveau mot de passe" : "Afficher le nouveau mot de passe"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assoc-confirm-pwd">Confirmation</Label>
              <div className="relative">
                <Input
                  id="assoc-confirm-pwd"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={pwdBusy}
                  minLength={8}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={pwdBusy}
                  aria-label={
                    showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation du mot de passe"
                  }
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setPwdOpen(false)} disabled={pwdBusy}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  pwdBusy ||
                  newPassword.length < 8 ||
                  (requireCurrentPassword && currentPassword.trim().length === 0)
                }
                className="text-white"
                style={{ backgroundColor: appConfig.primaryColor }}
              >
                {pwdBusy ? "…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
