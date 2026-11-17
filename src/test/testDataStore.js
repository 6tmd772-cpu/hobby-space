// ====================================================================
// HOBBY SPACE: 가상 테스트 모드 전용 로컬 저장소 (DB와 100% 분리)
// ====================================================================

const TEST_POSTS_KEY = 'hobby_space_test_posts'
const TEST_COMMENTS_KEY = 'hobby_space_test_comments'

const INITIAL_SAMPLE_POSTS = [
  {
    id: 'test-p-1',
    board_id: 'book',
    title: '[테스트] 헤르만 헤세의 데미안을 읽고 사유를 나눕니다',
    content: '새는 알을 깨고 나온다. 알은 세계이다. 태어나려는 자는 하나의 세계를 파괴해야 한다.\n\n취미로 독서를 시작하시는 분들에게 깊이 추천하고 싶은 고전입니다.',
    author_id: 'test-mgr-book',
    author_nickname: '문학지기',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'test-p-2',
    board_id: 'game',
    title: '[테스트] 주말에 차분하게 즐기기 좋은 인디 어드벤처 추천',
    content: '화려한 그래픽보다는 잔잔한 음악과 서사가 돋보이는 인디게임을 모아보았습니다.\n\n커피 한 잔과 함께 가볍게 몰입하기 좋은 게임들입니다.',
    author_id: 'test-mgr-game',
    author_nickname: '게임마스터',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'test-p-3',
    board_id: 'cook',
    title: '[테스트] 주말 아침, 정갈한 바질 페스토 파스타 레시피',
    content: '신선한 바질과 잣, 엑스트라 버진 올리브유로 간단하게 만드는 브런치 파스타입니다.\n\n재료 준비부터 플레이팅까지 20분이면 충분합니다.',
    author_id: 'test-mgr-cook',
    author_nickname: '셰프킴',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
]

const INITIAL_SAMPLE_COMMENTS = [
  {
    id: 'test-c-1',
    post_id: 'test-p-1',
    author_id: 'test-user-001',
    author_nickname: '취미탐험가',
    content: '데미안은 언제 읽어도 마음을 울리는 문장이 많아서 참 좋습니다. 좋은 글 감사합니다!',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'test-c-2',
    post_id: 'test-p-1',
    author_id: 'test-user-002',
    author_nickname: '호기심천국',
    content: '이번 주말에 꼭 서점에 가서 데미안을 다시 읽어봐야겠네요.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
]

// 1. 테스트 게시글 목록 불러오기
export function getTestPosts(boardId = 'all') {
  let stored = localStorage.getItem(TEST_POSTS_KEY)
  let posts = []

  if (!stored) {
    posts = INITIAL_SAMPLE_POSTS
    localStorage.setItem(TEST_POSTS_KEY, JSON.stringify(posts))
  } else {
    try {
      posts = JSON.parse(stored) || []
    } catch {
      posts = INITIAL_SAMPLE_POSTS
    }
  }

  if (boardId && boardId !== 'all') {
    return posts.filter((p) => p.board_id === boardId)
  }
  return posts
}

// 2. 테스트 단일 게시글 조회
export function getTestPostById(postId) {
  const posts = getTestPosts('all')
  return posts.find((p) => String(p.id) === String(postId)) || null
}

// 3. 테스트 게시글 생성
export function createTestPost({ board_id, title, content, author_id, author_nickname }) {
  const posts = getTestPosts('all')
  const newPost = {
    id: `test-p-${Date.now()}`,
    board_id,
    title,
    content,
    author_id,
    author_nickname,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const updated = [newPost, ...posts]
  localStorage.setItem(TEST_POSTS_KEY, JSON.stringify(updated))
  return newPost
}

// 4. 테스트 게시글 수정
export function updateTestPost(postId, { board_id, title, content }) {
  const posts = getTestPosts('all')
  let updatedPost = null

  const updated = posts.map((p) => {
    if (String(p.id) === String(postId)) {
      updatedPost = {
        ...p,
        board_id: board_id || p.board_id,
        title,
        content,
        updated_at: new Date().toISOString(),
      }
      return updatedPost
    }
    return p
  })

  localStorage.setItem(TEST_POSTS_KEY, JSON.stringify(updated))
  return updatedPost
}

// 5. 테스트 게시글 삭제 (해당 글의 테스트 댓글도 연쇄 삭제)
export function deleteTestPost(postId) {
  const posts = getTestPosts('all')
  const filtered = posts.filter((p) => String(p.id) !== String(postId))
  localStorage.setItem(TEST_POSTS_KEY, JSON.stringify(filtered))

  // 댓글 연쇄 삭제
  const comments = getTestComments('all')
  const filteredComments = comments.filter((c) => String(c.post_id) !== String(postId))
  localStorage.setItem(TEST_COMMENTS_KEY, JSON.stringify(filteredComments))
}

// 6. 테스트 댓글 목록 불러오기
export function getTestComments(postId) {
  let stored = localStorage.getItem(TEST_COMMENTS_KEY)
  let comments = []

  if (!stored) {
    comments = INITIAL_SAMPLE_COMMENTS
    localStorage.setItem(TEST_COMMENTS_KEY, JSON.stringify(comments))
  } else {
    try {
      comments = JSON.parse(stored) || []
    } catch {
      comments = INITIAL_SAMPLE_COMMENTS
    }
  }

  if (postId && postId !== 'all') {
    return comments.filter((c) => String(c.post_id) === String(postId))
  }
  return comments
}

// 7. 테스트 댓글 생성
export function createTestComment({ post_id, author_id, author_nickname, content }) {
  const comments = getTestComments('all')
  const newComment = {
    id: `test-c-${Date.now()}`,
    post_id: String(post_id),
    author_id,
    author_nickname,
    content,
    created_at: new Date().toISOString(),
  }

  const updated = [...comments, newComment]
  localStorage.setItem(TEST_COMMENTS_KEY, JSON.stringify(updated))
  return newComment
}

// 8. 테스트 댓글 삭제
export function deleteTestComment(commentId) {
  const comments = getTestComments('all')
  const filtered = comments.filter((c) => String(c.id) !== String(commentId))
  localStorage.setItem(TEST_COMMENTS_KEY, JSON.stringify(filtered))
}

// 9. 테스트 전용 데이터 초기화
export function resetTestStorageData() {
  localStorage.removeItem(TEST_POSTS_KEY)
  localStorage.removeItem(TEST_COMMENTS_KEY)
  // 샘플 데이터 재적용
  localStorage.setItem(TEST_POSTS_KEY, JSON.stringify(INITIAL_SAMPLE_POSTS))
  localStorage.setItem(TEST_COMMENTS_KEY, JSON.stringify(INITIAL_SAMPLE_COMMENTS))
}
