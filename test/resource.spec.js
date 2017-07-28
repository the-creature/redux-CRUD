import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { makeResource } from '../src/resource';

describe('makeResource with a simple config', () => {
  const collection = 'docs';
  const url = '/api/docs';
  const itemUrl = '/api/docs/:id';

  let resource;
  beforeEach(() => {
    resource = makeResource(collection, url);
  });

  it('should have methods object', () => {
    expect(resource).to.be.a('object');
    expect(resource).to.have.property('methods');
  });

  describe('methods', () => {
    let methods;

    beforeEach(() => {
      methods = resource.methods;
    });

    it('list', () => testMethod(methods.list, resource.list, 'GET', url));
    it('read', () => testMethod(methods.read, resource.read, 'GET', itemUrl));
    it('create', () => testMethod(methods.create, resource.create, 'POST', url));
    it('update', () => testMethod(methods.update, resource.update, 'PUT', itemUrl));
    it('delete', () => testMethod(methods.delete, resource.delete, 'DELETE', itemUrl));
  });

  function testMethod(method, resourceMethod, type, expectedUrl) {
    expect(method).to.be.a('object');
    expect(method.url).to.equal(expectedUrl);
    expect(method.type).to.equal(type);
    expect(resourceMethod).to.be.a('function');
  }
});

// TODO (including URLs, hooks, modifiers, and methods calls)
describe('makeResource with a full custom config', () => {
  const collection = 'users';
  const baseUrl = `/api/${collection}`;

  const mockStore = configureMockStore([thunk]);
  const store = mockStore({ entries: { [collection]: [] } });
  const modifyBefore = data => ({ ...data, modified: true });
  const modifyAfter = data => ({ ...data, modified: false });
  const hookBefore = payload => ({ type: 'HOOK_BEFORE', payload });
  const hookAfter = payload => ({ type: 'HOOK_AFTER', payload });
  const modCollectionAfter = data => data.map(modifyAfter);

  const defaults = {
    modifyBefore,
    modifyAfter,
    hookBefore,
    hookAfter,
  };

  const customAsync = (data) => {
    return dispatch => new Promise(resolve => setTimeout(() => {
      resolve(dispatch({
        type: 'CRUD_CUSTOM_ASYNC',
        payload: data,
      }));
    }, 100));
  };

  const custom = data => ({
    type: 'CRUD_CUSTOM',
    payload: data,
  });

  const config = {
    baseUrl,
    list: { modifyAfter: modCollectionAfter, hookBefore, hookAfter, url: baseUrl },
    read: { modifyAfter, hookBefore, hookAfter, url: `${baseUrl}/:id` },
    create: { ...defaults, url: baseUrl },
    // update: {}, since `update` omitted, we will use its default configuration
    delete: { url: `${baseUrl}/:id/delete`, type: 'POST', usePayload: true },
    custom,
    customAsync,
  };

  let resource;

  beforeEach(() => (resource = makeResource(collection, config)));
  afterEach(() => {
    nock.cleanAll();
    store.clearActions();
  });

  it('should create a correct `custom` method', () => {
    const method = resource.methods.custom;
    const data = 111;

    expect(method).to.be.a('function');
    store.dispatch(resource.custom(data));
    expect(store.getActions()).to.eql([{
      type: 'CRUD_CUSTOM',
      payload: data,
    }]);
  });

  it('should create a correct `customAsync` method', () => {
    const method = resource.methods.customAsync;
    const data = 111;

    expect(method).to.be.a('function');
    return store.dispatch(resource.customAsync(data))
      .then(() => {
        expect(store.getActions()).to.eql([{
          type: 'CRUD_CUSTOM_ASYNC',
          payload: data,
        }]);
      });
  });
});
