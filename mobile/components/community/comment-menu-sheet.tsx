import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMe } from '@/hooks/use-me';
import { buildCommentMenu } from '@/lib/comment-menu';
import { deleteComment, type CommentItem } from '@/lib/community';
import { showToast } from '@/lib/toast';

// 댓글 ⋮ 로 여는 시트 + 삭제 확인 창.
//
// 왜 조각으로 빼나: 게시글 상세와 스레드 화면이 똑같은 메뉴를 쓴다. 두 화면에 같은 코드를
// 두 벌 두면 한쪽만 고쳐져 문구·캐시 갱신이 갈린다(상세에서만 답글 목록을 새로 안 받는 식).
//
// 무엇을 보일지는 lib/comment-menu.ts가 정한다 — 여기는 그리고 보내기만 한다.

interface Props {
  postId: number;
  /** ⋮ 를 연 댓글. null이면 아무것도 안 뜬다 */
  target: CommentItem | null;
  onClose: () => void;
  /** 삭제가 끝난 뒤. 스레드 화면이 「원 댓글이 사라졌다」를 알아채려고 쓴다 */
  onDeleted?: (comment: CommentItem) => void;
}

export function CommentMenuSheet({ postId, target, onClose, onDeleted }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null);

  const actions: SheetAction[] = target
    ? buildCommentMenu(me?.id, target.authorId).map((item) => ({
        label: item.label,
        tone: item.tone,
        onPress: () => {
          // 시트를 먼저 닫는다. 확인 창·신고 화면과 겹쳐 뜨지 않게(내 상품 목록과 같은 순서).
          onClose();

          if (item.kind === 'delete') {
            setDeleteTarget(target);
            return;
          }

          // 댓글 신고 API가 없어 **작성자**를 신고한다 — 9바퀴 사용자 신고 화면 그대로다.
          router.push({
            pathname: '/report',
            params: { kind: 'user', id: String(target.authorId), name: target.authorNickname },
          });
        },
      }))
    : [];

  const handleDelete = async (comment: CommentItem) => {
    try {
      await deleteComment(comment.id);

      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      // 답글 조회 **전체**를 새로 받는다.
      //
      // ⚠️ comment.parentId만 보면 안 된다. 서버가 답글을 깊이 구분 없이 평평하게 주므로
      //    「답글의 답글」을 지우면 parentId가 답글을 가리킨다. 그 키로 새로 받아 봐야
      //    화면에 있는 목록(부모 기준)은 안 바뀐다.
      //    답글 있는 부모가 글당 1~2개뿐이라 전체를 다시 받아도 비용이 없다.
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      // 헤더의 댓글 수는 서버가 준 commentCount다. 상세를 다시 받아 맞춘다.
      queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });

      onDeleted?.(comment);
    } catch (error) {
      // 여기서 삼킨다. ConfirmDialog의 onConfirm이 던지면 창이 안 닫혀 사용자가 갇힌다.
      showToast(error instanceof Error ? error.message : '댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <>
      <ProductActionSheet visible={target !== null} onClose={onClose} actions={actions} />

      <ConfirmDialog
        visible={deleteTarget !== null}
        // 문구는 웹 DeleteReplyModal 그대로다.
        heading="댓글 삭제하기"
        description="정말로 이 댓글을 삭제하시겠습니까?"
        confirmLabel="삭제하기"
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await handleDelete(deleteTarget);
          // 성공이든 실패든 닫는다. 실패해도 창이 남으면 사용자가 갇힌다 —
          // 무엇이 잘못됐는지는 토스트가 알린다.
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
