import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Check, KeyRound, RefreshCw } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  blogSlug: string;
}

export function InstallSheet({ open, onOpenChange, blogSlug }: Props) {
  const [apiKey] = useState("nbs_live_8f4c2a1d9b0e6730e54a");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const snippet = `<div id="nimbus-blog" data-blog="${blogSlug}"></div>
<script src="https://cdn.nimbus.app/blog.js"
  data-key="${apiKey}" async></script>`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[560px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Instalación</SheetTitle>
          <SheetDescription>
            Embebe tu blog en cualquier sitio o conéctate vía API REST.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section className="space-y-2">
            <Label className="text-xs">API Key</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <code className="flex-1 text-xs font-mono truncate">{apiKey}</code>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(apiKey, "key")}>
                {copied === "key" ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Guárdala en un lugar seguro. Puedes rotarla cuando quieras.</p>
          </section>

          <section className="space-y-2">
            <Label className="text-xs">Snippet embebible</Label>
            <div className="relative">
              <pre className="rounded-md border bg-muted/40 p-3 text-xs font-mono overflow-x-auto leading-relaxed">
{snippet}
              </pre>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 h-7"
                onClick={() => copy(snippet, "snippet")}
              >
                {copied === "snippet" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied === "snippet" ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Pega esto antes del cierre de &lt;/body&gt; en tu sitio.</p>
          </section>

          <section className="space-y-2">
            <Label className="text-xs">API REST</Label>
            <Accordion type="single" collapsible className="rounded-md border">
              <Endpoint method="GET" path={`/v1/blogs/${blogSlug}/posts`} desc="Lista los posts publicados del blog." />
              <Endpoint method="GET" path={`/v1/blogs/${blogSlug}/posts/:slug`} desc="Obtiene un post por su slug." />
              <Endpoint method="POST" path={`/v1/blogs/${blogSlug}/posts`} desc="Crea un nuevo post (requiere permisos de escritura)." />
              <Endpoint method="PATCH" path={`/v1/blogs/${blogSlug}/posts/:id`} desc="Actualiza campos parciales de un post." />
              <Endpoint method="DELETE" path={`/v1/blogs/${blogSlug}/posts/:id`} desc="Elimina un post de forma permanente." />
            </Accordion>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const color =
    method === "GET" ? "text-success" :
    method === "POST" ? "text-primary" :
    method === "PATCH" ? "text-warning" :
    "text-destructive";
  return (
    <AccordionItem value={method + path} className="border-b last:border-0">
      <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <span className={`text-[11px] font-mono font-bold ${color} w-12`}>{method}</span>
          <code className="text-xs font-mono">{path}</code>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3 text-xs text-muted-foreground space-y-2">
        <p>{desc}</p>
        <pre className="rounded bg-muted/40 p-2 font-mono text-[11px]">
{`curl https://api.nimbus.app${path.replace(":slug", "mi-post").replace(":id", "abc123")} \\
  -H "Authorization: Bearer <API_KEY>"`}
        </pre>
      </AccordionContent>
    </AccordionItem>
  );
}
