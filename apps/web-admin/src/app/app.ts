import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'vexa-root',
  template: '<router-outlet />',
})
export class App {}
