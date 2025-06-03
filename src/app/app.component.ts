import {  Component, } from '@angular/core';
import { RouterOutlet } from '@angular/router';


declare global {
  interface Window {
    Flowbite: any;
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  {
  title = 'Aldyapp2';

 

}
