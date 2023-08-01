import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class CodeService {

  constructor(private httpClient: HttpClient) { }

  getCode(): Observable<string> {
    const code = this.httpClient.get('https://raw.githubusercontent.com/gfx-rs/wgpu/trunk/wgpu-core/src/device/global.rs', {responseType:'text'});
    //return of('why does this work')
    return code;
  }
}
