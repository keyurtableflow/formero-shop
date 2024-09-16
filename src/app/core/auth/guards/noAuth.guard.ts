import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { of, switchMap } from 'rxjs';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = (route, state) =>
{
    const router: Router = inject(Router);

    // Check the authentication status
    return inject(AuthService).check().pipe(
        switchMap(() =>
        {
            // If the user is authenticated...
            if ( localStorage.getItem('accessToken') )
            {
                return of(router.parseUrl(''));
            }

            // Allow the access
            return of(true);
        }),
    );
};
