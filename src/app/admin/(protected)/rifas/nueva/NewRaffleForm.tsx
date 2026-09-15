"use client";

import { useRouter } from "next/navigation";
import RaffleForm, { emptyRaffleForm, type RaffleFormValues } from "@/components/RaffleForm";
import { createRaffle } from "./actions";

export default function NewRaffleForm() {
  const router = useRouter();

  async function handleSubmit(values: RaffleFormValues) {
    const result = await createRaffle(values);
    if (!result.ok) return { ok: false, error: result.error };
    router.push(`/admin/rifas/${result.raffleId}`);
    return { ok: true };
  }

  return (
    <RaffleForm
      initialValues={emptyRaffleForm}
      submitLabel="Crear rifa"
      showStatus={false}
      onSubmit={handleSubmit}
    />
  );
}
