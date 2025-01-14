import { Component, OnInit } from '@angular/core';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import {DynamicDialogConfig} from 'primeng/dynamicdialog';
import { ColorSettings } from 'src/app/mud/color-settings';
import { ReadLanguageService } from 'src/app/read-language.service';

@Component({
  selector: 'app-color-settings',
  templateUrl: './color-settings.component.html',
  styleUrls: ['./color-settings.component.css']
})
export class ColorSettingsComponent implements OnInit {

  cs : ColorSettings = new ColorSettings();
  cb: Function;

  constructor(
    public i18n: ReadLanguageService,
    public ref: DynamicDialogRef, 
    public config: DynamicDialogConfig
  ) { }

  ngOnInit(): void {
    this.cs = this.config.data['cs'];
    this.cb = this.config.data['cb'];
  }
  onClick(event) {
    const newev = {
      item: {
        id: 'MUD_VIEW:COLOR:RETURN',
        cs: this.cs
      }
    }
    this.cb(newev);
  }

}
