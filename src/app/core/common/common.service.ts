import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Injectable({
    providedIn: MatSnackBarModule
})
export class CommonService {

    constructor(public snackBar: MatSnackBar) { }

    public openSnackBar(message: string) {
        this.snackBar.open(message, '', {
            panelClass: 'success',
            duration: 4000
        });
    }

    public openErrorSnackBar(message: string) {
        this.snackBar.open(message, '', {
            panelClass: 'error',
            duration: 4000
        });
    }
}
