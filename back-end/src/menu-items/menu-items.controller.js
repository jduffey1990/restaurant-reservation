const service = require("./menu-items.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

const CATEGORIES = ["appetizer", "entree", "dessert", "drink"];

// Either an absolute http(s) URL or a root-relative path served by the front
// end ("/images/menu/x.jpg"). Anything else — notably `javascript:` and `data:`
// — is rejected rather than handed to an <img src> downstream.
const IMAGE_URL_PATTERN = /^(https?:\/\/|\/)[^\s]*$/i;
const IMAGE_URL_MAX_LENGTH = 500;

async function list(req, res) {
  const includeInactive = req.query.all === "true";
  const data = await service.list(req.user.restaurant_id, includeInactive);
  res.json({ data });
}

function hasBodyData(req, _res, next) {
  if (!req.body.data) return next({ status: 400, message: "data" });
  next();
}

function menuItemIsValid(req, _res, next) {
  const { name, category, price_cents, image_url } = req.body.data;
  if (!name || !name.length) return next({ status: 400, message: "name" });
  if (!CATEGORIES.includes(category))
    return next({
      status: 400,
      message: `category must be one of: ${CATEGORIES.join(", ")}`,
    });
  if (!Number.isInteger(price_cents) || price_cents < 0)
    return next({ status: 400, message: "price_cents" });
  // image_url is optional; empty string and null both mean "no photo".
  if (image_url) {
    if (typeof image_url !== "string" || !IMAGE_URL_PATTERN.test(image_url))
      return next({
        status: 400,
        message:
          "image_url must be an http(s) URL or a path beginning with /",
      });
    if (image_url.length > IMAGE_URL_MAX_LENGTH)
      return next({
        status: 400,
        message: `image_url must be ${IMAGE_URL_MAX_LENGTH} characters or fewer`,
      });
  }
  next();
}

async function menuItemExists(req, res, next) {
  const menuItem = await service.read(req.params.menu_item_id);
  if (menuItem && menuItem.restaurant_id === req.user.restaurant_id) {
    res.locals.menuItem = menuItem;
    return next();
  }
  next({
    status: 404,
    message: `Menu item ${req.params.menu_item_id} not found`,
  });
}

async function create(req, res) {
  const { name, description, category, price_cents, image_url } = req.body.data;
  const data = await service.create({
    restaurant_id: req.user.restaurant_id,
    name,
    description: description || null,
    category,
    price_cents,
    image_url: image_url || null,
  });
  res.status(201).json({ data });
}

async function update(req, res) {
  const { name, description, category, price_cents, is_active, image_url } =
    req.body.data;
  const data = await service.update(res.locals.menuItem.menu_item_id, {
    name,
    description: description || null,
    category,
    price_cents,
    image_url: image_url || null,
    is_active: is_active !== undefined ? is_active : true,
  });
  res.json({ data });
}

module.exports = {
  list: asyncErrorBoundary(list),
  create: [hasBodyData, menuItemIsValid, asyncErrorBoundary(create)],
  update: [
    hasBodyData,
    menuItemIsValid,
    asyncErrorBoundary(menuItemExists),
    asyncErrorBoundary(update),
  ],
};
