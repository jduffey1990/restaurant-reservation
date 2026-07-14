const service = require("./checks.service");
const menuItemsService = require("../menu-items/menu-items.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(req, res) {
  const data = await service.list(req.user.restaurant_id, {
    status: req.query.status,
  });
  res.json({ data });
}

async function checkExists(req, res, next) {
  const check = await service.read(req.params.check_id);
  if (check && check.restaurant_id === req.user.restaurant_id) {
    res.locals.check = check;
    return next();
  }
  next({ status: 404, message: `Check ${req.params.check_id} not found` });
}

function checkIsOpen(_req, res, next) {
  if (res.locals.check.status !== "open") {
    return next({
      status: 400,
      message: `Check ${res.locals.check.check_id} is already closed`,
    });
  }
  next();
}

async function read(_req, res) {
  const items = await service.readItems(res.locals.check.check_id);
  res.json({ data: { ...res.locals.check, items } });
}

function hasBodyData(req, _res, next) {
  if (!req.body.data) return next({ status: 400, message: "data" });
  next();
}

async function newItemIsValid(req, res, next) {
  const { menu_item_id, quantity } = req.body.data;
  const parsedQuantity = quantity === undefined ? 1 : quantity;
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
    return next({ status: 400, message: "quantity" });
  }
  const menuItem = await menuItemsService.read(menu_item_id);
  if (!menuItem || menuItem.restaurant_id !== req.user.restaurant_id) {
    return next({ status: 400, message: `menu_item_id: ${menu_item_id}` });
  }
  res.locals.menuItem = menuItem;
  res.locals.quantity = parsedQuantity;
  next();
}

async function addItem(_req, res) {
  await service.addItem(
    res.locals.check.check_id,
    res.locals.menuItem,
    res.locals.quantity
  );
  const items = await service.readItems(res.locals.check.check_id);
  res.status(201).json({ data: { ...res.locals.check, items } });
}

async function removeItem(req, res) {
  await service.removeItem(req.params.check_item_id);
  const items = await service.readItems(res.locals.check.check_id);
  res.json({ data: { ...res.locals.check, items } });
}

async function close(_req, res) {
  const data = await service.close(res.locals.check);
  res.json({ data });
}

module.exports = {
  list: asyncErrorBoundary(list),
  read: [asyncErrorBoundary(checkExists), asyncErrorBoundary(read)],
  addItem: [
    hasBodyData,
    asyncErrorBoundary(checkExists),
    checkIsOpen,
    asyncErrorBoundary(newItemIsValid),
    asyncErrorBoundary(addItem),
  ],
  removeItem: [
    asyncErrorBoundary(checkExists),
    checkIsOpen,
    asyncErrorBoundary(removeItem),
  ],
  close: [
    asyncErrorBoundary(checkExists),
    checkIsOpen,
    asyncErrorBoundary(close),
  ],
};
