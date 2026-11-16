"use server";

import { isDomain } from "@reflect/core/book";
import { createWorkAction } from "../../journal/actions";

/** Open a journal prompt from an idea or term page: a new work from the template, starting from the prompt's text, filed under the part of life the person picked. */
export async function writePromptAction(templateId: string, about: string, form: FormData): Promise<void> {
  const d = form.get("domain");
  await createWorkAction(templateId, about, isDomain(d) ? d : null);
}
