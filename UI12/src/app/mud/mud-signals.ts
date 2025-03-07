import { WindowConfig } from "../shared/window-config";

export class MudMessage {
  text: string;
};

export class MudSignals {
    signal : string;
    id : string;
    wizard? : number;
    playSoundFile?: string;
    filepath?: string;
    fileinfo? : FileInfo;
    entries?: FileEntries[];
}

export class FileEntries {
    name : string ='';
    size : number = -2;
    filedate : string = '';
    filetime : string = '';
    isdir : number = 0;
}

export class FileInfo {
    lasturl : string = '';
    file : string = '';
    path : string= '';
    filename : string = '';
    filetype : string = '';
    edditortype? : string = '';

    newfile : boolean = true;
    writeacl : boolean = false;
    temporary : boolean = false;
    saveActive : boolean = false;
    filesize : number = -1;
    title: string ='';

    content? : string = '';
    oldContent? : string = '';

    alreadyLoaded? : boolean = false;
    windowsId? : string = undefined;
    save01_start? = function(filepath) {};
    save02_url? = function(url) {};
    save03_saved? = function(filepath){};
    save04_closing? = function(windowsid){};
    save05_error? = function(windowsid,error){};
    save06_success? = function(windowsid){};
    relateWindow? = function(wid){};    
    load? = function(cb) {};
    cancel01_start? = function(filepath,cb) {};
    cancel02_end? = function(filepath) {};
}

export class MudSignalHelpers {
    public static mudProecessSignals(other:any,musi:MudSignals,_id:string) {
        
        other.logger.debug('mudclient-socketService.mudReceiveSignals',_id,musi.signal);
        other.logger.trace('mudclient-socketService.mudReceiveSignals',_id,musi);
        switch (musi.signal) {
          case 'NOECHO-START': other.v.inpType = 'password'; break;
          case 'NOECHO-END':   other.v.inpType = 'text'; break;
          case 'name@mud':
            if (typeof musi.wizard !== 'undefined') {
              other.filesrv.startFilesModule();
            }
            break;
          case 'Sound.Play.Once':
            let audio = new Audio();
            audio.src = musi.playSoundFile;
            audio.load();
            audio.play();
            break;
          case 'Files.URL':
            let newfile = other.filesrv.processFileInfo(musi.fileinfo);
            if (newfile.alreadyLoaded) {
              other.logger.trace('Files.URL-alreadyLoaded',_id,newfile);
            } else {
              newfile.save04_closing = function(windowsid) {
                other.logger.debug('Files.URL-save04_closing',_id,windowsid);
                other.wincfg.SavedAndClose(windowsid);
              }
              newfile.save05_error = function(windowsid,error) {
                other.logger.error('Files.URL-save05_error',_id,windowsid,error);
                other.wincfg.WinError(windowsid,error);
              }
              newfile.save06_success = function(windowsid) {
                other.logger.debug('Files.URL-save06_success',_id,windowsid);
                other.wincfg.SaveComplete(windowsid);
              }
              other.logger.trace('Files.URL-firstLoad',_id,newfile);
              let filewincfg : WindowConfig = new WindowConfig();
              filewincfg.component = 'EditorComponent';
              filewincfg.data = newfile;
              filewincfg.dontCancel = true;
              if (typeof newfile.title !== 'undefined' && newfile.title != '') {
                filewincfg.wtitle = newfile.title;
              } else {
                filewincfg.wtitle = newfile.filename;
                filewincfg.tooltip = newfile.file;
              }
              if (!newfile.newfile){
                newfile.load(function(err,data) {
                  if (typeof err !== 'undefined') {
                  } else {
                    newfile.content = data;
                    newfile.oldContent = data;
                    filewincfg.data = newfile;
                    filewincfg.save = true;
                    const windowsid = other.wincfg.newWindow(filewincfg);
                    newfile.relateWindow(windowsid);
                  }
                })
              } else {
                newfile.content = '';
                newfile.oldContent = '';
                filewincfg.data = newfile;
                filewincfg.save = true;
                const windowsid = other.wincfg.newWindow(filewincfg);
                newfile.relateWindow(windowsid);
              }
            }
            return;
          case 'Files.Dir':
              let nooldcfg = (typeof other.filesWindow === 'undefined');
              let newcfg = other.wincfg.findFilesWindow(other.filesWindow,musi);
              other.filesWindow = newcfg;
              if (nooldcfg) {
                other.filesWindow.outGoingEvents.subscribe((x:string) => {
                  other.logger.debug('Files.Dir-outGoingEvents',_id,x);
                  let xsplit = x.split(':');
                  switch(xsplit[0]) {
                    case 'FileOpen':
                      // Files.OpenFile { "file": "/w/myonara/ed.tmp" }
                      other.socketService.sendGMCP(_id,"Files","OpenFile",{"file":xsplit[1]+xsplit[2]});
                      break;
                    case 'ChangeDir':
                      if (xsplit[2]=="../") {
                        other.socketService.sendGMCP(_id,"Files","ChDir",{"dir":xsplit[2]});
                      } else {
                        other.socketService.sendGMCP(_id,"Files","ChDir",{"dir":xsplit[1]+xsplit[2]});
                      }
                      break;
                  }
                }, err => {;
                  other.logger.error('Files.Dir-outGoingEvents-Error',_id,err);
                }, () => {
                  other.logger.debug('Files.Dir-outGoingEvents-complete',_id);
                });
              }
            return;
          case 'Core.Ping':
            other.togglePing = !other.togglePing;
            return;
          case 'Core.GoodBye': 
          default: 
            other.logger.info('mudclient-socketService.mudReceiveSignals UNKNOWN',_id,musi.signal);
            return;
        }
    }
    public static mudProcessData(other:any,_id:string,outline:string[]) {
        var outp = outline[0];
          var iecho = outline[1];
          other.logger.trace('mudclient-mudReceiveData',_id,outline);
          if (typeof outp !== 'undefined') {
            const idx = outp.indexOf(other.ansiService.ESC_CLRSCR);
            if (idx >=0) {
              other.messages = [];
              other.mudlines = [];
            }
            other.ansiCurrent.ansi = outp;
            other.ansiCurrent.mudEcho = undefined;
            other.messages.push({text:outp});
          } else  {
            other.ansiCurrent.ansi = '';
            other.ansiCurrent.mudEcho = iecho;
            other.messages.push({text:iecho});
          }
          var ts = new Date();
          other.ansiCurrent.timeString = ((ts.getDate() < 10)?"0":"") + ts.getDate() +"."
                                       + (((ts.getMonth()+1) < 10)?"0":"") + (ts.getMonth()+1) +"."
                                       + ts.getFullYear() + ' '
                                       +((ts.getHours() < 10)?"0":"") + ts.getHours() +":"
                                       + ((ts.getMinutes() < 10)?"0":"") + ts.getMinutes() +":"
                                       + ((ts.getSeconds() < 10)?"0":"") + ts.getSeconds();
          other.logger.trace('mudclient-mudReceiveData-ansiCurrent-before',_id,other.ansiCurrent);
          const a2harr = other.ansiService.processAnsi(other.ansiCurrent);
          other.logger.trace('mudclient-mudReceiveData-s2harr after',_id,a2harr);
          for (var ix=0;ix<a2harr.length;ix++) {
            if (a2harr[ix].text!=''||typeof a2harr[ix].mudEcho !=='undefined') {
              other.mudlines = other.mudlines.concat(a2harr[ix]);
            }
          }
          other.ansiCurrent = a2harr[a2harr.length-1];
    }
}