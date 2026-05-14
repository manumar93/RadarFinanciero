const {
  findPortfoliosByUserId,
  findPortfolioByIdAndUserId,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  findItemsByPortfolioId,
  addPortfolioItem,
  removePortfolioItem,
} = require("../services/portfolio.repository");

async function listPortfolios(req, res, next) {
  try {
    const portfolios = await findPortfoliosByUserId(req.user.id);
    return res.status(200).json({ portfolios });
  } catch (error) {
    return next(error);
  }
}

async function createPortfolioHandler(req, res, next) {
  try {
    const { name, description, is_default } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "El campo 'name' es obligatorio" });
    }

    const portfolio = await createPortfolio(req.user.id, {
      name: name.trim(),
      description: description?.trim() || null,
      is_default: Boolean(is_default),
    });

    return res.status(201).json({ message: "Cartera creada correctamente", portfolio });
  } catch (error) {
    return next(error);
  }
}

async function updatePortfolioHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, is_default } = req.body || {};

    const existing = await findPortfolioByIdAndUserId(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: "Cartera no encontrada" });
    }

    const payload = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "El campo 'name' no puede estar vacío" });
      }
      payload.name = name.trim();
    }
    if (description !== undefined) payload.description = description?.trim() || null;
    if (is_default !== undefined) payload.is_default = Boolean(is_default);

    const portfolio = await updatePortfolio(id, req.user.id, payload);
    return res.status(200).json({ message: "Cartera actualizada correctamente", portfolio });
  } catch (error) {
    return next(error);
  }
}

async function deletePortfolioHandler(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await findPortfolioByIdAndUserId(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: "Cartera no encontrada" });
    }

    await deletePortfolio(id, req.user.id);
    return res.status(200).json({ message: "Cartera eliminada correctamente" });
  } catch (error) {
    return next(error);
  }
}

async function listItemsHandler(req, res, next) {
  try {
    const { id } = req.params;
    const portfolio = await findPortfolioByIdAndUserId(id, req.user.id);
    if (!portfolio) return res.status(404).json({ error: "Cartera no encontrada" });

    const items = await findItemsByPortfolioId(id);
    return res.status(200).json({ items });
  } catch (error) {
    return next(error);
  }
}

async function addItemHandler(req, res, next) {
  try {
    const { id } = req.params;
    const portfolio = await findPortfolioByIdAndUserId(id, req.user.id);
    if (!portfolio) return res.status(404).json({ error: "Cartera no encontrada" });

    const { symbol, instrument_name, category, units, average_cost } = req.body || {};
    if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
      return res.status(400).json({ error: "El campo 'symbol' es obligatorio" });
    }

    const item = await addPortfolioItem(id, {
      symbol: symbol.trim().toUpperCase(),
      instrument_name: instrument_name?.trim() || null,
      category: category || null,
      units: units != null ? parseFloat(units) : 0,
      average_cost: average_cost != null && average_cost !== "" ? parseFloat(average_cost) : null,
    });

    return res.status(201).json({ message: "Instrumento añadido correctamente", item });
  } catch (error) {
    if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
      return res.status(409).json({ error: "Este símbolo ya está en la cartera" });
    }
    return next(error);
  }
}

async function removeItemHandler(req, res, next) {
  try {
    const { id, itemId } = req.params;
    const portfolio = await findPortfolioByIdAndUserId(id, req.user.id);
    if (!portfolio) return res.status(404).json({ error: "Cartera no encontrada" });

    await removePortfolioItem(itemId, id);
    return res.status(200).json({ message: "Instrumento eliminado correctamente" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPortfolios,
  createPortfolioHandler,
  updatePortfolioHandler,
  deletePortfolioHandler,
  listItemsHandler,
  addItemHandler,
  removeItemHandler,
};
