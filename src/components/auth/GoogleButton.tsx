"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/auth/Icons";

export const GoogleButton = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  return (
    <Button className="w-full" variant="outline" size="lg" type="button" disabled={loading} onClick={handleClick}>
      <GoogleLogo className="mr-2 size-4" />
      {loading ? "Conectando con Google..." : "Continuar con Google"}
    </Button>
  );
};
