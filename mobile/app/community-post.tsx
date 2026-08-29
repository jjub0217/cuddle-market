import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostImageField } from '@/components/community/post-image-field';
import { messageStyles } from '@/components/signup/field';
import { StatusFilterChips, type FilterChip } from '@/components/my/status-filter-chips';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { fetchPostDetail, type BoardType } from '@/lib/community';
import {
  createPost,
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_LENGTH,
  remainingBodyLength,
  splitContent,
  updatePost,
} from '@/lib/community-post';
import type { UploadSlot } from '@/lib/product-images';

// 커뮤니티 글쓰기. 루트 화면이라 탭바가 안 보인다 — 끝내고 나가는 화면이다
// (상품 등록·신고와 같은 판단).
//
// ⚠️ **사진은 화면이 들고 있다가 보낼 때 본문 뒤에 붙는다.** 사진 칸이 스스로 값을 들면
//    화면이 「사진 몫이 몇 글자인가」를 몰라 글자 수를 못 센다(lib/community-post.ts 참고).
//
// 문구는 웹 글쓰기(CommunityPostForm.tsx)에서 그대로 가져왔다 —
// 「제목을 입력해 주세요」·「내용을 입력하세요」·「n/50」·「n/1000자」·「등록」.
// 헤더 이름도 웹 모바일 서브헤더(MobileBackHeader)와 같은 「게시글 작성」·「게시글 수정」이다.
//
// ⚠️ **글 고치기도 이 화면이 한다**(`/community-post?postId=39`). 새 화면을 만들지 않았다 —
//    칸·한계·검사가 글쓰기와 똑같아서, 나누면 같은 규칙을 두 곳에서 지켜야 한다.

/**
 * 질문/정보 두 갈래. 목록 화면(`(tabs)/community/index.tsx` 의 `BOARD_CHIPS`)과
 * **같은 조각·같은 말**이다. 같은 갈래를 두 이름으로 부르면 안 된다.
 *
 * ⚠️ 목록의 것을 가져다 쓰지 않고 여기 다시 적었다. 그쪽은 expo-router 의 화면 파일이라
 *    화면 말고 다른 것을 내보내지 않는다. 말이 바뀌면 두 곳을 같이 고친다.
 */
const BOARD_CHIPS: FilterChip<BoardType>[] = [
  { id: 'QUESTION', label: '질문 있어요' },
  { id: 'INFO', label: '정보 공유' },
];

export default function CommunityPostScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  // 목록에서 보던 게시판을 그대로 물려받는다. 정보 공유를 보다 글을 쓰는데 질문으로
  // 시작하면 고르는 손이 한 번 더 든다.
  //
  // postId 가 오면 **수정 모드**다. 화면을 따로 만들지 않았다 — 칸도 한계도 검사도
  // 글쓰기와 똑같아서, 나누면 같은 규칙을 두 곳에서 지켜야 한다.
  const params = useLocalSearchParams<{ boardType?: string; postId?: string }>();
  const postId = params.postId ? Number(params.postId) : null;
  const isEdit = postId !== null;

  const [boardType, setBoardType] = useState<BoardType>(
    params.boardType === 'INFO' ? 'INFO' : 'QUESTION'
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [slots, setSlots] = useState<UploadSlot[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정 모드면 원래 글을 받아 온다. 상세 화면과 같은 queryKey 라 이미 본 글이면 바로 뜬다.
  const { data: original } = useQuery({
    queryKey: ['communityPost', postId],
    queryFn: () => fetchPostDetail(postId!),
    enabled: isEdit,
  });

  // 받아 온 글을 칸에 붓는다.
  //
  // ⚠️ **한 번만** 붓는다. 매번 부으면 사용자가 고쳐 놓은 것이 되돌아간다.
  // ⚠️ **렌더 도중에 맞춘다.** useEffect 로 하면 react-hooks/set-state-in-effect 가 막는다 —
  //    「받아 온 것이 달라졌으면 그때 맞춘다」가 이 저장소의 방식이다.
  const [filled, setFilled] = useState(false);
  if (original && !filled) {
    setFilled(true);
    setTitle(original.title);
    setBoardType(original.boardType);
    // ⭐ 서버가 사진을 따로 안 준다(imageUrls 는 늘 비어 있다). 본문에서 꺼내 나눠 담는다.
    const { body: 글, imageUrls: 사진들 } = splitContent(original.content);
    setBody(글);
    // ⚠️ localUri 에 **서버 주소**를 넣는다. 원래는 「폰 안의 주소」를 담는 자리지만,
    //    이미 올라간 사진은 그것이 곧 미리보기 주소다. url 도 채워야 「올리는 중」에 안 걸린다.
    setSlots(사진들.map((url, i) => ({ key: `orig-${i}`, localUri: url, url, failed: false })));
  }

  // 폰 안의 주소는 서버가 못 읽는다. 올라간 것만 본문에 붙는다.
  const uploadedUrls = slots.map((slot) => slot.url).filter((url): url is string => url !== null);
  // 웹과 같은 모양(n/1000자)으로 보여주되 **사진 몫까지 더한** 값이다 — 서버가 세는 것과 같다.
  const remaining = remainingBodyLength(body, uploadedUrls);
  const used = MAX_CONTENT_LENGTH - remaining;
  // ⚠️ 아직 안 올라간 사진이 있으면 막는다. 안 막으면 본문에 ![](null) 이 들어간다.
  const uploading = slots.some((slot) => slot.url === null && !slot.failed);

  const canSubmit =
    title.trim().length >= MIN_LENGTH &&
    body.trim().length >= MIN_LENGTH &&
    remaining >= 0 &&
    !uploading &&
    !sending;

  /**
   * 왜 못 누르는지 알린다.
   *
   * ⚠️ **단추만 흐려 두면 이유를 모른다.** 특히 사진은 다 보이는데도(미리보기가 먼저 뜬다)
   *    아직 안 올라간 상태가 있어, 화면만 보면 다 된 것처럼 보인다.
   *    글자·제목이 짧은 것은 칸 아래 숫자가 이미 말해 주므로 여기서는 안 적는다.
   */
  const blockedReason = uploading
    ? '사진을 올리는 중이에요. 다 올라가면 등록할 수 있어요.'
    : remaining < 0
      ? '1000자를 넘었어요. 사진도 글자 수에 들어가요.'
      : null;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSending(true);
    setError(null);
    try {
      if (isEdit) {
        await updatePost(postId, { title, body, imageUrls: uploadedUrls, boardType });
        // 상세도 무르게 한다. 안 하면 돌아간 자리에 **고치기 전 글**이 그대로 보인다.
        await queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
      } else {
        await createPost({ title, body, imageUrls: uploadedUrls, boardType });
      }

      // ⚠️ **무르게 하지 않으면 목록에 방금 쓴 글이 안 보인다.** 돌아가도 캐시에 든
      //    옛 결과를 그대로 보여줘서 「등록이 안 됐나」로 읽힌다(#922).
      //    목록의 queryKey 는 ['communityPosts', boardType, keyword, sortBy] 인데,
      //    **앞자리만 주면** 게시판·검색어·정렬이 달라도 다 걸린다.
      //    앱의 관례다 — 댓글도 그렇게 한다(`comment-thread.tsx` 의 댓글 등록 뒤
      //    `invalidateQueries({ queryKey: ['replies'] })`).
      await queryClient.invalidateQueries({ queryKey: ['communityPosts'] });

      router.back();
    } catch (e) {
      // 서버 문구를 그대로 살린다 — 차단·권한 같은 것을 사용자가 구별해야 한다.
      // 화면은 안 닫는다. 적어 둔 글이 남아 있어야 다시 낼 수 있다.
      setError(
        e instanceof Error ? e.message : isEdit ? '글 수정에 실패했어요' : '글 등록에 실패했어요'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    // ⚠️ 루트 화면이라 아래도 자기가 비켜야 한다. 탭 화면과 다르다(mobile/AGENTS.md)
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title={isEdit ? '게시글 수정' : '게시글 작성'}
        onPressIcon={() => router.back()}
        right={
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={!canSubmit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="등록"
            accessibilityState={{ disabled: !canSubmit }}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            {sending ? (
              <ActivityIndicator color={colors.action} />
            ) : (
              <Text style={[styles.submit, !canSubmit && styles.submitOff]}>등록</Text>
            )}
          </Pressable>
        }
      />

      {/* ⚠️ 안드로이드도 'padding' 이다. edgeToEdgeEnabled 라 창이 안 줄고 앱이 키보드 뒤까지
          그린다. 본문 칸과 사진 격자를 **함께** 감싼다 — 칸만 감싸면 위쪽이 안 밀린다
          (product-form.tsx·comment-thread.tsx 와 같은 판단, mobile/AGENTS.md 참고) */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* 목록 위에서 고르는 줄과 같은 조각이다. 자기 좌우 여백을 들고 있어 밖에 둔다 */}
          <StatusFilterChips chips={BOARD_CHIPS} activeId={boardType} onChange={setBoardType} />

          <View style={styles.fields}>
            <View style={styles.field}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="제목을 입력해 주세요"
                placeholderTextColor={colors.onSurfaceSubtle}
                maxLength={MAX_TITLE_LENGTH}
                style={styles.input}
              />
              <Text style={styles.counter}>
                {title.length}/{MAX_TITLE_LENGTH}
              </Text>
            </View>

            <View style={styles.field}>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="내용을 입력하세요"
                placeholderTextColor={colors.onSurfaceSubtle}
                multiline
                // ⚠️ **maxLength 를 안 준다.** 한계는 사진까지 합친 1000자라, 글에만 1000을
                //    걸면 사진을 더한 순간 조용히 넘어간다. 넘으면 숫자를 빨갛게 보여준다.
                style={[styles.input, styles.textarea]}
                textAlignVertical="top"
              />
              <Text style={[styles.counter, remaining < 0 && styles.counterOver]}>
                {used}/{MAX_CONTENT_LENGTH}자
              </Text>
            </View>

            <PostImageField slots={slots} onChange={setSlots} />

            {blockedReason ? <Text style={messageStyles.hint}>{blockedReason}</Text> : null}
            {error ? <Text style={messageStyles.error}>{error}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  body: { paddingBottom: 24 },
  // 칩 줄은 자기 여백(16)을 들고 있어 이 안에 없다. 나머지 칸만 같은 16로 맞춘다
  fields: { paddingHorizontal: 16, gap: 16 },
  field: { gap: 6 },

  // 값은 signup/field.tsx 의 입력칸과 같다 — 앱 안에서 칸 모양이 두 가지면 안 된다.
  // 이름표가 없어 Field 조각을 안 썼다(웹도 제목·내용에 이름표를 안 붙인다).
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.onSurface,
    backgroundColor: colors.surface,
  },
  // 여러 줄 칸. 상품 설명(product-form.tsx 의 textarea)과 같은 값이다
  textarea: { height: 200, paddingTop: 12, paddingBottom: 12 },

  // 웹처럼 칸 오른쪽 아래에 붙인다. 크기·색은 칸 아래 안내문(messageStyles.hint)과 같다
  counter: { alignSelf: 'flex-end', fontSize: 13, color: colors.onSurfaceMuted },
  counterOver: { color: colors.danger, fontWeight: '600' },

  // 헤더 오른쪽 「등록」. 못 누를 때는 흐리게 두고, 왜 못 누르는지는 칸 아래에 적는다
  submit: { fontSize: 16, fontWeight: '700', color: colors.action },
  submitOff: { color: colors.onSurfaceSubtle },
  pressed: { opacity: 0.5 },
});
