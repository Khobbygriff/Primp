import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useSuspendUserMutation } from '@/domains/user-moderation/hooks/useSuspendUserMutation';
import { normalizeApiError } from '@/shared/api/apiError';

interface SuspendUserDialogProps {
  userId: number;
  userName: string;
  onClose: () => void;
  onSuspended?: () => void;
}

export function SuspendUserDialog({ userId, userName, onClose, onSuspended }: SuspendUserDialogProps) {
  const suspendMutation = useSuspendUserMutation();

  return (
    <ConfirmDialog
      title={`Suspend ${userName}?`}
      body={
        <>
          <p style={{ margin: 0 }}>
            This immediately hides the account from discovery and blocks new bookings. Existing
            in-progress bookings are not automatically cancelled — handle those separately before
            suspending, if needed.
          </p>
          {suspendMutation.isError && (
            <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 8 }}>
              {normalizeApiError(suspendMutation.error).message}
            </p>
          )}
        </>
      }
      confirmLabel="Suspend account"
      requireReason
      reasonPlaceholder="e.g. Repeated no-shows reported by clients — case #4021"
      isSubmitting={suspendMutation.isPending}
      onCancel={onClose}
      onConfirm={(reason) => {
        suspendMutation.mutate(
          { userId, reason: reason ?? '' },
          {
            onSuccess: () => {
              onSuspended?.();
              onClose();
            },
          },
        );
      }}
    />
  );
}
