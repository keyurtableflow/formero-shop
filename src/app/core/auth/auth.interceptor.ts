import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { catchError, Observable, throwError } from 'rxjs';

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> =>
{
    const authService = inject(AuthService);

    // Clone the request object
    let newReq = req.clone();

    if ( localStorage.getItem('accessToken') )
    {
        newReq = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + localStorage.getItem('accessToken')),
        });
    }

    // Response
    return next(newReq).pipe(
        catchError((error) =>
        {
            // Catch "401 Unauthorized" responses
            if ( error instanceof HttpErrorResponse && error.status == 401 )
            {
                // Sign out
                authService.signOut();

                // this._router.navigateByUrl('/sign-in')
                // Reload the app
                // location.reload();
            }

            return throwError(error);
        }),
    );
};
