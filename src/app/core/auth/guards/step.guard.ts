// step.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { StepService } from 'app/core/services/step.service';

@Injectable({
  providedIn: 'root'
})
export class StepGuard implements CanActivate {

  constructor(private stepService: StepService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const stepIndex = route.data['stepIndex'];

    if (stepIndex > 0 && !this.stepService.isStepCompleted(stepIndex - 1)) {
      this.router.navigate(['/upload-models']);
      return false;
    }

    return true;
  }
}
