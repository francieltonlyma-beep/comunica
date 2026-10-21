
@file:Suppress(
  "KotlinRedundantDiagnosticSuppress",
  "PropertyName",
  "MayBeConstant",
  "RedundantVisibilityModifier",
  "RedundantCompanionReference",
  "RemoveEmptyClassBody",
  "SpellCheckingInspection",
  "unused",
)

package com.google.firebase.dataconnect.generated


import kotlinx.coroutines.flow.filterNotNull as _flow_filterNotNull
import kotlinx.coroutines.flow.map as _flow_map


public interface GetUserSubscriptionsQuery :
    com.google.firebase.dataconnect.generated.GeneratedQuery<
      ExampleConnector,
      GetUserSubscriptionsQuery.Data,
      Unit
    >
{
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val categorySubscriptions: List<CategorySubscriptionsItem>,
  
  ) {
    
      
        @kotlinx.serialization.Serializable
  public data class CategorySubscriptionsItem(
  
    val category: Category,
  
  ) {
    
      
        @kotlinx.serialization.Serializable
  public data class Category(
  
    val name: String,
  
    val colorCode: String?,
  
  ) {
    
    
  }
      
    
    
  }
      
    
    
  }
  

  public companion object {
    public val operationName: String = "GetUserSubscriptions"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Unit> =
      kotlinx.serialization.serializer()
  }
}

public fun GetUserSubscriptionsQuery.ref(
  
): com.google.firebase.dataconnect.QueryRef<
    GetUserSubscriptionsQuery.Data,
    Unit
  > =
  ref(
    
      Unit
    
  )

public suspend fun GetUserSubscriptionsQuery.execute(

  
    fetchPolicy: com.google.firebase.dataconnect.QueryRef.FetchPolicy = com.google.firebase.dataconnect.QueryRef.FetchPolicy.PREFER_CACHE,
  

  ): com.google.firebase.dataconnect.QueryResult<
    GetUserSubscriptionsQuery.Data,
    Unit
  > =
  ref(
    
  ).execute(fetchPolicy = fetchPolicy)


  public fun GetUserSubscriptionsQuery.flow(
    
    ): kotlinx.coroutines.flow.Flow<GetUserSubscriptionsQuery.Data> =
    ref(
        
      ).subscribe()
      .flow
      ._flow_map { querySubscriptionResult -> querySubscriptionResult.result.getOrNull() }
      ._flow_filterNotNull()
      ._flow_map { it.data }

