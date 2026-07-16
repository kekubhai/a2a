import { notFound } from 'next/navigation';
import { getTaskById, getBidsForTask, getVerificationsForTask } from '@/lib/queries';
import { TaskDetail } from '@/components/tasks/task-detail';

export const dynamic = 'force-dynamic';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) notFound();

  const [bids, verifications] = await Promise.all([
    getBidsForTask(id),
    getVerificationsForTask(id),
  ]);

  return (
    <TaskDetail
      taskId={id}
      initialTask={task}
      initialBids={bids}
      initialVerifications={verifications}
    />
  );
}
