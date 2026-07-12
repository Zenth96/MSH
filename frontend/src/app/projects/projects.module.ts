import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { ProjectCreateComponent } from './project-create/project-create.component';
import { ProjectEditComponent } from './project-edit/project-edit.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: ProjectListComponent },
      { path: 'new', component: ProjectCreateComponent },
      { path: ':id', component: ProjectDetailComponent },
      { path: ':id/edit', component: ProjectEditComponent },
    ]),
    ProjectListComponent,
    ProjectDetailComponent,
    ProjectCreateComponent,
    ProjectEditComponent,
  ],
})
export class ProjectsModule {}
