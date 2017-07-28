import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import {
  CRUD_LIST,
  CRUD_READ,
  CRUD_CREATE,
  CRUD_UPDATE,
  CRUD_DELETE,
  makeActions
} from '../src/actions';

describe('makeActions', () => {
  const collection = 'users';
  let actions;
  beforeEach(() => {
    actions = makeActions(collection);
  });

  it(CRUD_LIST, () => {
    const list = ['item', 'other item'];
    expect(actions.list).to.be.a('function');
    expect(actions.list(list)).to.eql({
      type: CRUD_LIST,
      payload: list,
      kind: collection,
    });
  });

  it(CRUD_READ, () => {
    const itemId = 1;
    expect(actions.read).to.be.a('function');
    expect(actions.read(itemId)).to.eql({
      type: CRUD_READ,
      payload: itemId,
      kind: collection,
    });
  });

  it(CRUD_CREATE, () => {
    const item = { id: 1 };
    expect(actions.create).to.be.a('function');
    expect(actions.create(item)).to.eql({
      type: CRUD_CREATE,
      payload: item,
      kind: collection,
    });
  });

  it(CRUD_UPDATE, () => {
    const item = { id: 1 };
    expect(actions.update).to.be.a('function');
    expect(actions.update(item)).to.eql({
      type: CRUD_UPDATE,
      payload: item,
      kind: collection,
    });
  });

  it(CRUD_DELETE, () => {
    const itemId = 2;
    expect(actions.delete).to.be.a('function');
    expect(actions.delete(itemId)).to.eql({
      type: CRUD_DELETE,
      payload: itemId,
      kind: collection,
    });
  });
});