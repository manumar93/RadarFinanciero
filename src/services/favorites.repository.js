const { getSupabaseAdminClient } = require("../config/supabase");

async function findFavoritesByUserId(userId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudieron obtener los favoritos: ${error.message}`);
  return data;
}

async function findFavoriteByIdAndUserId(id, userId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo obtener el favorito: ${error.message}`);
  return data;
}

async function createFavorite(userId, payload) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, ...payload })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw Object.assign(new Error("El símbolo ya está en favoritos"), { statusCode: 409 });
    }
    throw new Error(`No se pudo añadir el favorito: ${error.message}`);
  }

  return data;
}

async function deleteFavorite(id, userId) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(`No se pudo eliminar el favorito: ${error.message}`);
}

module.exports = {
  findFavoritesByUserId,
  findFavoriteByIdAndUserId,
  createFavorite,
  deleteFavorite,
};
