import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Announcement_Key {
  id: UUIDString;
  __typename?: 'Announcement_Key';
}

export interface CategorySubscription_Key {
  userId: UUIDString;
  categoryId: UUIDString;
  __typename?: 'CategorySubscription_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreateCommentData {
  comment_insert: Comment_Key;
}

export interface CreateCommentVariables {
  announcementId: UUIDString;
  content: string;
}

export interface DeleteSubscriptionData {
  categorySubscription_delete?: CategorySubscription_Key | null;
}

export interface DeleteSubscriptionVariables {
  categoryId: UUIDString;
}

export interface GetUserSubscriptionsData {
  categorySubscriptions: ({
    category: {
      name: string;
      colorCode?: string | null;
    };
  })[];
}

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

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListAnnouncementsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAnnouncementsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAnnouncementsData, undefined>;
  operationName: string;
}
export const listAnnouncementsRef: ListAnnouncementsRef;

export function listAnnouncements(options?: ExecuteQueryOptions): QueryPromise<ListAnnouncementsData, undefined>;
export function listAnnouncements(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAnnouncementsData, undefined>;

interface GetUserSubscriptionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserSubscriptionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserSubscriptionsData, undefined>;
  operationName: string;
}
export const getUserSubscriptionsRef: GetUserSubscriptionsRef;

export function getUserSubscriptions(options?: ExecuteQueryOptions): QueryPromise<GetUserSubscriptionsData, undefined>;
export function getUserSubscriptions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserSubscriptionsData, undefined>;

interface CreateCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
  operationName: string;
}
export const createCommentRef: CreateCommentRef;

export function createComment(vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;
export function createComment(dc: DataConnect, vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;

interface DeleteSubscriptionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSubscriptionVariables): MutationRef<DeleteSubscriptionData, DeleteSubscriptionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteSubscriptionVariables): MutationRef<DeleteSubscriptionData, DeleteSubscriptionVariables>;
  operationName: string;
}
export const deleteSubscriptionRef: DeleteSubscriptionRef;

export function deleteSubscription(vars: DeleteSubscriptionVariables): MutationPromise<DeleteSubscriptionData, DeleteSubscriptionVariables>;
export function deleteSubscription(dc: DataConnect, vars: DeleteSubscriptionVariables): MutationPromise<DeleteSubscriptionData, DeleteSubscriptionVariables>;

