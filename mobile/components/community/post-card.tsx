import { getTimeAgo } from '@cuddle/shared';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { PostListItem } from '@/lib/community';

// 목록 한 줄. 웹 커뮤니티 목록과 같은 재료를 쓴다 —
// 제목 · 내용 미리보기 · 작성자 · 시간 · 조회 · 댓글 수 · 오른쪽 썸네일.

interface PostCardProps {
  post: PostListItem;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        {post.contentPreview ? (
          <Text style={styles.preview} numberOfLines={2}>
            {post.contentPreview}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          {post.authorNickname} · {getTimeAgo(post.createdAt)} · 조회 {post.viewCount} · 댓글{' '}
          {post.commentCount}
        </Text>
      </View>

      {/* CDN 이미지라 expo-image를 쓴다. 없으면 자리도 안 만든다 */}
      {post.thumbnailImageUrl ? (
        <Image source={{ uri: post.thumbnailImageUrl }} style={styles.thumb} contentFit="cover" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  text: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  preview: { fontSize: 14, lineHeight: 20, color: '#6B7280' },
  meta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  thumb: { width: 76, height: 76, borderRadius: 8, backgroundColor: '#F3F4F6' },
});
