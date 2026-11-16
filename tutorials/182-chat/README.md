# 182 – A chat

This tutorial shows a chat (`grd-chat`) in a docking application: the chat of a team as a document (cards, replies, emoji, who is online), and an assistant as a tool (bubbles, and an answer that is written word by word, with a Stop button). You will learn how to:

- give the chat its messages, and add the one that the user sent (`[messages]`, `(submitted)`, `grdChatAddReply`);
- let the user reply to a message and press emoji under it (`(reacted)`, `grdChatReact`);
- write an answer while it arrives, as an assistant does (`status: 'pending'` and `'streaming'`, `grdChatUpdate`), and stop it (`(stopRequested)`);
- choose the look: cards for a discussion, bubbles for a talk (`appearance`).

```
npm run tutorial 182
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30182 and write a message to the team.

## The words first

- **A message** has an `id`, an `author` and a `text`; it may have a `time`, `reactions` (the emoji under it, and who pressed them) and `replies` (messages again: the conversation is a tree).
- **The user** is the author whose `id` is `currentUser`: their messages are "mine", and the emoji they press are theirs.
- **The data is yours**: the chat draws the messages it is given and tells what the user did (sent a text, pressed an emoji, pressed Stop). The application makes a new list, and the chat draws it.
- **The status** of a message: `pending` (an answer that has not begun: dots), `streaming` (the text so far, and dots), `sent` (the default).

## Step by step

### Step 1: the chat of the team

`src/app/team-chat.ts` is the document:

```ts
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
```

- **The authors** have an `id` and a `name`; the circle shows the initials. **`status`** is the presence: a dot at the circle (`online` green, `away` orange), which the screen readers read after the name.
- **The messages** are a signal. The first has a reply (`replies`) and an emoji (`reactions`: 👍, pressed by Jakub). `time` is a `Date`: a message of today shows the hour, an older one the date.
- **`(submitted)`** gives `{ text, parentId }`: the text that was sent, and the message it replies to (`null` for a new message). **`grdChatAddReply`** puts the new message at its place: at the end of the conversation, or at the end of the replies of `parentId`.
- **`(reacted)`** gives the message and the emoji; **`grdChatReact`** adds the user to the emoji, or takes them away when they had it.
- **`height: 100%`**: the chat fills the height of its place, here the tab. The list scrolls inside, and the field stays at the bottom.

### Step 2: the assistant

`src/app/assistant.ts` is the tool. Its chat:

<!-- prettier-ignore -->
```html
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
```

- **`appearance="bubbles"`**: the messages of the user are on the right, in the color of the accent, the others on the left. **`[threads]="false"`** and **`[reactions]="false"`** take the replies and the emoji away: a talk with an assistant needs neither.
- **The author** `Helper` has `icon: '🤖'` in its circle instead of the initials.

What happens when the user asks, and when they press Stop:

```ts
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
```

- **`status: 'pending'`**: the answer is there, empty, and shows dots. While an answer is `pending` or `streaming`, the chat is busy: its send button is **Stop**, and Enter sends nothing.
- **The loop** writes one more word every 120 ms, with `status: 'streaming'` (the text and the dots after it). A real application does the same with the parts of an answer that come from its server.
- **`grdChatUpdate(list, id, change)`** gives a new list in which the message `id` is changed. Only the way to it is new, so the chat draws only that message again.
- **`'sent'`** at the end: the dots go, and the button is Send again.
- **`(stopRequested)`**: Stop was pressed. What happens is up to the application; the usual way is the one here: an answer that has not begun is taken away, one that has begun stays as far as it came.

### Step 3: the layout

`src/app/app.ts` puts the chat of the team among the documents and the assistant into a tool on the right, and registers them by their keys, as 015 does.

### Step 4: run it

```
npm run tutorial 182
```

## Try it

1. **Write.** Type `I checked the prices.` into the field of _Team_ and press Enter: your message is at the end, with the hour. Shift+Enter makes a new line.
2. **Reply.** Press **Reply** under the message of Olivia Brown, write `Thanks, Olivia!` and press Enter: the reply is under the one of Jakub. **Collapse** folds the replies, and the circle of Olivia says how many are hidden.
3. **Emoji.** Press 👍 under the message of Olivia: it says 2, and it is marked as yours. Press it again: 1. The smiley button adds another emoji: put 🎉 under the message of Jakub.
4. **Presence.** The dots at the circles: Olivia is online (green), Jakub is away (orange).
5. **Ask the assistant.** Type `What are the prices?` into the field of _Assistant_: three dots for a moment, then the answer comes word by word, and the send button is a square: Stop.
6. **Stop.** Ask `When are you open?` and press Stop while the answer is being written: it stays as far as it came. Pressed while there are only the dots, Stop takes the answer away.
7. **The engine.** Choose _Detach to a floating window_ in the menu of the tab _Assistant_ (the ⋯): the conversation goes with it.

## More

- **Markdown**: `format="markdown"` draws headings, lists, tables and code in the messages (never HTML): what an assistant usually answers with.
- **Tools under an answer**: `actions="copy regenerate feedback"`: copy it, ask for it again (`regenerateRequested`), a thumb up or down (`feedbackGiven`).
- **A message that did not go**: `status: 'failed'` shows a button to try again (`retryRequested`); `'sending'` is a pale message on its way.
- **Pictures**: `avatar` of an author is the address of a picture, shown instead of the initials.
- **Send with Ctrl+Enter**: `sendOn="ctrl-enter"` (Enter is then a new line); for all the chats of an application `provideGrdControlDefaults({ chatSendOn: 'ctrl-enter' })`, see 102.

## With a real server

- **The messages** come from the server: a request at the start, then the new ones as they come (a WebSocket, or events sent by the server). `(submitted)` sends the text; the message can be `status: 'sending'` until the server has it.
- **An assistant**: the server asks a model and sends its answer in parts; each part makes the text longer with `grdChatUpdate`, as the loop of this tutorial does. Stop tells the server to stop (an `AbortController` for `fetch`).

## Build it yourself

`npm run tutorial:eject 182 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `team-chat.ts` and `assistant.ts` to `src/app`, and replace `app.ts` with the one of this tutorial.
