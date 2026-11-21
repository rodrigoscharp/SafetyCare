import { requirePageUser } from "@/lib/session";

export default async function Page() {
  const user = await requirePageUser();
  return <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>;
}
