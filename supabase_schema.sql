-- ====================================================================
-- HOBBY SPACE 1단계: 단순 게시판 데이터베이스 스키마 및 보안(RLS) 설정
-- ====================================================================

-- 1. 프로필 테이블 (profiles)
-- auth.users와 1:1로 매핑되어 실명과 권한(role)을 안전하게 관리합니다.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 게시글 테이블 (posts)
-- 향후 다중 게시판 확장을 위해 board_id 필드가 'general' 기본값으로 설계되었습니다.
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  board_id TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON public.posts (board_id);

-- 3. RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 4. 관리자 권한 확인 함수 (SECURITY DEFINER로 무한 재귀 및 권한 상승 방지)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 5. 신규 회원 가입 시 profiles 자동 생성 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', '익명 회원'),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. 프로필 role 임의 승격 방지 트리거 함수
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 관리자가 아니라면 일반 회원은 본인의 role을 변경할 수 없도록 기존 값 유지
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 7. 게시글 작성자 ID 및 실명 일치 검증 트리거 함수
CREATE OR REPLACE FUNCTION public.sync_post_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name TEXT;
BEGIN
  -- 로그인된 유저가 작성할 때 author_id를 본인 ID로 강제 일치
  IF auth.uid() IS NOT NULL THEN
    IF NEW.author_id IS NULL OR NEW.author_id <> auth.uid() THEN
      NEW.author_id := auth.uid();
    END IF;
  END IF;

  -- profiles 테이블의 실제 실명으로 author_name 동기화
  SELECT name INTO v_author_name FROM public.profiles WHERE id = NEW.author_id;
  IF v_author_name IS NOT NULL THEN
    NEW.author_name := v_author_name;
  ELSE
    NEW.author_name := COALESCE(NEW.author_name, '회원');
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_author ON public.posts;
CREATE TRIGGER trg_sync_post_author
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_author();

-- ====================================================================
-- RLS 정책 설정
-- ====================================================================

-- [profiles RLS 정책]
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- [posts RLS 정책]
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors or admins can update posts" ON public.posts;
CREATE POLICY "Authors or admins can update posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin())
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "Authors or admins can delete posts" ON public.posts;
CREATE POLICY "Authors or admins can delete posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id OR public.is_admin());
