"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightIcon, SparklesIcon, TerminalIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const cardSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  number: z.string().min(1, "Requerido"),
  expiry: z.string().min(1, "Requerido"),
  cvv: z.string().min(1, "Requerido"),
})

type CardValues = z.infer<typeof cardSchema>

export function BillingPanel() {
  const cardForm = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { name: "", number: "", expiry: "", cvv: "" },
  })

  function onCardSubmit(values: CardValues) {
    console.log("card:", values)
  }

  return (
    <div className="space-y-6">
      {/* Banner plan actual */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-foreground px-5 py-4 text-background">
        <div className="flex items-center gap-3">
          <TerminalIcon className="size-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Estás usando el plan Free</p>
            <p className="text-xs opacity-70">Actualiza tu plan para acceder a más funcionalidades.</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 bg-transparent text-background border-background/40 hover:bg-background/10 hover:text-background gap-1.5"
        >
          Ver planes
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </div>

      {/* Card details */}
      <form onSubmit={cardForm.handleSubmit(onCardSubmit)}>
        <Card className="relative overflow-hidden">
          {/* Próximamente overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/80 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
              <SparklesIcon className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Próximamente</span>
            </div>
            <p className="text-xs text-muted-foreground">Estamos trabajando en esto.</p>
          </div>

          <CardHeader className="border-b">
            <CardTitle>Datos de pago</CardTitle>
            <CardDescription>Actualiza tu método de pago</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="card-name">Nombre en la tarjeta</Label>
                <Input id="card-name" {...cardForm.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-number">Número de tarjeta</Label>
                <Input id="card-number" {...cardForm.register("number")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="card-expiry">Vencimiento</Label>
                <Input id="card-expiry" placeholder="MM/AAAA" {...cardForm.register("expiry")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-cvv">CVV</Label>
                <Input id="card-cvv" type="password" maxLength={4} {...cardForm.register("cvv")} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit">Guardar</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
