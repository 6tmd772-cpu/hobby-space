import { supabase } from '../supabase'
import {
  getTestComments,
  createTestComment,
  deleteTestComment,
} from '../test/testDataStore'

export async function fetchComments(postId, { isTestMode = false } = {}) {
  if (isTestMode) {
    return getTestComments(postId)
  }

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createComment({
  post_id,
  author_id,
  author_nickname,
  content,
  isTestMode = false,
}) {
  if (isTestMode) {
    return createTestComment({
      post_id,
      author_id,
      author_nickname,
      content,
    })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id,
      author_id,
      author_nickname,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(commentId, { isTestMode = false } = {}) {
  if (isTestMode) {
    deleteTestComment(commentId)
    return true
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) throw error
  return true
}
