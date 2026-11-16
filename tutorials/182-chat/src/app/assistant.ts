import { Component, signal } from '@angular/core';
import {
  GrdChat,
  type GrdChatAuthor,
  grdChatFind,
  type GrdChatMessage,
  type GrdChatSend,
  grdChatUpdate,
} from '@gridify/studio';

const ME: GrdChatAuthor = { id: 'me', name: 'You' };
const HELPER: GrdChatAuthor = { id: 'helper', name: 'Helper', icon: '🤖' };

/** What the pretend assistant says: an answer for the first word it knows in the question. */
function answerTo(question: string): string {
  const text = question.toLowerCase();
  if (text.includes('price')) {
    return 'The coffee prices went up by 5 % on 1 October. The new list is in the folder Price lists.';
  }
  if (text.includes('open')) {
    return 'The shop is open from 8:00 to 18:00 on weekdays, and from 9:00 to 13:00 on Saturday.';
  }
  return 'I am a pretend assistant: I know about the prices and the opening hours. Ask me about them.';
}

/** Waits a moment. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A tool: an assistant in bubbles, whose answer is written word by word, as a model does it. */
@Component({
  selector: 'app-assistant',
  imports: [GrdChat],
  template: `
    <!-- Bubbles, and no replies and no emoji: a talk, not a discussion. -->
    <grd-chat
      [messages]="messages()"
      currentUser="me"
      appearance="bubbles"
      [threads]="false"
      [reactions]="false"
      placeholder="Ask about the prices or the opening hours"
      (submitted)="ask($event)"
      (stopRequested)="stop()"
    />
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class Assistant {
  protected readonly messages = signal<readonly GrdChatMessage[]>([
    { id: 'hello', author: HELPER, text: 'Hello! What do you want to know?' },
  ]);

  private nextId = 1;
  /** The id of the answer that is being written, or null. */
  private writing: string | null = null;

  /** The user asked: the question, and an answer that comes word by word. */
  protected async ask(send: GrdChatSend): Promise<void> {
    const question: GrdChatMessage = { id: `q${this.nextId++}`, author: ME, text: send.text };
    // 'pending': the answer has not begun yet, the chat shows dots. While an answer is pending
    // or streaming, the send button of the chat is a Stop button.
    const answerId = `a${this.nextId++}`;
    const answer: GrdChatMessage = { id: answerId, author: HELPER, text: '', status: 'pending' };
    this.messages.update((list) => [...list, question, answer]);
    this.writing = answerId;

    await wait(900); // The pretend model thinks.

    const words = answerTo(send.text).split(' ');
    for (let count = 1; count <= words.length; count++) {
      if (this.writing !== answerId) return; // Stop was pressed.
      // 'streaming': the text so far, and the dots after it.
      this.change(answerId, { text: words.slice(0, count).join(' '), status: 'streaming' });
      await wait(120);
    }
    this.change(answerId, { status: 'sent' });
    this.writing = null;
  }

  /** Stop was pressed. */
  protected stop(): void {
    const id = this.writing;
    this.writing = null;
    if (!id) return;
    if (grdChatFind(this.messages(), id)?.status === 'pending') {
      // It has not begun: it is taken away.
      this.messages.update((list) => list.filter((message) => message.id !== id));
    } else {
      // It has begun: it stays as far as it came.
      this.change(id, { status: 'sent' });
    }
  }

  /** Changes one message: grdChatUpdate gives a new list with the changed message. */
  private change(id: string, patch: Partial<GrdChatMessage>): void {
    this.messages.update((list) =>
      grdChatUpdate(list, id, (message) => ({ ...message, ...patch })),
    );
  }
}
