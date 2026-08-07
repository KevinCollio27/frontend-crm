"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Building2, Users, ChevronRight } from "lucide-react";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { CreateWorkspaceForm } from "@/components/onboarding/CreateWorkspaceForm";
import { InviteTeamForm } from "@/components/onboarding/InviteTeamForm";
import { useSessionStore } from "@/store/session.store";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, icon: Building2, title: "Tu Workspace",     description: "Nombre, país y moneda" },
  { id: 2, icon: Users,     title: "Invitar Usuarios",  description: "Agrega a tu equipo" },
];

const CreateWorkspace = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const hasActiveWorkspace = useSessionStore((s) => s.workspaceId !== null);
  const logoUploadRef = useRef<Promise<unknown> | undefined>(undefined);

  const handleWorkspaceSuccess = (logoUploadPromise?: Promise<unknown>) => {
    logoUploadRef.current = logoUploadPromise;
    setStep(2);
  };

  // Navegación dura (no router.push): el workspace recién creado necesita que
  // DashboardShell remonte desde cero — su lógica trata null→id como "solo
  // hidratación" y no fuerza refetch, dejando datos del workspace anterior pegados.
  // Por lo mismo, hay que esperar a que el logo termine de subirse ANTES de
  // navegar — si el reload ocurre primero, la subida en curso se pierde con
  // la página y el logo persistido nunca llega a reflejarse.
  const handleTeamDone = async () => {
    if (logoUploadRef.current) {
      try { await logoUploadRef.current; } catch {}
    }
    window.location.href = "/chat?welcome=1";
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-muted p-4 md:p-6">
      <div className="grid min-h-160 w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl/5 lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 p-6 md:p-8">
          {hasActiveWorkspace && step === 1 && (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="size-3.5" />
              Volver
            </button>
          )}

          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
                      isActive || isDone
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className={cn(
                        "whitespace-nowrap text-sm font-semibold leading-none",
                        !isActive && !isDone && "text-muted-foreground/60"
                      )}>
                        {s.title}
                      </p>
                      <p className={cn(
                        "mt-1 whitespace-nowrap text-xs",
                        isActive || isDone ? "text-muted-foreground" : "text-muted-foreground/40"
                      )}>
                        {s.description}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="mx-1 size-4 shrink-0 text-muted-foreground/30" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t pt-6">
            {step === 1 ? (
              <CreateWorkspaceForm onSuccess={handleWorkspaceSuccess} />
            ) : (
              <InviteTeamForm onSuccess={handleTeamDone} onSkip={handleTeamDone} />
            )}
          </div>
        </div>
        <AuthHeroPanel />
      </div>
    </div>
  );
};

export default CreateWorkspace;
