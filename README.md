# Table of Contents
1. [Getting started](#getting-started)
1.1. [Install](#install)
1.2. [Create a simple resource](#create-a-simple-resource)
1.3. [Create a resource with a config](#create-a-resource-with-a-config)
2. [Resource Configuration](#resource-configuration)
2.1. [Resource options](#resource-options)
2.2. [Method options](#method-options)
2.3. [Add a custom method](#add-a-custom-method)
3. [Advanced](#advanced)

# Getting started
## Install
```npm i```

## Create a simple resource
If your API endpoint looks like a standard REST API, as below
```text
List   = GET:    /users
Create = POST:   /users
Read   = GET:    /users/1
Update = PUT:    /users/1
Delete = DELETE: /users/1
```
you can use a simple configuration
```js
import { makeResource } from 'crud';

const apiUrl = '/api/users';
const resource = makeResource('users', apiUrl);
```

## Create a resource with a config
If you need more than just a CRUD, or your endpoint differs from standard REST APIs,
you can use a custom configuration as below. You can read about configuration params
in the [Resource Configuration](#resource-configuration) section.
```js
import { makeResource } from 'crud';

const apiUrl = '/api/users';
const resource = makeResource('users', {
  baseUrl: apiUrl,
  list: {
    modifyAfter: modifyListAfter,
    hookAfter: usersReceived,
  },
  create: {
    url: `${apiUrl}/create`,
    usePayload: true,
    modifyBefore: modifyItemBefore,
    hookAfter: hookAfterCreate,
  },
  update: {
    url: `${apiUrl}/:id/update`,
    modifyBefore: modifyItemBefore,
    hookAfter: hookAfterUpdate,
  },
  delete: {
    url: `${apiUrl}/:id/delete`,
    usePayload: true,
    hookAfter: removeRecord,
  }
});
```

## Using
### API
You may use predefined methods or define your own [custom method](#add-a-custom-method).
Each method is an action creator in fact, so you need to dispatch it
with [bind](#3-connect-your-resource-to-a-component) or directly.
#### `list()`
Receive a list of records
#### `read(id)`
Receive a specific record
#### `create(data)`
Create record
#### `update(data)`
Update record
#### `delete(id)`
Delete a specific record
#### `actions`
An object with CRUD actions

### Example
#### 1) Create a resource with an appropriate name, e.g. `users`.

```js
//actions/users.js
import { makeResource } from 'crud';

const apiUrl = '/api/users';
const resource = makeResource('users', apiUrl);

export default resource;
```

#### 2) Connect the CRUD reducer to your root reducer.
You will have access to your resource data in `state.crud.name_of_resource`.

```js
//reducers/index.js
import { combineReducers } from 'redux';
import { crudReducer } from 'crud';
//...

export default combineReducers({
  //...
  crud: crudReducer,
});
```

#### 3) Connect your resource to a component.

```js
//components/UsersList.jsx
//...
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import users from '../actions/users';

class UsersList extends Component {

  componentDidMount() {
    this.props.users.list();
  }

  //...

  render() {
    return (
      <ul>
        {this.props.list.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    );
  }

}

function mapDispatchToProps(dispatch) {
  return {
    users: bindActionCreators(users, dispatch),
  }
}

function mapStateToProps(state) {
  return {
    list: state.crud.users
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UsersList);

```

# Resource Configuration
## Resource options
A config should be a URL or an object. If you want your resource to be
flexible you need to use an object as a config. A config object should contain
at least one option.

### `baseUrl`
An endpoint base URL, uses for generating methods URLs

### `list`
A [method](#method-options) config for receiving of list of records

### `read`
A [method](#method-options) config for receiving a record

### `create`
A [method](#method-options) config for creating a record

### `update`
A [method](#method-options) config for updating a record

### `delete`
A [method](#method-options) config for deleting a record


## Method options
Every predefined method has following options.

### `url`
An endpoint for a method. You can use placeholders in the definition if you need,
e.g.: `'/api/users/:id/update'`. So the placeholder will be replaced with a matched
property from your data, or to ID you passed as payload if the placeholder is `:id`

### `type`
HTTP method type (`GET`, `POST`, `PUT`, or `DELETE`)

### `usePayload`: Boolean
When this property is true, CRUD uses payload passed to a method instead of API response.
It can be useful if you want to dispatch data, but server returns some other data structure
or you just don't want to rely on a server response.

### `modifyBefore(payload)`
You can use the method if you want to modify data before sending.
For example, you may need to trim service properties.
```js
function beforeUserUpdate(user){
  return {
    id: user.id,
    roles: user.rolesIds
  }
}
```
### `modifyAfter(data)`
If you want to change received data format, or get only specific fields you can use this method.
```js
function afterUsersReceive(users){
  return users.map(user => ({
    ...user,
    name: `${user.first_name} ${user.last_name}`
  }))
}
```

### `hookBefore(payload)`
May be used to dispatch some action before API call
```js
function startUpdate(file){
  return {
    type: SHOW_SAVE_PROGRESS,
    payload: file
  }
}
```

### `hookAfter(data)`
May be used to dispatch some action after API response
```js
function finishUpdate(file){
  return dispatch => {
    dispatch(hideSaveProgress());
    dispatch(closeModal());
  };
}
```

## Add a custom method
As mentioned [above](#api) every method is an action creator.
So you can make an action creator you need and just pass it as a prop to the resource config.
You can even replace a predefined method if you want, you only need to call CRUD actions manually.
```js
//...
const resource = makeResource('documents', {
  baseUrl: apiUrl,
  list
});

function list() {
  return (dispatch, getState) => {
    const { documents } = getState().crud;
    if(documents) {
      return dispatch(hookAfterList(documents));
    }

    return axios.get(docsUrl)
      .then(response => response.data)
      .then(data => {
        const dataProp = 'assessment_details';
        const modified = {
          ...data,
          [dataProp]: data[dataProp].map(row => ({ ...row, id: row.assessment_id }))
        };

        // call a CRUD action
        dispatch(resource.actions.list(modified[dataProp]));
        dispatch(hookAfterList(modified));
      });
  };
}

function hookAfterList(data) {
  return (dispatch, getState) => {
    // when get from state
    if(Array.isArray(data)) {
      const { states } = getState().entries;
      dispatch(documentsReceived(data, states));

    // when receive from API
    } else {
      const records = data.assessment_details;
      const states = data.assessment_definition_states;

      dispatch(documentsReceived(records, states));
      dispatch(storeEntries('states', states));
      dispatch(storeEntries('statesByGroup', groupBy(states, 'assessment_definition_id')));
    }
  }
}

//...
```

# Advanced
## Method Lifecycle
Whenever you run a method the crud library works as follows:
1. Change data by function `modifyBefore()`
2. Dispatch action `hookBefore()` with modified data
3. Call to an API
4. If the `usePayload` property is true, use payload instead of received data
5. Change result with `modifyAfter()`
6. Dispatch an internal CRUD action with modified result
7. Dispatch action `hookAfter()` with modified result

# Todos
[ ] Cover reducers
[ ] Cover batch actions
[ ] Add more examples


# Publish your module
Use the [`npm version`](https://docs.npmjs.com/cli/version) command instead of using `git commit` directly to commit module changes.
You should specify version according to [SemVer](http://semver.org/):


> Given a version number MAJOR.MINOR.PATCH, increment the:
>
> 1. MAJOR version when you make incompatible API changes,
> 2. MINOR version when you add functionality in a backwards-compatible manner, and
> 3. PATCH version when you make backwards-compatible bug fixes.
>
> Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

The `npm version` command can increase version automatically with one of following values as an argument: `patch`, `minor`, `major`.
In fact there are more possible values, but you need only these three.

# Possible issues
1. If you get `Git working directory not clean.` message, you can add `-f` flag after command
