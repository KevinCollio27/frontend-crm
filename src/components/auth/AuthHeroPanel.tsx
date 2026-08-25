export const AuthHeroPanel = () => (
  <div className="relative hidden overflow-hidden lg:block">
    <img
      src="/images/login-hero.jpg"
      alt=""
      className="absolute inset-0 size-full object-cover"
    />
    <div className="absolute inset-0 bg-black/50" />

    <div className="relative z-10 flex h-full flex-col justify-between p-8">
      <div className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-sm">
        Para cualquier negocio que vende
      </div>

      <div>
        <h2 className="text-2xl font-bold leading-tight text-white">
          Del prospecto al cierre,
          <br />
          todo en un solo lugar.
        </h2>
        <p className="mt-2 text-sm text-white/80">
          Gestiona oportunidades y convierte prospectos en clientes reales.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <img src="/images/goxt-negro.png" alt="GOXT" className="h-5 w-auto brightness-0 invert" />
        <span className="text-xs text-white/70">
          Impulsando el crecimiento de negocios en toda Latinoamérica
        </span>
      </div>
    </div>
  </div>
);
