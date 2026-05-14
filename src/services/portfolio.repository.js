const { getSupabaseAdminClient } = require("../config/supabase");

async function findPortfoliosByUserId(userId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudieron obtener las carteras: ${error.message}`);
  return data;
}

async function findPortfolioByIdAndUserId(id, userId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo obtener la cartera: ${error.message}`);
  return data;
}

async function createPortfolio(userId, payload) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("portfolios")
    .insert({ user_id: userId, ...payload })
    .select()
    .single();

  if (error) throw new Error(`No se pudo crear la cartera: ${error.message}`);
  return data;
}

async function updatePortfolio(id, userId, payload) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("portfolios")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(`No se pudo actualizar la cartera: ${error.message}`);
  return data;
}

async function deletePortfolio(id, userId) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(`No se pudo eliminar la cartera: ${error.message}`);
}

async function findItemsByPortfolioId(portfolioId) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron obtener los instrumentos: ${error.message}`);
  return data;
}

async function addPortfolioItem(portfolioId, payload) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({ portfolio_id: portfolioId, ...payload })
    .select()
    .single();

  if (error) throw new Error(`No se pudo añadir el instrumento: ${error.message}`);
  return data;
}

async function removePortfolioItem(itemId, portfolioId) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("portfolio_id", portfolioId);

  if (error) throw new Error(`No se pudo eliminar el instrumento: ${error.message}`);
}

module.exports = {
  findPortfoliosByUserId,
  findPortfolioByIdAndUserId,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  findItemsByPortfolioId,
  addPortfolioItem,
  removePortfolioItem,
};
