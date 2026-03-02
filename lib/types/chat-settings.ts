export type MessageDisplayMode = "streaming" | "static";
export type ReplyDialect = "colloquial" | "formal";
export type ChatSettings = {
  displayMode: MessageDisplayMode;
  dialect: ReplyDialect;
};
