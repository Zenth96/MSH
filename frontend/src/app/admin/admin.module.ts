import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdminLayoutComponent } from './layout/admin-layout.component';
import { UsersComponent } from './users/users.component';
import { roleGuard } from '../core/guards/role.guard';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: AdminLayoutComponent,
        children: [
          { path: 'users', component: UsersComponent, canActivate: [roleGuard(['ADMIN'])] },
          { path: '', redirectTo: 'users', pathMatch: 'full' },
        ],
      },
    ]),
    AdminLayoutComponent,
    UsersComponent,
  ],
})
export class AdminModule {}
