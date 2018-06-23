import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { SocketService } from '../shared/socket.service';
import { MudMessage } from '../shared/mud-message';
import { DebugData } from '../shared/debug-data';
import { AnsiService } from '../shared/ansi.service';
import { AnsiData } from '../shared/ansi-data';

@Component({
  selector: 'app-mudclient',
  templateUrl: './mudclient.component.html',
  styleUrls: ['./mudclient.component.css']
})
export class MudclientComponent implements OnInit {

 
  @ViewChild('mudInput') mudInput: ElementRef;

  private mudc_id : string;
  private mudName : string = 'disconnect';
  private connected : boolean;
  private obs_connect;
  private obs_connected;
  private obs_data;
  private obs_debug;
  private ansiCurrent: AnsiData;
  private mudlines : AnsiData[] = [];
  public messages : MudMessage[] = [];
  public inpmessage : string;
  private inpHistory : string[] = [];
  private inpPointer : number = -1;
  public lastdbg : DebugData;
  
  constructor(
    private socketService: SocketService,
    private ansiService:AnsiService) { 

    }

  private connect() {
    if (this.mudName.toLowerCase() == 'disconnect') {
      if (this.mudc_id) {
        if (this.obs_debug) this.obs_debug.unsubscribe();
        if (this.obs_data) this.obs_data.unsubscribe();
        if (this.obs_connect) this.obs_connect.unsubscribe();// including disconnect
        this.connected = false;
        this.mudc_id = undefined;
        return;
      }
    }
    const other = this;
    const mudOb = {mudname:this.mudName}; // TODO options???
    this.obs_connect = this.socketService.mudConnect(mudOb).subscribe(_id => {
      other.mudc_id = _id;
      other.obs_connected = this.socketService.mudConnectStatus(_id).subscribe(
          flag => {other.connected = flag;
        });
      other.obs_data = this.socketService.mudReceiveData(_id).subscribe(outline => {
          var outp = outline;
          const idx = outline.indexOf(other.ansiService.ESC_CLRSCR);
          if (idx >=0) {
            other.messages = [];
            other.mudlines = [];
          }
          other.ansiCurrent.ansi = outp;
          const a2harr = this.ansiService.processAnsi(other.ansiCurrent);
          for (var ix=0;ix<a2harr.length;ix++) {
            //console.log('main-'+ix+":"+JSON.stringify(a2harr[ix]));
            if (a2harr[ix].text!='') {
              other.mudlines = other.mudlines.concat(a2harr[ix]);
            }
          }
          other.ansiCurrent = a2harr[a2harr.length-1];
          other.messages.push({text:outp});
        });
      other.obs_debug = this.socketService.mudReceiveDebug(_id).subscribe(debugdata => {
          other.lastdbg = debugdata;
        });
    });
  }

  ngOnInit() { 
    this.ansiCurrent = new AnsiData();
  }

  ngOnDestroy() {
    this.obs_debug.unsubscribe();
    this.obs_data.unsubscribe();
    this.obs_connect.unsubscribe();// including disconnect
    this.obs_connected.unsubscribe(); 
  }

  sendMessage() {
    this.socketService.mudSendData(this.mudc_id,this.inpmessage);
    if (this.inpmessage != '' && (this.inpHistory.length==0 || (this.inpHistory.length >0 && this.inpHistory[0] != this.inpmessage))) {
      this.inpHistory.unshift(this.inpmessage);
    }
    this.inpmessage = '';
  }

  onSelectMud(mudselection : string) {
    this.mudName = mudselection;
    this.ansiCurrent = new AnsiData();
    this.connect();
  }
  onKeyUp(event:KeyboardEvent) {
    switch (event.key) {
      case "ArrowUp":
        if (this.inpHistory.length < this.inpPointer) {
          return; // at the end.....
        }
        if (this.inpPointer < 0) {
          if (this.inpmessage == '') {
            if (this.inpHistory.length > 0) {
              this.inpPointer = 0;
              this.inpmessage = this.inpHistory[0];
              return;
            } else {
              return;
            }
          } else {
            if (this.inpHistory.length>0 && this.inpmessage == this.inpHistory[0]) {
              return;
            }
            this.inpHistory.unshift(this.inpmessage);
            if (this.inpHistory.length > 1) {
              this.inpPointer = 1;
              this.inpmessage = this.inpHistory[1];
              return;
            } else {
              this.inpPointer = 0;
              return;
            }
          }
        } else {
          this.inpPointer++;
          if (this.inpHistory.length > this.inpPointer) {
            return; // at the end...
          }
          this.inpmessage = this.inpHistory[this.inpPointer];
        }
        return;
       case "ArrowDown":
        if (this.inpPointer < 0) {
          return; // at the beginning
        }
        this.inpPointer--;
        if (this.inpPointer < 0) {
          this.inpmessage = '';
          return; // at the beginning
        }
        this.inpmessage = this.inpHistory[this.inpPointer];
        return;
      case "ArrowLeft":
      case "ArrowRight":
      case "Shift":
      case "Ctrl":
      case "Alt":
      case "AltGraph":
      case "Meta":
        return; // no change to the pointer...
      case "Enter":
        this.inpPointer = -1;
        return;
      default:
        this.inpPointer = -1;
        return;
    }
  }

  @HostListener('click')
  public autofocusInput() {
    this.mudInput.nativeElement.focus();
  }


}
