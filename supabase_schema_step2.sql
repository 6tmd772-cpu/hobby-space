-- ====================================================================
-- HOBBY SPACE 2단계: 다중 게시판 및 댓글 시스템 DB 마이그레이션 SQL
-- ====================================================================

-- 1. boards (게시판 메타데이터 테이블) 생성
CREATE TABLE IF NOT EXISTS public.boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 게시판 초기 데이터 등록 (기존 general 보존 및 5대 취미 게시판 추가)
INSERT INTO public.boards (id, name, description, order_index)
VALUES
  ('general', '자유 공간', '모든 취미와 자유로운 대화를 나누는 공간', 0),
  ('book', 'BOOK SPACE', '책과 문장, 깊이 있는 사유와 서평을 나누는 공간', 1),
  ('game', 'GAME SPACE', '콘솔, PC, 인디게임 등 다양한 게임 이야기와 팁', 2),
  ('music', 'MUSIC SPACE', '음악 감상, 추천 플레이리스트, 악기 연주 이야기', 3),
  ('cook', 'COOK SPACE', '나만의 요리 레시피, 홈베이킹과 미식 탐방기', 4),
  ('active', 'ACTIVE SPACE', '러닝, 헬스, 등산, 스포츠와 활력 넘치는 일상', 5)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index;

-- 3. profiles 테이블에 닉네임(nickname) 컬럼 추가 및 기존 데이터 마이그레이션
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 기존 profiles의 nickname이 비어있는 경우 name 또는 기본값으로 채움
UPDATE public.profiles
SET nickname = COALESCE(NULLIF(TRIM(name), ''), '회원')
WHERE nickname IS NULL;

-- 4. posts 테이블 외래 키 및 닉네임(author_nickname) 컬럼 보강
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_nickname TEXT;

-- 기존 posts의 author_nickname을 기존 author_name으로 채움
UPDATE public.posts
SET author_nickname = COALESCE(NULLIF(TRIM(author_name), ''), '회원')
WHERE author_nickname IS NULL;

-- 기존 general 글이 안전하게 보존된 상태에서 boards 외래 키 연결
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_board_id'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT fk_posts_board_id
      FOREIGN KEY (board_id) REFERENCES public.boards(id)
      ON UPDATE CASCADE;
  END IF;
END $$;

-- 5. 취미별 관리자 매핑 테이블 (board_managers) 생성
CREATE TABLE IF NOT EXISTS public.board_managers (
  board_id TEXT NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, user_id)
);

-- 6. comments (댓글 테이블) 생성
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments (created_at ASC);

-- 7. 테이블 권한 부여
GRANT ALL ON TABLE public.boards TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.board_managers TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.comments TO authenticated, anon, service_role;

-- 8. 취미별 관리자 판별 보안 함수
CREATE OR REPLACE FUNCTION public.is_board_manager(p_board_id TEXT)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_managers
    WHERE board_id = p_board_id AND user_id = auth.uid()
  );
$$;

-- 9. 신규 가입 시 닉네임 우선 저장 트리거 업데이트
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nickname TEXT;
BEGIN
  v_nickname := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'nickname'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    '회원'
  );

  INSERT INTO public.profiles (id, name, nickname, role)
  VALUES (
    new.id,
    v_nickname,
    v_nickname,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET nickname = COALESCE(EXCLUDED.nickname, profiles.nickname);

  RETURN new;
END;
$$;

-- 10. 게시글 작성자 닉네임 자동 주입 트리거 업데이트
CREATE OR REPLACE FUNCTION public.sync_post_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nickname TEXT;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NEW.author_id IS NULL OR NEW.author_id <> auth.uid() THEN
      NEW.author_id := auth.uid();
    END IF;
  END IF;

  SELECT nickname INTO v_nickname FROM public.profiles WHERE id = NEW.author_id;
  IF v_nickname IS NOT NULL THEN
    NEW.author_nickname := v_nickname;
    NEW.author_name := v_nickname;
  ELSE
    NEW.author_nickname := COALESCE(NEW.author_nickname, '회원');
    NEW.author_name := NEW.author_nickname;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 11. 댓글 작성자 닉네임 자동 주입 트리거 생성
CREATE OR REPLACE FUNCTION public.sync_comment_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nickname TEXT;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NEW.author_id IS NULL OR NEW.author_id <> auth.uid() THEN
      NEW.author_id := auth.uid();
    END IF;
  END IF;

  SELECT nickname INTO v_nickname FROM public.profiles WHERE id = NEW.author_id;
  IF v_nickname IS NOT NULL THEN
    NEW.author_nickname := v_nickname;
  ELSE
    NEW.author_nickname := COALESCE(NEW.author_nickname, '회원');
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_comment_author ON public.comments;
CREATE TRIGGER trg_sync_comment_author
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_author();

-- 12. RLS 정책 활성화 및 설정
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- [boards RLS]
DROP POLICY IF EXISTS "Boards are viewable by everyone" ON public.boards;
CREATE POLICY "Boards are viewable by everyone"
  ON public.boards FOR SELECT USING (true);

-- [board_managers RLS]
DROP POLICY IF EXISTS "Board managers viewable by everyone" ON public.board_managers;
CREATE POLICY "Board managers viewable by everyone"
  ON public.board_managers FOR SELECT USING (true);

-- [posts RLS 업데이트: 본인, 전체관리자, 또는 해당 취미 게시판 관리자 수정/삭제 가능]
DROP POLICY IF EXISTS "Authors or admins can update posts" ON public.posts;
CREATE POLICY "Authors or admins can update posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id 
    OR public.is_admin() 
    OR public.is_board_manager(board_id)
  )
  WITH CHECK (
    auth.uid() = author_id 
    OR public.is_admin() 
    OR public.is_board_manager(board_id)
  );

DROP POLICY IF EXISTS "Authors or admins can delete posts" ON public.posts;
CREATE POLICY "Authors or admins can delete posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id 
    OR public.is_admin() 
    OR public.is_board_manager(board_id)
  );

-- [comments RLS]
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors or admins can delete comments" ON public.comments;
CREATE POLICY "Authors or admins can delete comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id 
    OR public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = comments.post_id 
      AND public.is_board_manager(p.board_id)
    )
  );

-- 13. PostgREST 스키마 캐시 즉시 리로드
NOTIFY pgrst, 'reload schema';
