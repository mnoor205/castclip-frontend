"use server";

import { revalidatePath } from "next/cache";

export async function revalidateProjectPages() {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}
