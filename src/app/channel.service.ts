import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Place } from './place';
import { Radio } from './radio';

const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type':  'application/json',
    })
};

export interface ResponsePlace {
    success: boolean,
    places: Place[]
}

export interface ResponseChannels {
    success: boolean,
    channels: Radio[]
}

export interface GiveStream {
    stream: String;
}

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
    constructor(private http: HttpClient) { 

    }

    /**
     * Handle Http operation that failed.
     * Let the app continue.
     * @param operation - name of the operation that failed
     * @param result - optional value to return as the observable result
    */
    private handleError<T> (operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            console.error(error); // log to console instead

            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }

    public getData() : Observable<ResponsePlace> {
        return this.http.post<ResponsePlace>('http://localhost:8100/getData', '', httpOptions)
        .pipe();
    }

    public getChannels(place_id: String) : Observable<ResponseChannels> {
        let url = 'http://localhost:8100/' + place_id + '/channels';
        return this.http.post<ResponseChannels>(url, '', httpOptions)
        .pipe();
    }

    public startStream(stream_url: String) : Observable<GiveStream>{
        return this.http.post<GiveStream>('http://localhost:8100/stream/', '{"stream_url": "' + stream_url + '"}', httpOptions).pipe();
    }
}
