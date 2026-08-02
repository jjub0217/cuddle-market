import { useQueries, useQuery } from '@tanstack/react-query';
import { MessageSquareText } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMe } from '@/hooks/use-me';
import { fetchComments, fetchReplies, flattenComments, type CommentItem } from '@/lib/community';

import { CommentRow } from './comment-row';

// 댓글 목록. 부모와 그 답글을 한 줄기로 그린다.
//
// 답글은 부모마다 따로 부른다 — 서버가 목록에 답글을 안 담아 준다.
// **처음부터 다 부른다**: 답글 있는 부모가 글당 1~2개라 요청이 최대 3번이고,
// 나란히 쏘면 +50ms다(2026-08-01 실측). 눌러야 펼쳐지면 대화의 대부분이 처음에 안 보인다.

interface CommentListProps {
  postId: number;
  /** ⋮ 를 눌렀을 때. 부르는 쪽이 시트를 연다 */
  onMenu?: (comment: CommentItem) => void;
  /** 「답글 달기」를 눌렀을 때. 부모는 화면을 옮기고, 답글은 그 자리에 칸을 연다 */
  onReply?: (comment: CommentItem, isReply: boolean) => void;
  /** 답글 칸을 목록 **아래**에 그린다 (스레드 화면에서만 쓴다) */
  renderReplyInput?: (parentId: number) => ReactNode;
  /** 이 부모만 그린다 (스레드 화면). 없으면 전부 */
  onlyParentId?: number;
}

export function CommentList({
  postId,
  onMenu,
  onReply,
  renderReplyInput,
  onlyParentId,
}: CommentListProps) {
  const { data: me } = useMe();

  const { data: allParents } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  });

  const parents = (allParents ?? []).filter(
    (comment) => onlyParentId === undefined || comment.id === onlyParentId
  );

  const parentsWithReplies = parents.filter((comment) => comment.hasChildren);

  const replyQueries = useQueries({
    queries: parentsWithReplies.map((comment) => ({
      queryKey: ['replies', comment.id],
      queryFn: () => fetchReplies(comment.id),
    })),
  });

  const repliesByParent = new Map<number, CommentItem[]>(
    parentsWithReplies.map((comment, index) => [comment.id, replyQueries[index]?.data ?? []])
  );

  /** 답글을 못 불러온 부모 id. 그 자리에만 한 줄 안내를 그린다 */
  const failedParents = new Set<number>(
    parentsWithReplies
      .filter((_, index) => replyQueries[index]?.isError)
      .map((comment) => comment.id)
  );

  const rows = flattenComments(parents, repliesByParent);

  // 아직 받는 중일 때는 아무것도 안 그린다 — 「댓글이 없다」고 했다가 곧 나타나면 어수선하다.
  // 스레드 화면에서는 안 그린다: 거기엔 부모 댓글이 늘 있어 「없다」가 참이 아니다.
  if (allParents && rows.length === 0 && onlyParentId === undefined) {
    return (
      <View style={styles.empty}>
        <MessageSquareText size={32} color="#D1D5DB" />
        {/* 웹 CommentSection과 같은 문구다 */}
        <Text style={styles.emptyText}>첫 댓글을 남겨보세요</Text>
      </View>
    );
  }

  return (
    <View>
      {rows.map((row) => (
        <View key={row.comment.id}>
          <CommentRow
            comment={row.comment}
            isReply={row.isReply}
            isMine={Boolean(me && me.id === row.comment.authorId)}
            onMenu={onMenu ? () => onMenu(row.comment) : undefined}
            onReply={onReply ? () => onReply(row.comment, row.isReply) : undefined}
          />
          {/* 답글을 못 불러온 부모 아래에만 한 줄. 나머지 댓글은 그대로 보인다 */}
          {!row.isReply && failedParents.has(row.comment.id) ? (
            <Text style={styles.replyError}>답글을 불러오지 못했어요.</Text>
          ) : null}
        </View>
      ))}

      {/* 스레드 화면에서 답글 칸을 맨 아래에 그린다 */}
      {renderReplyInput && onlyParentId !== undefined ? renderReplyInput(onlyParentId) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  replyError: { marginLeft: 40, marginBottom: 8, fontSize: 12, color: '#9CA3AF' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
