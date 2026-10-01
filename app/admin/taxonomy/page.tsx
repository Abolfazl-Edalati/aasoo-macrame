import { redirect } from "next/navigation";

export default function AdminTaxonomyRedirect() {
  redirect("/admin/collections");
}
