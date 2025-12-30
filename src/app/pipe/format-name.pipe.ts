import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatName',
  standalone: true
})
export class FormatNamePipe implements PipeTransform {
    transform(fullName: string): string {
    if (!fullName || typeof fullName !== 'string') {
      return '';
    }

    const names = fullName.trim().split(/\s+/);
    
    if (names.length === 0) {
      return '';
    }
    
    if (names.length === 1) {
      return names[0];
    }
    
    const firstName = names[0];
    const lastNameInitial = names[names.length - 1].charAt(0).toUpperCase();
    
    return `${firstName} ${lastNameInitial}.`;
  }
}