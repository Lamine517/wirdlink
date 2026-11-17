import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { Icon } from '../../../../shared/components/icon/icon';
import { ADMIN_SECTIONS } from '../../data-access/admin-sections';

@Component({
  selector: 'app-admin-page',
  imports: [RouterLink, BackButton, Icon],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  protected readonly sections = ADMIN_SECTIONS;
}
