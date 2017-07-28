import defaultsDeep from 'lodash/defaultsDeep';

export function getMethods(config) {
  const defaultMethods = makeDefaultMethods(config.baseUrl);
  return defaultsDeep(config, defaultMethods);
}

export function makeDefaultMethods(url) {
  const itemUrl = `${url}/:id`;

  return {
    list: { url, type: 'GET', cache: true },
    read: { url: itemUrl, type: 'GET' },
    create: { url: url, type: 'POST' },
    update: { url: itemUrl, type: 'PUT' },
    delete: { url: itemUrl, type: 'DELETE' },
  };
}
