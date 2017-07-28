export const CRUD_LIST = 'CRUD_LIST';
export const CRUD_READ = 'CRUD_READ';
export const CRUD_CREATE = 'CRUD_CREATE';
export const CRUD_UPDATE = 'CRUD_UPDATE';
export const CRUD_DELETE = 'CRUD_DELETE';
export const CRUD_CREATE_BATCH = 'CRUD_CREATE_BATCH';
export const CRUD_UPDATE_BATCH = 'CRUD_UPDATE_BATCH';
export const CRUD_DELETE_BATCH = 'CRUD_DELETE_BATCH';


export function makeActions(type) {
  const action = fn => fn.bind(null, type);

  return {
    list: action(list),
    read: action(read),
    create: action(create),
    update: action(update),
    delete: action(remove),
    createBatch: action(createBatch),
    updateBatch: action(updateBatch),
    deleteBatch: action(deleteBatch),
  };
}

export function bindHooks(actions, config = {}) {
  const actionsWithHooks = {};

  Object.keys(actions).forEach(type => {
    const hooks = (config[type] && config[type].hooks) || {};
    actionsWithHooks[type] = {
      before: hooks.before,
      call: actions[type],
      after: hooks.after,
    };
  });

  return actionsWithHooks;
}

function list(type, list) {
  return {
    type: CRUD_LIST,
    kind: type,
    payload: list,
  };
}

function read(type, id) {
  return {
    type: CRUD_READ,
    kind: type,
    payload: id,
  };
}

function create(type, data) {
  return {
    type: CRUD_CREATE,
    kind: type,
    payload: data,
  };
}

function update(type, data) {
  return {
    type: CRUD_UPDATE,
    kind: type,
    payload: data,
  };
}

function remove(type, id) {
  return {
    type: CRUD_DELETE,
    kind: type,
    payload: id,
  };
}

function createBatch(type, data) {
  return {
    type: CRUD_CREATE_BATCH,
    kind: type,
    payload: data,
  };
}

function updateBatch(type, data) {
  return {
    type: CRUD_UPDATE_BATCH,
    kind: type,
    payload: data,
  };
}

function deleteBatch(type, ids) {
  return {
    type: CRUD_DELETE_BATCH,
    kind: type,
    payload: ids,
  };
}
