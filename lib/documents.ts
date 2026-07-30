import { createServiceClient } from "./supabase/server";

export type DocumentRecord = {
  id: string;
  companyId: string;
  docType: "sow" | "msa";
  title: string;
  contentMarkdown: string;
};

export async function listDocuments(): Promise<DocumentRecord[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("documents")
    .select("id, company_id, doc_type, title, content_markdown")
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    companyId: d.company_id,
    docType: d.doc_type as "sow" | "msa",
    title: d.title,
    contentMarkdown: d.content_markdown,
  }));
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, company_id, doc_type, title, content_markdown")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    companyId: data.company_id,
    docType: data.doc_type as "sow" | "msa",
    title: data.title,
    contentMarkdown: data.content_markdown,
  };
}

export async function createDocument(
  companyId: string,
  docType: "sow" | "msa",
  title: string,
  contentMarkdown: string,
): Promise<{ id: string } | { error: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({ company_id: companyId, doc_type: docType, title, content_markdown: contentMarkdown })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateDocument(
  id: string,
  title: string,
  contentMarkdown: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("documents")
    .update({ title, content_markdown: contentMarkdown, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
