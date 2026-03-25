const { getSupabaseAdminClient } = require("../config/supabase");

async function findProfileByUserId(userId) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener el perfil: ${error.message}`);
  }

  return data || null;
}

async function upsertProfileByUserId(userId, payload) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, ...payload }, { onConflict: "id" });

  if (error) {
    throw new Error(`No se pudo guardar el perfil: ${error.message}`);
  }

  return findProfileByUserId(userId);
}

module.exports = {
  findProfileByUserId,
  upsertProfileByUserId,
};
