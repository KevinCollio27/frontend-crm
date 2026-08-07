"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { getCountry, getAllCountries } from "countries-and-timezones";
import { Building2, Camera } from "lucide-react";
import { notify } from "@/lib/notify";
import { authService } from "@/services/auth.service";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

const CURRENCIES = [
  { value: "USD", label: "USD — Dólar estadounidense", flag: "us", id: 10, name: "United States Dollar" },
  { value: "EUR", label: "EUR — Euro",                  flag: "eu", id: 13, name: "Euro" },
  { value: "CLP", label: "CLP — Peso chileno",          flag: "cl", id: 3,  name: "Chilean Peso" },
  { value: "ARS", label: "ARS — Peso argentino",        flag: "ar", id: 1,  name: "Argentine Peso" },
  { value: "COP", label: "COP — Peso colombiano",       flag: "co", id: 4,  name: "Colombian Peso" },
  { value: "MXN", label: "MXN — Peso mexicano",         flag: "mx", id: 12, name: "Mexican Peso" },
  { value: "PEN", label: "PEN — Sol peruano",           flag: "pe", id: 5,  name: "Peruvian Sol" },
  { value: "BRL", label: "BRL — Real brasileño",        flag: "br", id: 2,  name: "Brazilian Real" },
];

// ISO country code → currency code (cubre Latam + principales)
const COUNTRY_CURRENCY: Record<string, string> = {
  CL: "CLP", AR: "ARS", CO: "COP", MX: "MXN", PE: "PEN", BR: "BRL",
  US: "USD", CA: "USD",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", FI: "EUR", IE: "EUR", GR: "EUR",
};

// Timezone por defecto para países con múltiples zonas
const COUNTRY_DEFAULT_TZ: Record<string, string> = {
  CL: "America/Santiago",
  AR: "America/Argentina/Buenos_Aires",
  CO: "America/Bogota",
  MX: "America/Mexico_City",
  PE: "America/Lima",
  BR: "America/Sao_Paulo",
  US: "America/New_York",
  CA: "America/Toronto",
  ES: "Europe/Madrid",
  FR: "Europe/Paris",
  DE: "Europe/Berlin",
  PT: "Europe/Lisbon",
  GB: "Europe/London",
  AU: "Australia/Sydney",
};

const formSchema = z.object({
  name:     z.string().min(2, { message: "Mínimo 2 caracteres" }),
  country:  z.string().min(1, { message: "Selecciona un país" }),
  timezone: z.string().min(1, { message: "Selecciona una zona horaria" }),
  currency: z.string().min(1, { message: "Selecciona una moneda" }),
});

type FormValues = z.infer<typeof formSchema>;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  // Si se subió un logo, onSuccess recibe la promesa de esa subida — el padre
  // debe esperarla antes de hacer la navegación dura a /chat (window.location.href),
  // porque esa recarga completa es la única forma en que el sidebar toma el logo
  // fresco; si navega antes de que el logo termine, se pierde el resultado.
  onSuccess: (logoUploadPromise?: Promise<unknown>) => void;
}

export const CreateWorkspaceForm = ({ onSuccess }: Props) => {
  const allCountries = Object.values(getAllCountries())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: c.id, label: c.name, flag: c.id }));

  const [timezones, setTimezones] = useState<{ value: string; label: string }[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", country: "CL", timezone: "", currency: "" },
  });

  const selectedCountry  = watch("country");
  const selectedTimezone = watch("timezone");
  const selectedCurrency = watch("currency");

  useEffect(() => {
    if (!selectedCountry) { setTimezones([]); return; }
    const country = getCountry(selectedCountry);
    const tzList  = (country?.timezones ?? []).map((tz) => ({ value: tz, label: tz }));
    setTimezones(tzList);

    // Auto-seleccionar timezone
    const defaultTz = COUNTRY_DEFAULT_TZ[selectedCountry];
    const tz = (defaultTz && tzList.find(t => t.value === defaultTz))
      ? defaultTz
      : tzList.length === 1 ? tzList[0].value : "";
    setValue("timezone", tz, { shouldValidate: false });

    // Auto-seleccionar moneda
    const currencyCode = COUNTRY_CURRENCY[selectedCountry];
    if (currencyCode) setValue("currency", currencyCode, { shouldValidate: false });
  }, [selectedCountry, setValue]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  async function onSubmit(values: FormValues) {
    const countryData = allCountries.find(c => c.value === values.country);
    const currencyData = CURRENCIES.find(c => c.value === values.currency);
    if (!countryData || !currencyData) return;

    setIsLoading(true);
    const t0 = performance.now();
    try {
      await authService.createWorkspace({
        name:     values.name,
        country:  { id: values.country,  name: countryData.label },
        timezone: { id: values.timezone, name: values.timezone },
        currency: { id: currencyData.id, name: currencyData.name },
      });
      console.log(`⏱️ [CreateWorkspace] createWorkspace: ${Math.round(performance.now() - t0)}ms`);

      // No bloqueamos el paso 2 por el logo — se sube en segundo plano, pero
      // el padre debe esperar esta promesa antes de navegar a /chat.
      let logoUploadPromise: Promise<unknown> | undefined;
      if (logoFile) {
        const file = logoFile;
        const tLogo0 = performance.now();
        logoUploadPromise = fileToBase64(file)
          .then((base64) => workspaceService.uploadLogo(file.name, base64))
          .then(() => {
            console.log(`⏱️ [CreateWorkspace] uploadLogo (background): ${Math.round(performance.now() - tLogo0)}ms`);
          })
          .catch(() => {
            notify.error({ title: "No se pudo subir el logo", description: "El workspace se creó igual, puedes subirlo después en Ajustes." });
          });
      }

      onSuccess(logoUploadPromise);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Error inesperado";
      notify.error({ title: "Error al crear workspace", description: msg });
    } finally {
      setIsLoading(false);
    }
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

      {/* Nombre + País */}
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

      {/* Zona horaria + Moneda */}
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

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Creando..." : "Continuar"}
      </Button>
    </form>
  );
};
