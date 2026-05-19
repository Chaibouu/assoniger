"use client";

import * as React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { isExecutiveBoardMemberPosition } from "@/lib/association-member-kind";
import { removeAssociationMemberAction, updateAssociationMemberAction } from "@/actions/associations/association-self-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
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
import appConfig from "@/settings";

export type AssociationMemberRowData = {
  id: string;
  fullName: string;
  position: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

type AssociationMemberRowActionsProps = {
  associationId: string;
  member: AssociationMemberRowData;
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function AssociationMemberRowActions({ associationId, member }: AssociationMemberRowActionsProps) {
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const isExec = isExecutiveBoardMemberPosition(member.position);
  const defaultKind: "executive" | "simple" = isExec ? "executive" : "simple";
  const [editKind, setEditKind] = React.useState<"executive" | "simple">(defaultKind);

  React.useEffect(() => {
    if (editOpen) {
      setEditKind(isExecutiveBoardMemberPosition(member.position) ? "executive" : "simple");
    }
  }, [editOpen, member.position]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Voir les détails"
          aria-label="Voir les détails"
          onClick={() => setDetailOpen(true)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Modifier"
          aria-label="Modifier le membre"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
          title="Supprimer"
          aria-label="Supprimer le membre"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du membre</DialogTitle>
            <DialogDescription>Fiche enregistrée pour {member.fullName}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Type</span>
              {isExec ? (
                <Badge variant="secondary" className="text-[0.65rem] font-semibold uppercase">
                  Bureau exécutif
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[0.65rem] font-semibold uppercase">
                  Adhérent
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Nom complet</p>
              <p className="font-medium text-foreground">{member.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Fonction / rôle</p>
              <p className="text-foreground">{isExec ? member.position : "Membre simple (adhérent)"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Téléphone</p>
              <p className="text-foreground">{member.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">E-mail</p>
              <p className="break-all text-foreground">{member.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Photo (URL)</p>
              {member.photoUrl ? (
                <a
                  href={member.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-primary underline"
                >
                  {member.photoUrl}
                </a>
              ) : (
                <p className="text-foreground">—</p>
              )}
            </div>
            {isExec ? (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Contact principal du bureau</p>
                <p className="text-foreground">{member.isPrimary ? "Oui" : "Non"}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Créé le</p>
              <p className="text-foreground">{fmtDate(member.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Dernière mise à jour</p>
              <p className="text-foreground">{fmtDate(member.updatedAt)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDetailOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
            <DialogDescription>Mettez à jour les informations de {member.fullName}.</DialogDescription>
          </DialogHeader>
          <form action={updateAssociationMemberAction} className="grid gap-4">
            <input type="hidden" name="associationId" value={associationId} />
            <input type="hidden" name="memberId" value={member.id} />
            <input type="hidden" name="memberKind" value={editKind} />

            <fieldset className="space-y-3 rounded-lg border border-border/70 bg-muted/15 p-4">
              <legend className="text-sm font-semibold text-foreground">Type de membre</legend>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent p-2 has-[:checked]:border-primary/40 has-[:checked]:bg-background">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={editKind === "executive"}
                    onChange={() => setEditKind("executive")}
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">Bureau exécutif</span>
                    <span className="block text-xs text-muted-foreground">Avec fonction officielle.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent p-2 has-[:checked]:border-primary/40 has-[:checked]:bg-background">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={editKind === "simple"}
                    onChange={() => setEditKind("simple")}
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">Membre simple</span>
                    <span className="block text-xs text-muted-foreground">Adhérent sans poste au bureau.</span>
                  </span>
                </label>
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor={`edit-name-${member.id}`}>Nom complet</Label>
              <Input
                id={`edit-name-${member.id}`}
                name="fullName"
                required
                minLength={2}
                defaultValue={member.fullName}
              />
            </div>

            {editKind === "executive" ? (
              <div className="space-y-1.5">
                <Label htmlFor={`edit-post-${member.id}`}>Fonction / poste au bureau</Label>
                <Input
                  id={`edit-post-${member.id}`}
                  name="executivePost"
                  required={editKind === "executive"}
                  minLength={2}
                  defaultValue={isExec ? member.position : ""}
                  placeholder="Ex. Président, Secrétaire général…"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor={`edit-phone-${member.id}`}>Téléphone (optionnel)</Label>
              <Input
                id={`edit-phone-${member.id}`}
                name="phone"
                type="tel"
                defaultValue={member.phone ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-email-${member.id}`}>E-mail (optionnel)</Label>
              <Input
                id={`edit-email-${member.id}`}
                name="email"
                type="email"
                defaultValue={member.email ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-photo-${member.id}`}>URL de la photo (optionnel)</Label>
              <Input
                id={`edit-photo-${member.id}`}
                name="photoUrl"
                type="url"
                defaultValue={member.photoUrl ?? ""}
                placeholder="https://…"
              />
            </div>

            {editKind === "executive" ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="isPrimary"
                  defaultChecked={member.isPrimary}
                  className="h-4 w-4 rounded border-input"
                />
                Contact principal du bureau
              </label>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <FormSubmitButton
                pendingLabel="Enregistrement…"
                className="text-white"
                style={{ backgroundColor: appConfig.primaryColor }}
              >
                Enregistrer
              </FormSubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce membre ?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{member.fullName}</span> sera retiré de la liste des
              membres de l’association (suppression douce).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <form action={removeAssociationMemberAction} className="inline-flex">
              <input type="hidden" name="associationId" value={associationId} />
              <input type="hidden" name="memberId" value={member.id} />
              <FormSubmitButton variant="destructive" pendingLabel="Suppression…">
                Supprimer
              </FormSubmitButton>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
