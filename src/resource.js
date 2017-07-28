import { makeActions, bindHooks } from './actions';
import { getMethods, makeDefaultMethods } from './methods';

export function makeResource(resourceName, configOrUrl) {
  const isSimple = typeof configOrUrl === 'string';
  const config = isSimple ? {} : configOrUrl;
  const methods = isSimple ? makeDefaultMethods(configOrUrl) : getMethods(config);
  const rawActions = makeActions(resourceName);
  const actions = bindHooks(rawActions, config);
  const resource = {
    actions: rawActions,
    methods,
  };

  Object.keys(methods).forEach((methodName) => {
    const method = methods[methodName];

    if (typeof method === 'function') {
      return (resource[methodName] = method);
    }

    resource[methodName] = methodCall.bind(null, {
      method,
      action: actions[methodName],
      type: methodName,
      resource: resourceName
    });
  });

  return resource;
}

function methodCall(config, ...payload) {
  return (dispatch, getState) => {
    const { resource, type, action, method } = config;
    const {
      usePayload, asParams, modifyBefore, modifyAfter,
      hookBefore, hookAfter, cache,
    } = method;

    if (type === 'list' && cache) {
      const { crud } = getState();
      const resourceData = crud[resource];

      if (resourceData) {
        dispatch(action.call(resourceData));
        if (hookAfter) dispatch(hookAfter(resourceData));

        return;
      }
    }

    const toSend = modifyBefore ? modifyBefore(...payload) : payload[0];
    if (hookBefore) dispatch(hookBefore(toSend));
    return makeQuery(method, toSend, asParams)
      .then((data) => {
        const useData = usePayload ? payload[0] : data;
        const toReceive = modifyAfter ? modifyAfter(useData) : useData;

        dispatch(action.call(toReceive));
        if (hookAfter) dispatch(hookAfter(toReceive));
      })
      .catch((err) => { throw err; });
  };
}

function makeQuery(method, payload, asParams = false) {
  const dataField = asParams ? 'params' : 'data';

  return axios({
    method: method.type.toLowerCase(),
    url: makeUrl(method.url, payload),
    [dataField]: typeof payload === 'object' ? payload : null,
  }).then(response => response.data);
}

function makeUrl(url, data) {
  if (url.indexOf(':') < 0) return url;

  const params = typeof data === 'object' ? data : { id: data };
  let newUrl = url;

  Object.keys(params).forEach((key) => {
    newUrl = newUrl.replace(new RegExp(`:${key}`, 'i'), params[key]);
  });

  return newUrl;
}
