export type StickerBubble = {
  speaker: string;
  text: string;
  // 目前只做“被回复消息 = incoming”
  kind: "incoming";
};
