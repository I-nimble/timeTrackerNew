import { Pipe, PipeTransform, Injectable  } from '@angular/core';
import data from '@emoji-mart/data';

@Pipe({ name: 'emojiMart' })
@Injectable({ providedIn: 'root' })
export class EmojiMartPipe implements PipeTransform {
  private map: Record<string, string> = {};
  private readonly emojiSequenceRegex = /(\p{Regional_Indicator}{2}|[\d#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*)/gu;
  private readonly debugEnabled = true;

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

    const originalValue = value;
    let shortcodeReplacements = 0;
    let nativeReplacements = 0;

    value = value.replace(/:([a-zA-Z0-9_+-]+):/g, (full, sc) => {
      const native = this.map[sc];
      if (!native) {
        return full;
      }
      shortcodeReplacements += 1;
      return this.getAppleImageHtmlFromNative(native, 22);
    });

    const transformed = value.replace(this.emojiSequenceRegex, (emoji) => {
      nativeReplacements += 1;
      return this.getAppleImageHtmlFromNative(emoji, 22);
    });
    return transformed;
  }

  getShortcodeFromNative(nativeEmoji: string): string | null {
    const target = this.normalizeNativeEmoji(nativeEmoji);
    for (const sc in this.map) {
      if (this.normalizeNativeEmoji(this.map[sc]) === target) {
        return `:${sc}:`;
      }
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
    if (!native) {
      return null;
    }
    return this.getAppleImageHtmlFromNative(native, 18);
  }

  getAppleImgFromNative(native: string, size: number = 18): string {
    return this.getAppleImageHtmlFromNative(native, size);
  }

  private getAppleImageHtmlFromNative(native: string, size: number): string {
    const normalized = this.normalizeNativeEmoji(native);
    const hex = Array.from(normalized)
      .map(c => c.codePointAt(0)?.toString(16))
      .filter((v): v is string => !!v)
      .join('-');

    if (!hex) return native;

    return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${hex}.png" width="${size}" height="${size}" style="vertical-align:middle;"/>`;
  }

  private normalizeNativeEmoji(value: string): string {
    return (value || '').replace(/\uFE0F/g, '');
  }

  private preview(value: string): string {
    if (!value) return '';
    const compact = value.replace(/\s+/g, ' ').trim();
    return compact.length > 160 ? `${compact.slice(0, 160)}...` : compact;
  }

  private debug(message: string, data?: any): void {
    if (!this.debugEnabled) return;
    if (typeof data === 'undefined') {
      return;
    }
  }
}