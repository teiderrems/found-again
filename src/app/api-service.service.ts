import {Inject, Injectable} from '@angular/core';
import {catchError, EMPTY, map, of} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {ApiRoutesWithoutPrefix} from "../config/constant";
import { commercial_modes, ReservetionDto } from './interfaces/dtos/api';

@Injectable({
    providedIn: 'root',
})
export class ApiServiceService {
     constructor(@Inject('sncfBaseUrl') private sncfBaseUrl: string,@Inject('API_URL') private sncfApiUrl: string, private httpClient: HttpClient) {
    }

    getLines() {
        return this.httpClient.get(`${this.sncfBaseUrl}/${ApiRoutesWithoutPrefix.COVERAGE_SANDBOX_LINES}`).pipe(
            map((values) => values),
            catchError((error) => EMPTY)
        );
    }

    getCommercialModes() {
       return this.httpClient.get<commercial_modes[]>(`${this.sncfApiUrl}/${ApiRoutesWithoutPrefix.COMMERCIAL_MODES}`).pipe(
           map((values) => values),
           catchError((error) => of(error))
       );
    }

    getTrajets(reservationInfo:ReservetionDto){
        return this.httpClient.get<any>(`${this.sncfApiUrl}/${ApiRoutesWithoutPrefix.JOURNEYS}?from=${reservationInfo.from}&to=${reservationInfo.to}&datetime=${reservationInfo.datetime}`);
    }

    getCoordonnee(adresse:string){
        return this.httpClient.get<any>(`${this.sncfApiUrl}/pt_objects?q=${adresse}`);
    }
}
