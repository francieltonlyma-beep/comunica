
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



public interface CreateCommentMutation :
    com.google.firebase.dataconnect.generated.GeneratedMutation<
      ExampleConnector,
      CreateCommentMutation.Data,
      CreateCommentMutation.Variables
    >
{
  
    @kotlinx.serialization.Serializable
  public data class Variables(
  
    val announcementId: @kotlinx.serialization.Serializable(with = com.google.firebase.dataconnect.serializers.UUIDSerializer::class) java.util.UUID,
  
    val content: String,
  
  ) {
    
    
  }
  

  
    @kotlinx.serialization.Serializable
  public data class Data(
  
    val comment_insert: CommentKey,
  
  ) {
    
    
  }
  

  public companion object {
    public val operationName: String = "CreateComment"

    public val dataDeserializer: kotlinx.serialization.DeserializationStrategy<Data> =
      kotlinx.serialization.serializer()

    public val variablesSerializer: kotlinx.serialization.SerializationStrategy<Variables> =
      kotlinx.serialization.serializer()
  }
}

public fun CreateCommentMutation.ref(
  
    announcementId: java.util.UUID,content: String,

  
  
): com.google.firebase.dataconnect.MutationRef<
    CreateCommentMutation.Data,
    CreateCommentMutation.Variables
  > =
  ref(
    
      CreateCommentMutation.Variables(
        announcementId=announcementId,content=content,
  
      )
    
  )

public suspend fun CreateCommentMutation.execute(

  
    
      announcementId: java.util.UUID,content: String,

  

  ): com.google.firebase.dataconnect.MutationResult<
    CreateCommentMutation.Data,
    CreateCommentMutation.Variables
  > =
  ref(
    
      announcementId=announcementId,content=content,
  
    
  ).execute()


