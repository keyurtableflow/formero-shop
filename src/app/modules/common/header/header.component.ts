import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { NavigationEnd, Router } from '@angular/router';
import { StepService } from 'app/core/services/step.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, MatTabsModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

    selectedTabIndex = 0;

    constructor(private router: Router, public stepService: StepService) {
        this.selectTab(this.router.url);
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.selectTab(event.url);
            }
        });
    }

    onTabChange(index: number): void {
        if (index > this.selectedTabIndex && !this.stepService.isStepCompleted(index - 1)) {
            // Prevent forward navigation if the previous step is not completed
            return;
        }
        this.selectedTabIndex = index;
        switch (index) {
            case 0:
                this.router.navigate(['/upload-models']);
                break;
            case 1:
                this.router.navigate(['/create-order']);
                break;
            case 2:
                this.router.navigate(['/order-details']);
                break;
            case 3:
                this.router.navigate(['/confirmation']);
                break;
        }
    }

    selectTab(url){
        switch (url) {
            case '/upload-models':
                this.selectedTabIndex = 0;
                break;
            case '/create-order':
                this.selectedTabIndex = 1;
                break;
            case '/order-details':
                this.selectedTabIndex = 2;
                break;
            case '/confirmation':
                this.selectedTabIndex = 3;
                break;
        }
    }
}
