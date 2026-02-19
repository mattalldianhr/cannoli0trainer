import { Container } from '@/components/layout/Container';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Messages | Cannoli Trainer',
};

export default function MessagesPage() {
  return (
    <Container className="py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Conversations with your athletes
        </p>
      </div>
      <div className="max-w-2xl">
        <ConversationList />
      </div>
    </Container>
  );
}
