import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import emojiDataPt from 'emoji-picker-react/dist/data/emojis-pt.json';

const emojiDataComunica = {
  ...emojiDataPt,
  categories: {
    ...emojiDataPt.categories,
    flags: { ...emojiDataPt.categories.flags, name: 'bandeiras' },
  },
};

export default function LazyEmojiPicker({ height, onSelect }) {
  return <EmojiPicker
    emojiData={emojiDataComunica}
    emojiStyle={EmojiStyle.TWITTER}
    theme="light"
    width="100%"
    height={height}
    lazyLoadEmojis
    searchPlaceholder="Pesquisar emoji"
    searchClearButtonLabel="Limpar pesquisa"
    previewConfig={{ showPreview: false }}
    onEmojiClick={onSelect}
  />;
}
