import reject from 'lodash/reject';
import findIndex from 'lodash/findIndex';
import keyBy from 'lodash/keyBy';
import values from 'lodash/values';
import * as t from './actions';

const initialState = {};

export default function (state = initialState, action) {
  switch (action.type) {
    case t.CRUD_LIST:
      return { ...state, [action.kind]: action.payload };
    case t.CRUD_CREATE:
    case t.CRUD_UPDATE:
    case t.CRUD_DELETE:
    case t.CRUD_CREATE_BATCH:
    case t.CRUD_UPDATE_BATCH:
    case t.CRUD_DELETE_BATCH:
      return {
        ...state,
        [action.kind]: updateCollection(state[action.kind], action)
      };
  }

  return state;
}

function updateCollection(collection, action) {
  switch (action.type) {
    case t.CRUD_CREATE:
      return [...collection, action.payload];
    case t.CRUD_UPDATE:
      return updateItem(collection, action.payload);
    case t.CRUD_DELETE:
      return reject([...collection], { id: action.payload });
    case t.CRUD_CREATE_BATCH:
      return [...collection, ...action.payload];
    case t.CRUD_UPDATE_BATCH:
      return updateBatch(collection, action.payload);
    case t.CRUD_DELETE_BATCH:
      return collection.filter(item => !action.payload.includes(item.id));
  }

  return collection;
}

function updateItem(collection, item) {
  const index = findIndex(collection, { id: item.id });

  return [
    ...collection.slice(0, index),
    item,
    ...collection.slice(index + 1),
  ];
}

function updateBatch(collection, items) {
  const collectionByKey = keyBy(collection, 'id');
  const itemsByKey = keyBy(items, 'id');

  return values({
    ...collectionByKey,
    ...itemsByKey,
  });
}
