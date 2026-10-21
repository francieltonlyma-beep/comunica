
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



public interface DeleteSubscriptionMutation :
    com.google.firebase.dataconnect.generated.GeneratedMutation<
      ExampleConnector,
      DeleteSubscriptionMutation.Data,
      DeleteSubscriptionMutation.Variables
    >
{
  
    @kotlinx.serialization.Serializable
  public data class Variables(
  
    val categoryId: @kotlinx.serialization.Serializable(with = com.google.firebase.dataconnect.serializers.UUIDSerializer::class) java.util.UUID,
  
  ) {
    
    
  }
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val categorySubscription_delete: CategorySubscriptionKey?,
  
  ) {
    
    
  }
  

  public companion object {
    public val operationName: String = "DeleteSubscription"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables> =
      kotlinx.serialization.serializer()
  }
}

public fun DeleteSubscriptionMutation.ref(
  
    categoryId: java.util.UUID,

  
  
): com.google.firebase.dataconnect.MutationRef<
    DeleteSubscriptionMutation.Data,
    DeleteSubscriptionMutation.Variables
  > =
  ref(
    
      DeleteSubscriptionMutation.Variables(
        categoryId=categoryId,
  
      )
    
  )

public suspend fun DeleteSubscriptionMutation.execute(

  
    
      categoryId: java.util.UUID,

  

  ): com.google.firebase.dataconnect.MutationResult<
    DeleteSubscriptionMutation.Data,
    DeleteSubscriptionMutation.Variables
  > =
  ref(
    
      categoryId=categoryId,
  
    
  ).execute()


