import { Component, signal } from '@angular/core';
import {
  GrdChat,
  grdChatAddReply,
  type GrdChatAuthor,
  type GrdChatMessage,
  grdChatReact,
  type GrdChatReactionEvent,
  type GrdChatSend,
} from '@gridify/studio';

const ME: GrdChatAuthor = { id: 'me', name: 'You' };
const OLIVIA: GrdChatAuthor = { id: 'olivia', name: 'Olivia Brown', status: 'online' };
const JAKUB: GrdChatAuthor = { id: 'jakub', name: 'Jakub Dvořák', status: 'away' };

let nextId = 10;

/** A time of today: the chat shows the hour of a message of today. */
function today(hours: number, minutes: number): Date {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** A document: the chat of the team, as cards with replies and emoji. */
@Component({
  selector: 'app-team-chat',
  imports: [GrdChat],
  template: `
    <!-- currentUser: the messages of this author are "mine", and so are the emoji they press. -->
    <grd-chat
      [messages]="messages()"
      currentUser="me"
      (submitted)="send($event)"
      (reacted)="react($event)"
    />
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class TeamChat {
  /** The conversation: a tree, a message can have replies. */
  protected readonly messages = signal<readonly GrdChatMessage[]>([
    {
      id: 'm1',
      author: OLIVIA,
      text: 'The new price list is on the shared drive. Can somebody check the coffee prices?',
      time: today(9, 12),
      reactions: [{ emoji: '👍', users: ['jakub'] }],
      replies: [
        { id: 'm2', author: JAKUB, text: 'I will look at it after lunch.', time: today(9, 20) },
      ],
    },
    {
      id: 'm3',
      author: JAKUB,
      text: 'The shop opens at 8:00 tomorrow, not at 9:00.',
      time: today(10, 5),
    },
  ]);

  /** The composer sent a message: a new one, or a reply (`parentId`). */
  protected send(send: GrdChatSend): void {
    const message: GrdChatMessage = {
      id: `m${nextId++}`,
      author: ME,
      text: send.text,
      time: new Date(),
    };
    this.messages.update((list) => grdChatAddReply(list, send.parentId, message));
  }

  /** An emoji was pressed: it is added for the user, or taken away when it was theirs. */
  protected react(event: GrdChatReactionEvent): void {
    this.messages.update((list) => grdChatReact(list, event.message.id, event.emoji, 'me'));
  }
}
