import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    styles: ['.v-middile { vertical-align: middle }'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user',
    standalone: true,
    imports: [MatButtonModule, MatMenuModule, NgIf, MatIconModule, NgClass, MatDividerModule],
})
export class UserComponent implements OnInit, OnDestroy {
    static ngAcceptInputType_showAvatar: BooleanInput;

    @Input() showAvatar: boolean = true;
    user: any;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _userService: UserService,
        private _authService: AuthService
    ) {
    }

    ngOnInit(): void {

        this.user = JSON.parse(localStorage.getItem('user'));

        this._changeDetectorRef.markForCheck();
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    updateUserStatus(status: string): void {
        if (!this.user) {
            return;
        }

        // this._userService.update({
        //     ...this.user,
        //     status,
        // }).subscribe();
    }

    signOut(): void {
        this._authService.signOut().subscribe((result: any) => {
            localStorage.clear()
            this._router.navigate(['/sign-out']);
        },(error : any) => {
            if(error.status == 401){
                this._router.navigateByUrl('/sign-in')
            }
        })
    }
}
