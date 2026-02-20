import { Pipe, PipeTransform, Injectable  } from '@angular/core';
import data from '@emoji-mart/data';

@Pipe({ name: 'emojiMart' })
@Injectable({ providedIn: 'root' })
export class EmojiMartPipe implements PipeTransform {
  private map: Record<string, string> = {};

  constructor() {
    this.buildEmojiMap();
  }

  private buildEmojiMap() {
    const categories: any[] = (data as any).categories;
    const emojiData = (data as any).emojis;
    if (!categories || !emojiData) {
      console.error("Emoji mart categories or emojis missing!", data);
      return;
    }
    categories.forEach(cat => {
      (cat.emojis || []).forEach((emojiId: string) => {
        const e = emojiData[emojiId];
        if (!e) return;
        const native = e.skins?.[0]?.native;
        if (!native) return;
        if (e.shortcodes) {
          const list = Array.isArray(e.shortcodes) ? e.shortcodes : [e.shortcodes];
          list.forEach((sc: string) => this.map[sc] = native);
        }
        this.map[e.id] = native;
      });
    });
  }

  transform(value: string): string {
    if (!value) return '';

    value = value.replace(/:([a-zA-Z0-9_+-]+):/g, (full, sc) => {
      const native = this.map[sc];
      if (!native) return full;
      const hex = Array.from(native)
        .map(c => c.codePointAt(0)?.toString(16))
        .join('-');
      return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${hex}.png" width="22" height="22"/>`;
    });

    return value.replace(/\p{Extended_Pictographic}/gu, (emoji) => {
      const hex = emoji.codePointAt(0)?.toString(16);
      return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${hex}.png" width="22" height="22"/>`;
    });
  }

  getShortcodeFromNative(nativeEmoji: string): string | null {
    for (const sc in this.map) {
      if (this.map[sc] === nativeEmoji) return `:${sc}:`;
    }
    return null;
  }

  getNativeFromShortcode(shortcode: string): string | null {
    const clean = shortcode.replace(/:/g, '');
    return this.map[clean] || null;
  }

  getAppleImgFromShortcode(shortcode: string): string | null {
    const key = shortcode.replace(/:/g, '');
    const native = this.map[key];
    if (!native) return null;
    const hex = Array.from(native)
      .map(c => c.codePointAt(0)?.toString(16))
      .join('-');
    if (!hex) return null;
    return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${hex}.png"
                width="18" height="18" style="vertical-align:middle;" />`;
  }
}