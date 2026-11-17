import { supabase } from '../supabase'
import {
  getTestPosts,
  getTestPostById,
  createTestPost,
  updateTestPost,
  deleteTestPost,
} from '../test/testDataStore'

export async function fetchPosts({ selectedBoard = 'all', isTestMode = false }) {
  if (isTestMode) {
    return getTestPosts(selectedBoard)
  }

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (selectedBoard !== 'all') {
    query = query.eq('board_id', selectedBoard)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchPostById(postId, { isTestMode = false } = {}) {
  if (isTestMode) {
    const post = getTestPostById(postId)
    if (!post) throw new Error('테스트 게시글을 찾을 수 없습니다.')
    return post
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error) throw error
  return data
}

export async function createPost({
  board_id,
  title,
  content,
  author_id,
  author_nickname,
  isTestMode = false,
}) {
  if (isTestMode) {
    return createTestPost({
      board_id,
      title,
      content,
      author_id,
      author_nickname,
    })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      board_id,
      title,
      content,
      author_id,
      author_nickname,
      author_name: author_nickname,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePost(
  postId,
  { board_id, title, content, isTestMode = false }
) {
  if (isTestMode) {
    return updateTestPost(postId, { board_id, title, content })
  }

  const { data, error } = await supabase
    .from('posts')
    .update({
      board_id,
      title,
      content,
    })
    .eq('id', postId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePost(postId, { isTestMode = false } = {}) {
  if (isTestMode) {
    deleteTestPost(postId)
    return true
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) throw error
  return true
}
