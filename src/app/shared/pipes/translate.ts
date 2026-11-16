import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n';

@Pipe({ name: 't', pure: false })
export class Translate implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(key: string, parameters?: Readonly<Record<string, string | number>>): string {
    return this.i18n.translate(key, parameters);
  }
}
