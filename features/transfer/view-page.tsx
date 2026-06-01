import { getTransferById } from '@/service/transfer';
import TransferForm from './form';
import { ITransfer } from '@/models/transfer';

type TTransferViewPageProps = {
  transferId: string;
};

export default async function TransferViewPage({
  transferId
}: TTransferViewPageProps) {
  let transfer: ITransfer | null = null;
  let isEdit = false;

  if (transferId !== 'new') {
    const data = await getTransferById(transferId);
    transfer = data as ITransfer;
    isEdit = true;
  }

  return <TransferForm initialData={transfer} isEdit={isEdit} />;
}
