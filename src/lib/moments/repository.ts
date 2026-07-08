import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeTagName } from "@/lib/moments/validation";

export async function findOrCreateTagIds(
  supabase: SupabaseClient,
  userId: string,
  tagNames: string[],
): Promise<string[]> {
  if (tagNames.length === 0) {
    return [];
  }

  const { data: existingTags, error: fetchError } = await supabase
    .from("tags")
    .select("id, name")
    .eq("user_id", userId);

  if (fetchError) {
    throw fetchError;
  }

  const tagIds: string[] = [];
  const knownTags = existingTags ?? [];

  for (const tagName of tagNames) {
    const normalized = normalizeTagName(tagName);
    const existing = knownTags.find(
      (tag) =>
        normalizeTagName(tag.name).toLowerCase() === normalized.toLowerCase(),
    );

    if (existing) {
      tagIds.push(existing.id);
      continue;
    }

    const { data: createdTag, error: insertError } = await supabase
      .from("tags")
      .insert({ user_id: userId, name: normalized })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    tagIds.push(createdTag.id);
    knownTags.push({ id: createdTag.id, name: normalized });
  }

  return tagIds;
}

export async function linkMomentTags(
  supabase: SupabaseClient,
  momentId: string,
  tagIds: string[],
): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  const { error } = await supabase.from("moment_tags").insert(
    tagIds.map((tagId) => ({
      moment_id: momentId,
      tag_id: tagId,
    })),
  );

  if (error) {
    throw error;
  }
}

export async function replaceMomentTags(
  supabase: SupabaseClient,
  userId: string,
  momentId: string,
  tagNames: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("moment_tags")
    .delete()
    .eq("moment_id", momentId);

  if (deleteError) {
    throw deleteError;
  }

  const tagIds = await findOrCreateTagIds(supabase, userId, tagNames);
  await linkMomentTags(supabase, momentId, tagIds);
}
