import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    let html = value
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*\*([\s\S]*?)\*\*\*/g, '<b><i>$1</i></b>')
      .replace(/\*\*([\s\S]*?)\*\*/g, '<b>$1</b>')
      .replace(/\*([\s\S]*?)\*/g, '<i>$1</i>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    return html;
  }
}

@Pipe({ name: 'linebreak' })
export class LinebreakPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.replace(/\n/g, '<br>');
  }
}
