const { getSupabaseAdminClient } = require("../config/supabase");

async function listUsers(req, res, next) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, risk_profile, preferred_currency, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    res.json({ users: data });
  } catch (error) {
    next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Rol inválido. Debe ser 'user' o 'admin'" });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: "No puedes cambiar tu propio rol" });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) throw new Error(error.message);

    res.json({ message: "Rol actualizado correctamente" });
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, updateUserRole };
