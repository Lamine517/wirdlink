import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFlow } from '../../auth/data-access/auth-flow';
import { PassService } from '../../../core/pass/pass-service';

/** Hides the back office from non-members; the database re-checks every admin call. */
export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthFlow);
  const passes = inject(PassService);
  await auth.ready;
  if (!auth.session()) return router.parseUrl('/');
  const status = await passes.loadStatus();
  return status?.isAdmin === true ? true : router.parseUrl('/');
};
