import { USER_BLOCK_ALERT_LIST } from '@cuddle/shared';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { blockUser } from '@/lib/reports';
import { showToast } from '@/lib/toast';

// 차단 확인 창.
//
// 껍데기는 components/ui/confirm-dialog.tsx다 — 차단 해제 창과 같은 모양이어야 한다.
// (한때 여기가 창을 직접 그리고 차단 해제는 RN 기본 Alert을 써서 둘이 갈려 있었다.)
// 여기는 「무엇을 묻고 무엇을 부르는지」만 정한다.
//
// 안내 문구는 @cuddle/shared의 USER_BLOCK_ALERT_LIST를 쓴다. 웹도 같은 것을 쓰므로
// 문구를 고칠 일이 있으면 shared 한 곳만 고치면 된다.

interface Props {
  visible: boolean;
  nickname: string;
  userId: number;
  onClose: () => void;
  /** 차단이 끝났을 때. 보통 프로필을 다시 불러온다. */
  onDone: () => void;
}

export function BlockConfirm({ visible, nickname, userId, onClose, onDone }: Props) {
  const handleConfirm = async () => {
    try {
      await blockUser(userId);
      onDone();
    } catch {
      // 창을 닫고 토스트로 알린다. 창을 열어 둔 채 오류를 그리면 안내 문구와 겹쳐
      // 무엇이 잘못됐는지 흐려진다.
      onClose();
      showToast('사용자 차단에 실패했습니다');
    }
  };

  return (
    <ConfirmDialog
      visible={visible}
      heading="사용자 차단하기"
      description={`정말로 ${nickname}님을 차단하시겠습니까?`}
      notes={USER_BLOCK_ALERT_LIST}
      confirmLabel="차단하기"
      tone="danger"
      onClose={onClose}
      onConfirm={handleConfirm}
    />
  );
}
