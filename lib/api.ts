import type { Package } from "@/types/package"

/**
 * Change this if your packages endpoint lives somewhere else.
 * For example, with App Router API routes you might have:
 *   /app/api/packages/route.ts
 */
const BASE_URL = "/api/packages"

/* -------------------------------------------------------------------------- */
/*                                 Packages                                   */
/* -------------------------------------------------------------------------- */

/** Fetch all packages */
export async function getPackages(): Promise<Package[]> {
  const res = await fetch(BASE_URL, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load packages")
  return res.json()
}

/** Create a package */
export async function createPackage(data: Omit<Package, "id">) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create package")
  return res.json()
}

/** Update a package */
export async function updatePackage(data: Partial<Omit<Package, "id">> & { id: number }) {
  const res = await fetch(`${BASE_URL}/${data.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update package")
  return res.json()
}

/** Delete a package */
export async function deletePackage(id: number) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete package")
  return res.json()
}
