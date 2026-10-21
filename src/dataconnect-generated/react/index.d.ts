import { ListAnnouncementsData, GetUserSubscriptionsData, CreateCommentData, CreateCommentVariables, DeleteSubscriptionData, DeleteSubscriptionVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListAnnouncements(options?: useDataConnectQueryOptions<ListAnnouncementsData>): UseDataConnectQueryResult<ListAnnouncementsData, undefined>;
export function useListAnnouncements(dc: DataConnect, options?: useDataConnectQueryOptions<ListAnnouncementsData>): UseDataConnectQueryResult<ListAnnouncementsData, undefined>;

export function useGetUserSubscriptions(options?: useDataConnectQueryOptions<GetUserSubscriptionsData>): UseDataConnectQueryResult<GetUserSubscriptionsData, undefined>;
export function useGetUserSubscriptions(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserSubscriptionsData>): UseDataConnectQueryResult<GetUserSubscriptionsData, undefined>;

export function useCreateComment(options?: useDataConnectMutationOptions<CreateCommentData, FirebaseError, CreateCommentVariables>): UseDataConnectMutationResult<CreateCommentData, CreateCommentVariables>;
export function useCreateComment(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCommentData, FirebaseError, CreateCommentVariables>): UseDataConnectMutationResult<CreateCommentData, CreateCommentVariables>;

export function useDeleteSubscription(options?: useDataConnectMutationOptions<DeleteSubscriptionData, FirebaseError, DeleteSubscriptionVariables>): UseDataConnectMutationResult<DeleteSubscriptionData, DeleteSubscriptionVariables>;
export function useDeleteSubscription(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteSubscriptionData, FirebaseError, DeleteSubscriptionVariables>): UseDataConnectMutationResult<DeleteSubscriptionData, DeleteSubscriptionVariables>;
