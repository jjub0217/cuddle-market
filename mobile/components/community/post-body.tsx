import { Image, type ImageLoadEventData } from 'expo-image';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ImageStyle, type TextStyle } from 'react-native';
import { Renderer, useMarkdown, type MarkedStyles } from 'react-native-marked';

import { PhotoViewer } from '@/components/photo-viewer/photo-viewer';
import { colors } from '@/constants/colors';

// 게시글 본문. 서버가 마크다운으로 준다.
//
// 웹 MdPreview.tsx가 정한 모양을 그대로 옮긴다. 웹과 앱이 같은 글을 다르게
// 보여주면 안 된다.
//
// ⚠️ 이미지는 본문 안에 ![](url)로 들어 있다. 상세 응답의 imageUrls에도 같은 것이
//    오는데, 그것까지 따로 그리면 같은 사진이 두 번 나온다. 본문만 그린다.
//
// ⚠️ 기본 내보내기인 <Markdown>은 속을 FlatList로 그린다. 상세 화면이 ScrollView
//    안이라 목록이 목록 안에 들어가 경고가 뜬다. 그래서 같은 라이브러리가 주는
//    useMarkdown 훅으로 조각만 받아 View에 그대로 담는다. 그리는 결과는 같다.
//
// 링크를 누르면 라이브러리가 Linking.openURL로 앱 밖 브라우저를 연다
// (웹도 target="_blank"다). 따로 붙일 것이 없다.

interface PostBodyProps {
  content: string;
}

// 본문 글자 기본값. 라이브러리 기본은 16/24/#333333이라 앱 값으로 덮는다.
const BODY_TEXT = { fontSize: 15, lineHeight: 22, color: colors.onSurface } as const;

// 사진을 아직 못 읽었을 때 잡아 두는 가로세로 비. 읽고 나면 진짜 비로 바꾼다.
const FALLBACK_RATIO = 4 / 3;

// 웹 MdPreview의 클래스와 짝을 이루는 값들:
//   h1 text-2xl(24)/h2 text-xl(20)/h3 text-lg(18) · font-semibold(600) · mt-2 mb-2
//   a  text-blue-600(#2563EB) underline
//   code bg-gray-100(#F3F4F6) rounded
//   blockquote border-l-4 pl-3(12) · 앱은 글자색까지는 못 준다(감싸개가 View라서)
//   img rounded-lg(8)
//
// ⚠️ 라이브러리 기본값 중 웹에 없는 것을 여기서 되돌린다:
//   - h1·h2 아래 밑줄(borderBottom) → 0으로
//   - link·codespan의 기울임(fontStyle: italic) → normal로
//   - blockquote의 opacity 0.8 → 1로
const MARKDOWN_STYLES: MarkedStyles = {
  text: BODY_TEXT,
  em: { ...BODY_TEXT, fontStyle: 'italic' },
  strong: { ...BODY_TEXT, fontWeight: '700' },
  strikethrough: { ...BODY_TEXT, textDecorationLine: 'line-through' },
  paragraph: { paddingVertical: 0, marginVertical: 6 },
  h1: {
    ...BODY_TEXT,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    marginVertical: 8,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  h2: {
    ...BODY_TEXT,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    marginVertical: 8,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  h3: {
    ...BODY_TEXT,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  li: BODY_TEXT,
  list: { marginVertical: 4 },
  link: { ...BODY_TEXT, color: colors.link, textDecorationLine: 'underline', fontStyle: 'normal' },
  codespan: {
    ...BODY_TEXT,
    backgroundColor: colors.surfaceSunken,
    borderRadius: 4,
    fontStyle: 'normal',
    fontWeight: '400',
  },
  code: { backgroundColor: colors.surfaceSunken, borderRadius: 4, padding: 12 },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.outline,
    paddingLeft: 12,
    marginVertical: 8,
    opacity: 1,
  },
  image: { borderRadius: 8 },
};

/**
 * 본문 속 사진 한 장. 폭을 꽉 채우고 높이는 원본 비를 따라간다(웹 `w-full h-auto`).
 *
 * ⚠️ 라이브러리가 주는 사진 조각(MDImage)을 쓰지 않고 이걸 대신 끼운다.
 *    MDImage의 useEffect에 의존성 배열이 없어서, 크기를 읽어 상태에 넣을 때마다
 *    다시 그려지고 → 또 읽고 → 또 그려지는 고리가 생긴다(v8.1.1에서 확인).
 *    시험에서는 이 고리 때문에 메모리가 터졌다. 우리는 expo-image의 onLoad로
 *    크기를 한 번만 받는다(같은 숫자를 다시 넣으면 React가 다시 그리지 않는다).
 */
function PostImage({ uri, alt, style }: { uri: string; alt?: string; style?: ImageStyle }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleLoad = (event: ImageLoadEventData) => {
    const { width, height } = event.source;
    if (width > 0 && height > 0) setRatio(width / height);
  };

  return (
    <>
      {/* ⚠️ 사진마다 이름이 같다(post-photo). 그리개(PostRenderer.image)가 몇 번째
          사진인지 알려 주지 않아서다 — this.getKey() 는 리액트 key 로만 쓰이고
          조각 안에서는 못 본다. 시험은 getAllByTestId('post-photo')[0] 으로 집는다. */}
      <Pressable
        testID="post-photo"
        accessibilityRole="button"
        onPress={() => setViewerOpen(true)}
      >
        <Image
          source={{ uri }}
          style={[styles.image, { aspectRatio: ratio ?? FALLBACK_RATIO }, style]}
          contentFit="cover"
          accessibilityLabel={alt}
          onLoad={handleLoad}
          testID="post-body-image"
        />
      </Pressable>

      {/* 본문 사진은 한 장씩 따로 그려진다 — 그리개가 이웃 사진을 안 알려 줘서
          확대창도 누른 그 한 장만 받는다(웹 MdPreview 도 마찬가지다). */}
      <PhotoViewer images={[uri]} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </>
  );
}

/** 사진만 우리 것으로 바꾼 그리개. 나머지(제목·목록·링크…)는 라이브러리 그대로. */
class PostRenderer extends Renderer {
  override image(uri: string, alt?: string, style?: ImageStyle, title?: string): ReactNode {
    return <PostImage key={this.getKey()} uri={uri} alt={alt || title} style={style} />;
  }

  // 본문을 꾹 눌러 복사할 수 있게 한다(#896).
  //
  // ⚠️ **여기서만 할 수 있다.** 본문의 <Text> 는 우리가 아니라 라이브러리가 만든다.
  //    그래서 화면 쪽에서는 selectable 을 붙일 자리가 없고, 글자를 그리는 이 메서드를
  //    덮는 수밖에 없다. image() 를 덮는 것과 같은 방식이다.
  //
  // ⚠️ 원래 구현은 getTextNode(text, styles) 다(Renderer.js:102). 모양이 달라지지 않게
  //    스타일을 그대로 넘기고 selectable 만 더한다.
  override text(text: string | ReactNode[], styles?: TextStyle): ReactNode {
    return (
      <Text key={this.getKey()} selectable style={styles}>
        {text}
      </Text>
    );
  }
}

export function PostBody({ content }: PostBodyProps) {
  // 그리개는 한 번만 만든다. 매번 새로 만들면 라이브러리가 글을 통째로 다시 판다.
  const renderer = useMemo(() => new PostRenderer(), []);

  // 화면 전체가 밝은 색 하나로 고정이라(다른 화면도 #111827·#FFFFFF를 직접 쓴다)
  // 기기 설정을 따라가지 않고 밝은 쪽으로 못 박는다.
  const elements = useMarkdown(content, {
    colorScheme: 'light',
    styles: MARKDOWN_STYLES,
    renderer,
  });

  return <View style={styles.body}>{elements}</View>;
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
  },
  image: {
    width: '100%',
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.outlineVariant, // 읽기 전·실패했을 때 보이는 회색 자리
  },
});
