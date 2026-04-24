"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, ChevronRight } from "lucide-react";
import { CreateWorkspaceForm } from "@/components/onboarding/CreateWorkspaceForm";
import { InviteTeamForm } from "@/components/onboarding/InviteTeamForm";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, icon: Building2, title: "Tu Workspace",    description: "Nombre, país y moneda" },
  { id: 2, icon: Users,     title: "Invitar Usuarios", description: "Agrega a tu equipo"  },
];

const CreateWorkspace = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleWorkspaceSuccess = () => setStep(2);
  const handleTeamDone = () => router.push("/dashboard");

  return (
    <div className="grid h-screen overflow-hidden lg:grid-cols-[2fr_3fr]">
      {/* Left — imagen */}
      <div className="relative hidden lg:block">
        <img
          src="/logos/fondo%201.jpg"
          alt="Onboarding"
          className="absolute inset-0 size-full object-cover"
        />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-2xl">

          {/* Card */}
          <div className="rounded-2xl border bg-card px-8 py-8 shadow-sm">

            {/* Stepper */}
            <div className="mb-8 flex items-center justify-center gap-2 border-b pb-8">
              {STEPS.map((s, index) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isDone = step > s.id;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
                        isActive || isDone
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className={cn(
                          "whitespace-nowrap text-base font-semibold leading-none",
                          !isActive && !isDone && "text-muted-foreground/60"
                        )}>
                          {s.title}
                        </p>
                        <p className={cn(
                          "mt-1 whitespace-nowrap text-sm",
                          isActive || isDone ? "text-muted-foreground" : "text-muted-foreground/40"
                        )}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                    {index < STEPS.length - 1 && (
                      <ChevronRight className="mx-3 size-4 shrink-0 text-muted-foreground/30" />
                    )}
                  </div>
                );
              })}
            </div>

            {step === 1 ? (
              <CreateWorkspaceForm onSuccess={handleWorkspaceSuccess} />
            ) : (
              <InviteTeamForm onSuccess={handleTeamDone} onSkip={handleTeamDone} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspace;
