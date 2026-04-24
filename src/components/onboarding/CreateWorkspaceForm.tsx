"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { getCountry, getAllCountries } from "countries-and-timezones";
import { Building2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

const CURRENCIES = [
  { value: "USD", label: "USD — Dólar estadounidense", flag: "us" },
  { value: "EUR", label: "EUR — Euro", flag: "eu" },
  { value: "CLP", label: "CLP — Peso chileno", flag: "cl" },
  { value: "ARS", label: "ARS — Peso argentino", flag: "ar" },
  { value: "COP", label: "COP — Peso colombiano", flag: "co" },
  { value: "MXN", label: "MXN — Peso mexicano", flag: "mx" },
  { value: "PEN", label: "PEN — Sol peruano", flag: "pe" },
  { value: "BRL", label: "BRL — Real brasileño", flag: "br" },
];

const formSchema = z.object({
  name:     z.string().min(2, { message: "Mínimo 2 caracteres" }),
  country:  z.string().min(1, { message: "Selecciona un país" }),
  timezone: z.string().min(1, { message: "Selecciona una zona horaria" }),
  currency: z.string().min(1, { message: "Selecciona una moneda" }),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSuccess: (data: FormValues & { logo?: File }) => void;
}

export const CreateWorkspaceForm = ({ onSuccess }: Props) => {
  const allCountries = Object.values(getAllCountries())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: c.id, label: c.name, flag: c.id }));

  const [timezones, setTimezones] = useState<{ value: string; label: string }[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", country: "", timezone: "", currency: "" },
  });

  const selectedCountry  = watch("country");
  const selectedTimezone = watch("timezone");
  const selectedCurrency = watch("currency");

  useEffect(() => {
    if (!selectedCountry) { setTimezones([]); return; }
    const country = getCountry(selectedCountry);
    const tzList  = (country?.timezones ?? []).map((tz) => ({ value: tz, label: tz }));
    setTimezones(tzList);
    setValue("timezone", tzList.length === 1 ? tzList[0].value : "", { shouldValidate: false });
  }, [selectedCountry, setValue]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  function onSubmit(values: FormValues) {
    onSuccess({ ...values, logo: logoFile });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Crea tu Workspace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Completa la información principal de tu espacio de trabajo
        </p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 transition-colors hover:border-muted-foreground/60 hover:bg-muted/50"
        >
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="size-full object-cover" />
          ) : (
            <Camera className="size-5 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
          )}
        </button>
        <div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-medium hover:underline">
            {logoPreview ? "Cambiar logo" : "Subir logo"}
          </button>
          <p className="mt-0.5 text-xs text-muted-foreground">PNG, JPG hasta 5MB. Opcional.</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
      </div>

      {/* Fila 2: Nombre + País */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>Nombre</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Ej. CamionGO"
              className={`pl-9 ${errors.name ? "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25" : ""}`}
              {...register("name")}
            />
          </div>
          {errors.name && <p className="text-[0.8rem] text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className={errors.country ? "text-destructive" : ""}>País</Label>
          <SearchableSelect
            options={allCountries}
            value={selectedCountry}
            onChange={(val) => setValue("country", val, { shouldValidate: true })}
            placeholder="Selecciona un país"
            searchPlaceholder="Buscar país..."
            hasError={!!errors.country}
          />
          {errors.country && <p className="text-[0.8rem] text-destructive">{errors.country.message}</p>}
        </div>
      </div>

      {/* Fila 3: Zona horaria + Moneda */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className={errors.timezone ? "text-destructive" : ""}>Zona horaria</Label>
          <SearchableSelect
            options={timezones}
            value={selectedTimezone}
            onChange={(val) => setValue("timezone", val, { shouldValidate: true })}
            placeholder={timezones.length === 0 ? "Primero elige país" : "Selecciona"}
            searchPlaceholder="Buscar..."
            disabled={timezones.length === 0}
            hasError={!!errors.timezone}
          />
          {errors.timezone && <p className="text-[0.8rem] text-destructive">{errors.timezone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className={errors.currency ? "text-destructive" : ""}>Moneda</Label>
          <SearchableSelect
            options={CURRENCIES}
            value={selectedCurrency}
            onChange={(val) => setValue("currency", val, { shouldValidate: true })}
            placeholder="Selecciona"
            searchPlaceholder="Buscar moneda..."
            hasError={!!errors.currency}
          />
          {errors.currency && <p className="text-[0.8rem] text-destructive">{errors.currency.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Continuar
      </Button>
    </form>
  );
};
