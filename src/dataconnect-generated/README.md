# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListAnnouncements*](#listannouncements)
  - [*GetUserSubscriptions*](#getusersubscriptions)
- [**Mutations**](#mutations)
  - [*CreateComment*](#createcomment)
  - [*DeleteSubscription*](#deletesubscription)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListAnnouncements
You can execute the `ListAnnouncements` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAnnouncements(options?: ExecuteQueryOptions): QueryPromise<ListAnnouncementsData, undefined>;

interface ListAnnouncementsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAnnouncementsData, undefined>;
}
export const listAnnouncementsRef: ListAnnouncementsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAnnouncements(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAnnouncementsData, undefined>;

interface ListAnnouncementsRef {
  ...
  (dc: DataConnect): QueryRef<ListAnnouncementsData, undefined>;
}
export const listAnnouncementsRef: ListAnnouncementsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAnnouncementsRef:
```typescript
const name = listAnnouncementsRef.operationName;
console.log(name);
```

### Variables
The `ListAnnouncements` query has no variables.
### Return Type
Recall that executing the `ListAnnouncements` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAnnouncementsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAnnouncementsData {
  announcements: ({
    title: string;
    content: string;
    createdAt: TimestampString;
    author: {
      username: string;
    };
    category?: {
      name: string;
    };
  })[];
}
```
### Using `ListAnnouncements`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAnnouncements } from '@dataconnect/generated';


// Call the `listAnnouncements()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAnnouncements();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAnnouncements(dataConnect);

console.log(data.announcements);

// Or, you can use the `Promise` API.
listAnnouncements().then((response) => {
  const data = response.data;
  console.log(data.announcements);
});
```

### Using `ListAnnouncements`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAnnouncementsRef } from '@dataconnect/generated';


// Call the `listAnnouncementsRef()` function to get a reference to the query.
const ref = listAnnouncementsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAnnouncementsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.announcements);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.announcements);
});
```

## GetUserSubscriptions
You can execute the `GetUserSubscriptions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserSubscriptions(options?: ExecuteQueryOptions): QueryPromise<GetUserSubscriptionsData, undefined>;

interface GetUserSubscriptionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserSubscriptionsData, undefined>;
}
export const getUserSubscriptionsRef: GetUserSubscriptionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserSubscriptions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserSubscriptionsData, undefined>;

interface GetUserSubscriptionsRef {
  ...
  (dc: DataConnect): QueryRef<GetUserSubscriptionsData, undefined>;
}
export const getUserSubscriptionsRef: GetUserSubscriptionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserSubscriptionsRef:
```typescript
const name = getUserSubscriptionsRef.operationName;
console.log(name);
```

### Variables
The `GetUserSubscriptions` query has no variables.
### Return Type
Recall that executing the `GetUserSubscriptions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserSubscriptionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserSubscriptionsData {
  categorySubscriptions: ({
    category: {
      name: string;
      colorCode?: string | null;
    };
  })[];
}
```
### Using `GetUserSubscriptions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserSubscriptions } from '@dataconnect/generated';


// Call the `getUserSubscriptions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserSubscriptions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserSubscriptions(dataConnect);

console.log(data.categorySubscriptions);

// Or, you can use the `Promise` API.
getUserSubscriptions().then((response) => {
  const data = response.data;
  console.log(data.categorySubscriptions);
});
```

### Using `GetUserSubscriptions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserSubscriptionsRef } from '@dataconnect/generated';


// Call the `getUserSubscriptionsRef()` function to get a reference to the query.
const ref = getUserSubscriptionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserSubscriptionsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.categorySubscriptions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.categorySubscriptions);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateComment
You can execute the `CreateComment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createComment(vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;

interface CreateCommentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
}
export const createCommentRef: CreateCommentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createComment(dc: DataConnect, vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;

interface CreateCommentRef {
  ...
  (dc: DataConnect, vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
}
export const createCommentRef: CreateCommentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCommentRef:
```typescript
const name = createCommentRef.operationName;
console.log(name);
```

### Variables
The `CreateComment` mutation requires an argument of type `CreateCommentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCommentVariables {
  announcementId: UUIDString;
  content: string;
}
```
### Return Type
Recall that executing the `CreateComment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCommentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCommentData {
  comment_insert: Comment_Key;
}
```
### Using `CreateComment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createComment, CreateCommentVariables } from '@dataconnect/generated';

// The `CreateComment` mutation requires an argument of type `CreateCommentVariables`:
const createCommentVars: CreateCommentVariables = {
  announcementId: ..., 
  content: ..., 
};

// Call the `createComment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createComment(createCommentVars);
// Variables can be defined inline as well.
const { data } = await createComment({ announcementId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createComment(dataConnect, createCommentVars);

console.log(data.comment_insert);

// Or, you can use the `Promise` API.
createComment(createCommentVars).then((response) => {
  const data = response.data;
  console.log(data.comment_insert);
});
```

### Using `CreateComment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCommentRef, CreateCommentVariables } from '@dataconnect/generated';

// The `CreateComment` mutation requires an argument of type `CreateCommentVariables`:
const createCommentVars: CreateCommentVariables = {
  announcementId: ..., 
  content: ..., 
};

// Call the `createCommentRef()` function to get a reference to the mutation.
const ref = createCommentRef(createCommentVars);
// Variables can be defined inline as well.
const ref = createCommentRef({ announcementId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCommentRef(dataConnect, createCommentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.comment_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.comment_insert);
});
```

## DeleteSubscription
You can execute the `DeleteSubscription` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteSubscription(vars: DeleteSubscriptionVariables): MutationPromise<DeleteSubscriptionData, DeleteSubscriptionVariables>;

interface DeleteSubscriptionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSubscriptionVariables): MutationRef<DeleteSubscriptionData, DeleteSubscriptionVariables>;
}
export const deleteSubscriptionRef: DeleteSubscriptionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteSubscription(dc: DataConnect, vars: DeleteSubscriptionVariables): MutationPromise<DeleteSubscriptionData, DeleteSubscriptionVariables>;

interface DeleteSubscriptionRef {
  ...
  (dc: DataConnect, vars: DeleteSubscriptionVariables): MutationRef<DeleteSubscriptionData, DeleteSubscriptionVariables>;
}
export const deleteSubscriptionRef: DeleteSubscriptionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteSubscriptionRef:
```typescript
const name = deleteSubscriptionRef.operationName;
console.log(name);
```

### Variables
The `DeleteSubscription` mutation requires an argument of type `DeleteSubscriptionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteSubscriptionVariables {
  categoryId: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteSubscription` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteSubscriptionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteSubscriptionData {
  categorySubscription_delete?: CategorySubscription_Key | null;
}
```
### Using `DeleteSubscription`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteSubscription, DeleteSubscriptionVariables } from '@dataconnect/generated';

// The `DeleteSubscription` mutation requires an argument of type `DeleteSubscriptionVariables`:
const deleteSubscriptionVars: DeleteSubscriptionVariables = {
  categoryId: ..., 
};

// Call the `deleteSubscription()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteSubscription(deleteSubscriptionVars);
// Variables can be defined inline as well.
const { data } = await deleteSubscription({ categoryId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteSubscription(dataConnect, deleteSubscriptionVars);

console.log(data.categorySubscription_delete);

// Or, you can use the `Promise` API.
deleteSubscription(deleteSubscriptionVars).then((response) => {
  const data = response.data;
  console.log(data.categorySubscription_delete);
});
```

### Using `DeleteSubscription`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteSubscriptionRef, DeleteSubscriptionVariables } from '@dataconnect/generated';

// The `DeleteSubscription` mutation requires an argument of type `DeleteSubscriptionVariables`:
const deleteSubscriptionVars: DeleteSubscriptionVariables = {
  categoryId: ..., 
};

// Call the `deleteSubscriptionRef()` function to get a reference to the mutation.
const ref = deleteSubscriptionRef(deleteSubscriptionVars);
// Variables can be defined inline as well.
const ref = deleteSubscriptionRef({ categoryId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteSubscriptionRef(dataConnect, deleteSubscriptionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.categorySubscription_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.categorySubscription_delete);
});
```

