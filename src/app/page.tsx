import { redirect } from "next/navigation";

// La raíz entra directamente al producto (usuario ya autenticado).
export default function Home() {
  redirect("/dashboard");
}
