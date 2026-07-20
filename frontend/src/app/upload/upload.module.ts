import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UploadComponent } from './upload.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: UploadComponent },
    ]),
    UploadComponent,
  ],
})
export class UploadModule {}
