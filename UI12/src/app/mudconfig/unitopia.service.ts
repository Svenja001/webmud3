import { Injectable } from '@angular/core';
import { GmcpConfig } from '../gmcp/gmcp-config';
import { GmcpMenu } from '../gmcp/gmcp-menu';
import { LoggerService } from '../logger.service';

@Injectable({
  providedIn: 'root'
})
export class UnitopiaService {

  private mudconfs = {};

  private set_mudconf(_id:string,key:string,value:any) {
    if (typeof this.mudconfs[_id] === 'undefined') {
      this.mudconfs[_id] = {};
    }
    this.mudconfs[_id][key] = value;
  }
  private get_mudconf(_id:string,key:string) {
    if (typeof this.mudconfs[_id] === 'undefined') {
      return undefined;
    }
    return this.mudconfs[_id][key];
  }
  public set_callbacks(_id:string,cb_mudSwitchGmcpModule,cb_add_gmcp_module,cb_remove_gmcp_module){
    this.set_mudconf(_id,'cb_mudSwitchGmcpModule',cb_mudSwitchGmcpModule);
    this.set_mudconf(_id,'cb_add_gmcp_module',cb_add_gmcp_module);
    this.set_mudconf(_id,'cb_remove_gmcp_module',cb_remove_gmcp_module);
  }

  constructor(private logger:LoggerService) { }

  private toggleSound(gcfg:GmcpConfig,gmen:GmcpMenu,_cb) {
    if (!gmen.active) {
      this.init_module(gcfg.mud_id,'Sound');
    } else {
      this.delete_module(gcfg.mud_id,'Sound');
    }
    _cb('toggle'); // switch gmen.active-bit.
  }

  public menuAction(action :string,gcfg:GmcpConfig,gmen:GmcpMenu,index:number,_cb) {
    this.logger.trace('UnitopiaService-menuAction',action,gcfg,gmen,index);
    switch(action) {
      case 'ToggleSound':
        this.toggleSound(gcfg,gmen,_cb);
        return;
      case 'add_gmcp_module':
        _cb(action);
        return;
      default:
          this.logger.error('UnitopiaService-menuAction-UNKNOWN',action,gcfg,gmen,index);
    }
  }

  public init_module_config(_id:string,mod:string) {
    var cb_add_gmcp_module = this.get_mudconf(_id,'cb_add_gmcp_module');
    var gmcpcfg = new GmcpConfig();
    var other = this;
    gmcpcfg.mud_family = 'unitopia';
    gmcpcfg.mud_id = _id;
    gmcpcfg.callback = function(action :string,gcfg:GmcpConfig,gmen:GmcpMenu,index:number,_cb) {
      other.menuAction(action,gcfg,gmen,index,_cb);
    };
    switch (mod.toLowerCase()) {
      case 'sound':
      case 'sound 1':
        gmcpcfg.module_name = 'Sound';
        gmcpcfg.version = '1';
        gmcpcfg.initial_menu = new GmcpMenu();
        gmcpcfg.initial_menu.action = 'ToggleSound';
        gmcpcfg.initial_menu.active = true; // on per default 
        gmcpcfg.initial_menu.name = 'Vertonung';
        cb_add_gmcp_module(gmcpcfg);
        return;
      case 'files':
      case 'files 1':
        gmcpcfg.module_name = 'Files';
        gmcpcfg.version = '1';
        cb_add_gmcp_module(gmcpcfg);
        return;
      case 'char':
      case 'char 1':
          gmcpcfg.module_name = 'Char';
          gmcpcfg.version = '1';
          cb_add_gmcp_module(gmcpcfg);
        return;
      case 'char.items':
      case 'char.items 1':
        gmcpcfg.module_name = 'Char.Items';
        gmcpcfg.version = '1';
        cb_add_gmcp_module(gmcpcfg);
      return;
      case 'comm':
      case 'comm 1':
          gmcpcfg.module_name = 'Comm';
          gmcpcfg.version = '1';
          cb_add_gmcp_module(gmcpcfg);
        return;
      case 'playermap':
      case 'playermap 1':
          gmcpcfg.module_name = 'PlayerMap';
          gmcpcfg.version = '1';
          cb_add_gmcp_module(gmcpcfg);
        return;
    }
  }

  public init_module(_id:string,mod:string) {
    var cb_switch = this.get_mudconf(_id,'cb_mudSwitchGmcpModule');
    switch (mod.toLowerCase()) {
      case 'sound':
      case 'sound 1':
        cb_switch(_id,'Sound 1',true);
        return;
      case 'char':
      case 'char 1':
          cb_switch(_id,'Char 1',true);
          return;
      case 'files':
      case 'files 1':
          cb_switch(_id,'Files 1',true);
          return;
      case 'char.items':
      case 'char.items 1':
      case 'comm':
      case 'comm 1':
      case 'playermap':
      case 'playermap 1':
    }
  }
  public delete_module(_id:string,mod:string) {
    var cb_switch = this.get_mudconf(_id,'cb_mudSwitchGmcpModule');
    var cb_remove_gmcp_module = this.get_mudconf(_id,'cb_remove_gmcp_module');
    switch (mod.toLowerCase()) {
      case 'sound':
      case 'sound 1':
        cb_remove_gmcp_module(_id,'Sound');
        cb_switch(_id,'Sound',false);
        return;
      case 'char':
      case 'char 1':
      case 'char.items':
      case 'char.items 1':
      case 'comm':
      case 'comm 1':
      case 'playermap':
      case 'playermap 1':
    }
  }

}
