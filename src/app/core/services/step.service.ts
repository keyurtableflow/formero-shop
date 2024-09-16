// step.service.ts
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class StepService {
  private readonly storageKey = 'a1b2c3d4e5'; // Use a non-meaningful key
  private readonly encryptionKey = 'FoRmErO3DPrInTiNg'; // Use a secure key for encryption

  constructor() {
    this.initializeStepCompletionStatus();
  }

  private stepsCompletionStatus: boolean[];

  private initializeStepCompletionStatus(): void {
    const encryptedStatus = localStorage.getItem(this.storageKey);
    if (encryptedStatus) {
      this.stepsCompletionStatus = this.decryptData(encryptedStatus);
    } else {
      this.stepsCompletionStatus = [false, false, false]; // Adjust array size for more steps
      this.saveCompletionStatus();
    }
  }

  private saveCompletionStatus(): void {
    const encryptedStatus = this.encryptData(this.stepsCompletionStatus);
    localStorage.setItem(this.storageKey, encryptedStatus);
  }

  setStepCompleted(stepIndex: number, completed: boolean): void {
    this.stepsCompletionStatus[stepIndex] = completed;
    this.saveCompletionStatus();
  }

  isStepCompleted(stepIndex: number): boolean {
    return this.stepsCompletionStatus[stepIndex];
  }

  resetSteps(): void {
    this.stepsCompletionStatus = [false, false, false];
    this.saveCompletionStatus();
    localStorage.removeItem("quotationId");
  }

  private encryptData(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
  }

  private decryptData(data: string): any {
    const bytes = CryptoJS.AES.decrypt(data, this.encryptionKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }
}
