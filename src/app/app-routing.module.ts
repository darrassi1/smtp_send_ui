import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComposeComponent } from './components/compose/compose.component';
import { DraftsComponent } from './components/drafts/drafts.component';
import { SettingsComponent } from './components/settings/settings.component';

const routes: Routes = [
  { path: '', redirectTo: '/compose', pathMatch: 'full' },
  { path: 'compose', component: ComposeComponent },
  { path: 'drafts', component: DraftsComponent },
  { path: 'settings', component: SettingsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
